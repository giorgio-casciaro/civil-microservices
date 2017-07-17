class ErrorWithData extends Error {
  constructor (message, data) {
    super(message)
    Object.defineProperty(this, 'data', { value: data })
    Error.captureStackTrace(this, this.constructor)
  }
}
module.exports = ErrorWithData
