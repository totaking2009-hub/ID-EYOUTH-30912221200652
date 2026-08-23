const Registration = require('../models/Registration');
const Event = require('../models/Event');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/events/:eventId/register
exports.registerForEvent = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) return next(new AppError('No event found with that id.', 404));

  const existing = await Registration.findOne({ user: req.user.id, event: eventId, status: 'confirmed' });
  if (existing) {
    return next(new AppError('You are already registered for this event.', 409));
  }

  const confirmedCount = await Registration.countDocuments({ event: eventId, status: 'confirmed' });
  if (confirmedCount >= event.capacity) {
    return next(new AppError('This event is full. No more registrations are accepted.', 409));
  }

  let registration;
  try {
    registration = await Registration.create({ user: req.user.id, event: eventId });
  } catch (err) {
    // Unique index (user + event) guards against a duplicate slipping
    // through a race between the check above and the insert.
    if (err.code === 11000) {
      return next(new AppError('You are already registered for this event.', 409));
    }
    throw err;
  }

  res.status(201).json({ status: 'success', data: { registration } });
});

// GET /api/registrations/me
exports.getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find({ user: req.user.id, status: 'confirmed' })
    .populate({ path: 'event', populate: { path: 'category' } })
    .sort('-createdAt');

  res.status(200).json({ status: 'success', results: registrations.length, data: { registrations } });
});

// DELETE /api/registrations/:id
exports.cancelRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration) return next(new AppError('No registration found with that id.', 404));

  if (registration.user.toString() !== req.user.id) {
    return next(new AppError('You cannot cancel a registration that belongs to another user.', 403));
  }

  await registration.deleteOne();

  res.status(204).json({ status: 'success', data: null });
});
