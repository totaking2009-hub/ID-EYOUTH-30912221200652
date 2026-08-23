const express = require('express');
const {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { registerForEvent } = require('../controllers/registrationController');
const { getEventMessages } = require('../controllers/messageController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createEventRules, updateEventRules, mongoIdParamRules } = require('../middleware/validators');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @openapi
 * /api/events:
 *   get:
 *     summary: List events with filtering, pagination, sorting and search
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, registrations] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200: { description: Paginated list of events }
 */
router.get('/', listEvents);

/**
 * @openapi
 * /api/events/{id}:
 *   get:
 *     summary: Get a single event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Event details }
 *       404: { description: Event not found }
 */
router.get('/:id', mongoIdParamRules(), validate, getEvent);

/**
 * @openapi
 * /api/events:
 *   post:
 *     summary: Create an event (admin only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Event created }
 *       403: { description: Admins only }
 *       422: { description: Validation failed }
 */
router.post('/', requireAuth, requireRole('admin'), createEventRules, validate, createEvent);

/**
 * @openapi
 * /api/events/{id}:
 *   patch:
 *     summary: Update an event (admin only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Event updated }
 *       403: { description: Admins only }
 *       404: { description: Event not found }
 */
router.patch('/:id', requireAuth, requireRole('admin'), updateEventRules, validate, updateEvent);

/**
 * @openapi
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event (admin only)
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Event deleted }
 *       403: { description: Admins only }
 *       404: { description: Event not found }
 */
router.delete('/:id', requireAuth, requireRole('admin'), mongoIdParamRules(), validate, deleteEvent);

/**
 * @openapi
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register the authenticated attendee for an event
 *     tags: [Registrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Registration created }
 *       409: { description: Already registered or event full }
 */
router.post('/:eventId/register', requireAuth, mongoIdParamRules('eventId'), validate, registerForEvent);

/**
 * @openapi
 * /api/events/{eventId}/messages:
 *   get:
 *     summary: Get the announcement history for an event
 *     tags: [Announcements]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of announcements ordered by time }
 *       404: { description: Event not found }
 */
router.get('/:eventId/messages', requireAuth, mongoIdParamRules('eventId'), validate, getEventMessages);

module.exports = router;
