const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * Verifies the Bearer token on the request, attaches the authenticated
 * user (id + role) to req.user, and blocks any unauthenticated or
 * invalid/expired request with a 401.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('You are not logged in. Please log in to access this route.', 401));
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // The role is always read from the token/DB, never from the request body.
  req.user = { id: user._id.toString(), role: user.role, email: user.email };
  next();
});

/**
 * Restricts a route to the given role(s). Must run after requireAuth.
 * Usage: requireRole('admin')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { requireAuth, requireRole };
