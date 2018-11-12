const moment = require('moment-timezone')

function renderHeader (options, context) {
  context.columns = [''].concat(context.data.rooms.map(options.quickEscape))
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
  const br = options.renderBreak(options, context)
  return br + new Array(context.data.rooms.length).join(`${options.columnSeperator}${br}`)
}

function renderBreak (options, context) {
  return `[${options.breakWord}]`
}

function escape (options, context) {
  return String(context.string).replace(/\|/g, '&#124;').replace(/\n/gm, '<br/>')
}

function renderBy (options, context) {
  if (!context.roomEntry || !context.roomEntry.person) {
    return ''
  }
  context.string = context.roomEntry.person
  const result = ` _${options.by} ${options.escape(options, context)}_`
  delete context.string
  return result
}

function renderRoomListEntry (options, context) {
  return `${options.listBullet}${context.roomListContent}`
}

function renderRoomListContent (options, context) {
  const ctx = Object.assign({}, context, {
    roomEntry: context.roomListEntry,
    roomList: ''
  })
  ctx.roomPerson = options.renderBy(options, ctx)
  return options.renderRoom(options, ctx)
}

function renderRoomList (options, context) {
  if (!context.roomEntry.entries) {
    return ''
  }
  const roomEntries = context.roomEntry.entries.map((roomListEntry) => {
    context.roomListEntry = roomListEntry
    context.roomListContent = options.renderRoomListContent(options, context)
    return options.renderRoomListEntry(options, context)
  })
  delete context.roomListContent
  delete context.roomListEntry
  return `${options.listHeader}${roomEntries.join(options.listSeperator)}${options.listFooter}`
}

function renderRoom (options, context) {
  if (!context.roomEntry) {
    return options.cont
  }
  if (context.roomEntry.summary === null) {
    return options.renderBreak(options, context)
  }
  return `${options.quickEscape(context.roomEntry.summary)}${context.roomPerson}${context.roomList}`
}

function renderSingleRoom (options, context) {
  let found = false
  return context.data.rooms.map(room => {
    if (context.slotEntry.room === room) {
      found = true
      return options.renderRoom(options, context)
    }
    return found ? options.left : options.right
  }).join(options.columnSeperator)
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
    context.roomList = options.renderRoomList(options, context)
    let result
    if (context.data.rooms.length === 1) {
      result = options.renderRoom(options, context)
    } else {
      result = options.renderSingleRoom(options, context)
    }
    delete context.room
    delete context.roomEntry
    delete context.roomPerson
    delete context.roomList
    return result
  }
  return context.data.rooms.map(room => {
    context.room = room
    context.roomEntry = slotEntry.entries[room]
    if (context.roomEntry) {
      context.roomPerson = options.renderBy(options, context)
      context.roomList = options.renderRoomList(options, context)
    }
    const result = options.renderRoom(options, context)
    delete context.room
    delete context.roomEntry
    delete context.roomPerson
    delete context.roomList
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

function quickEscape (options, context, string) {
  context.string = string
  const result = options.escape(options, context)
  delete context.string
  return result
}

const defaults = {
  header: '\n', // Header to be prepended to the list
  footer: '', // Footer to be appended on the list
  breakWord: 'Break', // Keyword to be inserted in a break
  by: 'by', // Keywork to be used to prefix the presenter
  cont: '⤓', // If the former entry continues in this slot
  left: '←', // Single room: for empty rooms, where the full room is on the left
  right: '→', // Single room: for empty rooms, where the full room is on the right
  rowHeader: '| ', // prefix for a row
  rowFooter: ' |', // suffix for a row
  columnSeperator: ' | ', // seperator between each column
  rowSeperator: '\n', // seperator between each row
  headerSeperator: '---', // seperator between head and body
  listHeader: '<br/><ul>', // header before a list of entries in an entry
  listSeperator: '</li>', // suffix to be added to an list entry
  listBullet: '<li>', // prefix to be added to an list entry
  listFooter: '</li></ul>', // suffix to be added after the list
  //
  // All render methods are called with (options, context)
  //
  // where 'options' is this passed-in options and context
  // is transformed before each call. The context always
  // contains a 'data' property that contains the slotData
  //
  render,
  renderRow,
  renderHeader,
  renderSlots,
  renderSlot,
  renderTime,
  renderRooms,
  renderRoom,
  renderSingleRoom,
  renderRoomList,
  renderRoomListEntry,
  renderRoomListContent,
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
  if (!options.quickEscape) {
    options.quickEscape = quickEscape.bind(null, options, context)
  }
  return options.render(options, context)
}
