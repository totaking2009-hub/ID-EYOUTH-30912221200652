const mongoose = require('mongoose');
const app = require('../app');
const connectDB = require('../config/db');

if (mongoose.connection.readyState === 0) {
  connectDB().catch((err) => {
    console.error('[DB] Failed to connect in serverless context:', err.message);
  });
}

module.exports = app;
