const CalError = require('./CalError')
const getTimezone = require('./getTimezone')
const slotsForRooms = require('./slotsForRooms')
const renderSlots = require('./renderSlots')
const moment = require('moment')
const MD_INDENT = 4

function extractPerson (roomEntry) {
  let personParts = /\s+by\s+(.*)$/ig.exec(roomEntry.summary)
  if (personParts) {
    roomEntry.summary = roomEntry.summary.substr(0, personParts.index)
    roomEntry.person = personParts[1]
  } else {
    roomEntry.person = null
  }
  return roomEntry
}

function processFirstLine (roomEntry) {
  extractPerson(roomEntry)
  const continueLine = !/\\$/ig.test(roomEntry.summary)
  if (!continueLine) {
    roomEntry.summary = roomEntry.summary.substr(0, roomEntry.summary.length - 1)
  }
  return continueLine
}

function processInput (apiKey, stringOrBuffer) {
  if (!stringOrBuffer) {
    throw new CalError('empty', 'Input not given')
  }
  const string = stringOrBuffer.toString()
  const lines = string.split('\n')
  const isEmptyLine = (line) => /^\s*$/.test(line)
  if (lines.filter(isEmptyLine).length === lines.length) {
    throw new CalError('empty', 'Input is empty')
  }
  const rooms = {}
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
  let continueLine = true
  let indent = 0
  lines.forEach((line, lineIndex) => {
    if (isEmptyLine(line)) {
      return // empty lines
    }
    const r = /^\s*\[(.*)\]\s*$/ig.exec(line)
    if (r) {
      room = r[1]
      checkMissing(lineIndex)
      return
    }
    if (!room) {
      const loc = /^\s*at ([^#]*)#(.*)\s*$/ig.exec(line)
      if (loc) {
        doc.location = loc[1]
        doc.googleObjectId = loc[2]
        return
      }
      const time = /^\s*on ([0-9]{4})\/([0-9]{2})\/([0-9]{2})\s*$/ig.exec(line)
      if (time) {
        doc.date = `${time[1]}${time[2]}${time[3]}`
        return
      }
      if (!doc.title) {
        doc.title = line.trim()
        return
      }
      throw new CalError('invalid-data', `Unknown header "${line}"`, lineIndex)
    }
    let roomData = rooms[room]
    if (!roomData) {
      roomData = []
      rooms[room] = roomData
    }
    const parts = /^(\s*)([0-9]{2}):([0-9]{2})-([0-9]{2}):([0-9]{2})\s*(.*)\s*$/ig.exec(line)
    if (parts) {
      if (!continueLine) {
        throw new CalError('invalid-data', 'Line tries to extend over entry boundaries', lineIndex - 1, parts[1].length)
      }
      indent = parts[1].length
      let summary = parts[6].trim()
      const roomEntry = {
        start: `${doc.date}T${parts[2]}${parts[3]}00`,
        end: `${doc.date}T${parts[4]}${parts[5]}00`,
        summary
      }
      continueLine = processFirstLine(roomEntry)
      roomData.push(roomEntry)
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
      if (continueLine) {
        const listParts = /^-\s+(.*)$/g.exec(nextLine)
        if (listParts) {
          if (!formerRoom.entries) {
            formerRoom.entries = []
          }
          roomEntry = {
            summary: listParts[1].trim()
          }
          continueLine = processFirstLine(roomEntry)
          formerRoom.entries.push(roomEntry)
          return
        } else {
          roomEntry.summary += '\n'
        }
      } else {
        roomEntry.summary += ' '
      }
      continueLine = !/\\$/ig.test(nextLine)
      if (!continueLine) {
        nextLine = nextLine.substr(0, nextLine.length - 1)
      }
      roomEntry.summary += nextLine
      return
    }
    throw new CalError('invalid-data', `Unprocessable line "${line}"`, lineIndex, contParts && contParts[1].length)
  })
  checkMissing(lines.length - 1)
  return getTimezone(apiKey, doc.googleObjectId)
    .then(googleObject => {
      applyTimeZone(rooms, googleObject.timeZone)
      doc.googleObject = googleObject
      doc.toSlots = function () {
        return slotsForRooms(googleObject.timeZone, this.rooms)
      }
      doc.render = function (options) {
        const slots = this.toSlots()
        options = Object.assign({
          header: `## ${this.title}
at [${this.location}](${googleObject.url})
`
        }, options)
        return renderSlots(options, slots)
      }
      doc.toMarkdown = function () {
        return this.render({})
      }
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
  if (!options.apiKey) {
    return Promise.reject(new CalError('missing-option', 'The "apiKey" options, containing a Google API key, is required to get the google object information for the location'))
  }
  return toPromise(input)
   .then((stringOrBuffer) => processInput(options.apiKey, stringOrBuffer))
}
confCal.CalError = CalError
module.exports = confCal
