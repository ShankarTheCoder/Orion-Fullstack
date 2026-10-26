// MongoDB connection via Mongoose (PDF Section 6, step 1-2).
const mongoose = require('mongoose');
const config = require('./env');

async function connectDB(uri = config.MONGODB_URI) {
  mongoose.set('strictQuery', true);
  // Reuse an already-active connection (e.g. the Jest suite connects to an
  // in-memory MongoDB first, then imports the seed, which calls connectDB).
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  const conn = await mongoose.connect(uri);
  if (config.NODE_ENV !== 'test') {
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  }
  return conn;
}

module.exports = connectDB;
