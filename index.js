const CalError = require('./CalError')
const getTimezone = require('./getTimezone')
const slotsForRooms = require('./slotsForRooms')
const renderSlots = require('./renderSlots')
const moment = require('moment')

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
      let person
      let personParts = /\s+by\s+(.*)$/ig.exec(summary)
      if (personParts) {
        summary = summary.substr(0, personParts.index)
        person = personParts[1]
      }
      continueLine = !/\\$/ig.test(summary)
      if (!continueLine) {
        summary = summary.substr(0, summary.length - 1)
      }
      roomData.push({
        start: `${doc.date}T${parts[2]}${parts[3]}00`,
        end: `${doc.date}T${parts[4]}${parts[5]}00`,
        summary,
        person: person
      })
      return
    }
    const contParts = /^(\s+)(.*)$/ig.exec(line)
    const formerRoom = roomData[roomData.length - 1]
    if (contParts && contParts[1].length >= (indent + 12) && formerRoom) {
      let nextLine = contParts[2].trim()
      if (continueLine) {
        formerRoom.summary += '\n'
      } else {
        formerRoom.summary += ' '
      }
      continueLine = !/\\$/ig.test(nextLine)
      if (!continueLine) {
        nextLine = nextLine.substr(0, nextLine.length - 1)
      }
      formerRoom.summary += nextLine
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
