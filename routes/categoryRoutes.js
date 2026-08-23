const express = require('express');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createCategoryRules, updateCategoryRules, mongoIdParamRules } = require('../middleware/validators');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     responses:
 *       200: { description: List of categories }
 */
router.get('/', listCategories);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Category created }
 *       403: { description: Admins only }
 *       422: { description: Validation failed }
 */
router.post('/', requireAuth, requireRole('admin'), createCategoryRules, validate, createCategory);

router.patch('/:id', requireAuth, requireRole('admin'), updateCategoryRules, validate, updateCategory);
router.delete('/:id', requireAuth, requireRole('admin'), mongoIdParamRules(), validate, deleteCategory);

module.exports = router;
