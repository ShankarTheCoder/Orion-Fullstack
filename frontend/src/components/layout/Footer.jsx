import { Link } from 'react-router-dom';
import logoIcon from '../../assets/logo-icon.png';

export default function Footer() {
  return (
    <footer className="mt-16 bg-farm-950 text-farm-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold text-white"><img src={logoIcon} alt="Orion" className="mr-1.5 inline h-7 w-7 rounded-md align-[-6px]" />Or<span className="text-amber-400">ion</span></p>
          <p className="mt-2 text-sm text-farm-200">Meerut's online farm-fresh fruits & vegetables store. Handpicked quality, delivered to your doorstep.</p>
        </div>
        <div>
          <p className="font-bold text-white">Shop</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link className="hover:text-white" to="/products?category=Fruits">Fresh Fruits</Link></li>
            <li><Link className="hover:text-white" to="/products?category=Vegetables">Fresh Vegetables</Link></li>
            <li><Link className="hover:text-white" to="/products?deal=dealOfWeek">Deals of the Week</Link></li>
            <li><Link className="hover:text-white" to="/products?deal=rs30Corner">₹30 Corner</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-white">Good to know</p>
          <ul className="mt-2 space-y-1 text-sm text-farm-200">
            <li>🚚 Delivery charge ₹40 — FREE above ₹499</li>
            <li>💵 Cash on Delivery & online payment (mock gateway)</li>
            <li>📍 Delivering across Meerut</li>
            <li><Link className="hover:text-white" to="/feedback">Share feedback</Link> · <Link className="hover:text-white" to="/contact">Contact us</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-farm-800 py-4 text-center text-xs text-farm-300">
        Orion · Full-stack MERN application (React + Express + MongoDB) · Frontend and backend run as separate apps.
      </div>
    </footer>
  );
}
