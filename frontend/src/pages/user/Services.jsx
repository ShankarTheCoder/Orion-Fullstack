import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const SERVICES = [
  ['🛒', 'Online ordering', 'Browse 1000+ farm products across fruits and vegetables, add to cart and order in minutes.'],
  ['🕐', 'Delivery time slots', 'Pick 7-10 AM, 12-3 PM or 5-8 PM — we deliver within your chosen window, anywhere in Meerut.'],
  ['💵', 'Flexible payments', 'Pay online by card or UPI at checkout, or simply choose Cash on Delivery.'],
  ['📦', 'Order tracking', 'Follow your order from Placed to Confirmed, Packed, Out for Delivery and Delivered.'],
  ['🎁', 'Deals, big packs & combos', 'Weekly deals, family big packs, money-saving combos and the ₹30 corner for daily sabzi.'],
  ['⭐', 'Reviews & feedback', 'Read real customer reviews on every product and share your own experience.'],
];

const FAQS = [
  ['Where does Orion deliver?', 'We deliver farm-fresh fruits and vegetables across all sectors and neighborhoods in Meerut, Uttar Pradesh.'],
  ['What are your delivery timings and charges?', 'We offer 3 daily slots: 7–10 AM, 12–3 PM, and 5–8 PM. Delivery is ₹40, and completely FREE on orders above ₹499.'],
  ['Can I pay using Cash on Delivery (COD)?', 'Yes! We support Cash on Delivery as well as instant online card and UPI mock payments.'],
  ['How do I track my order?', 'Once signed in, go to your dedicated Customer Console → My Orders to see live status tracking from Confirmed to Delivered.'],
  ['How can I share feedback or contact support?', 'Guest users and customers can submit reviews via the Feedback page or reach our Meerut support team directly through the Contact page.'],
];

export default function Services() {
  const { isCustomer } = useAuth();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-farm-900">Services & FAQ</h1>
      <p className="mt-2 text-slate-600">Everything Orion does to get farm-fresh produce to your home, plus answers to common questions.</p>
      
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(([icon, title, text]) => (
          <div key={title} className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
            <p className="text-3xl">{icon}</p>
            <p className="mt-2 font-bold text-slate-800">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>

      {/* Frequently Asked Questions */}
      <div className="mt-12">
        <h2 className="text-2xl font-extrabold text-farm-900">Frequently Asked Questions</h2>
        <p className="mt-1 text-sm text-slate-500">Quick answers about our farm delivery service in Meerut.</p>
        <div className="mt-6 space-y-3">
          {FAQS.map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-farm-100 bg-white p-5 shadow-card">
              <p className="font-bold text-slate-900">❓ {q}</p>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-2xl bg-farm-700 p-6 text-center text-white">
        <p className="text-xl font-extrabold">Ready to order fresh?</p>
        <Link to={isCustomer ? '/customer/products' : '/products'} className="mt-3 inline-block rounded-lg bg-white px-6 py-2.5 font-bold text-farm-800">Browse products</Link>
      </div>
    </div>
  );
}
