// Server entry point (PDF Section 2: backend/src/server.js):
// connect MongoDB first, then start listening.
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/database');

function listenOnPort(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.on('listening', () => resolve({ server, port }));
    server.on('error', (err) => reject(err));
  });
}

async function start() {
  await connectDB();

  const targetPort = config.PORT;
  try {
    const { port } = await listenOnPort(targetPort);
    console.log(`Orion API listening on port ${port} (${config.NODE_ENV})`);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WARN] Port ${targetPort} is already in use.`);
      if (targetPort === 5000 && process.platform === 'darwin') {
        console.warn(
          'On macOS, port 5000 is often reserved by AirPlay Receiver (System Settings > General > AirDrop & AirPlay).'
        );
      }
      const fallbackPort = targetPort === 5000 ? 5001 : targetPort + 1;
      console.log(`Attempting fallback to port ${fallbackPort}...`);
      const { port } = await listenOnPort(fallbackPort);
      console.log(`Orion API listening on port ${port} (${config.NODE_ENV})`);
    } else {
      throw err;
    }
  }
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

