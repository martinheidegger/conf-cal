const test = require('tap').test
const getTimezone = require('../getTimezone')
const apiKey = process.env['GOOGLE_API_KEY']
const EVEREST_ID = 'ChIJvZ69FaJU6DkRsrqrBvjcdgU'
const GOOGLE_ID = 'ChIJN1t_tDeuEmsRUsoyG83frY4'
const confCal = require('../')

if (!apiKey) {
  throw new Error('To run the unit test you need to set the GOOGLE_API_KEY environment variable')
}

test('get the timezone for a google object id', async t => {
  const data = await getTimezone({ apiKey }, GOOGLE_ID)
  t.equals(data.name, 'Google')
  t.equals(data.timeZone, 'Australia/Sydney')
})

test('get the timezone of mt everest', async t => {
  const data = await getTimezone({ apiKey }, EVEREST_ID)
  t.equals(data.name, 'Mount Everest')
  t.equals(data.timeZone, 'Asia/Shanghai')
})

test('get the timezone from a local cache', async t => {
  const data = await getTimezone({ cache: `${__dirname}/api-documentation.objects` }, EVEREST_ID)
  t.equals(data.name, 'Mount Everest')
  t.equals(data.timeZone, 'Asia/Shanghai')
})

test('get the timezone without credentials', async t => {
  try {
    await getTimezone({ cache: `${__dirname}/api-documentation.objects` }, GOOGLE_ID)
    t.fail('This should not work because the google id is not in the cached data!')
  } catch (e) {
    if (!(e instanceof confCal.CalError) || e.code !== 'missing-option') {
      throw e
    }
  }
})
