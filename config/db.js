const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string stored in the
 * MONGO_URI environment variable.
 *
 * On a traditional long-running server (server.js), a broken DB
 * connection is fatal and the process should exit so an operator
 * notices. On a serverless platform (Vercel), calling process.exit()
 * inside a function invocation crashes that invocation and returns a
 * 500 to the caller instead of a useful error, so there we log and
 * re-throw and let the caller decide what to do.
 */
const isServerless = !!process.env.VERCEL;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[DB] MONGO_URI is not defined in the environment variables.');
    if (isServerless) {
      throw new Error('MONGO_URI is not defined in the environment variables.');
    }
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`[DB] MongoDB connection failed: ${err.message}`);
    if (isServerless) {
      throw err;
    }
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected.');
  });
};

module.exports = connectDB;
