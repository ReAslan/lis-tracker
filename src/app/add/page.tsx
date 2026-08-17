"use client";

import Link from "next/link";
import WorkForm from "@/components/WorkForm";
import LockedShelf from "@/components/LockedShelf";
import { useReader } from "@/context/ReaderContext";

export default function AddPage() {
  const { currentReader, loading } = useReader();

  if (loading) return <div className="py-24 text-center text-sm font-bold text-text-light">正在检查书架状态...</div>;
  if (!currentReader) return <LockedShelf />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/90 bg-white/80 p-5 shadow-[0_18px_60px_rgba(92,75,81,0.08)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-text-light transition-colors hover:text-coral-dark"
            >
              ← 返回作品库
            </Link>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-pill bg-coral/10 px-3 py-1 text-[11px] font-extrabold tracking-[0.14em] text-coral-dark">
                NEW ENTRY
              </span>
              <span className="text-xl">{currentReader.emoji}</span>
            </div>
            <h1 className="font-cute text-3xl font-extrabold tracking-tight text-text-warm sm:text-4xl">
              添加一部新作品
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-relaxed text-text-light">
              先记下基础信息，再慢慢补评分、触动片段和 CP 化学反应。没想好的内容都可以先留空。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:w-[270px]">
            {[
              ["01", "基础信息"],
              ["02", "阅读记录"],
              ["03", "私人感想"],
            ].map(([num, label]) => (
              <div key={num} className="rounded-[1.35rem] bg-coral/5 px-3 py-3 text-center ring-1 ring-coral/10">
                <div className="font-cute text-base font-extrabold text-coral-dark">{num}</div>
                <div className="mt-0.5 text-[10px] font-bold text-text-light">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <WorkForm />
    </div>
  );
}
