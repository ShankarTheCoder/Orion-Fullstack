// Central error handling (PDF Section 7: consistent API error responses).
// Shape for every error: { success: false, message, fields? }
const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  let fields = err.fields;
  if (err.name === 'ValidationError') { // Mongoose validation
    status = 400;
    fields = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  } else if (err.code === 11000) { // duplicate key
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
    fields = [{ field, message }];
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.type === 'entity.too.large') {
    status = 400;
    message = 'Request body too large';
  } else if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    message = 'Malformed JSON body';
  }
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message, ...(fields ? { fields } : {}) });
}

module.exports = { notFound, errorHandler, ApiError };
