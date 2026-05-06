interface CpData {
  cpPersonality?: string | null;
  cpTension?: string | null;
  cpFamousLines?: string | null;
}

export default function CpChemistryCard({ data }: { data: CpData }) {
  const hasAny = data.cpPersonality || data.cpTension || data.cpFamousLines;
  if (!hasAny) return null;

  const items = [
    { label: "性格互补", content: data.cpPersonality, emoji: "🌸", gradient: "from-pink-50 to-coral/5", border: "border-l-coral", text: "text-coral-dark" },
    { label: "张力来源", content: data.cpTension, emoji: "⚡", gradient: "from-amber-50 to-sunny/20", border: "border-l-amber-400", text: "text-amber-700" },
    { label: "名台词", content: data.cpFamousLines, emoji: "💬", gradient: "from-purple-50 to-lavender/20", border: "border-l-purple-400", text: "text-purple-700" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-text-light uppercase tracking-widest flex items-center gap-2">
        💕 CP 化学反应
      </h3>
      <div className="grid gap-3">
        {items.filter(i => i.content).map(item => (
          <div key={item.label} className={`bg-gradient-to-r ${item.gradient} ${item.border} border-l-[4px] rounded-r-[1.5rem] p-4 hover:scale-[1.01] transition-transform`}>
            <div className={`text-xs font-bold ${item.text} mb-1.5`}>
              {item.emoji} {item.label}
            </div>
            <p className="text-sm text-text-soft leading-relaxed whitespace-pre-wrap">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
