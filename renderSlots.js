const moment = require('moment-timezone')

function renderHeader (options, context) {
  context.columns = [''].concat(context.data.rooms.map(room => {
    context.string = room
    const result = options.escape(options, context)
    delete context.string
    return result
  }))
  const headerA = options.renderRow(options, context)
  let headerB = ''
  if (options.headerSeperator) {
    context.columns = context.columns.map(() => options.headerSeperator)
    headerB = options.renderRow(options, context)
  }
  delete context.columns
  return `${headerA}${headerB}`
}

function renderRow (options, context) {
  return `${options.rowHeader}${context.columns.join(options.columnSeperator)}${options.rowFooter}${options.rowSeperator}`
}

function renderFullBreak (options, context) {
  return `<${options.breakWord}>`
}

function renderBreak (options, context) {
  return `[${options.breakWord}]`
}

function escape (options, context) {
  return String(context.string).replace(/\|/g, '&#124;').replace(/\n/gm, '')
}

function renderBy (options, context) {
  if (!context.roomEntry || !context.roomEntry.person) {
    return ''
  }
  context.string = context.roomEntry.person
  const result = `${options.by}${options.escape(options, context)}`
  delete context.string
  return result
}

function renderRoom (options, context) {
  if (!context.roomEntry) {
    return ''
  }
  if (context.roomEntry.summary === null) {
    return options.renderBreak(options, context)
  }
  context.string = context.roomEntry.summary
  const result = `${options.escape(options, context)}${context.roomPerson}`
  delete context.string
  return result
}

function renderSingleRoom (options, context) {
  return `${context.room}: ${options.renderRoom(options, context)}`
}

function renderRooms (options, context) {
  const slotEntry = context.slotEntry
  if (slotEntry.entry) {
    if (!slotEntry.room) {
      return options.renderFullBreak(options, context)
    }
    context.room = slotEntry.room
    context.roomEntry = slotEntry.entry
    context.roomPerson = options.renderBy(options, context)
    let result
    if (context.data.rooms.length === 1) {
      result = options.renderRoom(options, context)
    } else {
      result = options.renderSingleRoom(options, context)
    }
    delete context.room
    delete context.roomEntry
    delete context.roomPerson
    return result
  }
  return context.data.rooms.map(room => {
    context.room = room
    context.roomEntry = slotEntry.entries[room]
    context.roomPerson = options.renderBy(options, context)
    const result = options.renderRoom(options, context)
    delete context.room
    delete context.roomEntry
    delete context.roomPerson
    return result
  }).join(options.columnSeperator)
}

function renderTime (options, context) {
  return `${context.slotStart}-${context.slotEnd}`
}

function renderSlot (options, context) {
  const time = options.renderTime(options, context)
  if (time) {
    context.columns = [time].concat(context.roomEntries)
  } else {
    context.columns = context.roomEntries
  }
  const result = options.renderRow(options, context)
  delete context.columns
  return result
}

function renderSlots (options, context) {
  return context.data.slots
    .map(slotEntry => {
      context.slotStart = moment(slotEntry.start).tz(context.data.tz).format('H:mm')
      context.slotEnd = moment(slotEntry.end).tz(context.data.tz).format('H:mm')
      context.slotEntry = slotEntry
      context.roomEntries = options.renderRooms(options, context)

      const result = options.renderSlot(options, context)

      delete context.slotEntry
      delete context.slotStart
      delete context.slotEnd
      delete context.roomEntries

      return result
    })
    .join('')
}

function render (options, context) {
  return `${options.header}${options.renderHeader(options, context)}${options.renderSlots(options, context)}${options.footer}`
}

const defaults = {
  header: '\n',
  footer: '',
  breakWord: 'Break',
  by: ' by ',
  rowHeader: '| ',
  rowFooter: ' |',
  columnSeperator: ' | ',
  rowSeperator: '\n',
  headerSeperator: '---',
  render,
  renderRow,
  renderHeader,
  renderSlots,
  renderSlot,
  renderTime,
  renderRooms,
  renderRoom,
  renderSingleRoom,
  renderBreak,
  renderFullBreak,
  renderBy,
  escape
}

module.exports = (options, slotData) => {
  options = Object.assign({}, defaults, options)
  options.defaults = defaults
  const context = {
    data: slotData
  }
  return options.render(options, context)
}
