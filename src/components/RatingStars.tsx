export default function RatingStars({ rating, size = "md" }: { rating: number | null; size?: "sm" | "md" }) {
  if (rating === null || rating === undefined) return null;

  const stars = Math.round(rating / 2);
  const sizeClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizeClass}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`transition-all duration-300 ${
            i < stars ? "text-sunny scale-110" : "text-gray-200"
          }`}
          style={{ filter: i < stars ? "drop-shadow(0 1px 2px rgba(255,200,100,0.4))" : "none" }}
        >
          {i < stars ? "🧡" : "🤍"}
        </span>
      ))}
      <span className="text-text-light ml-1 font-cute font-bold text-[11px]">{rating}/10</span>
    </span>
  );
}
