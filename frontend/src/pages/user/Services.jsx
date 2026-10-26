import { Link } from 'react-router-dom';

const SERVICES = [
  ['🛒', 'Online ordering', 'Browse 1000+ farm products across fruits and vegetables, add to cart and order in minutes.'],
  ['🕐', 'Delivery time slots', 'Pick 7-10 AM, 12-3 PM or 5-8 PM — we deliver within your chosen window, anywhere in Meerut.'],
  ['💵', 'Flexible payments', 'Pay online by card or UPI at checkout, or simply choose Cash on Delivery.'],
  ['📦', 'Order tracking', 'Follow your order from Placed to Confirmed, Packed, Out for Delivery and Delivered.'],
  ['🎁', 'Deals, big packs & combos', 'Weekly deals, family big packs, money-saving combos and the ₹30 corner for daily sabzi.'],
  ['⭐', 'Reviews & feedback', 'Read real customer reviews on every product and share your own experience.'],
];

export default function Services() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-farm-900">Our Services</h1>
      <p className="mt-2 text-slate-600">Everything Orion does to get farm-fresh produce to your home.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(([icon, title, text]) => (
          <div key={title} className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <p className="text-3xl">{icon}</p>
            <p className="mt-2 font-bold text-slate-800">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-2xl bg-farm-700 p-6 text-center text-white">
        <p className="text-xl font-extrabold">Ready to order fresh?</p>
        <Link to="/products" className="mt-3 inline-block rounded-lg bg-white px-6 py-2.5 font-bold text-farm-800">Browse products</Link>
      </div>
    </div>
  );
}
