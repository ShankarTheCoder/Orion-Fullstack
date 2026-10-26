// Express application (PDF Section 2: backend/src/app.js). All API routes are
// mounted under /api/v1; every protected route enforces authentication and
// role authorization server-side via middleware.
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Protect all routes with Helmet, bypassing strict CSP for Swagger UI web interface
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/docs') || req.path.startsWith('/api/docs') || req.path === '/docs') {
    return next();
  }
  helmet()(req, res, next);
});

const Media = require('./models/Media.model');

const clientUrls = (config.CLIENT_URL || '')
  .split(',')
  .map((u) => u.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (/^https?:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    if (clientUrls.includes(origin) || config.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));

// Serve uploaded images and documents directly from MongoDB.
// Survives Vercel serverless ephemeral environments where local disk resets.
// Falls back to static backend/uploads for pre-seeded assets.
app.get(['/uploads/:folder/:filename', '/uploads/:filename', '/api/v1/media/:filename'], async (req, res, next) => {
  try {
    const { filename, folder } = req.params;
    const filter = { filename };
    if (folder) filter.folder = folder;

    const doc = await Media.findOne(filter);
    if (doc && doc.data) {
      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(doc.data);
    }
    return next();
  } catch (err) {
    return next();
  }
});

app.use('/uploads', (req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); },
  express.static(path.join(__dirname, '..', 'uploads')));
if (config.NODE_ENV !== 'test') app.use(morgan('dev'));

// Swagger OpenAPI documentation
const swaggerUiOptions = {
  customSiteTitle: 'Orion API Docs',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-family: sans-serif; font-weight: 700; color: #1e293b; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
  },
};

app.get('/api/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.get('/api/docs.json', (req, res) => res.redirect('/api/v1/docs.json'));

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api/docs', (req, res) => res.redirect('/api/v1/docs'));
app.get('/docs', (req, res) => res.redirect('/api/v1/docs'));

// Rate limiting on API v1 routes
app.use('/api/v1', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX, 10) || 1000,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
}));

app.get('/api/v1/health', (req, res) => res.json({ success: true, message: 'Orion API is running' }));

const v1 = express.Router();
v1.use('/auth', require('./modules/auth/auth.routes'));
v1.use('/users', require('./modules/users/users.routes'));
v1.use('/products', require('./modules/products/products.routes'));
v1.use('/categories', require('./modules/categories/categories.routes'));
v1.use('/cart', require('./modules/cart/cart.routes'));
v1.use('/addresses', require('./modules/addresses/addresses.routes'));
v1.use('/orders', require('./modules/orders/orders.routes'));
v1.use('/payments', require('./modules/payments/payments.routes'));
v1.use('/feedback', require('./modules/feedback/feedback.routes'));
v1.use('/contact', require('./modules/contact/contact.routes'));
v1.use('/admin', require('./modules/admin/admin.routes'));

app.use('/api/v1', v1);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
