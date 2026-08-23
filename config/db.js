const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string stored in the
 * MONGO_URI environment variable. The app must not start with a
 * silent/broken database connection, so we log a clear message and
 * exit the process on failure.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[DB] MONGO_URI is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`[DB] MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });
};

module.exports = connectDB;
