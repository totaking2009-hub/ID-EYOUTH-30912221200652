const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check for the server and its database connection
 *     tags: [Health]
 *     responses:
 *       200: { description: Server is up }
 */
router.get('/', (req, res) => {
  const dbState = STATES[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'success',
    server: 'up',
    database: dbState,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
