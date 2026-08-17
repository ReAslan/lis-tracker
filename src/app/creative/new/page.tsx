"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReader } from "@/context/ReaderContext";
import LockedShelf from "@/components/LockedShelf";
import * as store from "@/lib/githubStore";

export default function NewCreativePage() {
  const router = useRouter();
  const { currentReader, loading } = useReader();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentReader) return;
    setSaving(true);
    setError("");
    try {
      const entry = await store.createCreativeEntry({ title, content, readerId: currentReader.id });
      router.push(`/creative?id=${entry.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，请重试");
      setSaving(false);
    }
  }

  if (loading) return <div className="py-24 text-center text-sm font-bold text-text-light">正在检查书架状态...</div>;
  if (!currentReader) return <LockedShelf />;

  const inputClass = "w-full rounded-[1.15rem] border border-coral/15 bg-[#fffdfc] px-4 py-3 text-sm text-text-warm outline-none placeholder:text-text-light/50 focus:border-coral/50 focus:bg-white focus:ring-4 focus:ring-coral/10";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-[0_18px_60px_rgba(92,75,81,0.08)] backdrop-blur-xl sm:p-7">
        <Link href="/creative" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-text-light hover:text-coral-dark">
          ← 返回创作角
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-lavender/35 text-2xl">💡</div>
          <div>
            <div className="mb-2 text-[11px] font-extrabold tracking-[0.18em] text-purple-500">NEW IDEA</div>
            <h1 className="font-cute text-3xl font-extrabold tracking-tight text-text-warm sm:text-4xl">把脑洞先留下来</h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-text-light">不用一次写完整。一个场景、一句台词、一对突然很好嗑的关系，都值得先记下来。</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-[0_16px_50px_rgba(92,75,81,0.06)] sm:p-7">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-extrabold tracking-wide text-text-soft">标题 *</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="给这条灵感取个名字" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="text-xs font-extrabold tracking-wide text-text-soft">正文 *</label>
              <span className="text-[10px] font-bold text-text-light">{content.length} 字</span>
            </div>
            <textarea className={`${inputClass} min-h-[360px] resize-y leading-7`} value={content} onChange={(e) => setContent(e.target.value)} required placeholder="写下你的脑洞、CP 重组、代餐小剧场、名场面……" />
          </div>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold leading-5 text-red-500">❌ {error}</div>}

        <div className="mt-6 flex flex-col gap-3 border-t border-coral/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-text-light">保存以后可以继续编辑，不需要现在就写到满意。</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.back()} className="flex-1 rounded-pill px-5 py-3 text-sm font-bold text-text-soft hover:bg-coral/5 sm:flex-none">取消</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-pill bg-coral px-7 py-3 text-sm font-bold text-white shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:bg-coral-dark disabled:opacity-50 sm:flex-none">
              {saving ? "保存中..." : "✨ 保存灵感"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
