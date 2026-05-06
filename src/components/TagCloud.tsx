const TAG_COLORS = [
  "bg-coral/12 text-coral-dark",
  "bg-mint/40 text-mint-dark",
  "bg-lavender/30 text-purple-600",
  "bg-sky/30 text-blue-600",
  "bg-sunny/40 text-amber-600",
  "bg-pink-100 text-pink-600",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
];

function getColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export default function TagCloud({ tags, label }: { tags: string; label?: string }) {
  const list = tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {label && <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">{label}</span>}
      {list.map(tag => (
        <span key={tag} className={`px-2.5 py-0.5 rounded-pill text-[11px] font-bold ${getColor(tag)}`}>
          #{tag}
        </span>
      ))}
    </div>
  );
}
