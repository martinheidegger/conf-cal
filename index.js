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
  let docIndent = -1
  let restrictIndent = -1
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

  function extractEntryMeta (roomEntry, lineIndex, columOffset) {
    extractId(roomEntry, lineIndex, columOffset)
    extractPerson(roomEntry)
  }

  function processFirstEntryLine (roomEntry, lineIndex, columOffset) {
    extractEntryMeta(roomEntry, lineIndex, columOffset)
    const continueLine = /\\$/ig.test(roomEntry.summary)
    if (continueLine) {
      roomEntry.summary = roomEntry.summary.substr(0, roomEntry.summary.length - 1)
    }
    return continueLine
  }

  function processRoom (line, lineIndex) {
    const r = /^\[(.*)\]\s*$/ig.exec(line)
    if (r) {
      room = r[1]
      roomData = []
      rooms[room] = roomData
      roomIndex += 1
      checkMissing(lineIndex)
      return true
    }
  }

  function assertStrictIndent (lineIndex, lineIndent) {
    if (lineIndent !== docIndent) {
      throw new CalError('invalid-indent', `The document's indent is derminded in the first line to be ${docIndent} spaces, it is ${lineIndent} spaces at line ${lineIndex}`, lineIndex, lineIndent)
    }
  }

  function processHeader (line, lineIndex, lineIndent) {
    assertStrictIndent(lineIndex, lineIndent)
    if (processRoom(line, lineIndex)) {
      return true
    }
    const loc = /^at ([^#]*)#(.*)\s*$/ig.exec(line)
    if (loc) {
      doc.location = loc[1]
      doc.googleObjectId = loc[2]
      return true
    }
    const time = /^on ([0-9]{4})\/([0-9]{2})\/([0-9]{2})\s*$/ig.exec(line)
    if (time) {
      doc.date = `${time[1]}${time[2]}${time[3]}`
      return true
    }
    if (!doc.title) {
      doc.title = line.trim()
      return true
    }
    throw new CalError('invalid-data', `Unknown header "${line}"`, lineIndex, lineIndent)
  }

  function processDateLine (line, lineIndex, columnOffset) {
    const parts = /^(([0-9]{2}):([0-9]{2})-([0-9]{2}):([0-9]{2})\s*)(.*)\s*$/ig.exec(line)
    if (parts) {
      if (continueLine) {
        throw new CalError('invalid-data', 'Line tries to extend over entry boundaries', lineIndex - 1, columnOffset)
      }
      const roomEntry = {
        auto_id: `${roomIndex}-${roomData.length + 1}`,
        start: `${doc.date}T${parts[2]}${parts[3]}00`,
        end: `${doc.date}T${parts[4]}${parts[5]}00`,
        summary: parts[6]
      }
      continueDescription = false
      continueLine = processFirstEntryLine(roomEntry, lineIndex, columnOffset + parts[1].length)
      if (continueLine) {
        restrictIndent = docIndent + MD_INDENT
      }
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

  function processBody (formerRoom, line, lineIndex, lineIndent) {
    if (lineIndent >= (docIndent + MD_INDENT) && formerRoom) {
      let nextLine = line.trim()
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
          continueLine = processFirstEntryLine(roomEntry, lineIndex, listParts[1].length + lineIndent)
          if (continueLine) {
            restrictIndent = docIndent + MD_INDENT + MD_INDENT
          }
          roomEntry.summary = roomEntry.summary.trim()
          if (roomEntry.person) {
            persons[roomEntry.person] = true
          }
          roomEntry.parent = formerRoom
          formerRoom.entries.push(roomEntry)
          return true
        }
        nextLine = '\n' + nextLine
      } else {
        nextLine = ' ' + nextLine
      }
      continueLine = /\\$/ig.test(nextLine)
      if (continueLine) {
        nextLine = nextLine.substr(0, nextLine.length - 1)
        restrictIndent = docIndent + MD_INDENT
      } else {
        restrictIndent = -1
      }
      if (continueDescription) {
        if (wasEmpty) {
          nextLine = '\n' + nextLine
        }
        roomEntry.description += nextLine
        return true
      }
      if (wasEmpty) {
        continueDescription = true
        roomEntry.description = nextLine.substr(1)
        return true
      }
      roomEntry.summary += nextLine
      return true
    }
  }

  function processLine (line, lineIndex) {
    const lineParts = /^([ ]*)(.*)/g.exec(line)
    const lineIndent = lineParts[1].length
    line = lineParts[2]
    if (docIndent === -1) {
      docIndent = lineIndent
    }
    if (room === null) {
      if (processHeader(line, lineIndex, lineIndent)) {
        return
      }
    } else {
      const formerRoom = roomData[roomData.length - 1]
      if (restrictIndent !== -1) {
        if (lineIndent !== restrictIndent) {
          throw new CalError('invalid-indent', `Line is a continuation of the former line and as such is expected to have ${restrictIndent} spaces, but it has ${lineIndent}`, lineIndex, lineIndent)
        }
      }
      if (!formerRoom) {
        assertStrictIndent(lineIndex, lineIndent)
      }
      if (!formerRoom || lineIndent === docIndent) {
        if (processRoom(line, lineIndex)) {
          return true
        }
        if (processDateLine(line, lineIndex, lineIndent)) {
          return true
        }
      } else {
        if (lineIndent < docIndent + MD_INDENT) {
          throw new CalError('invalid-indent', `The indentation of line needs to be at least ${docIndent + MD_INDENT} as it is content of the entry`, lineIndex, lineIndent)
        }
        if (processBody(formerRoom, line, lineIndex, lineIndent)) {
          return true
        }
      }
    }
    throw new CalError('invalid-data', `Unprocessable line "${line}"`, lineIndex, lineIndent)
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
