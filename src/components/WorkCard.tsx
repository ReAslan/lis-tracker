"use client";

import Link from "next/link";
import RatingStars from "./RatingStars";

const STATUS_CONFIG: Record<string, { label: string; style: string; emoji: string }> = {
  reading: { label: "在看", style: "bg-mint/60 text-mint-dark", emoji: "📖" },
  finished: { label: "看完啦", style: "bg-sky/60 text-sky", emoji: "🎉" },
  paused: { label: "搁置", style: "bg-sunny/60 text-amber-600", emoji: "💤" },
  dropped: { label: "弃坑", style: "bg-gray-200 text-gray-500", emoji: "👋" },
};

const TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  novel: { label: "小说", emoji: "📕" },
  manga: { label: "漫画", emoji: "📘" },
  anime: { label: "动漫", emoji: "📺" },
};

interface Work {
  id: number;
  title: string;
  author: string | null;
  type: string;
  coverUrl: string | null;
  readingStatus: string;
  rating: number | null;
  oneLineReview: string | null;
  progressCurrent: number;
  progressTotal: number | null;
}

export default function WorkCard({ work }: { work: Work }) {
  const progressPercent =
    work.progressTotal && work.progressTotal > 0
      ? Math.round((work.progressCurrent / work.progressTotal) * 100)
      : 0;

  const status = STATUS_CONFIG[work.readingStatus] || STATUS_CONFIG.reading;
  const typeInfo = TYPE_CONFIG[work.type] || TYPE_CONFIG.novel;

  return (
    <Link
      href={`/works/${work.id}`}
      className="group block bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all overflow-hidden hover:shadow-coral/15"
      style={{ animation: "pop 0.3s ease-out" }}
    >
      {/* Cover */}
      <div className="aspect-[3/4] bg-peach relative overflow-hidden">
        {work.coverUrl ? (
          <img
            src={work.coverUrl}
            alt={work.title}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-coral/30">
            <span className="text-5xl group-hover:animate-wiggle inline-block">📚</span>
            <span className="text-xs font-cute font-bold">还没封面呢</span>
          </div>
        )}

        {/* Badges */}
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-pill text-[11px] font-bold ${status.style} backdrop-blur-sm`}>
          {status.emoji} {status.label}
        </span>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-pill text-[11px] font-bold bg-black/35 backdrop-blur-sm text-white/90">
          {typeInfo.emoji} {typeInfo.label}
        </span>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4 space-y-2.5">
        <h3 className="font-cute font-bold text-text-warm truncate group-hover:text-coral transition-colors text-[15px]">
          {work.title}
        </h3>

        {work.author && (
          <p className="text-xs text-text-light truncate -mt-1">{work.author}</p>
        )}

        {/* Progress bar */}
        {work.progressTotal && work.progressTotal > 0 && (
          <div>
            <div className="flex justify-between text-[11px] text-text-light mb-1 font-bold">
              <span>📊 进度</span>
              <span>{work.progressCurrent}/{work.progressTotal}</span>
            </div>
            <div className="w-full bg-coral/12 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(progressPercent, 100)}%`,
                  background: "linear-gradient(90deg, #ff8fab, #d4b8ff)",
                }}
              />
            </div>
          </div>
        )}

        {/* Rating + one-liner */}
        <div className="space-y-1.5">
          <RatingStars rating={work.rating} size="sm" />
          {work.oneLineReview && (
            <p className="text-[11px] text-text-light/80 line-clamp-2 italic leading-relaxed">
              「{work.oneLineReview}」
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
