const app = require('../src/app');
const connectDB = require('../src/config/database');

// Vercel Serverless Function entry point
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in Vercel serverless handler:', err);
  }
  return app(req, res);
};
