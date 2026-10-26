// MongoDB connection via Mongoose (PDF Section 6, step 1-2).
const mongoose = require('mongoose');
const config = require('./env');

const LOCAL_FALLBACK_URI = 'mongodb://127.0.0.1:27017/farm_picked';

async function connectDB(uri = config.MONGODB_URI) {
  mongoose.set('strictQuery', true);
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  try {
    const conn = await mongoose.connect(uri);
    if (config.NODE_ENV !== 'test') {
      console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn;
  } catch (err) {
    if (config.NODE_ENV === 'development' && uri !== LOCAL_FALLBACK_URI) {
      console.warn(`\n[WARN] Failed to connect to configured MONGODB_URI: ${err.message}`);
      console.warn(`[WARN] Falling back to local MongoDB (${LOCAL_FALLBACK_URI})...\n`);
      try {
        const localConn = await mongoose.connect(LOCAL_FALLBACK_URI);
        console.log(`MongoDB connected to local fallback: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localErr) {
        throw new Error(`Failed to connect to both configured URI (${err.message}) and local MongoDB (${localErr.message})`);
      }
    }
    throw err;
  }
}

module.exports = connectDB;

