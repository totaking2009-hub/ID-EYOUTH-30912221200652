const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/categories
exports.listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
});

// POST /api/categories (admin only)
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ status: 'success', data: { category } });
});

// PATCH /api/categories/:id (admin only)
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return next(new AppError('No category found with that id.', 404));
  res.status(200).json({ status: 'success', data: { category } });
});

// DELETE /api/categories/:id (admin only)
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('No category found with that id.', 404));
  res.status(204).json({ status: 'success', data: null });
});
