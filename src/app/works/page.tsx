"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";
import TagCloud from "@/components/TagCloud";
import CpChemistryCard from "@/components/CpChemistryCard";
import LockedShelf from "@/components/LockedShelf";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

const STATUS_CONFIG: Record<string, { label: string; style: string; emoji: string }> = {
  reading: { label: "在看", style: "bg-mint/60 text-mint-dark", emoji: "📖" },
  finished: { label: "已看完", style: "bg-sky/60 text-blue-600", emoji: "🎉" },
  paused: { label: "搁置", style: "bg-sunny/60 text-amber-600", emoji: "💤" },
  dropped: { label: "弃坑", style: "bg-gray-200 text-gray-500", emoji: "👋" },
};

const TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  novel: { label: "小说", emoji: "📕" },
  manga: { label: "漫画", emoji: "📘" },
  anime: { label: "动漫", emoji: "📺" },
};

function WorkDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentReader, loading: readerLoading } = useReader();
  const id = searchParams.get("id");
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !currentReader) {
      setWork(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    store.getWork(id)
      .then((data) => setWork(data))
      .catch((err) => setError(err instanceof Error ? err.message : "读取作品失败"))
      .finally(() => setLoading(false));
  }, [id, currentReader]);

  async function handleDelete() {
    if (!id || !confirm("确定删除吗？")) return;
    setError("");
    try {
      await store.deleteWork(id);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败，请重试");
    }
  }

  if (readerLoading) return <div className="py-24 text-center text-sm font-bold text-text-light">正在检查书架状态...</div>;
  if (!currentReader) return <LockedShelf />;
  if (!id) return <div className="py-24 text-center"><p className="text-text-soft">作品 ID 未提供</p><Link href="/" className="mt-3 inline-block font-bold text-coral">返回作品库</Link></div>;
  if (loading) return <div className="mx-auto max-w-4xl animate-pulse space-y-6"><div className="h-8 w-1/3 rounded-full bg-coral/10" /><div className="h-80 rounded-[2rem] bg-white/60" /></div>;
  if (error && !work) return <div className="py-24 text-center"><p className="font-bold text-red-500">{error}</p><Link href="/" className="mt-3 inline-block font-bold text-coral">返回作品库</Link></div>;
  if (!work) return <div className="py-24 text-center"><p className="text-text-soft">作品不存在</p><Link href="/" className="mt-3 inline-block font-bold text-coral">返回作品库</Link></div>;

  const progressPercent = work.progressTotal && work.progressTotal > 0 ? Math.round((work.progressCurrent / work.progressTotal) * 100) : 0;
  const status = STATUS_CONFIG[work.readingStatus] || STATUS_CONFIG.reading;
  const typeInfo = TYPE_CONFIG[work.type] || TYPE_CONFIG.novel;

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-light hover:text-coral-dark">← 返回作品库</Link>

      {error && <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-500">❌ {error}</div>}

      <section className="overflow-hidden rounded-[2.2rem] border border-white/90 bg-white/88 shadow-[0_22px_70px_rgba(92,75,81,0.09)] backdrop-blur-xl">
        <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
          <div className="relative bg-gradient-to-br from-coral/10 via-lavender/15 to-mint/15 p-5 sm:p-7">
            <div className="mx-auto w-40 sm:w-full">
              {work.coverUrl ? (
                <img src={work.coverUrl} alt={work.title} className="aspect-[3/4] w-full rounded-[1.6rem] object-cover shadow-xl ring-1 ring-white/80" />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-[1.6rem] bg-white/85 shadow-sm ring-1 ring-coral/10">
                  <span className="text-6xl">📚</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <div className="text-[10px] font-extrabold tracking-[0.18em] text-coral-dark">LIBRARY NOTE</div>
            <h1 className="mt-2 font-cute text-3xl font-extrabold leading-tight tracking-tight text-text-warm sm:text-4xl">{work.title}</h1>
            {work.author && <p className="mt-2 text-sm font-semibold text-text-light">by {work.author}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-pill bg-coral/10 px-3 py-1.5 text-xs font-bold text-coral-dark">{typeInfo.emoji} {typeInfo.label}</span>
              <span className="rounded-pill bg-text-warm/5 px-3 py-1.5 text-xs font-bold text-text-soft">{work.serialStatus === "completed" ? "✅ 已完结" : "🔄 连载中"}</span>
              <span className={`rounded-pill px-3 py-1.5 text-xs font-bold ${status.style}`}>{status.emoji} {status.label}</span>
              {work.daysToFinish && <span className="rounded-pill bg-sunny/40 px-3 py-1.5 text-xs font-bold text-amber-700">⏱️ {work.daysToFinish} 天看完</span>}
            </div>

            {work.rating && <div className="mt-5"><RatingStars rating={work.rating} /></div>}

            {work.oneLineReview && (
              <blockquote className="mt-5 rounded-[1.5rem] bg-coral/5 px-4 py-3.5 text-sm font-semibold italic leading-6 text-text-soft ring-1 ring-coral/8">
                「{work.oneLineReview}」
              </blockquote>
            )}

            {work.progressTotal && work.progressTotal > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs font-bold text-text-light"><span>阅读进度</span><span>{work.progressCurrent}/{work.progressTotal} · {Math.min(progressPercent, 100)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-coral/10">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(progressPercent, 100)}%`, background: "linear-gradient(90deg, #ff8fab, #d4b8ff)" }} />
                </div>
              </div>
            )}

            {(work.tropes || work.tags) && (
              <div className="mt-6 space-y-3">
                {work.tropes && <TagCloud tags={work.tropes} label="Trope" />}
                {work.tags && <TagCloud tags={work.tags} label="标签" />}
              </div>
            )}
          </div>
        </div>
      </section>

      <CpChemistryCard data={{ cpPersonality: work.cpPersonality, cpTension: work.cpTension, cpFamousLines: work.cpFamousLines }} />

      <div className="grid gap-4 md:grid-cols-2">
        {work.touchingMoments && (
          <section className="rounded-[2rem] border border-white/90 bg-white/90 p-6 shadow-[0_14px_40px_rgba(92,75,81,0.05)]">
            <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-coral/10">💕</span><h2 className="font-cute text-lg font-extrabold text-text-warm">触动时刻</h2></div>
            <blockquote className="whitespace-pre-wrap border-l-[3px] border-coral/25 pl-4 text-sm font-medium leading-7 text-text-soft">{work.touchingMoments}</blockquote>
          </section>
        )}
        {work.notes && (
          <section className="rounded-[2rem] border border-white/90 bg-white/90 p-6 shadow-[0_14px_40px_rgba(92,75,81,0.05)]">
            <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-lavender/30">📝</span><h2 className="font-cute text-lg font-extrabold text-text-warm">私人备注</h2></div>
            <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-text-soft">{work.notes}</p>
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[1.7rem] border border-white/90 bg-white/85 p-3 shadow-sm">
        <Link href={`/edit?id=${work.id}`} className="rounded-pill bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-coral-dark">✏️ 编辑作品</Link>
        <button onClick={handleDelete} className="rounded-pill bg-red-50 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-100">🗑️ 删除</button>
        <Link href="/" className="rounded-pill px-5 py-2.5 text-sm font-bold text-text-light hover:bg-coral/5 hover:text-text-warm">返回列表</Link>
      </div>
    </div>
  );
}

export default function WorkPage() {
  return <Suspense fallback={<div className="py-24 text-center text-text-light">加载中...</div>}><WorkDetail /></Suspense>;
}
