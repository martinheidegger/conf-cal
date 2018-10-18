const fetch = require('isomorphic-fetch')
let geoTz
const fs = require('fs')
const path = require('path')
const CACHE_VERSION = 1
const cacheFile = path.normalize(`${process.env.HOME}/.conf-cal_${CACHE_VERSION}.cache`)

function readJSON (file) {
  return new Promise((resolve, reject) =>
    fs.access(file, err => err
      ? reject(err)
      : fs.readFile(file, 'utf8', (err, raw) => err ? reject(err) : resolve(raw))
    )
  )
    .then(raw => {
      try {
        return JSON.parse(raw)
      } catch (err) {
        throw new Error(`Error parsing JSON in ${file}: ${err.message}`)
      }
    })
}

function writeJSON (file, content) {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFile(
        file,
        JSON.stringify(content, null, 2),
        err => err ? reject(err) : resolve()
      )
    } catch (err) {
      reject(new Error(`Error writing JSON to ${file}: ${err.message}`))
    }
  })
}

const cache = readJSON(cacheFile)
  .catch(e => {
    if (e.code !== 'ENOENT') {
      console.warn(`Can't access cache file ${cacheFile}`)
    }
    return {}
  })

let writingRequested
let writing
function writeCacheData (cachedData) {
  if (!writing) {
    writing = writeJSON(cacheFile, cachedData)
      .catch(e => console.warn(`Can't write cache file to ${cacheFile}: ${e.stack || e}`))
      .then(() => {
        writing = null
      })
    return writing
  }
  if (!writingRequested) {
    writingRequested = writing.then(() => {
      writingRequested = null
      return writeCacheData(cachedData)
    })
  }
  return writingRequested
}

const requestLookup = {}

module.exports = (apiKey, googleObjectId) => {
  let request = requestLookup[googleObjectId]
  if (!request) {
    request = cache.then(cachedData => {
      let obj = cachedData[googleObjectId]
      if (obj) {
        return obj
      }
      return fetch(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${googleObjectId}&key=${apiKey}`)
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
          if (!geoTz) {
            // Lazy require: geo-tz is a monster!
            geoTz = require('geo-tz')
          }
          obj.timeZone = geoTz(loc.lat, loc.lng)
          return obj
        })
        .then(obj => {
          cachedData[googleObjectId] = obj
          return writeCacheData(cachedData).then(() => obj)
        })
    })
    requestLookup[googleObjectId] = request
  }
  return request
}
