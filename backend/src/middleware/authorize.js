// Role-based authorization (PDF Section 7: admin permissions are enforced in
// Express middleware on EVERY protected endpoint - hiding frontend links is
// not authorization). Authenticated user with the wrong role -> 403.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role for this resource' });
    }
    next();
  };
}

const requireAdmin = authorize('admin');
const requireCustomer = authorize('customer');

module.exports = { authorize, requireAdmin, requireCustomer };
