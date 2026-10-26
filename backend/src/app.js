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
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.CLIENT_URL ? config.CLIENT_URL.split(',') : true,
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
// Uploaded product images (backend/uploads) served publicly at /uploads/*.
// CORP is relaxed for this path only so the storefront on another origin
// (the Vite dev server) can embed the images.
app.use('/uploads', (req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); next(); },
  express.static(path.join(__dirname, '..', 'uploads')));
if (config.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', rateLimit({
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
