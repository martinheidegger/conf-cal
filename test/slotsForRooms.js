const { test } = require('tap')
const slotsForRooms = require('../slotsForRooms')

function single (entry, room) {
  if (!entry.person) {
    entry.person = null
  }
  if (!entry.lang) {
    entry.lang = null
  }
  if (!entry.room) {
    entry.room = room || null
  }
  return entry
}

function forRoom (room, ...entries) {
  entries.forEach(entry => single(entry, room))
  return {
    [room]: entries
  }
}

function scoped (room, entry) {
  single(entry, room)
  return { [room]: entry }
}

test('test with very simple data', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a', { id: '1-1', start: '11:00', end: '12:00', summary: 'x', description: 'z' }),
    ...forRoom('b', { id: '2-1', start: '11:00', end: '12:00', summary: 'y' })
  })
  t.deepEquals(slots, {
    tz: 'Asia/Tokyo',
    slots: [{
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('a', { id: '1-1', start: '11:00', end: '12:00', summary: 'x', description: 'z', rowSpan: 1 }),
        ...scoped('b', { id: '2-1', start: '11:00', end: '12:00', summary: 'y', rowSpan: 1 })
      }
    }],
    rooms: ['a', 'b']
  })
})

test('single room', async t => {
  const slots = slotsForRooms('Asia/Tokyo', forRoom('a',
    { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: 'a', lang: 'en' },
    { id: '1-2', start: '12:00', end: '13:00', summary: 'y' }
  ))
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      room: 'a',
      entry:
        single({ room: 'a', id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: 'a', lang: 'en', rowSpan: 1 })
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'a',
      entry:
        single({ room: 'a', id: '1-2', start: '12:00', end: '13:00', summary: 'y', rowSpan: 1 })
    }
  ])
})

test('opening entry', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '10:00', end: '11:00', summary: 'y' },
      { id: '2-2', start: '11:00', end: '12:00', summary: 'z' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '10:00',
      end: '11:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-1', start: '10:00', end: '11:00', summary: 'y', rowSpan: 1 })
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('a', { id: '1-1', start: '11:00', end: '12:00', summary: 'x', rowSpan: 1 }),
        ...scoped('b', { id: '2-2', start: '11:00', end: '12:00', summary: 'z', rowSpan: 1 })
      }
    }
  ])
})

test('multiple opening entries', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '09:00', end: '10:00', summary: 'y`' },
      { id: '2-2', start: '10:00', end: '11:00', summary: 'y' },
      { id: '2-3', start: '11:00', end: '12:00', summary: 'z' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-1', start: '09:00', end: '10:00', summary: 'y`', rowSpan: 1 })
    },
    {
      start: '10:00',
      end: '11:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-2', start: '10:00', end: '11:00', summary: 'y', rowSpan: 1 })
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('a', { id: '1-1', start: '11:00', end: '12:00', summary: 'x', rowSpan: 1 }),
        ...scoped('b', { id: '2-3', start: '11:00', end: '12:00', summary: 'z', rowSpan: 1 })
      }
    }
  ])
})

test('multiple opening entries with rowSpan', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '09:00', end: '10:00', summary: 'x' },
      { id: '1-2', start: '10:00', end: '12:00', summary: 'y' },
      { id: '1-3', start: '12:00', end: '13:00', summary: 'y`' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '11:00', end: '12:00', summary: 'z' },
      { id: '2-2', start: '12:00', end: '13:00', summary: 'z`' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'a',
      entry:
        single({ room: 'a', id: '1-1', start: '09:00', end: '10:00', summary: 'x', rowSpan: 1 })
    },
    {
      start: '10:00',
      end: '11:00',
      entries: {
        ...scoped('a', { id: '1-2', start: '10:00', end: '12:00', summary: 'y', rowSpan: 2 }),
        ...scoped('b', { start: '10:00', end: '11:00', summary: null, rowSpan: 1 })
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('b', { id: '2-1', start: '11:00', end: '12:00', summary: 'z', rowSpan: 1 })
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entries: {
        ...scoped('a', { id: '1-3', start: '12:00', end: '13:00', summary: 'y`', rowSpan: 1 }),
        ...scoped('b', { id: '2-2', start: '12:00', end: '13:00', summary: 'z`', rowSpan: 1 })
      }
    }
  ])
})

test('closing entry', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '11:00', end: '12:00', summary: 'y' },
      { id: '2-2', start: '12:00', end: '13:00', summary: 'z' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('a', { id: '1-1', start: '11:00', end: '12:00', summary: 'x', rowSpan: 1 }),
        ...scoped('b', { id: '2-1', start: '11:00', end: '12:00', summary: 'y', rowSpan: 1 })
      }
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-2', start: '12:00', end: '13:00', summary: 'z', rowSpan: 1 })
    }
  ])
})

test('multiple closing entries', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '11:00', end: '12:00', summary: 'y' },
      { id: '2-2', start: '12:00', end: '13:00', summary: 'z' },
      { id: '2-3', start: '13:10', end: '14:00', summary: 'z`' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('a', { id: '1-1', start: '11:00', end: '12:00', summary: 'x', rowSpan: 1 }),
        ...scoped('b', { id: '2-1', start: '11:00', end: '12:00', summary: 'y', rowSpan: 1 })
      }
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-2', start: '12:00', end: '13:00', summary: 'z', rowSpan: 1 })
    },
    {
      start: '13:00',
      end: '13:10',
      entry:
        single({ start: '13:00', end: '13:10', summary: null, rowSpan: 1 }),
      room: null
    },
    {
      start: '13:10',
      end: '14:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-3', start: '13:10', end: '14:00', summary: 'z`', rowSpan: 1 })
    }
  ])
})

test('test with closings and openings', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '11:00', end: '11:20', summary: 'opening' },
      { id: '1-2', start: '11:20', end: '12:00', summary: 'x', person: 'A', lang: null },
      { id: '1-3', start: '12:00', end: '13:30', summary: 'y', person: 'B', lang: null },
      { id: '1-4', start: '14:00', end: '15:00', summary: 'z', person: 'C', lang: null },
      { id: '1-5', start: '15:00', end: '15:30', summary: 'closing' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '11:20', end: '15:00', summary: 'w', person: 'D', lang: null }
    ),
    ...forRoom('c',
      { id: '3-1', start: '11:20', end: '13:30', summary: 'f', person: 'E', lang: null }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '11:20',
      room: 'a',
      entry:
        single({ room: 'a', id: '1-1', start: '11:00', end: '11:20', summary: 'opening', rowSpan: 1 })
    },
    {
      start: '11:20',
      end: '12:00',
      entries: {
        ...scoped('a', { id: '1-2', start: '11:20', end: '12:00', summary: 'x', person: 'A', lang: null, rowSpan: 1 }),
        ...scoped('b', { id: '2-1', start: '11:20', end: '15:00', summary: 'w', person: 'D', lang: null, rowSpan: 4 }),
        ...scoped('c', { id: '3-1', start: '11:20', end: '13:30', summary: 'f', person: 'E', lang: null, rowSpan: 2 })
      }
    },
    {
      start: '12:00',
      end: '13:30',
      entries: {
        ...scoped('a', { id: '1-3', start: '12:00', end: '13:30', summary: 'y', person: 'B', lang: null, rowSpan: 1 })
      }
    },
    {
      start: '13:30',
      end: '14:00',
      entries: {
        ...scoped('a', { start: '13:30', end: '14:00', summary: null, rowSpan: 1 }),
        ...scoped('c', { start: '13:30', end: '15:00', summary: null, rowSpan: 2 })
      }
    },
    {
      start: '14:00',
      end: '15:00',
      entries: {
        ...scoped('a', { id: '1-4', start: '14:00', end: '15:00', summary: 'z', person: 'C', lang: null, rowSpan: 1 })
      }
    },
    {
      start: '15:00',
      end: '15:30',
      room: 'a',
      entry:
        single({ room: 'a', id: '1-5', start: '15:00', end: '15:30', summary: 'closing', rowSpan: 1 })
    }
  ])
})

test('cross empty slots', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '10:00', end: '11:00', summary: 'x' },
      { start: '11:00', end: '14:00', summary: null },
      { id: '1-2', start: '14:00', end: '15:00', summary: 'y' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '10:00', end: '11:00', summary: 'a' },
      { id: '2-2', start: '11:00', end: '12:00', summary: 'b' },
      { start: '12:00', end: '13:00', summary: null },
      { id: '2-3', start: '13:00', end: '14:00', summary: 'c' },
      { id: '2-4', start: '14:00', end: '15:00', summary: 'd' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '10:00',
      end: '11:00',
      entries: {
        ...scoped('a', { id: '1-1', start: '10:00', end: '11:00', summary: 'x', rowSpan: 1 }),
        ...scoped('b', { id: '2-1', start: '10:00', end: '11:00', summary: 'a', rowSpan: 1 })
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('a', { start: '11:00', end: '12:00', summary: null, rowSpan: 1 }),
        ...scoped('b', { id: '2-2', start: '11:00', end: '12:00', summary: 'b', rowSpan: 1 })
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entry: single({
        start: '12:00', end: '13:00', summary: null, rowSpan: 1
      }),
      room: null
    },
    {
      start: '13:00',
      end: '14:00',
      entries: {
        ...scoped('a', { start: '13:00', end: '14:00', summary: null, rowSpan: 1 }),
        ...scoped('b', { id: '2-3', start: '13:00', end: '14:00', summary: 'c', rowSpan: 1 })
      }
    },
    {
      start: '14:00',
      end: '15:00',
      entries: {
        ...scoped('a', { id: '1-2', start: '14:00', end: '15:00', summary: 'y', rowSpan: 1 }),
        ...scoped('b', { id: '2-4', start: '14:00', end: '15:00', summary: 'd', rowSpan: 1 })
      }
    }
  ])
})

test('empty slots', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '11:00', end: '12:00', summary: 'opening' },
      { id: '1-2', start: '13:00', end: '14:00', summary: 'closing' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '11:00', end: '12:00', summary: 'opening' },
      { id: '2-2', start: '13:00', end: '14:00', summary: 'closing' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('a', { id: '1-1', start: '11:00', end: '12:00', summary: 'opening', rowSpan: 1 }),
        ...scoped('b', { id: '2-1', start: '11:00', end: '12:00', summary: 'opening', rowSpan: 1 })
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entry: single({
        start: '12:00', end: '13:00', summary: null, rowSpan: 1
      }),
      room: null
    },
    {
      start: '13:00',
      end: '14:00',
      entries: {
        ...scoped('a', { id: '1-2', start: '13:00', end: '14:00', summary: 'closing', rowSpan: 1 }),
        ...scoped('b', { id: '2-2', start: '13:00', end: '14:00', summary: 'closing', rowSpan: 1 })
      }
    }
  ])
})

test('end reductions, complex case', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    ...forRoom('a',
      { id: '1-1', start: '09:00', end: '10:00', summary: 'w' },
      { id: '1-2', start: '10:00', end: '12:00', summary: 'x' }
    ),
    ...forRoom('b',
      { id: '2-1', start: '12:00', end: '13:00', summary: 'y' },
      { id: '2-2', start: '14:00', end: '15:00', summary: 'z' },
      { id: '2-3', start: '15:00', end: '16:00', summary: 'zz' }
    ),
    ...forRoom('c',
      { id: '3-1', start: '11:00', end: '14:00', summary: 'r' }
    )
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'a',
      entry:
        single({ room: 'a', id: '1-1', start: '09:00', end: '10:00', summary: 'w', rowSpan: 1 })
    },
    {
      start: '10:00',
      end: '11:00',
      entries: {
        ...scoped('a', { id: '1-2', start: '10:00', end: '12:00', summary: 'x', rowSpan: 2 }),
        ...scoped('b', { start: '10:00', end: '12:00', summary: null, rowSpan: 2 }),
        ...scoped('c', { start: '10:00', end: '11:00', summary: null, rowSpan: 1 })
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        ...scoped('c', { id: '3-1', start: '11:00', end: '14:00', summary: 'r', rowSpan: 3 })
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entries: {
        ...scoped('a', { start: '12:00', end: '14:00', summary: null, rowSpan: 2 }),
        ...scoped('b', { id: '2-1', start: '12:00', end: '13:00', summary: 'y', rowSpan: 1 })
      }
    },
    {
      start: '13:00',
      end: '14:00',
      entries: {
        ...scoped('b', { start: '13:00', end: '14:00', summary: null, rowSpan: 1 })
      }
    },
    {
      start: '14:00',
      end: '15:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-2', start: '14:00', end: '15:00', summary: 'z', rowSpan: 1 })
    },
    {
      start: '15:00',
      end: '16:00',
      room: 'b',
      entry:
        single({ room: 'b', id: '2-3', start: '15:00', end: '16:00', summary: 'zz', rowSpan: 1 })
    }
  ])
})
