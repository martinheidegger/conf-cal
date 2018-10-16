const test = require('tap').test
const getTimezone = require('../getTimezone')
const apiKey = process.env['GOOGLE_API_KEY']

if (!apiKey) {
  throw new Error('To run the unit test you need to set the GOOGLE_API_KEY environment variable')
}

test('get the timezone for a google object id', t =>
  getTimezone(apiKey, 'ChIJN1t_tDeuEmsRUsoyG83frY4')
    .then(data => {
      t.equals(data.name, 'Google')
      t.equals(data.timeZone, 'Australia/Sydney')
    })
)
