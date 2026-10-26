const { body } = require('express-validator');
const { ORDER_STATUSES } = require('../../models/Order.model');

const orderStatusRules = [
  body('status').isIn(ORDER_STATUSES).withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
];

const customerStatusRules = [
  body('status').isIn(['active', 'blocked']).withMessage('status must be active or blocked'),
];

const createCustomerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be a 10-digit number'),
  body('email').isEmail().withMessage('Email is invalid').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('status').optional().isIn(['active', 'blocked']).withMessage('status must be active or blocked'),
];

const updateCustomerRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('mobile').optional().matches(/^\d{10}$/).withMessage('Mobile must be a 10-digit number'),
  body('email').optional().isEmail().withMessage('Email is invalid').normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('status').optional().isIn(['active', 'blocked']).withMessage('status must be active or blocked'),
];

module.exports = { orderStatusRules, customerStatusRules, createCustomerRules, updateCustomerRules };

