# conf-cal
_a human-readable conference calender format and library_

[![Build Status](https://travis-ci.org/martinheidegger/conf-cal.svg?branch=master)](https://travis-ci.org/martinheidegger/conf-cal)

When you have a conference, it can be a pain in the butt to keep
the schedule and generate html out of it. This little library
allows with little effort to keep all the important information in
one place in a human readable form.

It makes sure that all the important data is there:

- Name
- Day
- Location
- Google Place ID of the location! _(to be used from a map)_
- Timezone _(taken from the geo location using [geo-tz](https://npmjs.com/package/geo-tz))_
- Rooms
- Event Title/Description/Presenter
- Automatic Breaks Calculation _(times between the slots are automatically breaks)_
- Automatic Slot Calculation _(just enter the times and it can figure out the slots)_
- Automatically generates IDs for each entry that can be overridden
    _(to preserve deep links even when data changes)_

You can process this format with a **very lightweight** Node JS library.

### Here is an example calendar:

```
Mighty Superhero Gathering
on 2019/01/01
at Top of the World#ChIJvZ69FaJU6DkRsrqrBvjcdgU

[Main Room]
10:00-10:20 Opening
10:20-11:00 Doing the right thing by Super Man #keynote

    Super Man will talk about the challenges he faced
    trying to do the right thing when you are
    basically a god

11:15-12:00 What I love about underground sountracks by Batman

    In this special session Batman looks into a often
    overlooked benefit of getting to know really special
    music played in the bars just while beating up
    scum.

13:00-14:00 Lighting talks

    - Lassos materials by Wonder Woman
    - Leveraging water in battle by Wolverine
    - Why we need friends by The Hulk

[Track A]
11:15-14:00 Akward bumps of 2018 by The Flash

    Its not always easy to travel quickly without colliding
    with things. Lightheartedly, the flash will reflect on
    the funniest bumps of the last year.
```

The basic pattern is:

```
<Title>
on <year>/<month>/<date>
at <name-of-location>#<google-place-id>

[<room-name>]
<start>-<end> <summary>( by <person>)( #<custom-id>)
<four-space-indent><<line-break><description>> or list of subentries>

[<other-room-name>]

etc.
```

## JavaScript API

Install this library using:

```bash
$ npm i conf-cal --save
```

You can check out how the API works in the [`./test/api-documentation.js`](./test/api-documentation.js)
file.

# Contribution Guidelines

- PR's and issues welcome.
- If you can create a PR quickly, its better than an issue.
- Run the test before a PR.
- Be kind and patient.

# License

MIT
