"use client";

const TABS = [
  { key: "", label: "🌈 全部", emoji: "🌈" },
  { key: "reading", label: "📖 在看", emoji: "📖" },
  { key: "finished", label: "🎉 看完啦", emoji: "🎉" },
  { key: "dropped", label: "👋 弃坑", emoji: "👋" },
  { key: "paused", label: "💤 搁置", emoji: "💤" },
];

export default function StatusTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2.5 rounded-pill text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
            active === tab.key
              ? "bg-coral text-white shadow-lg shadow-coral/25"
              : "bg-white text-text-soft hover:text-coral hover:bg-coral/5 border-2 border-coral/15 hover:border-coral/30"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
