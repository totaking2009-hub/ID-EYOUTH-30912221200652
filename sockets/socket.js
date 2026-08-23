const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const Message = require('../models/Message');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

/**
 * Wires Socket.io onto the running HTTP server.
 *
 * Events:
 *  - "join_event"      { eventId }            -> joins the room for that event
 *  - "send_announcement" { eventId, content }  -> admin-only, broadcasts + persists
 *
 * Server emits:
 *  - "announcement" { event, sender, content, createdAt } to everyone in the room
 *  - "error" { message } to the requesting socket on failure
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Authenticate the socket using the same JWT used for REST requests.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization || '').replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (user ${socket.user?.id})`);

    socket.on('join_event', async ({ eventId }) => {
      try {
        const event = await Event.findById(eventId);
        if (!event) return socket.emit('error', { message: 'Event not found' });

        if (socket.user.role !== 'attendee') {
          return socket.emit('error', { message: 'Only registered attendees can join an event room.' });
        }

        const registration = await Registration.findOne({
          user: socket.user.id,
          event: eventId,
          status: 'confirmed',
        });
        if (!registration) {
          return socket.emit('error', { message: 'You must be registered for this event to join its room.' });
        }

        socket.join(`event:${eventId}`);
        socket.emit('joined_event', { eventId });
      } catch (err) {
        socket.emit('error', { message: 'Could not join event room' });
      }
    });

    socket.on('send_announcement', async ({ eventId, content }) => {
      try {
        if (socket.user.role !== 'admin') {
          return socket.emit('error', { message: 'Only an admin can broadcast an announcement.' });
        }
        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Announcement content is required.' });
        }

        const event = await Event.findById(eventId);
        if (!event) return socket.emit('error', { message: 'Event not found' });

        const message = await Message.create({
          event: eventId,
          sender: socket.user.id,
          content: content.trim(),
        });

        io.to(`event:${eventId}`).emit('announcement', {
          id: message._id,
          event: eventId,
          sender: socket.user.id,
          content: message.content,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: 'Could not send announcement' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initSocket;
