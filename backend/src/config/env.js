// Central environment configuration (PDF Section 5). Loads backend/.env via
// dotenv and exposes validated settings with safe development defaults.
// Real secrets never live in code - only in .env (never committed).
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/farm_picked',
  JWT_SECRET: process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'dev_only_change_me_secret'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

if (!config.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in backend/.env when NODE_ENV=production');
}

module.exports = config;
