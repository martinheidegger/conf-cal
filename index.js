const CalError = require('./CalError')
const getTimezone = require('./getTimezone')
const slotsForRooms = require('./slotsForRooms')

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
    const parts = /^\s*([0-9]{2}):([0-9]{2})-([0-9]{2}):([0-9]{2})\s*(.*)\s*$/ig.exec(line)
    if (parts) {
      let summary = parts[5].trim()
      let person
      let personParts = /\s+by\s+(.*)$/ig.exec(summary)
      if (personParts) {
        summary = summary.substr(0, personParts.index)
        person = personParts[1]
      }
      roomData.push({
        start: `${doc.date}T${parts[1]}${parts[2]}00Z`,
        end: `${doc.date}T${parts[3]}${parts[4]}00Z`,
        summary,
        person: person
      })
      return
    }
    throw new CalError('invalid-data', `Unprocessable line "${line}"`, lineIndex)
  })
  checkMissing(lines.length - 1)
  return getTimezone(apiKey, doc.googleObjectId)
    .then(googleObject => {
      doc.googleObject = googleObject
      doc.toSlots = function () {
        return slotsForRooms(this.rooms)
      }
      return doc
    })
}

function toPromise (input) {
  if (input instanceof Promise || (input && input.then)) {
    return input
  }
  return Promise.resolve(input)
}

const confCal = (apiKey, input) => toPromise(input)
  .then((stringOrBuffer) => processInput(apiKey, stringOrBuffer))
confCal.CalError = CalError
module.exports = confCal
