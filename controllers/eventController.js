const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/events
 * Supports:
 *  - filters: category, city, dateFrom, dateTo (combinable)
 *  - search: text search across name + description
 *  - pagination: page, limit
 *  - sorting: sortBy=date|registrations, order=asc|desc
 */
exports.listEvents = asyncHandler(async (req, res) => {
  const { category, city, startDate, endDate, dateFrom, dateTo, search, page = 1, limit = 10, sortBy, order } = req.query;
  // Accept the rubric names (startDate/endDate) and the older aliases for compatibility.
  const fromDate = startDate || dateFrom;
  const toDate = endDate || dateTo;

  const filter = {};
  if (category) filter.category = category;
  if (city) filter.city = new RegExp(`^${city}$`, 'i');
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = new Date(fromDate);
    if (toDate) {
      const end = new Date(toDate);
      // Include the full end date when a date-only value is supplied.
      if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) end.setUTCHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (pageNum - 1) * limitNum;

  // Default direction depends on the field: newest/soonest date first
  // makes sense ascending, but "most popular" only makes sense as most
  // registrations first, so registrations default to descending unless
  // the caller explicitly asks for ascending order.
  const sortDir = order ? (order === 'desc' ? -1 : 1) : sortBy === 'registrations' ? -1 : 1;

  // Sorting by number of registrations requires an aggregation
  // pipeline since `registrationsCount` isn't a stored field.
  if (sortBy === 'registrations') {
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'registrations',
          let: { eventId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$event', '$$eventId'] }, { $eq: ['$status', 'confirmed'] }] } } },
          ],
          as: 'registrations',
        },
      },
      { $addFields: { registrationsCount: { $size: '$registrations' } } },
      { $sort: { registrationsCount: sortDir } },
      { $skip: skip },
      { $limit: limitNum },
      { $project: { registrations: 0 } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ];

    const [events, total] = await Promise.all([
      Event.aggregate(pipeline),
      Event.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      results: events.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: { events },
    });
  }

  const sort = {};
  sort[sortBy === 'date' ? 'date' : 'date'] = sortDir; // default + explicit both sort by date

  const [events, total] = await Promise.all([
    Event.find(filter).populate('category').sort(sort).skip(skip).limit(limitNum),
    Event.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: events.length,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    data: { events },
  });
});

// GET /api/events/:id
exports.getEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id).populate('category');
  if (!event) return next(new AppError('No event found with that id.', 404));
  res.status(200).json({ status: 'success', data: { event } });
});

// POST /api/events (admin only)
exports.createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user.id });
  await event.populate('category');
  res.status(201).json({ status: 'success', data: { event } });
});

// PATCH /api/events/:id (admin only)
exports.updateEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category');

  if (!event) return next(new AppError('No event found with that id.', 404));
  res.status(200).json({ status: 'success', data: { event } });
});

// DELETE /api/events/:id (admin only)
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return next(new AppError('No event found with that id.', 404));
  await Registration.deleteMany({ event: event._id });
  res.status(204).json({ status: 'success', data: null });
});
