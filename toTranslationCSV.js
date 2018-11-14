const stringify = require('csv-stringify/lib/sync')
const toTranslationKeys = require('./toTranslationKeys')

module.exports = function toTranslationCSV (cal, defaultLang, csvOptions) {
  if (typeof defaultLang !== 'string' && arguments.length === 2) {
    return toTranslationCSV(cal, null, defaultLang)
  }
  const csvKeys = toTranslationKeys(cal)
  const lines = []
  const langs = {}
  if (defaultLang) {
    // Always return a header with default language!
    langs[defaultLang] = true
  }
  function addLine (lang, entry) {
    // We can not assume a source and target language if the lang is not given.
    if (defaultLang) {
      if (!lang) {
        lang = defaultLang
      }
      langs[lang] = true
      entry[lang] = entry.source
    }
    lines.push(entry)
  }

  Object.keys(csvKeys).forEach(csvKey => {
    const entry = csvKeys[csvKey]
    addLine(entry.lang, { key: `${csvKey} - summary`, source: entry.summary })
    if (entry.description) {
      addLine(entry.lang, { key: `${csvKey} - description`, source: entry.description })
    }
  })
  csvOptions = Object.assign(Object.assign({}, csvOptions), {
    columns: ['key', 'source'].concat(Object.keys(langs))
  })
  return stringify(lines, csvOptions)
}
