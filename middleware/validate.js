const { validationResult } = require('express-validator');

/**
 * Runs after the express-validator rule chains on a route. If any rule
 * failed, responds with a structured 422 listing every invalid field
 * instead of letting the request continue.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const formatted = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return res.status(422).json({
    status: 'fail',
    message: 'Validation failed',
    errors: formatted,
  });
};

module.exports = validate;
