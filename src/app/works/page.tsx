"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";
import TagCloud from "@/components/TagCloud";
import CpChemistryCard from "@/components/CpChemistryCard";
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
  const id = searchParams.get("id");
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      store.getWork(id).then(data => { setWork(data); setLoading(false); });
    }
  }, [id]);

  async function handleDelete() {
    if (!id || !confirm("确定删除吗？")) return;
    await store.deleteWork(id);
    router.push("/");
  }

  if (!id) return <div className="text-center py-24"><p className="text-text-soft">作品 ID 未提供</p><Link href="/" className="text-coral font-bold mt-3 inline-block">返回首页</Link></div>;
  if (loading) return <div className="max-w-3xl mx-auto animate-pulse space-y-6"><div className="flex gap-6"><div className="w-48 h-64 bg-coral/8 rounded-[2rem]" /><div className="flex-1 space-y-3"><div className="h-7 bg-coral/10 rounded-full w-1/2" /></div></div></div>;
  if (!work) return <div className="text-center py-24"><p className="text-text-soft">作品不存在</p><Link href="/" className="text-coral font-bold mt-3 inline-block">返回首页</Link></div>;

  const progressPercent = work.progressTotal && work.progressTotal > 0 ? Math.round((work.progressCurrent / work.progressTotal) * 100) : 0;
  const status = STATUS_CONFIG[work.readingStatus] || STATUS_CONFIG.reading;
  const typeInfo = TYPE_CONFIG[work.type] || TYPE_CONFIG.novel;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="w-44 sm:w-48 flex-shrink-0 mx-auto sm:mx-0">
          {work.coverUrl ? <img src={work.coverUrl} alt={work.title} className="w-full rounded-[2rem] shadow-xl object-cover aspect-[3/4]" /> : (
            <div className="w-full aspect-[3/4] bg-white rounded-[2rem] flex items-center justify-center shadow-sm border-2 border-coral/10"><span className="text-5xl">📚</span></div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div><h1 className="font-cute text-2xl font-extrabold text-text-warm">{work.title}</h1>{work.author && <p className="text-text-light mt-1">{work.author}</p>}</div>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-pill text-xs font-bold bg-coral/12 text-coral-dark">{typeInfo.emoji} {typeInfo.label}</span>
            <span className="px-3 py-1 rounded-pill text-xs font-bold bg-text-warm/5 text-text-soft">{work.serialStatus === "completed" ? "已完结" : "连载中"}</span>
            <span className={`px-3 py-1 rounded-pill text-xs font-bold ${status.style}`}>{status.emoji} {status.label}</span>
            {work.daysToFinish && <span className="px-3 py-1 rounded-pill text-xs font-bold bg-sunny/40 text-amber-700">⏱️ {work.daysToFinish}天看完</span>}
          </div>
          {work.rating && <RatingStars rating={work.rating} />}
          {work.oneLineReview && <div className="bg-white rounded-[2rem] border-2 border-coral/10 p-4 shadow-sm"><p className="text-text-soft italic text-sm">「{work.oneLineReview}」</p></div>}
          {work.progressTotal && work.progressTotal > 0 && <div><div className="flex justify-between text-sm text-text-light mb-1.5 font-bold"><span>📊 进度</span><span>{work.progressCurrent}/{work.progressTotal}</span></div><div className="w-full bg-coral/12 rounded-full h-2.5 overflow-hidden"><div className="h-2.5 rounded-full" style={{ width: `${Math.min(progressPercent, 100)}%`, background: "linear-gradient(90deg, #ff8fab, #d4b8ff)" }} /></div></div>}
          <div className="space-y-2.5">{work.tropes && <TagCloud tags={work.tropes} label="Trope" />}{work.tags && <TagCloud tags={work.tags} label="标签" />}</div>
        </div>
      </div>
      <CpChemistryCard data={{ cpPersonality: work.cpPersonality, cpTension: work.cpTension, cpFamousLines: work.cpFamousLines }} />
      {work.touchingMoments && <div className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6"><h3 className="text-xs font-bold text-text-light uppercase tracking-widest mb-4">💕 触动时刻</h3><blockquote className="border-l-[4px] border-coral/30 pl-5 text-text-soft whitespace-pre-wrap">{work.touchingMoments}</blockquote></div>}
      {work.notes && <div className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6"><h3 className="text-xs font-bold text-text-light uppercase tracking-widest mb-4">📝 备注</h3><p className="text-text-soft whitespace-pre-wrap">{work.notes}</p></div>}
      <div className="flex gap-3 pt-6 border-t-2 border-coral/10">
        <Link href={`/edit?id=${work.id}`} className="px-5 py-2.5 bg-coral text-white rounded-pill text-sm font-bold hover:bg-coral-dark transition-all shadow-md shadow-coral/15">✏️ 编辑</Link>
        <button onClick={handleDelete} className="px-5 py-2.5 bg-red-50 text-red-400 rounded-pill text-sm font-bold hover:bg-red-100">🗑️ 删除</button>
        <Link href="/" className="px-5 py-2.5 text-text-light hover:text-text-warm text-sm font-bold">← 返回列表</Link>
      </div>
    </div>
  );
}

export default function WorkPage() {
  return <Suspense fallback={<div className="text-center py-24">加载中...</div>}><WorkDetail /></Suspense>;
}
