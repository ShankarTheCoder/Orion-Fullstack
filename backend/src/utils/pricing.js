// Delivery pricing rule (PRD Section 13, fixed for V1):
// flat Rs 40 delivery charge, FREE delivery when subtotal is above Rs 499.
// Order totals are ALWAYS calculated on the server from DB prices - a total
// sent by the client is never trusted (PDF Section 7).
const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_THRESHOLD = 499;

function calcTotals(subtotal) {
  const deliveryCharge = subtotal === 0 || subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  return { subtotal, deliveryCharge, total: subtotal + deliveryCharge, grandTotal: subtotal + deliveryCharge };
}

module.exports = { DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD, calcTotals };
