const test = require('tap').test
const slotsForRooms = require('../slotsForRooms')

test('test with very simple data', t => {
  const slots = slotsForRooms({
    a: [{start: '11:00', end: '12:00', summary: 'x', person: null}],
    b: [{start: '11:00', end: '12:00', summary: 'y', person: null}]
  })
  t.deepEquals(slots.slots, [{
    start: '11:00',
    end: '12:00',
    entries: {
      a: {start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1},
      b: {start: '11:00', end: '12:00', summary: 'y', person: null, rowSpan: 1}
    }
  }])
  t.end()
})

test('single room', t => {
  const slots = slotsForRooms({
    a: [
      {start: '11:00', end: '12:00', summary: 'x', person: null},
      {start: '12:00', end: '13:00', summary: 'y', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      room: 'a',
      entry:
        {start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1}
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'a',
      entry:
        {start: '12:00', end: '13:00', summary: 'y', person: null, rowSpan: 1}
    }
  ])
  t.end()
})

test('opening entry', t => {
  const slots = slotsForRooms({
    a: [
      {start: '11:00', end: '12:00', summary: 'x', person: null}
    ],
    b: [
      {start: '10:00', end: '11:00', summary: 'y', person: null},
      {start: '11:00', end: '12:00', summary: 'z', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '10:00',
      end: '11:00',
      room: 'b',
      entry:
        {start: '10:00', end: '11:00', summary: 'y', person: null, rowSpan: 1}
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: {start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1},
        b: {start: '11:00', end: '12:00', summary: 'z', person: null, rowSpan: 1}
      }
    }
  ])
  t.end()
})

test('multiple opening entries', t => {
  const slots = slotsForRooms({
    a: [
      {start: '11:00', end: '12:00', summary: 'x', person: null}
    ],
    b: [
      {start: '09:00', end: '10:00', summary: 'y`', person: null},
      {start: '10:00', end: '11:00', summary: 'y', person: null},
      {start: '11:00', end: '12:00', summary: 'z', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'b',
      entry:
        {start: '09:00', end: '10:00', summary: 'y`', person: null, rowSpan: 1}
    },
    {
      start: '10:00',
      end: '11:00',
      room: 'b',
      entry:
        {start: '10:00', end: '11:00', summary: 'y', person: null, rowSpan: 1}
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: {start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1},
        b: {start: '11:00', end: '12:00', summary: 'z', person: null, rowSpan: 1}
      }
    }
  ])
  t.end()
})

test('multiple opening entries with rowSpan', t => {
  const slots = slotsForRooms({
    a: [
      {start: '09:00', end: '10:00', summary: 'x', person: null},
      {start: '10:00', end: '12:00', summary: 'y', person: null},
      {start: '12:00', end: '13:00', summary: 'y`', person: null}
    ],
    b: [
      {start: '11:00', end: '12:00', summary: 'z', person: null},
      {start: '12:00', end: '13:00', summary: 'z`', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'a',
      entry:
        {start: '09:00', end: '10:00', summary: 'x', person: null, rowSpan: 1}
    },
    {
      start: '10:00',
      end: '11:00',
      entries: {
        a: {start: '10:00', end: '12:00', summary: 'y', person: null, rowSpan: 2},
        b: {start: '10:00', end: '11:00', summary: null, person: null, rowSpan: 1}
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        b: {start: '11:00', end: '12:00', summary: 'z', person: null, rowSpan: 1}
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entries: {
        a: {start: '12:00', end: '13:00', summary: 'y`', person: null, rowSpan: 1},
        b: {start: '12:00', end: '13:00', summary: 'z`', person: null, rowSpan: 1}
      }
    }
  ])
  t.end()
})

test('closing entry', t => {
  const slots = slotsForRooms({
    a: [
      {start: '11:00', end: '12:00', summary: 'x', person: null}
    ],
    b: [
      {start: '11:00', end: '12:00', summary: 'y', person: null},
      {start: '12:00', end: '13:00', summary: 'z', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: {start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1},
        b: {start: '11:00', end: '12:00', summary: 'y', person: null, rowSpan: 1}
      }
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'b',
      entry:
        {start: '12:00', end: '13:00', summary: 'z', person: null, rowSpan: 1}
    }
  ])
  t.end()
})

test('multiple closing entries', t => {
  const slots = slotsForRooms({
    a: [
      {start: '11:00', end: '12:00', summary: 'x', person: null}
    ],
    b: [
      {start: '11:00', end: '12:00', summary: 'y', person: null},
      {start: '12:00', end: '13:00', summary: 'z', person: null},
      {start: '13:10', end: '14:00', summary: 'z`', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: {start: '11:00', end: '12:00', summary: 'x', person: null, rowSpan: 1},
        b: {start: '11:00', end: '12:00', summary: 'y', person: null, rowSpan: 1}
      }
    },
    {
      start: '12:00',
      end: '13:00',
      room: 'b',
      entry:
        {start: '12:00', end: '13:00', summary: 'z', person: null, rowSpan: 1}
    },
    {
      start: '13:00',
      end: '13:10',
      entry: 
        {start: '13:00', end: '13:10', summary: null, person: null, rowSpan: 1},
      room: null
    },
    {
      start: '13:10',
      end: '14:00',
      room: 'b',
      entry:
        {start: '13:10', end: '14:00', summary: 'z`', person: null, rowSpan: 1}

    }
  ])
  t.end()
})

test('test with closings and openings', t => {
  const slots = slotsForRooms({
    a: [
      {start: '11:00', end: '11:20', summary: 'opening', person: null},
      {start: '11:20', end: '12:00', summary: 'x', person: 'A'},
      {start: '12:00', end: '13:30', summary: 'y', person: 'B'},
      {start: '14:00', end: '15:00', summary: 'z', person: 'C'},
      {start: '15:00', end: '15:30', summary: 'closing', person: null}
    ],
    b: [
      {start: '11:20', end: '15:00', summary: 'w', person: 'D'}
    ],
    c: [
      {start: '11:20', end: '13:30', summary: 'f', person: 'E'}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '11:20',
      room: 'a',
      entry:
        {start: '11:00', end: '11:20', summary: 'opening', person: null, rowSpan: 1}
    },
    {
      start: '11:20',
      end: '12:00',
      entries: {
        a: {start: '11:20', end: '12:00', summary: 'x', person: 'A', rowSpan: 1},
        b: {start: '11:20', end: '15:00', summary: 'w', person: 'D', rowSpan: 4},
        c: {start: '11:20', end: '13:30', summary: 'f', person: 'E', rowSpan: 2}
      }
    },
    {
      start: '12:00',
      end: '13:30',
      entries: {
        a: {start: '12:00', end: '13:30', summary: 'y', person: 'B', rowSpan: 1}
      }
    },
    {
      start: '13:30',
      end: '14:00',
      entries: {
        a: {start: '13:30', end: '14:00', summary: null, person: null, rowSpan: 1},
        c: {start: '13:30', end: '15:00', summary: null, person: null, rowSpan: 2}
      }
    },
    {
      start: '14:00',
      end: '15:00',
      entries: {
        a: {start: '14:00', end: '15:00', summary: 'z', person: 'C', rowSpan: 1}
      }
    },
    {
      start: '15:00',
      end: '15:30',
      room: 'a',
      entry:
        {start: '15:00', end: '15:30', summary: 'closing', person: null, rowSpan: 1}
    }
  ])
  t.end()
})

test('cross empty slots', t => {
  const slots = slotsForRooms({
    a: [
      {start: '10:00', end: '11:00', summary: 'x', person: null},
      {start: '11:00', end: '14:00', summary: null, person: null},
      {start: '14:00', end: '15:00', summary: 'y', person: null}
    ],
    b: [
      {start: '10:00', end: '11:00', summary: 'a', person: null},
      {start: '11:00', end: '12:00', summary: 'b', person: null},
      {start: '12:00', end: '13:00', summary: null, person: null},
      {start: '13:00', end: '14:00', summary: 'c', person: null},
      {start: '14:00', end: '15:00', summary: 'd', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '10:00',
      end: '11:00',
      entries: {
        a: {start: '10:00', end: '11:00', summary: 'x', person: null, rowSpan: 1},
        b: {start: '10:00', end: '11:00', summary: 'a', person: null, rowSpan: 1}
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: {start: '11:00', end: '12:00', summary: null, person: null, rowSpan: 1},
        b: {start: '11:00', end: '12:00', summary: 'b', person: null, rowSpan: 1}
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
        a: {start: '13:00', end: '14:00', summary: null, person: null, rowSpan: 1},
        b: {start: '13:00', end: '14:00', summary: 'c', person: null, rowSpan: 1}
      }
    },
    {
      start: '14:00',
      end: '15:00',
      entries: {
        a: {start: '14:00', end: '15:00', summary: 'y', person: null, rowSpan: 1},
        b: {start: '14:00', end: '15:00', summary: 'd', person: null, rowSpan: 1}
      }
    }
  ])
  t.end()
})

test('empty slots', t => {
  const slots = slotsForRooms({
    a: [
      {start: '11:00', end: '12:00', summary: 'opening', person: null},
      {start: '13:00', end: '14:00', summary: 'closing', person: null}
    ],
    b: [
      {start: '11:00', end: '12:00', summary: 'opening', person: null},
      {start: '13:00', end: '14:00', summary: 'closing', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '11:00',
      end: '12:00',
      entries: {
        a: {start: '11:00', end: '12:00', summary: 'opening', person: null, rowSpan: 1},
        b: {start: '11:00', end: '12:00', summary: 'opening', person: null, rowSpan: 1}
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
        a: {start: '13:00', end: '14:00', summary: 'closing', person: null, rowSpan: 1},
        b: {start: '13:00', end: '14:00', summary: 'closing', person: null, rowSpan: 1}
      }
    }
  ])
  t.end()
})

test('end reductions, complex case', t => {
  const slots = slotsForRooms({
    a: [
      {start: '09:00', end: '10:00', summary: 'w', person: null},
      {start: '10:00', end: '12:00', summary: 'x', person: null}
    ],
    b: [
      {start: '12:00', end: '13:00', summary: 'y', person: null},
      {start: '14:00', end: '15:00', summary: 'z', person: null},
      {start: '15:00', end: '16:00', summary: 'zz', person: null}
    ],
    c: [
      {start: '11:00', end: '14:00', summary: 'r', person: null}
    ]
  })
  t.deepEquals(slots.slots, [
    {
      start: '09:00',
      end: '10:00',
      room: 'a',
      entry:
        {start: '09:00', end: '10:00', summary: 'w', person: null, rowSpan: 1}
    },
    {
      start: '10:00',
      end: '11:00',
      entries: {
        a: {start: '10:00', end: '12:00', summary: 'x', person: null, rowSpan: 2},
        b: {start: '10:00', end: '12:00', summary: null, person: null, rowSpan: 2},
        c: {start: '10:00', end: '11:00', summary: null, person: null, rowSpan: 1}
      }
    },
    {
      start: '11:00',
      end: '12:00',
      entries: {
        c: {start: '11:00', end: '14:00', summary: 'r', person: null, rowSpan: 3}
      }
    },
    {
      start: '12:00',
      end: '13:00',
      entries: {
        a: {start: '12:00', end: '14:00', summary: null, person: null, rowSpan: 2},
        b: {start: '12:00', end: '13:00', summary: 'y', person: null, rowSpan: 1}
      }
    },
    {
      start: '13:00',
      end: '14:00',
      entries: {
        b: {start: '13:00', end: '14:00', summary: null, person: null, rowSpan: 1}
      }
    },
    {
      start: '14:00',
      end: '15:00',
      room: 'b',
      entry:
        {start: '14:00', end: '15:00', summary: 'z', person: null, rowSpan: 1}
    },
    {
      start: '15:00',
      end: '16:00',
      room: 'b',
      entry:
        {start: '15:00', end: '16:00', summary: 'zz', person: null, rowSpan: 1}
    }
  ])
  t.end()
})
