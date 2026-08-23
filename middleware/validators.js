const { body, param } = require('express-validator');

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

exports.loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.createEventRules = [
  body('name').trim().notEmpty().withMessage('Event name is required'),
  body('description').trim().notEmpty().withMessage('Event description is required'),
  body('category').isMongoId().withMessage('A valid category id is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('date').isISO8601().toDate().withMessage('A valid date is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

exports.updateEventRules = [
  param('id').isMongoId().withMessage('Invalid event id'),
  body('name').optional().trim().notEmpty().withMessage('Event name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Event description cannot be empty'),
  body('category').optional().isMongoId().withMessage('A valid category id is required'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('date').optional().isISO8601().toDate().withMessage('A valid date is required'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
];

exports.createCategoryRules = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
];

exports.updateCategoryRules = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().trim(),
];

exports.mongoIdParamRules = (name = 'id') => [param(name).isMongoId().withMessage(`Invalid ${name}`)];
