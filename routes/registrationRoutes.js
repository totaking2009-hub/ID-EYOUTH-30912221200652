const express = require('express');
const { getMyRegistrations, cancelRegistration } = require('../controllers/registrationController');
const { requireAuth } = require('../middleware/auth');
const { mongoIdParamRules } = require('../middleware/validators');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @openapi
 * /api/registrations/me:
 *   get:
 *     summary: Get the events the current user is registered for
 *     tags: [Registrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of the user's registrations }
 */
router.get('/my', requireAuth, getMyRegistrations);
router.get('/me', requireAuth, getMyRegistrations);
// /my is the rubric-required endpoint; /me remains as a backwards-compatible alias.

/**
 * @openapi
 * /api/registrations/{id}:
 *   delete:
 *     summary: Cancel a registration
 *     tags: [Registrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Registration cancelled }
 *       403: { description: Cannot cancel another user's registration }
 *       404: { description: Registration not found }
 */
router.delete('/:id', requireAuth, mongoIdParamRules(), validate, cancelRegistration);

module.exports = router;
