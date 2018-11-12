const stringify = require('csv-stringify/lib/sync')
const toTranslationKeys = require('./toTranslationKeys')

module.exports = function toTranslationCSV (cal, csvOptions) {
  const csvKeys = toTranslationKeys(cal)
  const lines = []
  Object.keys(csvKeys).forEach(csvKey => {
    const entry = csvKeys[csvKey]
    lines.push({ key: `${csvKey} - summary`, string: entry.summary })
    if (entry.description) {
      lines.push({ key: `${csvKey} - description`, string: entry.description })
    }
  })
  return stringify(lines, Object.assign(Object.assign({}, csvOptions), {
    columns: ['key', 'string']
  }))
}
