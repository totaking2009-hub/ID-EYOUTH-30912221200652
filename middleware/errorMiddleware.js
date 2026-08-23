const AppError = require('../utils/AppError');

/**
 * Translates common Mongoose errors into operational AppErrors so the
 * client always gets a clear, structured message instead of a raw
 * driver error.
 */
const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsError = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = field ? err.keyValue[field] : '';
  return new AppError(`Duplicate value for field "${field}": ${value}. Please use another value.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${messages.join('. ')}`, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

/**
 * Central error middleware. Every controller error (thrown or passed
 * via next()) ends up here through asyncHandler. Unhandled/programming
 * errors are logged server-side but never leak internal details to
 * the client.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let error = err;
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateFieldsError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (!error.isOperational) {
    // Unexpected programming/system error: log full detail, hide from client.
    console.error('[UNEXPECTED ERROR]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }

  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
};

module.exports = errorMiddleware;
