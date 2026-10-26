// Error type carrying an HTTP status (and optional field errors) for the
// central error handler. Services throw these; controllers never format errors.
class ApiError extends Error {
  constructor(statusCode, message, fields) {
    super(message);
    this.statusCode = statusCode;
    this.fields = fields;
  }
}
module.exports = ApiError;
