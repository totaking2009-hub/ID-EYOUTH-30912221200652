/**
 * AppError represents a known, operational error (bad input, not found,
 * unauthorized, etc.) as opposed to an unexpected programming error.
 * The central error middleware uses `isOperational` to decide whether
 * it's safe to expose the message to the client.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
