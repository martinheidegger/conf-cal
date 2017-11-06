const moment = require('moment-timezone')

function renderHeader (options, context) {
  return `
| | ${context.data.rooms.map(room => {
  context.string = room
  const result = options.escape(options, context)
  delete context.string
  return result
}).join(' | ')} |
| --- | ${context.data.rooms.map(() => '---').join(' | ')} |
`
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
  if (!context.roomEntry.person) {
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
  let person = options.renderBy(options, context)
  context.string = context.roomEntry.summary
  const result = `${options.escape(options, context)}${person}`
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
    let result
    if (context.data.rooms.length === 1) {
      result = options.renderRoom(options, context)
    } else {
      result = options.renderSingleRoom(options, context)
    }
    delete context.room
    delete context.roomEntry
    return result
  }
  return context.data.rooms.map(room => {
    context.room = room
    context.roomEntry = slotEntry.entries[room]
    const result = options.renderRoom(options, context)
    delete context.room
    delete context.roomEntry
    return result
  }).join(' | ')
}

function renderSlot (options, context) {
  return `| ${context.slotStart}-${context.slotEnd} | ${context.roomEntries} |`
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
    .join('\n')
}

function render (options, context) {
  return `${options.header}${options.renderHeader(options, context)}${options.renderSlots(options, context)}${options.footer}`
}

module.exports = (options, slotData) => {
  options = Object.assign({
    header: '',
    footer: '\n',
    breakWord: 'Break',
    by: ' by ',
    render,
    renderHeader,
    renderSlots,
    renderSlot,
    renderRooms,
    renderRoom,
    renderSingleRoom,
    renderBreak,
    renderFullBreak,
    renderBy,
    escape
  }, options)
  const context = {
    data: slotData
  }
  return options.render(options, context)
}
