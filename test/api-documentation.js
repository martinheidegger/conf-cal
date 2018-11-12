const test = require('tap').test
const confCal = require('..')
const apiKey = process.env['GOOGLE_API_KEY']

if (!apiKey) {
  throw new Error('To run the unit test you need to set the GOOGLE_API_KEY environment variable')
}

const DOC_SAMPLE = `Mighty Superhero Gathering
on 2019/01/01
at Top of the World#ChIJvZ69FaJU6DkRsrqrBvjcdgU

[Main Room]
10:00-10:20 Opening

11:15-12:00 What I love about underground sountracks by Batman

    In this special session Batman looks into a often
    overlooked benefit of getting to know really special
    music played in the bars just while beating up
    scum.

13:00-14:00 Lighting talks

    - Lassos materials by Wonder Woman
    - Leveraging water in battle by Wolverine
    - Why we need friends by The Hulk
    - 楽しい CM の作り方 by ウルトラマン in ja

[Track A]
10:20-11:00 Doing the right thing by Super Man #keynote
  
    Super Man will talk about the challenges he faced
    trying to do the right thing when you are
    basically a god

11:15-14:00 Akward bumps of 2018 by The Flash #flash-talk

    Its not always easy to travel quickly without colliding
    with things. Lightheartedly, the flash will reflect on
    the funniest bumps of the last year.`

test('PROJECT USAGE', async t => {
  const calendar = await confCal({
    apiKey, // The Google API key to call "places"
    cache: `${__dirname}/api-documentation.objects` // Store
  }, DOC_SAMPLE)
  t.deepEquals(
    {
      title: calendar.title,
      location: calendar.location,
      date: calendar.date,
      googleObjectId: calendar.googleObjectId
    },
    {
      title: 'Mighty Superhero Gathering',
      location: 'Top of the World',
      date: '20190101',
      googleObjectId: 'ChIJvZ69FaJU6DkRsrqrBvjcdgU'
    },
    'All basic properties are normalized!'
  )

  t.deepEquals(
    {
      long_name: calendar.googleObject.name,
      place_id: calendar.googleObject.place_id,
      rating: calendar.googleObject.rating
    },
    {
      long_name: 'Mount Everest',
      place_id: 'ChIJvZ69FaJU6DkRsrqrBvjcdgU',
      rating: 4.2
    },
    'The googleObject is taken straight from the Google API'
  )

  t.equals(
    calendar.googleObject.timeZone,
    'Asia/Shanghai',
    '... but it has a timeZone added!'
  )

  t.deepEquals(
    Object.keys(calendar.rooms),
    ['Main Room', 'Track A'],
    'The calendar has a set of rooms'
  )

  t.deepEquals(
    calendar.persons,
    ['Batman', 'Wonder Woman', 'Wolverine', 'The Hulk', 'ウルトラマン', 'Super Man', 'The Flash'],
    'There is also a handy list of all the persons that appear in this calendar.'
  )

  t.equals(
    calendar.rooms['Main Room'].length,
    3,
    'The room contains a list of entries for that room'
  )

  t.equals(
    calendar.toMarkdown(),
    `## Mighty Superhero Gathering
at [Top of the World](https://maps.google.com/?q=Mount+Everest&ftid=0x39e854a215bd9ebd:0x576dcf806abbab2)
|  | Main Room | Track A |
| --- | --- | --- |
| 10:00-10:20 | Opening | ← |
| 10:20-11:00 | → | Doing the right thing _by Super Man_ |
| 11:00-11:15 | [Break] | [Break] |
| 11:15-12:00 | What I love about underground sountracks _by Batman_ | Akward bumps of 2018 _by The Flash_ |
| 12:00-13:00 | [Break] | ⤓ |
| 13:00-14:00 | Lighting talks<br/><ul><li>Lassos materials _by Wonder Woman_</li><li>Leveraging water in battle _by Wolverine_</li><li>Why we need friends _by The Hulk_</li><li>楽しい CM の作り方 _by ウルトラマン_ in ja</li></ul> | ⤓ |
`,
    'Turn can the calendar into a markdown calendar!'
  )

  // Get the detailed slot-data of the calendar
  const slotData = calendar.toSlots()

  t.deepEquals(
    slotData.rooms,
    ['Main Room', 'Track A'],
    'Access all the rooms in this calendar'
  )

  t.ok(
    Array.isArray(slotData.slots),
    'This list of all the slots of the day'
  )

  t.equals(
    slotData.slots[0].start,
    '2019-01-01T02:00:00.000Z',
    'Every slot has a start ...'
  )

  t.equals(
    slotData.slots[0].end,
    '2019-01-01T02:20:00.000Z',
    '... and end time as an ISO string'
  )

  t.type(
    slotData.slots[0].entry,
    'object',
    'With only one entry, a slot needs to have an entry property ...'
  )

  t.equals(
    slotData.slots[0].room,
    'Main Room',
    '... and the room in which the entry will be happening'
  )

  t.equals(
    slotData.slots[0].entry.id,
    '1-1',
    'Every valid entry in the document gets an unique id.'
  )

  t.equals(
    slotData.slots[1].entry.id,
    'keynote',
    'Which can be overwritten.'
  )

  t.equals(
    slotData.slots[0].entry.start,
    '2019-01-01T02:00:00.000Z',
    'Every slot-entry also has a start ...'
  )

  t.equals(
    slotData.slots[0].entry.end,
    '2019-01-01T02:20:00.000Z',
    '... and end time which is also an ISO time.'
  )

  t.equals(
    slotData.slots[0].entry.summary,
    'Opening',
    'The summary contains the title of the presentation (usually 1 line)'
  )

  t.equals(
    slotData.slots[2].entry.summary,
    null,
    'A null-summary indicates a break!'
  )

  t.equals(
    slotData.slots[2].entry.id,
    undefined,
    'Breaks do not receive an id!'
  )

  const theFlashTalk = slotData.slots[3].entries['Track A']
  t.equals(
    theFlashTalk.id,
    'flash-talk',
    'The id can be overwritten!'
  )

  t.equals(
    theFlashTalk.description,
    `Its not always easy to travel quickly without colliding
with things. Lightheartedly, the flash will reflect on
the funniest bumps of the last year.`,
    'If a long text is attached, it can also have a description.'
  )

  t.equals(
    slotData.slots[1].entry.person,
    'Super Man',
    'If a person is given, it is available in the entry ...'
  )

  t.equals(
    slotData.slots[0].entry.person,
    null,
    '... else the person is null'
  )

  t.deepEquals(
    Object.keys(slotData.slots[3].entries),
    ['Main Room', 'Track A'],
    `If there is more than one entry, entry will be null and entries will contain all entries mapped by room-name`
  )

  t.equals(
    slotData.slots[1].entry.rowSpan,
    1,
    'Usually entries have the rowSpan of 1'
  )

  t.equals(
    theFlashTalk.rowSpan,
    3,
    'But can grow if an entry uses more slots.'
  )

  t.notEquals(
    theFlashTalk.end,
    slotData.slots[3].end,
    'Then the end will not match the slot-end.'
  )

  t.ok(
    Array.isArray(slotData.slots[5].entries['Main Room'].entries),
    'Adding a list at of entries instead of a description will add the whole list of subentries'
  )

  t.equals(
    calendar.entries[theFlashTalk.id],
    calendar.rooms['Track A'][1],
    'The entries array contains a nice list of all entries in "rooms" ...'
  )

  t.equals(
    calendar.entries[theFlashTalk.id].id,
    theFlashTalk.id,
    '... and even though they look similar to the entries that you receive from toSlots'
  )

  t.notEquals(
    calendar.entries[theFlashTalk.id],
    theFlashTalk,
    '... they are not exacty the same!'
  )
})
