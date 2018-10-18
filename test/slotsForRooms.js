const test = require('tap').test
const slotsForRooms = require('../slotsForRooms')

test('test with very simple data', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [{ id: '1-1', start: '11:00', end: '12:00', summary: 'x', description: 'z', person: null }],
    b: [{ id: '2-1', start: '11:00', end: '12:00', summary: 'y', person: null }]
  })
  t.deepEquals(slots, {
    tz: 'Asia/Tokyo',
    slots: [{
      start: '11:00',
      end: '12:00',
      entries: {
        a: { id: '1-1', start: '11:00', end: '12:00', summary: 'x', description: 'z', person: null, rowSpan: 1 },
        b: { id: '2-1', start: '11:00', end: '12:00', summary: 'y', person: null, rowSpan: 1 }
      }
    }],
    rooms: ['a', 'b']
  })
})

test('single room', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null },
      { id: '1-2', start: '12:00', end: '13:00', summary: 'y', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      room: 'a',
      entry:
        { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1 }
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'a',
      entry:
        { id: '1-2', start: '12:00', end: '13:00', summary: 'y', person: null, rowSpan: 1 }
    }
  ])
})

test('opening entry', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null }
    ],
    b: [
      { id: '2-1', start: '10:00', end: '11:00', summary: 'y', person: null },
      { id: '2-2', start: '11:00', end: '12:00', summary: 'z', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '10:00',
      end: '11:00',
      room: 'b',
      entry:
        { id: '2-1', start: '10:00', end: '11:00', summary: 'y', person: null, rowSpan: 1 }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1 },
        b: { id: '2-2', start: '11:00', end: '12:00', summary: 'z', person: null, rowSpan: 1 }
      }
    }
  ])
})

test('multiple opening entries', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null }
    ],
    b: [
      { id: '2-1', start: '09:00', end: '10:00', summary: 'y`', person: null },
      { id: '2-2', start: '10:00', end: '11:00', summary: 'y', person: null },
      { id: '2-3', start: '11:00', end: '12:00', summary: 'z', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'b',
      entry:
        { id: '2-1', start: '09:00', end: '10:00', summary: 'y`', person: null, rowSpan: 1 }
    },
    {
      start: '10:00',
      end: '11:00',
      room: 'b',
      entry:
        { id: '2-2', start: '10:00', end: '11:00', summary: 'y', person: null, rowSpan: 1 }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1 },
        b: { id: '2-3', start: '11:00', end: '12:00', summary: 'z', person: null, rowSpan: 1 }
      }
    }
  ])
})

test('multiple opening entries with rowSpan', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '09:00', end: '10:00', summary: 'x', person: null },
      { id: '1-2', start: '10:00', end: '12:00', summary: 'y', person: null },
      { id: '1-3', start: '12:00', end: '13:00', summary: 'y`', person: null }
    ],
    b: [
      { id: '2-1', start: '11:00', end: '12:00', summary: 'z', person: null },
      { id: '2-2', start: '12:00', end: '13:00', summary: 'z`', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'a',
      entry:
        { id: '1-1', start: '09:00', end: '10:00', summary: 'x', person: null, rowSpan: 1 }
    },
    {
      start: '10:00',
      end: '11:00',
      entries: {
        a: { id: '1-2', start: '10:00', end: '12:00', summary: 'y', person: null, rowSpan: 2 },
        b: { start: '10:00', end: '11:00', summary: null, person: null, rowSpan: 1 }
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        b: { id: '2-1', start: '11:00', end: '12:00', summary: 'z', person: null, rowSpan: 1 }
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entries: {
        a: { id: '1-3', start: '12:00', end: '13:00', summary: 'y`', person: null, rowSpan: 1 },
        b: { id: '2-2', start: '12:00', end: '13:00', summary: 'z`', person: null, rowSpan: 1 }
      }
    }
  ])
})

test('closing entry', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null }
    ],
    b: [
      { id: '2-1', start: '11:00', end: '12:00', summary: 'y', person: null },
      { id: '2-2', start: '12:00', end: '13:00', summary: 'z', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1 },
        b: { id: '2-1', start: '11:00', end: '12:00', summary: 'y', person: null, rowSpan: 1 }
      }
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'b',
      entry:
        { id: '2-2', start: '12:00', end: '13:00', summary: 'z', person: null, rowSpan: 1 }
    }
  ])
})

test('multiple closing entries', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null }
    ],
    b: [
      { id: '2-1', start: '11:00', end: '12:00', summary: 'y', person: null },
      { id: '2-2', start: '12:00', end: '13:00', summary: 'z', person: null },
      { id: '2-3', start: '13:10', end: '14:00', summary: 'z`', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: { id: '1-1', start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1 },
        b: { id: '2-1', start: '11:00', end: '12:00', summary: 'y', person: null, rowSpan: 1 }
      }
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'b',
      entry:
        { id: '2-2', start: '12:00', end: '13:00', summary: 'z', person: null, rowSpan: 1 }
    },
    {
      start: '13:00',
      end: '13:10',
      entry:
        { start: '13:00', end: '13:10', summary: null, person: null, rowSpan: 1 },
      room: null
    },
    {
      start: '13:10',
      end: '14:00',
      room: 'b',
      entry:
        { id: '2-3', start: '13:10', end: '14:00', summary: 'z`', person: null, rowSpan: 1 }

    }
  ])
})

test('test with closings and openings', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '11:00', end: '11:20', summary: 'opening', person: null },
      { id: '1-2', start: '11:20', end: '12:00', summary: 'x', person: 'A' },
      { id: '1-3', start: '12:00', end: '13:30', summary: 'y', person: 'B' },
      { id: '1-4', start: '14:00', end: '15:00', summary: 'z', person: 'C' },
      { id: '1-5', start: '15:00', end: '15:30', summary: 'closing', person: null }
    ],
    b: [
      { id: '2-1', start: '11:20', end: '15:00', summary: 'w', person: 'D' }
    ],
    c: [
      { id: '3-1', start: '11:20', end: '13:30', summary: 'f', person: 'E' }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '11:20',
      room: 'a',
      entry:
        { id: '1-1', start: '11:00', end: '11:20', summary: 'opening', person: null, rowSpan: 1 }
    },
    {
      start: '11:20',
      end: '12:00',
      entries: {
        a: { id: '1-2', start: '11:20', end: '12:00', summary: 'x', person: 'A', rowSpan: 1 },
        b: { id: '2-1', start: '11:20', end: '15:00', summary: 'w', person: 'D', rowSpan: 4 },
        c: { id: '3-1', start: '11:20', end: '13:30', summary: 'f', person: 'E', rowSpan: 2 }
      }
    },
    {
      start: '12:00',
      end: '13:30',
      entries: {
        a: { id: '1-3', start: '12:00', end: '13:30', summary: 'y', person: 'B', rowSpan: 1 }
      }
    },
    {
      start: '13:30',
      end: '14:00',
      entries: {
        a: { start: '13:30', end: '14:00', summary: null, person: null, rowSpan: 1 },
        c: { start: '13:30', end: '15:00', summary: null, person: null, rowSpan: 2 }
      }
    },
    {
      start: '14:00',
      end: '15:00',
      entries: {
        a: { id: '1-4', start: '14:00', end: '15:00', summary: 'z', person: 'C', rowSpan: 1 }
      }
    },
    {
      start: '15:00',
      end: '15:30',
      room: 'a',
      entry:
        { id: '1-5', start: '15:00', end: '15:30', summary: 'closing', person: null, rowSpan: 1 }
    }
  ])
})

test('cross empty slots', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '10:00', end: '11:00', summary: 'x', person: null },
      { start: '11:00', end: '14:00', summary: null, person: null },
      { id: '1-2', start: '14:00', end: '15:00', summary: 'y', person: null }
    ],
    b: [
      { id: '2-1', start: '10:00', end: '11:00', summary: 'a', person: null },
      { id: '2-2', start: '11:00', end: '12:00', summary: 'b', person: null },
      { start: '12:00', end: '13:00', summary: null, person: null },
      { id: '2-3', start: '13:00', end: '14:00', summary: 'c', person: null },
      { id: '2-4', start: '14:00', end: '15:00', summary: 'd', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '10:00',
      end: '11:00',
      entries: {
        a: { id: '1-1', start: '10:00', end: '11:00', summary: 'x', person: null, rowSpan: 1 },
        b: { id: '2-1', start: '10:00', end: '11:00', summary: 'a', person: null, rowSpan: 1 }
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: { start: '11:00', end: '12:00', summary: null, person: null, rowSpan: 1 },
        b: { id: '2-2', start: '11:00', end: '12:00', summary: 'b', person: null, rowSpan: 1 }
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entry: {
        start: '12:00', end: '13:00', summary: null, person: null, rowSpan: 1
      },
      room: null
    },
    {
      start: '13:00',
      end: '14:00',
      entries: {
        a: { start: '13:00', end: '14:00', summary: null, person: null, rowSpan: 1 },
        b: { id: '2-3', start: '13:00', end: '14:00', summary: 'c', person: null, rowSpan: 1 }
      }
    },
    {
      start: '14:00',
      end: '15:00',
      entries: {
        a: { id: '1-2', start: '14:00', end: '15:00', summary: 'y', person: null, rowSpan: 1 },
        b: { id: '2-4', start: '14:00', end: '15:00', summary: 'd', person: null, rowSpan: 1 }
      }
    }
  ])
})

test('empty slots', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '11:00', end: '12:00', summary: 'opening', person: null },
      { id: '1-2', start: '13:00', end: '14:00', summary: 'closing', person: null }
    ],
    b: [
      { id: '2-1', start: '11:00', end: '12:00', summary: 'opening', person: null },
      { id: '2-2', start: '13:00', end: '14:00', summary: 'closing', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: { id: '1-1', start: '11:00', end: '12:00', summary: 'opening', person: null, rowSpan: 1 },
        b: { id: '2-1', start: '11:00', end: '12:00', summary: 'opening', person: null, rowSpan: 1 }
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entry: {
        start: '12:00', end: '13:00', summary: null, person: null, rowSpan: 1
      },
      room: null
    },
    {
      start: '13:00',
      end: '14:00',
      entries: {
        a: { id: '1-2', start: '13:00', end: '14:00', summary: 'closing', person: null, rowSpan: 1 },
        b: { id: '2-2', start: '13:00', end: '14:00', summary: 'closing', person: null, rowSpan: 1 }
      }
    }
  ])
})

test('end reductions, complex case', async t => {
  const slots = slotsForRooms('Asia/Tokyo', {
    a: [
      { id: '1-1', start: '09:00', end: '10:00', summary: 'w', person: null },
      { id: '1-2', start: '10:00', end: '12:00', summary: 'x', person: null }
    ],
    b: [
      { id: '2-1', start: '12:00', end: '13:00', summary: 'y', person: null },
      { id: '2-2', start: '14:00', end: '15:00', summary: 'z', person: null },
      { id: '2-3', start: '15:00', end: '16:00', summary: 'zz', person: null }
    ],
    c: [
      { id: '3-1', start: '11:00', end: '14:00', summary: 'r', person: null }
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'a',
      entry:
        { id: '1-1', start: '09:00', end: '10:00', summary: 'w', person: null, rowSpan: 1 }
    },
    {
      start: '10:00',
      end: '11:00',
      entries: {
        a: { id: '1-2', start: '10:00', end: '12:00', summary: 'x', person: null, rowSpan: 2 },
        b: { start: '10:00', end: '12:00', summary: null, person: null, rowSpan: 2 },
        c: { start: '10:00', end: '11:00', summary: null, person: null, rowSpan: 1 }
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        c: { id: '3-1', start: '11:00', end: '14:00', summary: 'r', person: null, rowSpan: 3 }
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entries: {
        a: { start: '12:00', end: '14:00', summary: null, person: null, rowSpan: 2 },
        b: { id: '2-1', start: '12:00', end: '13:00', summary: 'y', person: null, rowSpan: 1 }
      }
    },
    {
      start: '13:00',
      end: '14:00',
      entries: {
        b: { start: '13:00', end: '14:00', summary: null, person: null, rowSpan: 1 }
      }
    },
    {
      start: '14:00',
      end: '15:00',
      room: 'b',
      entry:
        { id: '2-2', start: '14:00', end: '15:00', summary: 'z', person: null, rowSpan: 1 }
    },
    {
      start: '15:00',
      end: '16:00',
      room: 'b',
      entry:
        { id: '2-3', start: '15:00', end: '16:00', summary: 'zz', person: null, rowSpan: 1 }
    }
  ])
})
