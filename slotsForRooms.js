module.exports = function slotsForRooms (rooms) {
  let slots = {}
  const addSlot = (slotTime, entry, room) => {
    let entries = slots[slotTime]
    if (!entries) {
      entries = {}
      slots[slotTime] = entries
    }
    if (entry) {
      entries[room] ={
        start: entry.start,
        end: entry.end,
        summary: entry.summary,
        person: entry.person,
        rowSpan: 1
      }
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
  Object.keys(rooms).forEach(room => {
    var lastEntry = null
    slotList.forEach(slot => {
      var slotEntry = slot.entries[room]
      if (slotEntry) {
        lastEntry = slotEntry
        return
      }
      if (!lastEntry || (lastEntry.end <= slot.start && lastEntry.summary !== null)) {
        lastEntry = {summary: null, person: null, start: slot.start, rowSpan: 0}
        slot.entries[room] = lastEntry
      }
      if (lastEntry.summary === null) {
        lastEntry.end = slot.end
      }
      lastEntry.rowSpan += 1
    })
  })
  clearBeginningEntries(slotList)
  clearClosingEntries(slotList)
  return slotList
}

function nonBreakEntries (slotEntry) {
  if (slotEntry.entry) {
    return [slotEntry.entry]
  }
  return Object.values(slotEntry.entries).filter(roomEntry => roomEntry.summary !== null)
}

function clearEntry (slotList, index) {
  let slotEntry = slotList[index]
  if (!slotEntry) {
    return false
  }
  if (slotEntry.entries) {
    const maxRowSpan = Object.values(slotEntry.entries).reduce((max, roomEntry) => {
      if (roomEntry.summary !== null && roomEntry.rowSpan > max) {
        max = roomEntry.rowSpan
      }
      return max
    }, 1)
    if (maxRowSpan > 1) {
      return false
    }
  }
  if (slotEntry.rowSpan > 1) {
    return false
  }
  if (slotEntry.entry) {
    return true
  }
  let allEntries = nonBreakEntries(slotEntry)
  if (allEntries.length > 1) {
    return false
  }
  if (allEntries.length === 0) {
    throw new Error('wtf - this case is not supposed to exist!')
  }
  Object.keys(slotEntry.entries).forEach(room => {
    let roomEntry = slotEntry.entries[room]
    if (roomEntry.summary !== null) {
      slotEntry.entry = roomEntry
      slotEntry.room = room
    } else if (roomEntry.rowSpan > 1) {
      const nextSlotEntry = slotList[index + 1]
      if (!nextSlotEntry) {
        throw new Error('data inconsistency, rowSpan grew over rows amount')
      }
      if (nextSlotEntry.entry) {
        // Okay, for some reason the next entry was already reduced, in this case
        // null entry becomes void
        return
      }
      // Move any null-slot-entry one row down
      roomEntry.start = nextSlotEntry.start
      roomEntry.rowSpan -= 1
      nextSlotEntry.entries[room] = roomEntry
    }
  })
  delete slotEntry.entries
  return true
}

function clearBeginningEntries (slotList) {
  let i = 0
  while (clearEntry(slotList, i)) {
    i++
  }
}

function clearClosingEntries (slotList) {
  let minIndex = 0
  fullList = slotList.map(() => 0)
  slotList.forEach((slotListEntry, index) => {
    if (slotListEntry.entry) {
      fullList[index] += 1
      return
    }
    Object.values(slotListEntry.entries).forEach(roomEntry => {
      if (roomEntry.summary === null) {
        return
      }
      for (let i = 0; i < roomEntry.rowSpan; i++) {
        fullList[index + i] += 1
      }
    })
    if (fullList[index] > 1) {
      minIndex = index
    }
  })
  let i = slotList.length - 1
  while (i > minIndex && clearEntry(slotList, i)) {
    i--
  }
  if (minIndex === slotList.length - 1 && minIndex > 0) {
    return
  }
  let firstClosingEntry = slotList[minIndex]
  for (let i = minIndex; i >= 0; i--) {
    let slotListEntry = slotList[i]
    if (slotListEntry.entry) {
      break
    }
    Object.values(slotListEntry.entries).forEach(roomEntry => {
      if (i + roomEntry.rowSpan > minIndex && roomEntry.summary === null) {
        roomEntry.rowSpan = minIndex - i + 1
        roomEntry.end = firstClosingEntry.end
      }
    })
  }
}

