const CalError = require('./CalError')
const getTimezone = require('./getTimezone')
const slotsForRooms = require('./slotsForRooms')
const renderSlots = require('./renderSlots')
const moment = require('moment')
const MD_INDENT = 4

function applyAutoIds (entries, entriesList) {
  for (const entry of entriesList) {
    if (!entry.id) {
      let id = entry.auto_id
      // This works because the parent
      // is always before the child in the list
      if (entry.parent) {
        id = `${entry.parent.id}${entry.auto_id}`
        entry.parentId = entry.parent.id
        delete entry.parent
      }
      while (entries[id]) {
        id = `$${id}`
      }
      entry.id = id
      entries[id] = entry
    }
    delete entry.auto_id
  }
}

function extractPerson (roomEntry) {
  let personParts = /\s+by\s+(.*)$/ig.exec(roomEntry.summary)
  if (personParts) {
    roomEntry.summary = roomEntry.summary.substr(0, personParts.index)
    roomEntry.person = personParts[1]
  } else {
    roomEntry.person = null
  }
}

function processInput (options, string) {
  const lines = string.split('\n')
  const isEmptyLine = (line) => /^\s*$/.test(line)
  if (lines.filter(isEmptyLine).length === lines.length) {
    throw new CalError('empty', 'Input is empty')
  }
  const rooms = {}
  const persons = {}
  const entries = {}
  const entriesList = []
  const doc = {
    rooms
  }
  const checkMissing = (lineIndex) => {
    if (!doc.date) {
      throw new CalError('missing-data', 'Date not specified in header, use "on YYYY/MM/DD" as a date format', lineIndex)
    }
    if (!doc.location) {
      throw new CalError('missing-data', 'Location not specified in header, use "at <location>#<google-place-id>" to specify one', lineIndex)
    }
    if (!doc.title) {
      throw new CalError('missing-data', 'No title specified, before the first room, enter any title in the first line', lineIndex)
    }
  }
  let room = null
  let roomIndex = 0
  let roomData = null
  let continueLine = false
  let indent = 0
  let continueDescription = false
  let wasEmpty = false
  lines.forEach((line, lineIndex) => {
    if (isEmptyLine(line)) {
      wasEmpty = true
      return // empty lines
    }
    processLine(line, lineIndex)
    wasEmpty = false
  })

  function extractId (roomEntry, lineIndex, columOffset) {
    let idParts = /\s+#([a-zA-Z0-9-._~:@/?!$&'()*+,;=]*)/ig.exec(roomEntry.summary)
    if (idParts) {
      roomEntry.summary = roomEntry.summary.substr(0, idParts.index)
      const id = idParts[1]
      if (entries[id]) {
        throw new CalError('duplicate-id', `There are two or more entries with the id: ${id}`, lineIndex, columOffset + idParts.index)
      }
      roomEntry.id = id
    }
  }

  function extractRoomInfo (roomEntry, lineIndex, columOffset) {
    extractId(roomEntry, lineIndex, columOffset)
    extractPerson(roomEntry)
  }

  function processFirstLine (roomEntry, lineIndex, columOffset) {
    extractRoomInfo(roomEntry, lineIndex, columOffset)
    const continueLine = /\\$/ig.test(roomEntry.summary)
    if (continueLine) {
      roomEntry.summary = roomEntry.summary.substr(0, roomEntry.summary.length - 1)
    }
    return continueLine
  }

  function processRoom (line, lineIndex) {
    const r = /^\s*\[(.*)\]\s*$/ig.exec(line)
    if (r) {
      room = r[1]
      roomData = []
      rooms[room] = roomData
      roomIndex += 1
      checkMissing(lineIndex)
      return true
    }
  }

  function processHeader (line, lineIndex) {
    if (!room) {
      const loc = /^\s*at ([^#]*)#(.*)\s*$/ig.exec(line)
      if (loc) {
        doc.location = loc[1]
        doc.googleObjectId = loc[2]
        return true
      }
      const time = /^\s*on ([0-9]{4})\/([0-9]{2})\/([0-9]{2})\s*$/ig.exec(line)
      if (time) {
        doc.date = `${time[1]}${time[2]}${time[3]}`
        return true
      }
      if (!doc.title) {
        doc.title = line.trim()
        return true
      }
      throw new CalError('invalid-data', `Unknown header "${line}"`, lineIndex)
    }
  }

  function processDateLine (line, lineIndex) {
    const parts = /^((\s*)([0-9]{2}):([0-9]{2})-([0-9]{2}):([0-9]{2})\s*)(.*)\s*$/ig.exec(line)
    if (parts) {
      if (continueLine) {
        throw new CalError('invalid-data', 'Line tries to extend over entry boundaries', lineIndex - 1, parts[2].length)
      }
      indent = parts[2].length
      const roomEntry = {
        auto_id: `${roomIndex}-${roomData.length + 1}`,
        start: `${doc.date}T${parts[3]}${parts[4]}00`,
        end: `${doc.date}T${parts[5]}${parts[6]}00`,
        summary: parts[7]
      }
      continueDescription = false
      continueLine = processFirstLine(roomEntry, lineIndex, parts[1].length)
      roomEntry.summary = roomEntry.summary.trim()
      if (roomEntry.person) {
        persons[roomEntry.person] = true
      }
      if (roomEntry.id) {
        entries[roomEntry.id] = roomEntry
      }
      entriesList.push(roomEntry)
      roomData.push(roomEntry)
      return true
    }
  }

  function processLine (line, lineIndex) {
    if (processRoom(line, lineIndex)) {
      return
    }
    if (processHeader(line, lineIndex)) {
      return
    }
    if (processDateLine(line, lineIndex)) {
      return
    }
    const contParts = /^(\s+)(.*)$/ig.exec(line)
    const formerRoom = roomData[roomData.length - 1]
    const contIndent = contParts[1].length
    if (contParts && contIndent >= (indent + MD_INDENT) && formerRoom) {
      let nextLine = contParts[2].trim()
      if (contIndent < (indent + MD_INDENT)) {
        throw new CalError('invalid-data', `Multiline indents need to be properly indented, expected indent: ${indent + MD_INDENT}, actual: ${contIndent}`, lineIndex - 1, contParts[1].length)
      }
      let roomEntry = formerRoom.entries ? formerRoom.entries[formerRoom.entries.length - 1] : formerRoom
      if (!continueLine) {
        const listParts = /^(-\s+)(.*)$/g.exec(nextLine)
        if (listParts) {
          if (!formerRoom.entries) {
            formerRoom.entries = []
          }
          roomEntry = {
            auto_id: `-${formerRoom.entries.length + 1}`,
            summary: listParts[2]
          }
          if (roomEntry.id) {
            entries[roomEntry.id] = roomEntry
          }
          entriesList.push(roomEntry)
          continueLine = processFirstLine(roomEntry, lineIndex, listParts[1].length + contParts[1].length)
          roomEntry.summary = roomEntry.summary.trim()
          if (roomEntry.person) {
            persons[roomEntry.person] = true
          }
          roomEntry.parent = formerRoom
          formerRoom.entries.push(roomEntry)
          return
        }
        nextLine = '\n' + nextLine
      } else {
        nextLine = ' ' + nextLine
      }
      continueLine = /\\$/ig.test(nextLine)
      if (continueLine) {
        nextLine = nextLine.substr(0, nextLine.length - 1)
      }
      if (continueDescription) {
        if (wasEmpty) {
          nextLine = '\n' + nextLine
        }
        roomEntry.description += nextLine
        return
      }
      if (wasEmpty) {
        continueDescription = true
        roomEntry.description = nextLine.substr(1)
        return
      }
      roomEntry.summary += nextLine
      return
    }
    throw new CalError('invalid-data', `Unprocessable line "${line}"`, lineIndex, contParts && contParts[1].length)
  }
  checkMissing(lines.length - 1)
  return getTimezone(options, doc.googleObjectId)
    .then(googleObject => {
      applyTimeZone(rooms, googleObject.timeZone)
      doc.googleObject = googleObject
      doc.persons = Object.keys(persons)
      applyAutoIds(entries, entriesList)
      doc.entries = entries
      return doc
    })
}

function applyTimeZone (rooms, timeZone) {
  Object.keys(rooms).forEach(room => {
    rooms[room].forEach(roomEntry => {
      roomEntry.start = moment.tz(roomEntry.start, timeZone).toISOString()
      roomEntry.end = moment.tz(roomEntry.end, timeZone).toISOString()
    })
  })
}

function toPromise (input) {
  if (input instanceof Promise || (input && input.then)) {
    return input
  }
  return Promise.resolve(input)
}

const confCal = (options, input) => {
  if (input === null || input === undefined) {
    return Promise.reject(new CalError('empty', 'input is missing'))
  }
  if (!options || typeof options !== 'object') {
    return Promise.reject(new CalError('missing-option', 'options are missing'))
  }
  return toPromise(input)
    .then(stringOrBuffer => {
      if (!stringOrBuffer) {
        throw new CalError('empty', 'Input not given')
      }
      return String(stringOrBuffer)
    })
    .then(string => processInput(options, string))
    .then(rawData => {
      return Object.assign(
        rawData,
        {
          toSlots: function () {
            return slotsForRooms(this.googleObject.timeZone, this.rooms)
          },
          render: function (options) {
            const slots = this.toSlots()
            options = Object.assign({
              header: `## ${this.title}\nat [${this.location}](${this.googleObject.url})\n`
            }, options)
            return renderSlots(options, slots)
          },
          toMarkdown: function () {
            return this.render({})
          }
        }
      )
    })
}
confCal.CalError = CalError
module.exports = confCal
