const test = require('tap').test
const renderSlots = require('../renderSlots')

test('rendering of a single slot and a single room', async t => {
  const rendered = renderSlots({}, {
    rooms: ['a'],
    tz: 'Asia/Tokyo',
    slots: [{
      start: '2017-11-25T00:00:00.000Z',
      end: '2017-11-25T01:00:00.000Z',
      room: 'a',
      entry: { start: '2017-11-25T00:00:00.000Z', end: '2017-11-25T01:00:00.000Z', summary: 'x', person: null, rowSpan: 1 }
    }]
  })
  t.equals(rendered, `
|  | a |
| --- | --- |
| 9:00-10:00 | x |
`)
})

test('rendering of a single slot and a single multiline room', async t => {
  const rendered = renderSlots({}, {
    rooms: ['a'],
    tz: 'Asia/Tokyo',
    slots: [{
      start: '2017-11-25T00:00:00.000Z',
      end: '2017-11-25T01:00:00.000Z',
      room: 'a',
      entry: { start: '2017-11-25T00:00:00.000Z', end: '2017-11-25T01:00:00.000Z', summary: 'x\ny', person: null, rowSpan: 1 }
    }]
  })
  t.equals(rendered, `
|  | a |
| --- | --- |
| 9:00-10:00 | x<br/>y |
`)
})

test('rendering a multiline slot with a list', async t => {
  const rendered = renderSlots({}, {
    rooms: ['a'],
    tz: 'Asia/Tokyo',
    slots: [{
      start: '2017-11-25T00:00:00.000Z',
      end: '2017-11-25T01:00:00.000Z',
      room: 'a',
      entry: {
        start: '2017-11-25T00:00:00.000Z',
        end: '2017-11-25T01:00:00.000Z',
        summary: 'x',
        person: 'a',
        lang: 'en',
        entries: [
          { summary: 'y', person: 'b' },
          { summary: 'z', person: 'c' }
        ],
        rowSpan: 1
      }
    }]
  })
  t.equals(rendered, `
|  | a |
| --- | --- |
| 9:00-10:00 | x _by a_ in en<br/><ul><li>y _by b_</li><li>z _by c_</li></ul> |
`)
})

test('rendering with escape characters in the room, summary and person', async t => {
  const rendered = renderSlots({}, {
    rooms: ['|a|'],
    tz: 'Asia/Tokyo',
    slots: [{
      start: '2017-11-25T00:00:00.000Z',
      end: '2017-11-25T01:00:00.000Z',
      room: '|a|',
      entry: { start: '2017-11-25T00:00:00.000Z', end: '2017-11-25T01:00:00.000Z', summary: '|x|', person: '|y|', rowSpan: 1 }
    }]
  })
  t.equals(rendered, `
|  | &#124;a&#124; |
| --- | --- |
| 9:00-10:00 | &#124;x&#124; _by &#124;y&#124;_ |
`)
})

test('rendering of two slots and two rooms', async t => {
  const rendered = renderSlots({}, {
    rooms: ['a', 'b'],
    tz: 'Asia/Tokyo',
    slots: [{
      start: '2017-11-25T00:00:00.000Z',
      end: '2017-11-25T01:00:00.000Z',
      entries: {
        a: { start: '2017-11-25T00:00:00.000Z', end: '2017-11-25T01:00:00.000Z', summary: 'x', person: null, rowSpan: 1 },
        b: { start: '2017-11-25T00:00:00.000Z', end: '2017-11-25T01:00:00.000Z', summary: '1', person: null, rowSpan: 1 }
      }
    }, {
      start: '2017-11-25T01:00:00.000Z',
      end: '2017-11-25T02:00:00.000Z',
      entries: {
        a: { start: '2017-11-25T01:00:00.000Z', end: '2017-11-25T02:00:00.000Z', summary: 'y', person: null, rowSpan: 1 },
        b: { start: '2017-11-25T01:00:00.000Z', end: '2017-11-25T02:00:00.000Z', summary: '2', person: null, rowSpan: 1 }
      }
    }]
  })
  t.equals(rendered, `
|  | a | b |
| --- | --- | --- |
| 9:00-10:00 | x | 1 |
| 10:00-11:00 | y | 2 |
`)
})

test('rendering of two slots with breaks and spaces', async t => {
  const rendered = renderSlots({}, {
    rooms: ['a', 'b'],
    tz: 'Asia/Tokyo',
    slots: [{
      start: '2017-11-25T00:00:00.000Z',
      end: '2017-11-25T01:00:00.000Z',
      room: 'a',
      entry:
        { start: '2017-11-25T00:00:00.000Z', end: '2017-11-25T01:00:00.000Z', summary: 'x', person: null, rowSpan: 1 }
    }, {
      start: '2017-11-25T01:00:00.000Z',
      end: '2017-11-25T02:00:00.000Z',
      entry:
        { start: '2017-11-25T01:00:00.000Z', end: '2017-11-25T02:00:00.000Z', summary: null, person: null, rowSpan: 1 }
    }, {
      start: '2017-11-25T02:00:00.000Z',
      end: '2017-11-25T03:00:00.000Z',
      room: 'a',
      entry:
        { start: '2017-11-25T02:00:00.000Z', end: '2017-11-25T03:00:00.000Z', summary: 'y', person: null, rowSpan: 1 }
    }, {
      start: '2017-11-25T03:00:00.000Z',
      end: '2017-11-25T04:00:00.000Z',
      entries: {
        a: { start: '2017-11-25T03:00:00.000Z', end: '2017-11-25T06:00:00.000Z', summary: 'y', person: null, rowSpan: 3 },
        b: { start: '2017-11-25T03:00:00.000Z', end: '2017-11-25T04:00:00.000Z', summary: '1', person: null, rowSpan: 1 }
      }
    }, {
      start: '2017-11-25T04:00:00.000Z',
      end: '2017-11-25T05:00:00.000Z',
      entries: {
        b: { start: '2017-11-25T04:00:00.000Z', end: '2017-11-25T05:00:00.000Z', summary: null, person: null, rowSpan: 1 }
      }
    }, {
      start: '2017-11-25T05:00:00.000Z',
      end: '2017-11-25T06:00:00.000Z',
      entries: {
        b: { start: '2017-11-25T05:00:00.000Z', end: '2017-11-25T06:00:00.000Z', summary: '2', person: null, rowSpan: 1 }
      }
    }, {
      start: '2017-11-25T06:00:00.000Z',
      end: '2017-11-25T07:00:00.000Z',
      room: null,
      entry:
        { start: '2017-11-25T06:00:00.000Z', end: '2017-11-25T07:00:00.000Z', summary: null, person: null, rowSpan: 1 }
    }, {
      start: '2017-11-25T07:00:00.000Z',
      end: '2017-11-25T08:00:00.000Z',
      entries: {
        a: { start: '2017-11-25T07:00:00.000Z', end: '2017-11-25T08:00:00.000Z', summary: 'z', person: null, rowSpan: 1 },
        b: { start: '2017-11-25T07:00:00.000Z', end: '2017-11-25T08:00:00.000Z', summary: '3', person: null, rowSpan: 1 }
      }
    }, {
      start: '2017-11-25T08:00:00.000Z',
      end: '2017-11-25T09:00:00.000Z',
      entries: {
        a: { start: '2017-11-25T08:00:00.000Z', end: '2017-11-25T09:00:00.000Z', summary: null, person: null, rowSpan: 1 },
        b: { start: '2017-11-25T08:00:00.000Z', end: '2017-11-25T09:00:00.000Z', summary: '4', person: null, rowSpan: 1 }
      }
    }, {
      start: '2017-11-25T09:00:00.000Z',
      end: '2017-11-25T10:00:00.000Z',
      entries: {
        a: { start: '2017-11-25T09:00:00.000Z', end: '2017-11-25T10:00:00.000Z', summary: 'z\'', person: null, rowSpan: 1 },
        b: { start: '2017-11-25T09:00:00.000Z', end: '2017-11-25T10:00:00.000Z', summary: '5', person: null, rowSpan: 1 }
      }
    }, {
      start: '2017-11-25T10:00:00.000Z',
      end: '2017-11-25T11:00:00.000Z',
      entry:
        { start: '2017-11-25T10:00:00.000Z', end: '2017-11-25T11:00:00.000Z', summary: '6', person: null, rowSpan: 1 },
      room: 'b'
    }, {
      start: '2017-11-25T11:00:00.000Z',
      end: '2017-11-25T12:00:00.000Z',
      entry:
        { start: '2017-11-25T11:00:00.000Z', end: '2017-11-25T12:00:00.000Z', summary: '7', person: null, rowSpan: 1 },
      room: 'b'
    }]
  })
  t.equals(rendered, `
|  | a | b |
| --- | --- | --- |
| 9:00-10:00 | x | ← |
| 10:00-11:00 | [Break] | [Break] |
| 11:00-12:00 | y | ← |
| 12:00-13:00 | y | 1 |
| 13:00-14:00 | ⤓ | [Break] |
| 14:00-15:00 | ⤓ | 2 |
| 15:00-16:00 | [Break] | [Break] |
| 16:00-17:00 | z | 3 |
| 17:00-18:00 | [Break] | 4 |
| 18:00-19:00 | z' | 5 |
| 19:00-20:00 | → | 6 |
| 20:00-21:00 | → | 7 |
`)
})
