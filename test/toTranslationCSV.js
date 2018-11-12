const test = require('tap').test
const toTranslationCSV = require('../toTranslationCSV')
const confCal = require('..')
const apiKey = process.env['GOOGLE_API_KEY']

if (!apiKey) {
  throw new Error('To run the unit test you need to set the GOOGLE_API_KEY environment variable')
}

test('', async t => {
  const cal = await confCal({ apiKey }, `
    Fancy title
    on 2017/11/11
    at Fiery Hell#ChIJca1Xh1c0I4gRimFWCXd5UNQ

    [roomA]
    10:20-11:20 Event A by X

        A simple description
        can be fun
    11:20-12:20 Q&A

    12:20-13:20 Event C

        Another description to translate

    13:20-14:20 Event D #custom-id

        Special id to be used for translation
    
    14:20-15:20 Reflections by X
    15:20-16:20 Reflections \
        by X

    16:20-17:20 Reflections

    [roomB]
    10:20-11:20 Q&A

        This is different from Q&A than in the other room.

    11:20-12:20 Reflections by X
    12:20-13:20 Reflections by Y
    13:40-14:10 Reflections by Y
  `)
  t.equals(toTranslationCSV(cal), `Event A by X - summary,Event A
Event A by X - description,"A simple description\ncan be fun"
roomA: Q&A - summary,Q&A
roomB: Q&A - summary,Q&A
roomB: Q&A - description,This is different from Q&A than in the other room.
Event C - summary,Event C
Event C - description,Another description to translate
#custom-id - summary,Event D
#custom-id - description,Special id to be used for translation
roomA#1: Reflections by X - summary,Reflections
roomA#2: Reflections by X - summary,Reflections
roomB: Reflections by X - summary,Reflections
Reflections - summary,Reflections
#1: Reflections by Y - summary,Reflections
#2: Reflections by Y - summary,Reflections
`)
})
