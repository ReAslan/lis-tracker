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
type SectionTone = "coral" | "mint" | "sunny" | "lavender";

const EMPTY_FORM: FormData = {
  title: "", author: "", type: "novel", serialStatus: "ongoing", coverUrl: "",
  readingStatus: "reading", progressCurrent: 0, progressTotal: null, rating: null,
  oneLineReview: "", touchingMoments: "", daysToFinish: null,
  cpPersonality: "", cpTension: "", cpFamousLines: "",
  tags: "", tropes: "", notes: "", readerId: "",
};

function SectionTitle({ emoji, title, hint, tone = "coral" }: { emoji: string; title: string; hint: string; tone?: SectionTone }) {
  const toneClass: Record<SectionTone, string> = {
    coral: "bg-coral/12 text-coral-dark",
    mint: "bg-mint/45 text-emerald-700",
    sunny: "bg-sunny/45 text-amber-700",
    lavender: "bg-lavender/35 text-purple-600",
  };

  return (
    <div className="mb-5 flex items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${toneClass[tone]}`}>{emoji}</div>
      <div>
        <h2 className="font-cute text-base font-extrabold text-text-warm sm:text-lg">{title}</h2>
        <p className="mt-0.5 text-xs font-semibold leading-relaxed text-text-light">{hint}</p>
      </div>
    </div>
  );
}

interface Props {
  initialData?: Partial<Work>;
}

export default function WorkForm({ initialData }: Props) {
  const router = useRouter();
  const { currentReader } = useReader();
  const [form, setForm] = useState<FormData>(() => {
    const base = { ...EMPTY_FORM };
    if (initialData) Object.assign(base, initialData);
    return base;
  });
  const [saving, setSaving] = useState(false);

  const isEdit = !!initialData?.id;
  const set = (field: keyof FormData, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

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

  const inputClass = "w-full rounded-[1.15rem] border border-coral/15 bg-[#fffdfc] px-4 py-3 text-sm text-text-warm outline-none placeholder:text-text-light/50 focus:border-coral/50 focus:bg-white focus:ring-4 focus:ring-coral/10";
  const labelClass = "mb-1.5 block text-xs font-extrabold tracking-wide text-text-soft";
  const sectionClass = "rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-[0_16px_50px_rgba(92,75,81,0.06)] ring-1 ring-coral/5 sm:p-7";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <section className={sectionClass}>
        <SectionTitle emoji="📋" title="基础信息" hint="标题是必填项，其余都可以之后再补。" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>标题 *</label>
            <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="作品标题" />
          </div>
          <div>
            <label className={labelClass}>作者</label>
            <input className={inputClass} value={form.author || ""} onChange={(e) => set("author", e.target.value || undefined)} placeholder="作者名" />
          </div>
          <div>
            <label className={labelClass}>类型 *</label>
            <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </div>
          <div>
            <label className={labelClass}>连载状态</label>
            <select className={inputClass} value={form.serialStatus} onChange={(e) => set("serialStatus", e.target.value)}>{SERIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>封面图片 URL</label>
            <input className={inputClass} value={form.coverUrl || ""} onChange={(e) => set("coverUrl", e.target.value || undefined)} placeholder="https://example.com/cover.jpg" />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle emoji="📊" title="阅读记录" hint="用进度和状态快速记住自己看到哪里。" tone="mint" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={labelClass}>阅读状态</label>
            <select className={inputClass} value={form.readingStatus} onChange={(e) => set("readingStatus", e.target.value)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </div>
          <div>
            <label className={labelClass}>当前进度</label>
            <input className={inputClass} type="number" value={form.progressCurrent} onChange={(e) => set("progressCurrent", parseInt(e.target.value) || 0)} min={0} />
          </div>
          <div>
            <label className={labelClass}>总章节 / 集数</label>
            <input className={inputClass} type="number" value={form.progressTotal ?? ""} onChange={(e) => set("progressTotal", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="可不填" min={0} />
          </div>
          <div>
            <label className={labelClass}>几天看完</label>
            <input className={inputClass} type="number" value={form.daysToFinish ?? ""} onChange={(e) => set("daysToFinish", e.target.value === "" ? null : parseInt(e.target.value))} placeholder="可不填" min={0} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle emoji="⭐" title="评分与感想" hint="这里更像你的私人观后感，不需要写得很正式。" tone="sunny" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>个人评分 1–10</label>
            <input className={inputClass} type="number" value={form.rating ?? ""} onChange={(e) => set("rating", e.target.value === "" ? null : parseInt(e.target.value))} min={1} max={10} placeholder="例如：9" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>一句话评语</label>
            <input className={inputClass} value={form.oneLineReview || ""} onChange={(e) => set("oneLineReview", e.target.value || undefined)} placeholder="一句话留下第一印象" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>💕 触动我的内容</label>
            <textarea className={inputClass} rows={4} value={form.touchingMoments || ""} onChange={(e) => set("touchingMoments", e.target.value || undefined)} placeholder="片段、台词、情节，或者看完以后最想记住的东西..." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>📝 私人备注</label>
            <textarea className={inputClass} rows={3} value={form.notes || ""} onChange={(e) => set("notes", e.target.value || undefined)} placeholder="其他想补充的内容，可以只写给未来的自己看。" />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle emoji="💕" title="CP 化学反应" hint="可选区域。只有想嗑的时候再认真填。" />
        <div className="space-y-4">
          <div>
            <label className={labelClass}>🌸 性格互补</label>
            <textarea className={inputClass} rows={2} value={form.cpPersonality || ""} onChange={(e) => set("cpPersonality", e.target.value || undefined)} placeholder="两人性格如何互补、反差..." />
          </div>
          <div>
            <label className={labelClass}>⚡ 张力来源</label>
            <textarea className={inputClass} rows={2} value={form.cpTension || ""} onChange={(e) => set("cpTension", e.target.value || undefined)} placeholder="他们之间的张力从何而来..." />
          </div>
          <div>
            <label className={labelClass}>💬 名台词</label>
            <textarea className={inputClass} rows={2} value={form.cpFamousLines || ""} onChange={(e) => set("cpFamousLines", e.target.value || undefined)} placeholder="印象深刻的 CP 台词..." />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <SectionTitle emoji="🏷️" title="标签分类" hint="用逗号分隔，之后回看会更方便。" tone="lavender" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>一般标签</label>
            <input className={inputClass} value={form.tags || ""} onChange={(e) => set("tags", e.target.value || undefined)} placeholder="爽文, 甜宠, 悬疑" />
          </div>
          <div>
            <label className={labelClass}>Trope 标签</label>
            <input className={inputClass} value={form.tropes || ""} onChange={(e) => set("tropes", e.target.value || undefined)} placeholder="宿敌, 青梅竹马, 救赎" />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/90 bg-white/90 p-4 shadow-[0_14px_45px_rgba(92,75,81,0.07)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-extrabold text-text-warm">都记好了吗？</p>
          <p className="mt-0.5 text-xs font-semibold text-text-light">保存后随时可以继续编辑。</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="flex-1 rounded-pill px-5 py-3 text-sm font-bold text-text-soft transition-colors hover:bg-coral/5 hover:text-text-warm sm:flex-none">取消</button>
          <button type="submit" disabled={saving} className="flex-1 rounded-pill bg-coral px-7 py-3 text-sm font-bold text-white shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:bg-coral-dark disabled:opacity-50 sm:flex-none">
            {saving ? "保存中..." : isEdit ? "💾 保存修改" : "✨ 添加作品"}
          </button>
        </div>
      </div>
    </form>
  );
}
