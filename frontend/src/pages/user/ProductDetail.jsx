import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as productService from '../../services/productService';
import * as customerService from '../../services/customerService';
import useFetch from '../../hooks/useFetch';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import Loader from '../../components/common/Loader';
import RatingStars from '../../components/common/RatingStars';
import { useToast } from '../../components/common/Toast';
import { formatPrice } from '../../utils/format';
import { productImageSrc } from '../../utils/image';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isCustomer } = useAuth();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');

  // Guests see BASIC details only (image, name, category, price/unit).
  // Description, stock, delivery details and reviews render only for
  // logged-in users (customers and admin) - never in the guest DOM.
  const isGuest = !user;

  const { data: product, loading, error } = useFetch(() => productService.getProduct(id), [id]);
  const { data: reviews, refetch: refetchReviews } = useFetch(() => customerService.getFeedback({ productId: id }), [id]);

  if (loading) return <Loader />;
  if (error || !product) return <p className="mx-auto max-w-xl px-4 py-16 text-center text-red-600">{error || 'Product not found'}</p>;

  const out = product.stock <= 0;

  const onAdd = async () => {
    if (!user) {
      toast.info('Please log in as a customer to use the cart');
      navigate('/login', { state: { message: 'Log in to add items to your cart. Guests can browse, but the cart is for registered customers.' } });
      return;
    }
    try {
      const res = await add(product.id, qty);
      if (res?.blocked) { toast.error('Admins do not shop - log in as a customer to order'); return; }
      toast.success(`${product.name} added to cart`);
    } catch (err) { toast.error(err.message); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!isCustomer) { setReviewError('Log in as a customer to write a review.'); return; }
    try {
      await customerService.submitFeedback({
        name: user.name, phone: user.mobile, rating: review.rating,
        comment: review.comment, productId: product.id,
      });
      setReview({ rating: 5, comment: '' });
      toast.success('Review submitted');
      refetchReviews();
    } catch (err) { setReviewError(err.message); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/products" className="text-sm font-semibold text-farm-700 hover:underline">← Back to products</Link>
      <div className="mt-4 grid gap-6 rounded-2xl border border-farm-100 bg-white p-6 shadow-card sm:grid-cols-2">
        {productImageSrc(product)
          ? <img src={productImageSrc(product)} alt={product.name} className="h-64 w-full rounded-2xl object-cover" />
          : <div className="flex h-64 items-center justify-center rounded-2xl bg-farm-50 text-[9rem]">{product.emoji || '🥬'}</div>}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-farm-600">{product.category}</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{product.name}</h1>
          {isGuest ? (
            <p className="mt-2 rounded-lg bg-farm-50 px-3 py-2 text-sm font-medium text-farm-800">🔒 Login to see full details — the description, stock and customer reviews are visible to registered customers.</p>
          ) : (
            <p className="mt-2 text-slate-600">{product.description || 'Fresh, handpicked and quality-checked this morning.'}</p>
          )}
          <p className="mt-4 text-3xl font-extrabold text-farm-700">{formatPrice(product.price)}<span className="text-base font-medium text-slate-500"> /{product.unit}</span></p>
          {!isGuest && (
            <p className={`mt-1 text-sm font-medium ${out ? 'text-red-500' : 'text-slate-500'}`}>{out ? 'Currently out of stock' : `${product.stock} ${product.unit} available`}</p>
          )}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-300">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 font-bold">−</button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock || 1, qty + 1))} className="px-3 py-2 font-bold">+</button>
            </div>
            <button disabled={user ? out : false} onClick={onAdd} className="flex-1 rounded-lg bg-farm-600 py-2.5 font-semibold text-white hover:bg-farm-700 disabled:bg-slate-300">
              {!user ? '🔑 Login to Order' : (out ? 'Out of Stock' : 'Add to Cart')}
            </button>
          </div>
          {!isGuest && (
            <ul className="mt-5 space-y-1 text-sm text-slate-500">
              <li>🚚 Delivery ₹40 · FREE above ₹499 · Slots: 7-10 AM, 12-3 PM, 5-8 PM</li>
              <li>💵 Cash on Delivery and online payment accepted</li>
            </ul>
          )}
        </div>
      </div>

      {!isGuest && (
      <section className="mt-8 rounded-2xl border border-farm-100 bg-white p-6 shadow-card">
        <h2 className="text-lg font-extrabold text-farm-900">Customer Reviews</h2>
        {reviews?.length ? (
          <ul className="mt-3 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="border-b border-slate-100 pb-3">
                <p className="flex items-center gap-2 font-semibold text-slate-800">{r.name} {r.rating && <RatingStars rating={r.rating} />}</p>
                <p className="text-sm text-slate-600">{r.comment}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-500">No reviews yet for this product.</p>}

        <form onSubmit={submitReview} className="mt-5 space-y-3">
          <p className="font-semibold text-slate-800">Write a review</p>
          <div className="flex items-center gap-2">
            <span className="text-sm">Your rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setReview((r) => ({ ...r, rating: n }))}
                className={`text-2xl ${n <= review.rating ? 'text-amber-500' : 'text-slate-300'}`}>★</button>
            ))}
          </div>
          <textarea required value={review.comment} onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
            placeholder="How was the quality?" className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-farm-500" rows={3} />
          {reviewError && <p className="text-sm font-medium text-red-600">{reviewError}</p>}
          <button className="rounded-lg bg-farm-600 px-5 py-2 font-semibold text-white hover:bg-farm-700">Submit review</button>
        </form>
      </section>
      )}
    </div>
  );
}
