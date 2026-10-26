export default function RatingStars({ rating = 0, size = 'text-base' }) {
  return (
    <span className={`text-amber-500 ${size}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= Math.round(rating) ? '★' : '☆'}</span>
      ))}
    </span>
  );
}
