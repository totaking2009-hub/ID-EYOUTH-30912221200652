const mongoose = require('mongoose');
const app = require('../app');
const connectDB = require('../config/db');

// On serverless platforms (Vercel), this module can be reused across
// invocations while the function stays "warm". Only start a new
// connection if one isn't already established/in progress, so we don't
// open a fresh connection on every request.
if (mongoose.connection.readyState === 0) {
  connectDB().catch((err) => {
    console.error('[DB] Failed to connect in serverless context:', err.message);
  });
}

module.exports = app;
