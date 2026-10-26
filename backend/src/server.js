// Server entry point (PDF Section 2: backend/src/server.js):
// connect MongoDB first, then start listening.
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/database');

async function start() {
  await connectDB();
  app.listen(config.PORT, () => {
    console.log(`Orion API listening on port ${config.PORT} (${config.NODE_ENV})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
