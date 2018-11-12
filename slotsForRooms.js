module.exports = function slotsForRooms (timeZone, rooms) {
  let slots = {}
  const addSlot = (slotTime, entry, room) => {
    let entries = slots[slotTime]
    if (!entries) {
      entries = {}
      slots[slotTime] = entries
    }
    if (entry) {
      const newEntry = {
        start: entry.start,
        end: entry.end,
        summary: entry.summary,
        person: entry.person,
        lang: entry.lang || null,
        rowSpan: 1
      }
      if (entry.id) {
        newEntry.id = entry.id
      }
      if (entry.hasCustomId) {
        newEntry.hasCustomId = true
      }
      if (entry.description) {
        newEntry.description = entry.description
      }
      if (entry.entries) {
        newEntry.entries = entry.entries
      }
      entries[room] = newEntry
    }
  }
  Object.keys(rooms).forEach((room) => {
    const roomData = rooms[room]
    roomData.forEach((entry) => {
      addSlot(entry.start, entry, room)
      addSlot(entry.end, null)
    })
  })
  let start = null
  let slotList = Object.keys(slots).sort().reduce((slotList, slot) => {
    if (start) {
      slotList.push({
        start: start, end: slot, entries: slots[start]
      })
    }
    start = slot
    return slotList
  }, [])

  let roomNames = Object.keys(rooms)

  // We have all the slots identified
  // now we distribute slots that cover more than
  // one slot over all slots covered
  distributeToAllSlots(roomNames, slotList)

  // We go through the beginning and end entries and reduce the only entries
  // to starter entries
  let groupsStart = mergeBeginningEntries(slotList)
  let groupsEnd = mergeClosingEntries(slotList, groupsStart)

  // We fill the rooms in other slots
  // with breaks (summary = null)
  insertBreaks(roomNames, slotList, groupsStart, groupsEnd)

  // We apply horizontal full breaks
  mergeFullBreaks(slotList, groupsStart, groupsEnd)

  // We calculate the rowspan
  applyRowSpan(roomNames, slotList)
  return {
    tz: timeZone,
    rooms: roomNames,
    slots: slotList
  }
}

function distributeToAllSlots (roomNames, slotList) {
  roomNames.forEach(room => {
    var lastEntry = null
    slotList.forEach(slotEntry => {
      if (lastEntry && lastEntry.end <= slotEntry.start) {
        lastEntry = null
      }
      lastEntry = slotEntry.entries[room] || lastEntry
      if (lastEntry) {
        slotEntry.entries[room] = lastEntry
      }
    })
  })
}

function insertBreaks (roomNames, slotList, indexMin, indexMax) {
  roomNames.forEach(room => {
    let formerEntry
    for (let slotIndex = 0; slotIndex < indexMax; slotIndex++) {
      let slotEntry = slotList[slotIndex]
      let roomEntry
      if (slotEntry.entries) {
        roomEntry = slotEntry.entries[room]
      } else if (slotEntry.room === room) {
        roomEntry = slotEntry.entry
      }
      if (formerEntry && formerEntry.summary !== null && formerEntry.end <= slotEntry.start) {
        formerEntry = null
      }
      if (!roomEntry && slotIndex >= indexMin) {
        roomEntry = formerEntry || {
          start: slotEntry.start,
          summary: null,
          person: null,
          lang: null
        }
        if (roomEntry.summary === null) {
          roomEntry.end = slotEntry.end
        }
        slotEntry.entries[room] = roomEntry
      }
      formerEntry = roomEntry
    }
  })
}

function mergeEntries (slotList, index) {
  let slotEntry = slotList[index]
  if (!slotEntry) {
    console.warn(new Error('warn: the slotlist contains a missing entry at ' + index).stack)
    return true // be fault tolerant in case of a missing entry
  }
  if (slotEntry.entry) {
    return false
  }
  let rooms = Object.keys(slotEntry.entries)
  if (rooms.length === 1) {
    let room = rooms[0]
    let roomEntry = slotEntry.entries[room]
    if (roomEntry.end > slotEntry.end || roomEntry.start < slotEntry.start) {
      // If a roomEntry needs to span over two slots, its better to
      // not merge it and show empty slots in the other slots.
      return false
    }
    roomEntry.rowSpan = 1
    slotEntry.entry = roomEntry
    slotEntry.room = room
    delete slotEntry.entries
    return true
  }
  if (rooms.length === 0) {
    delete slotEntry.entries
    slotEntry.entry = {
      start: slotEntry.start,
      end: slotEntry.end,
      summary: null,
      person: null,
      lang: null,
      rowSpan: 1
    }
    slotEntry.room = null
    // will be turned into a full break, next iteration
    return true
  }
  return false
}

function mergeBeginningEntries (slotList) {
  let i
  let max = slotList.length
  for (i = 0; i < max; i++) {
    if (!mergeEntries(slotList, i)) {
      return i
    }
  }
  return i
}

function mergeClosingEntries (slotList, iMin) {
  let iMax = slotList.length
  for (let i = iMax - 1; i >= iMin; i--) {
    if (mergeEntries(slotList, i)) {
      iMax = i
    } else {
      return iMax
    }
  }
  return iMax
}

function mergeFullBreaks (slotList, iMin, iMax) {
  while (iMin < iMax) {
    let slotEntry = slotList[iMin]
    let roomNames = Object.keys(slotEntry.entries)
    let nonEmptyRooms = roomNames.filter(room => slotEntry.entries[room].summary !== null)
    if (nonEmptyRooms.length === 0) {
      roomNames.forEach(room => {
        let roomEntry = slotEntry.entries[room]
        if (roomEntry.end > slotEntry.start) {
          let end = roomEntry.end
          roomEntry.end = slotEntry.start
          if (end > slotEntry.end) {
            let followEntry = {
              start: slotEntry.end,
              end: end,
              summary: null,
              person: null,
              lang: null
            }
            let i = iMin + 1
            while (i < iMax) {
              let followSlotEntry = slotList[i].entries[room]
              if (followSlotEntry !== roomEntry) {
                return
              }
              if (followSlotEntry.end > followEntry.end) {
                throw new Error('that shouldnt be the case')
              }
              slotList[i].entries[room] = followEntry
              i++
            }
          }
        }
      })
      delete slotEntry.entries
      slotEntry.entry = {
        start: slotEntry.start,
        end: slotEntry.end,
        summary: null,
        person: null,
        lang: null,
        rowSpan: 1
      }
      slotEntry.room = null
    }
    iMin++
  }
}

function applySingleRowSpan (entry, room, formerRooms) {
  if (formerRooms[room] === entry) {
    entry.rowSpan += 1
    return true
  }
  entry.rowSpan = 1
  formerRooms[room] = entry
  return false
}

function applyRowSpan (roomNames, slotList) {
  let formerRooms = {}
  slotList.forEach(slotEntry => {
    if (slotEntry.entry) {
      if (applySingleRowSpan(slotEntry.entry, slotEntry.room, formerRooms)) {
        delete slotEntry.entry
        delete slotEntry.room
      }
    } else {
      Object.keys(slotEntry.entries).forEach(room => {
        let roomEntry = slotEntry.entries[room]
        if (applySingleRowSpan(roomEntry, room, formerRooms)) {
          delete slotEntry.entries[room]
        }
      })
    }
  })
}
