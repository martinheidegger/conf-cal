const test = require('tap').test
const confCal = require('..')
const apiKey = process.env['GOOGLE_API_KEY']

if (!apiKey) {
  throw new Error('To run the unit test you need to set the GOOGLE_API_KEY environment variable')
}

function emptyTest (input) {
  return confCal({apiKey}, input)
    .then(() => Promise.reject(new Error('There should be an error for: "' + input + '"')))
    .catch(e => {
      if (e instanceof confCal.CalError && e.code === 'empty') {
        return Promise.resolve(true)
      }
      return Promise.reject(e)
    })
}

test('empty calendar file', () =>
  Promise.all([
    emptyTest(''),
    emptyTest(undefined),
    emptyTest(null),
    emptyTest('  ')
  ])
)

test('missing title', t =>
  confCal({apiKey}, '\nat Abbot Hall#FWztv6Nshtkn6MN-962gY46UtuA')
  .then(() => Promise.reject(new Error('There should be an error when the title is missing"')))
  .catch(e => {
    if (!(e instanceof confCal.CalError) || e.code !== 'missing-data') {
      return Promise.reject(e)
    }
    t.equals(e.line, 2)
    t.equals(e.column, 1)
  })
)

test('missing location', t =>
  confCal({apiKey}, '\nThis is us')
  .then(() => Promise.reject(new Error('There should be an error when the location is missing')))
  .catch(e => {
    if (!(e instanceof confCal.CalError) || e.code !== 'missing-data') {
      return Promise.reject(e)
    }
    t.equals(e.line, 2)
    t.equals(e.column, 1)
  })
)

test('valid empty file', t =>
  confCal({apiKey}, `
    Fancy title
    on 2017/11/25
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ
  `)
  .then((data) => {
    t.equals(data.title, 'Fancy title')
    t.equals(data.date, '20171125')
    t.equals(data.location, 'Fiery Hell')
  })
)

test('valid file with rooms', t =>
  confCal({apiKey}, `
    Fancy title
    on 2017/11/25
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:20-11:20 Event A by X
    11:20-13:00 Event B
    13:10-20:00 Event C
    
    [roomB]
    10:20-13:00 Event D
    13:10-15:00 Event E by Y
  `)
  .then(data => {
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
          summary: 'Event A',
          person: 'X'
        }, {
          start: '2017-11-25T16:20:00.000Z',
          end: '2017-11-25T18:00:00.000Z',
          summary: 'Event B',
          person: null
        }, {
          start: '2017-11-25T18:10:00.000Z',
          end: '2017-11-26T01:00:00.000Z',
          person: null,
          summary: 'Event C'
        }
      ],
      roomB: [
        {
          start: '2017-11-25T15:20:00.000Z',
          end: '2017-11-25T18:00:00.000Z',
          person: null,
          summary: 'Event D'
        }, {
          start: '2017-11-25T18:10:00.000Z',
          end: '2017-11-25T20:00:00.000Z',
          person: 'Y',
          summary: 'Event E'
        }
      ]
    })
  })
)

test('slots for doc', t =>
   confCal({apiKey}, `
     Some Conference
     on 2017/11/11
     at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

     [roomA]
     10:00-12:00 eventA by X
     12:00-13:00 eventB

     [roomB]
     12:00-13:00 eventC by Y
   `)
   .then(doc => {
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
           {start: '2017-11-11T15:00:00.000Z', end: '2017-11-11T17:00:00.000Z', summary: 'eventA', person: 'X', rowSpan: 1}
         },
         {
           start: '2017-11-11T17:00:00.000Z',
           end: '2017-11-11T18:00:00.000Z',
           entries: {
             roomA: {start: '2017-11-11T17:00:00.000Z', end: '2017-11-11T18:00:00.000Z', summary: 'eventB', person: null, rowSpan: 1},
             roomB: {start: '2017-11-11T17:00:00.000Z', end: '2017-11-11T18:00:00.000Z', summary: 'eventC', person: 'Y', rowSpan: 1}
           }
         }
       ]})
   })
)

test('markdown rendering for doc', t =>
  confCal({apiKey}, `
    Some Conference
    on 2017/11/11
    at Abbots place#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:00-12:00 eventA by X
    12:00-13:00 eventB

    [roomB]
    12:10-13:00 eventC by Y
  `)
  .then(doc => {
    const markdown = doc.toMarkdown()
    t.deepEquals(markdown, `## Some Conference
at [Abbots place](https://maps.google.com/?q=Hell,+MI+48169,+USA&ftid=0x882334578757ad71:0xd45079770956618a)
|  | roomA | roomB |
| --- | --- | --- |
| 10:00-12:00 | roomA: eventA by X |
| 12:00-12:10 | eventB | [Break] |
| 12:10-13:00 |  | eventC by Y |
`)
  })
)
