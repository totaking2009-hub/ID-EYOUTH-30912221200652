const Message = require('../models/Message');
const Event = require('../models/Event');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/events/:eventId/messages
// Returns the announcement history for an event, ordered by time, so a
// late attendee can catch up on everything they missed.
exports.getEventMessages = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) return next(new AppError('No event found with that id.', 404));

  const messages = await Message.find({ event: eventId })
    .populate('sender', 'name email role')
    .sort('createdAt');

  res.status(200).json({ status: 'success', results: messages.length, data: { messages } });
});
