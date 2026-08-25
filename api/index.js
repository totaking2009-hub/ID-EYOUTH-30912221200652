const app = require('../app');
const mongoose = require('mongoose');

/**
 * Vercel serverless entrypoint.
 *
 * server.js (which connects to MongoDB, then calls app.listen) is never
 * run in a serverless deployment — Vercel calls this file directly for
 * every request. So the DB connection has to happen here instead,
 * cached across warm invocations so we don't reconnect every request.
 */
let connectionPromise = null;

function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      return Promise.reject(new Error('MONGO_URI is not defined in the environment variables.'));
    }

    connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then((conn) => {
        console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
        return conn.connection;
      })
      .catch((err) => {
        connectionPromise = null; // allow a retry on the next request
        console.error(`[DB] MongoDB connection failed: ${err.message}`);
        throw err;
      });
  }

  return connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'error', message: 'Database connection failed.' }));
    return;
  }
  return app(req, res);
};
