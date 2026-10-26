const service = require('./admin.service');
const orderService = require('../orders/orders.service');
const paymentService = require('../payments/payments.service');
const feedbackService = require('../feedback/feedback.service');
const contactService = require('../contact/contact.service');
const { getPagination, paginated } = require('../../utils/pagination');

async function dashboard(req, res, next) {
  try { res.json({ success: true, data: await service.dashboardStats() }); } catch (err) { next(err); }
}

// customers
async function listCustomers(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await service.listCustomers(req.query, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}
async function customerDetail(req, res, next) {
  try { res.json({ success: true, data: await service.getCustomerDetail(req.params.id) }); } catch (err) { next(err); }
}
async function setCustomerStatus(req, res, next) {
  try { res.json({ success: true, data: await service.setCustomerStatus(req.user, req.params.id, req.body.status) }); } catch (err) { next(err); }
}
async function setCustomerVerification(req, res, next) {
  try {
    const isVerified = req.body.isVerified !== undefined ? Boolean(req.body.isVerified) : true;
    res.json({ success: true, data: await service.setCustomerVerification(req.user, req.params.id, isVerified) });
  } catch (err) { next(err); }
}
async function createCustomer(req, res, next) {
  try { res.status(201).json({ success: true, data: await service.createCustomer(req.body) }); } catch (err) { next(err); }
}
async function updateCustomer(req, res, next) {
  try { res.json({ success: true, data: await service.updateCustomer(req.user, req.params.id, req.body) }); } catch (err) { next(err); }
}
async function deleteCustomer(req, res, next) {
  try { res.json({ success: true, ...(await service.deleteCustomer(req.user, req.params.id)) }); } catch (err) { next(err); }
}

// orders
async function listOrders(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await orderService.listOrdersAdmin(req.query, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}
async function updateOrderStatus(req, res, next) {
  try { res.json({ success: true, data: await orderService.updateStatusAdmin(req.params.id, req.body.status) }); } catch (err) { next(err); }
}

// payments
async function listPayments(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await paymentService.listPaymentsAdmin(req.query, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}
async function paymentDetail(req, res, next) {
  try { res.json({ success: true, data: await paymentService.getPaymentAdmin(req.params.id) }); } catch (err) { next(err); }
}

// feedback moderation
async function listFeedback(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await feedbackService.listFeedback(req.query, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}
async function deleteFeedback(req, res, next) {
  try { res.json({ success: true, ...(await feedbackService.deleteFeedback(req.params.id)) }); } catch (err) { next(err); }
}

// contact requests
async function listContacts(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req);
    const { items, total } = await contactService.listContactRequests(req.query, { page, limit, skip });
    paginated(res, items, total, page, limit);
  } catch (err) { next(err); }
}
async function resolveContact(req, res, next) {
  try { res.json({ success: true, data: await contactService.resolveContactRequest(req.params.id) }); } catch (err) { next(err); }
}
async function deleteContact(req, res, next) {
  try { res.json({ success: true, ...(await contactService.deleteContactRequest(req.params.id)) }); } catch (err) { next(err); }
}

module.exports = {
  dashboard, listCustomers, customerDetail, setCustomerStatus, setCustomerVerification,
  createCustomer, updateCustomer, deleteCustomer,
  listOrders, updateOrderStatus, listPayments, paymentDetail,
  listFeedback, deleteFeedback, listContacts, resolveContact, deleteContact,
};
