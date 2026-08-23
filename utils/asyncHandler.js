/**
 * Wraps an async Express route handler so that any rejected promise
 * (thrown error) is forwarded to next(), instead of crashing the
 * process or requiring a try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
