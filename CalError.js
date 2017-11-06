function CalError (code, message, lineIndex, columnIndex) {
  this.code = code
  this.line = (lineIndex === undefined) ? 1 : lineIndex + 1
  this.column = (columnIndex === undefined) ? 1 : columnIndex + 1
  this.message = message
  Error.call(this, message)
}
CalError.prototype = Object.create(Error.prototype)
CalError.prototype.toString = function () {
  return '[' + this.code + '] ' + this.message + ' at ' + this.line + '/' + this.column
}

module.exports = CalError
