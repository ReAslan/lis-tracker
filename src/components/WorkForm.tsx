"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

const TYPE_OPTIONS = [
  { value: "novel", label: "📕 小说" },
  { value: "manga", label: "📘 漫画" },
  { value: "anime", label: "📺 动漫" },
];

const SERIAL_OPTIONS = [
  { value: "ongoing", label: "🔄 连载中" },
  { value: "completed", label: "✅ 已完结" },
];

const STATUS_OPTIONS = [
  { value: "reading", label: "📖 在看" },
  { value: "finished", label: "🎉 已看完" },
  { value: "paused", label: "💤 搁置" },
  { value: "dropped", label: "👋 弃坑" },
];

type FormData = Omit<Work, "id" | "createdAt" | "updatedAt">;

const EMPTY_FORM: FormData = {
  title: "", author: "", type: "novel", serialStatus: "ongoing", coverUrl: "",
  readingStatus: "reading", progressCurrent: 0, progressTotal: null, rating: null,
  oneLineReview: "", touchingMoments: "", daysToFinish: null,
  cpPersonality: "", cpTension: "", cpFamousLines: "",
  tags: "", tropes: "", notes: "", readerId: "",
};

interface Props {
  initialData?: Partial<Work>;
}

export default function WorkForm({ initialData }: Props) {
  const router = useRouter();
  const { currentReader } = useReader();
  const [form, setForm] = useState<FormData>(() => {
    const base = { ...EMPTY_FORM };
    if (initialData) {
      Object.assign(base, initialData);
    }
    return base;
  });
  const [saving, setSaving] = useState(false);

  const isEdit = !!initialData?.id;
  const set = (field: keyof FormData, value: any) => setForm(p => ({ ...p, [field]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentReader) return;
    setSaving(true);

    const data = {
      ...form,
      progressTotal: form.progressTotal === null ? null : Number(form.progressTotal),
      rating: form.rating === null ? null : Number(form.rating),
      daysToFinish: form.daysToFinish === null ? null : Number(form.daysToFinish),
      readerId: currentReader.id,
    };

    try {
      if (isEdit && initialData?.id) {
        const updated = await store.updateWork(initialData.id, data);
        router.push(`/works?id=${updated.id}`);
      } else {
        const created = await store.createWork(data);
        router.push(`/works?id=${created.id}`);
      }
      router.refresh();
    } catch {
      setSaving(false);
    }
  }

  const ic = "w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-2.5 text-sm text-text-warm placeholder:text-text-light/50 focus:ring-4 focus:ring-coral/15 focus:border-coral outline-none transition-all";
  const lc = "block text-sm font-bold text-text-warm mb-1.5";
  const sc = "bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6 space-y-5";
  const tc = "font-cute text-base font-extrabold text-text-warm flex items-center gap-2.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-coral to-lavender rounded-full" />📋 基础信息</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>标题 *</label><input className={ic} value={form.title} onChange={e => set("title", e.target.value)} required placeholder="作品标题" /></div>
          <div><label className={lc}>作者</label><input className={ic} value={form.author} onChange={e => set("author", e.target.value || undefined)} placeholder="作者名" /></div>
          <div><label className={lc}>类型 *</label><select className={ic} value={form.type} onChange={e => set("type", e.target.value)}>{TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div><label className={lc}>连载状态</label><select className={ic} value={form.serialStatus} onChange={e => set("serialStatus", e.target.value)}>{SERIAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="sm:col-span-2"><label className={lc}>🖼️ 封面图片 URL</label><input className={ic} value={form.coverUrl || ""} onChange={e => set("coverUrl", e.target.value || undefined)} placeholder="https://example.com/cover.jpg" /></div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-mint to-teal-400 rounded-full" />📊 阅读进度</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className={lc}>阅读状态</label><select className={ic} value={form.readingStatus} onChange={e => set("readingStatus", e.target.value)}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div><label className={lc}>当前进度</label><input className={ic} type="number" value={form.progressCurrent} onChange={e => set("progressCurrent", parseInt(e.target.value) || 0)} min={0} /></div>
          <div><label className={lc}>总章节/集数</label><input className={ic} type="number" value={form.progressTotal ?? ""} onChange={e => set("progressTotal", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="可不填" min={0} /></div>
          <div><label className={lc}>⏱️ 几天看完</label><input className={ic} type="number" value={form.daysToFinish ?? ""} onChange={e => set("daysToFinish", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="可不填" min={0} /></div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-sunny to-amber-400 rounded-full" />⭐ 评分与感想</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>个人评分 (1-10)</label><input className={ic} type="number" value={form.rating ?? ""} onChange={e => set("rating", e.target.value === "" ? null : parseInt(e.target.value))} min={1} max={10} placeholder="1-10" /></div>
          <div className="sm:col-span-2"><label className={lc}>💬 一句话评语</label><input className={ic} value={form.oneLineReview || ""} onChange={e => set("oneLineReview", e.target.value || undefined)} placeholder="用一句话总结这部作品" /></div>
          <div className="sm:col-span-2"><label className={lc}>💕 触动我的内容</label><textarea className={ic} rows={4} value={form.touchingMoments || ""} onChange={e => set("touchingMoments", e.target.value || undefined)} placeholder="记录那些打动你的片段、台词、情节..." /></div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-pink-400 to-coral rounded-full" />💕 CP 化学反应分析</h2>
        <div className="space-y-4">
          <div><label className={lc}>🌸 性格互补</label><textarea className={ic} rows={2} value={form.cpPersonality || ""} onChange={e => set("cpPersonality", e.target.value || undefined)} placeholder="两人性格如何互补/反差..." /></div>
          <div><label className={lc}>⚡ 张力来源</label><textarea className={ic} rows={2} value={form.cpTension || ""} onChange={e => set("cpTension", e.target.value || undefined)} placeholder="他们之间的张力从何而来..." /></div>
          <div><label className={lc}>💬 名台词</label><textarea className={ic} rows={2} value={form.cpFamousLines || ""} onChange={e => set("cpFamousLines", e.target.value || undefined)} placeholder="印象深刻的CP台词..." /></div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-lavender to-purple-400 rounded-full" />🏷️ 标签分类</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>一般标签</label><input className={ic} value={form.tags || ""} onChange={e => set("tags", e.target.value || undefined)} placeholder="爽文, 甜宠, 悬疑 (逗号分隔)" /></div>
          <div><label className={lc}>Trope 标签</label><input className={ic} value={form.tropes || ""} onChange={e => set("tropes", e.target.value || undefined)} placeholder="宿敌, 青梅竹马, 救赎 (逗号分隔)" /></div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="px-8 py-3.5 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark disabled:opacity-50 transition-all shadow-lg shadow-coral/20 hover:scale-105 active:scale-95">
          {saving ? "保存中..." : isEdit ? "💾 保存修改" : "✨ 添加作品"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-3 text-text-soft hover:text-text-warm font-bold text-sm transition-colors">取消</button>
      </div>
    </form>
  );
}
