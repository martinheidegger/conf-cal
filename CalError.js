class CalError extends Error {
  constructor (code, reason, lineIndex, columnIndex) {
    super(`[${code}] ${reason}`)
    this.code = code
    this.line = (lineIndex === undefined) ? 1 : lineIndex + 1
    this.column = (columnIndex === undefined) ? 1 : columnIndex + 1
    this.reason = reason
  }
}

module.exports = CalError
