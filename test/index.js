const { test } = require('tap')
const confCal = require('..')
const apiKey = process.env['GOOGLE_API_KEY']

if (!apiKey) {
  throw new Error('To run the unit test you need to set the GOOGLE_API_KEY environment variable')
}

async function emptyTest (input) {
  try {
    await confCal({ apiKey }, input)
  } catch (e) {
    if (!(e instanceof confCal.CalError)) {
      throw e
    }
    if (e.code !== 'empty') {
      throw e
    }
    return
  }
  throw new Error('There should be an error for: "' + input + '"')
}

test('empty calendar file', async () => {
  await emptyTest('')
  await emptyTest(undefined)
  await emptyTest(null)
  await emptyTest('  ')
})

test('missing title', async t => {
  try {
    await confCal({ apiKey }, '\nat Abbot Hall#FWztv6Nshtkn6MN-962gY46UtuA')
    t.fail('There should be an error when the title is missing"')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'missing-data') {
      throw e
    }
    t.equals(e.line, 2)
    t.equals(e.column, 1)
  }
})

test('missing location', async t => {
  try {
    await confCal({ apiKey }, '\nThis is us')
    t.fail('There should be an error when the location is missing')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'missing-data') {
      throw e
    }
    t.equals(e.line, 2)
    t.equals(e.column, 1)
  }
})

test('valid empty file', async t => {
  const data = await confCal({ apiKey }, `
    Fancy title
    on 2017/11/25
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ
  `)
  t.equals(data.title, 'Fancy title')
  t.equals(data.date, '20171125')
  t.equals(data.location, 'Fiery Hell')
})

test('valid file with rooms', async t => {
  const data = await confCal({ apiKey }, `
    Fancy title
    on 2017/11/25
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    09:20-11:20 Event A by X in ja
    11:20-13:00 Event B #b
    13:10-20:00 Event C
    
    [roomB]
    09:20-13:00 Event D #d
    13:10-15:00 Event E by Y
  `)
  t.equals(data.location, 'Fiery Hell')
  t.equals(data.date, '20171125')
  t.equals(data.title, 'Fancy title')
  t.equals(data.googleObjectId, 'ChIJca1Xh1c0I4gRimFWCXd5UNQ')
  t.equals(data.googleObject.timeZone, 'America/Detroit')
  t.deepEquals(data.rooms, {
    roomA: [
      {
        start: '2017-11-25T14:20:00.000Z',
        end: '2017-11-25T16:20:00.000Z',
        id: '1-1',
        summary: 'Event A',
        person: 'X',
        lang: 'ja',
        room: 'roomA'
      }, {
        start: '2017-11-25T16:20:00.000Z',
        end: '2017-11-25T18:00:00.000Z',
        id: 'b',
        hasCustomId: true,
        summary: 'Event B',
        person: null,
        lang: null,
        room: 'roomA'
      }, {
        start: '2017-11-25T18:10:00.000Z',
        end: '2017-11-26T01:00:00.000Z',
        id: '1-3',
        person: null,
        summary: 'Event C',
        lang: null,
        room: 'roomA'
      }
    ],
    roomB: [
      {
        start: '2017-11-25T14:20:00.000Z',
        end: '2017-11-25T18:00:00.000Z',
        id: 'd',
        hasCustomId: true,
        person: null,
        summary: 'Event D',
        lang: null,
        room: 'roomB'
      }, {
        start: '2017-11-25T18:10:00.000Z',
        end: '2017-11-25T20:00:00.000Z',
        id: '2-2',
        person: 'Y',
        summary: 'Event E',
        lang: null,
        room: 'roomB'
      }
    ]
  })
})

test('valid file with multiline entries', async t => {
  const data = await confCal({ apiKey }, `
Fancy title
on 2017/11/25
at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

[roomA]
10:20-11:20 Event A\\ by X
    Fancy test
    Even line endings\\
    are funny
11:30-12:30 Event B
    and more text it is
  `)
  t.equals(data.location, 'Fiery Hell')
  t.equals(data.date, '20171125')
  t.equals(data.title, 'Fancy title')
  t.equals(data.googleObjectId, 'ChIJca1Xh1c0I4gRimFWCXd5UNQ')
  t.equals(data.googleObject.timeZone, 'America/Detroit')
  t.deepEquals(data.rooms, {
    roomA: [
      {
        start: '2017-11-25T15:20:00.000Z',
        end: '2017-11-25T16:20:00.000Z',
        id: '1-1',
        summary: 'Event A Fancy test\nEven line endings are funny',
        person: 'X',
        lang: null,
        room: 'roomA'
      },
      {
        start: '2017-11-25T16:30:00.000Z',
        end: '2017-11-25T17:30:00.000Z',
        id: '1-2',
        summary: 'Event B\nand more text it is',
        person: null,
        lang: null,
        room: 'roomA'
      }
    ]
  })
})

test('valid file with multiline entries with lists', async t => {
  const data = await confCal({ apiKey }, `
Fancy title
on 2017/11/25
at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

[roomA]
10:20-11:20 Event A
    - Event A1 by X
    - Event A2 by Y
    - Event A3\\ by Z
        has more text
    - Event A4 by Z'
  `)
  t.equals(data.location, 'Fiery Hell')
  t.equals(data.date, '20171125')
  t.equals(data.title, 'Fancy title')
  t.equals(data.googleObjectId, 'ChIJca1Xh1c0I4gRimFWCXd5UNQ')
  t.equals(data.googleObject.timeZone, 'America/Detroit')
  t.deepEquals(data.rooms, {
    roomA: [
      {
        start: '2017-11-25T15:20:00.000Z',
        end: '2017-11-25T16:20:00.000Z',
        id: '1-1',
        summary: 'Event A',
        entries: [
          { room: 'roomA', id: '1-1-1', parentId: '1-1', summary: 'Event A1', person: 'X', lang: null },
          { room: 'roomA', id: '1-1-2', parentId: '1-1', summary: 'Event A2', person: 'Y', lang: null },
          { room: 'roomA', id: '1-1-3', parentId: '1-1', summary: 'Event A3 has more text', person: 'Z', lang: null },
          { room: 'roomA', id: '1-1-4', parentId: '1-1', summary: 'Event A4', person: 'Z\'', lang: null }
        ],
        person: null,
        lang: null,
        room: 'roomA'
      }
    ]
  })
})

test('valid file with language', async t => {
  const data = await confCal({ apiKey }, `
    Fancy title
    on 2017/11/25
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:20-11:20 Event A
    11:20-12:20 Event B by X
    12:20-13:20 Event C by Y in ja
    13:20-14:20 Event D by Z in en
    14:20-15:20 Event E in en
    15:20-16:20 Event F in English
  `)
  const [ roomClear, roomClearLang, roomJa, roomEn, roomClearPerson, wrongLangCode ] = data.rooms.roomA
  t.equals(roomClear.summary, 'Event A')
  t.equals(roomClear.person, null)
  t.equals(roomClear.lang, null)
  t.equals(roomClearLang.person, 'X')
  t.equals(roomClearLang.lang, null)
  t.equals(roomJa.person, 'Y')
  t.equals(roomJa.lang, 'ja')
  t.equals(roomEn.person, 'Z')
  t.equals(roomEn.lang, 'en')
  t.equals(roomClearPerson.lang, 'en')
  t.equals(wrongLangCode.summary, 'Event F in English')
})

test('valid file with multiline entry with wrong date indent', async t => {
  try {
    await confCal({ apiKey }, `
      Fancy title
      on 2017/11/25
      at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

      [roomA]
        10:20-11:20 Event A
    `)
    t.fail('There should be an error when the indent is wrong')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'invalid-indent') {
      throw e
    }
    t.equals(e.line, 7)
    t.equals(e.column, 9)
  }
})

test('valid file with multiline entry with too short indents', async t => {
  try {
    await confCal({ apiKey }, `
      Fancy title
      on 2017/11/25
      at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

      [roomA]
      10:20-11:20 Event A\\ by X
        Fancy test
    `)
    t.fail('There should be an error when the indent is wrong')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'invalid-indent') {
      throw e
    }
    t.equals(e.line, 8)
    t.equals(e.column, 9)
  }
})

test('valid file with multiline entry with too long indents', async t => {
  try {
    await confCal({ apiKey }, `
      Fancy title
      on 2017/11/25
      at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

      [roomA]
      10:20-11:20 Event A\\ by X
           Fancy test
    `)
    t.fail('There should be an error when the indent is wrong')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'invalid-indent') {
      throw e
    }
    t.equals(e.line, 8)
    t.equals(e.column, 12)
  }
})

test('valid file with multiline entry with extension in next line', async t => {
  try {
    await confCal({ apiKey }, `
      Fancy title
      on 2017/11/25
      at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

      [roomA]
      10:20-11:20 Event A\\
      11:20-11:40 Event B
    `)
    t.fail('There should be an error when the indent is wrong')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'invalid-indent') {
      throw e
    }
    t.equals(e.line, 8)
    t.equals(e.column, 7)
  }
})

test('valid file with multiline entry with extension in next line from a multiline entry', async t => {
  try {
    await confCal({ apiKey }, `
      Fancy title
      on 2017/11/25
      at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

      [roomA]
      10:20-11:20 Event A
                  Fancy test\\               
      11:20-11:40 Event B
    `)
    t.fail('There should be an error when the indent is wrong')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'invalid-indent') {
      throw e
    }
    t.equals(e.line, 9)
    t.equals(e.column, 7)
  }
})

test('description in entry', async t => {
  const doc = await confCal({ apiKey }, `
    Fancy title
    on 2017/11/11
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:20-11:20 Event A by X

        A simple description
  `)
  const slots = doc.toSlots()

  t.deepEquals(slots, {
    rooms: ['roomA'],
    tz: 'America/Detroit',
    slots: [{
      start: '2017-11-11T15:20:00.000Z',
      end: '2017-11-11T16:20:00.000Z',
      room: 'roomA',
      entry:
      { room: 'roomA', id: '1-1', start: '2017-11-11T15:20:00.000Z', end: '2017-11-11T16:20:00.000Z', summary: 'Event A', person: 'X', lang: null, description: 'A simple description', rowSpan: 1 }
    }]
  })
})

test('description in entry with multiline and paragraphs', async t => {
  const doc = await confCal({ apiKey }, `
    Fancy title
    on 2017/11/11
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:20-11:20 Event A by X

        A simple description
        can be fun
        for many \\
        people

        But Life can be tricky,\\
        take care!
  `)
  const slots = doc.toSlots()

  t.deepEquals(slots, {
    rooms: ['roomA'],
    tz: 'America/Detroit',
    slots: [{
      start: '2017-11-11T15:20:00.000Z',
      end: '2017-11-11T16:20:00.000Z',
      room: 'roomA',
      entry:
      { start: '2017-11-11T15:20:00.000Z',
        end: '2017-11-11T16:20:00.000Z',
        summary: 'Event A',
        id: '1-1',
        person: 'X',
        lang: null,
        room: 'roomA',
        description: `A simple description\ncan be fun\nfor many  people\n\nBut Life can be tricky, take care!`,
        rowSpan: 1 }
    }]
  })
})

test('slots for doc', async t => {
  const doc = await confCal({ apiKey }, `
    Some Conference
    on 2017/11/11
    at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:00-12:00 eventA by X
    12:00-13:00 eventB

    [roomB]
    12:00-13:00 eventC by Y
  `)
  const slots = doc.toSlots()

  t.deepEquals(slots, {
    rooms: ['roomA', 'roomB'],
    tz: 'America/Detroit',
    slots: [
      {
        start: '2017-11-11T15:00:00.000Z',
        end: '2017-11-11T17:00:00.000Z',
        room: 'roomA',
        entry:
        { room: 'roomA', id: '1-1', start: '2017-11-11T15:00:00.000Z', end: '2017-11-11T17:00:00.000Z', summary: 'eventA', person: 'X', lang: null, rowSpan: 1 }
      },
      {
        start: '2017-11-11T17:00:00.000Z',
        end: '2017-11-11T18:00:00.000Z',
        entries: {
          roomA: { room: 'roomA', id: '1-2', start: '2017-11-11T17:00:00.000Z', end: '2017-11-11T18:00:00.000Z', summary: 'eventB', person: null, lang: null, rowSpan: 1 },
          roomB: { room: 'roomB', id: '2-1', start: '2017-11-11T17:00:00.000Z', end: '2017-11-11T18:00:00.000Z', summary: 'eventC', person: 'Y', lang: null, rowSpan: 1 }
        }
      }
    ] })
})

test('markdown rendering for doc', async t => {
  const doc = await confCal({ apiKey }, `
    Some Conference
    on 2017/11/11
    at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:00-12:00 eventA by X
        - eventA1 by X
    12:00-13:00 eventB

    [roomB]
    12:10-13:00 eventC by Y
        - eventD by Z
        - eventE
        - eventF
  `)
  const markdown = doc.toMarkdown()
  t.deepEquals(markdown, `## Some Conference
at [Abbots place](https://maps.google.com/?q=Hell,+MI+48169,+USA&ftid=0x882334578757ad71:0xd45079770956618a)
|  | roomA | roomB |
| --- | --- | --- |
| 10:00-12:00 | eventA _by X_<br/><ul><li>eventA1 _by X_</li></ul> | ← |
| 12:00-12:10 | eventB | [Break] |
| 12:10-13:00 | ⤓ | eventC _by Y_<br/><ul><li>eventD _by Z_</li><li>eventE</li><li>eventF</li></ul> |
`)
})

test('duplicate ids result in a conflict', async t => {
  try {
    await confCal({ apiKey }, `
      Some Conference
      on 2017/11/11
      at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

      [roomA]
      10:00-12:00 eventA #x
      12:00-13:00 eventB #x
    `)
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'duplicate-id') {
      throw e
    }
    t.equals(e.line, 8)
    t.equals(e.column, 25)
  }
})

test('duplicate ids result in a conflict, even with subentries', async t => {
  try {
    await confCal({ apiKey }, `
      Some Conference
      on 2017/11/11
      at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

      [roomA]
      10:00-12:00 eventA #x
      12:00-13:00 eventB
          - talk a #x
    `)
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'duplicate-id') {
      throw e
    }
    t.equals(e.line, 9)
    t.equals(e.column, 19)
  }
})

test('auto-ids expand if the ids are pre-occupied', async t => {
  const doc = await confCal({ apiKey }, `
    Some Conference
    on 2017/11/11
    at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:00-12:00 eventA #1-2
    12:00-13:00 eventB
  `)
  t.deepEquals(doc.entries['1-2'].summary, 'eventA')
  t.deepEquals(doc.entries['$1-2'].summary, 'eventB')
})

test('specified ids are of higher importance than auto-ids', async t => {
  const doc = await confCal({ apiKey }, `
    Some Conference
    on 2017/11/11
    at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:00-12:00 eventA
    12:00-13:00 eventB #1-1
  `)
  t.deepEquals(doc.entries['$1-1'].summary, 'eventA')
  t.deepEquals(doc.entries['1-1'].summary, 'eventB')
})

test('follow up indents that less than the documents indents should thrown an error', async t => {
  try {
    await confCal({ apiKey }, `
      Some Conference
     on 2017/11/11`)
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'invalid-indent') {
      throw e
    }
    t.equals(e.line, 3)
    t.equals(e.column, 6)
  }
})

test('rooms need to respect indents', async t => {
  const doc = await confCal({ apiKey }, `
    Some Conference
    on 2017/11/11
    at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:00-12:00 eventA
        [Some text]
        more description
  
        [And even more text]
    12:00-13:00 eventB #1-1
  `)
  t.deepEquals(Object.keys(doc.rooms), ['roomA'])
})
