const fetch = require('isomorphic-fetch')
const geoTz = require('geo-tz')
const fse = require('fs-extra')
const path = require('path')
const cacheFile = path.join(process.env.HOME, '.conf-cal.cache')

let cachedData
let cachedLookup
const cache = fse.readJSON(cacheFile)
  .catch(e => {
    if (e.code !== 'ENOENT') {
      console.warn(`Can't access cache file ${cacheFile}`)
    }
    return {}
  })
  .then(data => {
    // Storage only for the raw data
    cachedData = data
    // Storage for the raw data as well as the loading processes
    cachedLookup = Object.assign({}, cachedData)
    return cachedLookup
  })

let writingRequested
let writing
function writeCacheData () {
  if (!writing) {
    writing = fse.writeFile(cacheFile, JSON.stringify(cachedData, null, 2))
      .catch(e => console.warn(`Can't write cache file to ${cacheFile}: ${e.stack || e}`))
      .then(() => {
        writing = null
      })
    return writing
  }
  if (!writingRequested) {
    writingRequested = writing.then(() => {
      writingRequested = null
      return writeCacheData()
    })
  }
  return writingRequested
}

function fromCache (googleObjectId) {
  return cache.then(cacheLookup => cacheLookup[googleObjectId])
}

module.exports = (apiKey, googleObjectId) =>
  fromCache(googleObjectId)
  .then(cached => {
    if (!cached) {
      cached = fetch(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${googleObjectId}&key=${apiKey}`)
        .then(response => {
          if (response.status >= 400) {
            return Promise.reject(new Error(`[${response.status}] Error while loading url ${response.text()}`))
          }
          return response.json()
        })
        .then(json => {
          if (json.status !== 'OK') {
            return Promise.reject(new Error(`Google API didn't work out: [${json.status}] ${json.error_message}`))
          }
          return json.result
        })
        .then(obj => {
          const loc = obj.geometry.location
          obj.timeZone = geoTz.tz(loc.lat, loc.lng)
          return obj
        })
        .then(obj => {
          cachedLookup[googleObjectId] = obj
          cachedData[googleObjectId] = obj
          return writeCacheData()
            .then(() => {
              return obj
            })
        })
      // For the next loading to use the same promise!
      cachedLookup[googleObjectId] = cached
    }
    return cached
  })
