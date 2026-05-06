"use client";

import { useState, useRef, FormEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useReader } from "@/context/ReaderContext";

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

interface WorkFormData {
  title: string;
  author: string;
  type: string;
  serialStatus: string;
  coverUrl: string;
  readingStatus: string;
  progressCurrent: number;
  progressTotal: number | "";
  rating: number | "";
  oneLineReview: string;
  touchingMoments: string;
  daysToFinish: number | "";
  cpPersonality: string;
  cpTension: string;
  cpFamousLines: string;
  tags: string;
  tropes: string;
  notes: string;
}

const EMPTY_FORM: WorkFormData = {
  title: "", author: "", type: "novel", serialStatus: "ongoing", coverUrl: "",
  readingStatus: "reading", progressCurrent: 0, progressTotal: "", rating: "",
  oneLineReview: "", touchingMoments: "", daysToFinish: "",
  cpPersonality: "", cpTension: "", cpFamousLines: "",
  tags: "", tropes: "", notes: "",
};

export default function WorkForm({ initialData }: { initialData?: Partial<WorkFormData> }) {
  const router = useRouter();
  const { currentReader } = useReader();
  const [form, setForm] = useState<WorkFormData>({ ...EMPTY_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverMode, setCoverMode] = useState<"url" | "upload">("url");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initialData?.title;

  async function handleFileUpload(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      set("coverUrl", data.url);
      setCoverMode("url");
    }
    setUploading(false);
  }
  const set = (field: keyof WorkFormData, value: string | number) => setForm(p => ({ ...p, [field]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentReader) return;
    setSaving(true);

    const data = {
      ...form,
      progressTotal: form.progressTotal === "" ? null : Number(form.progressTotal),
      rating: form.rating === "" ? null : Number(form.rating),
      daysToFinish: form.daysToFinish === "" ? null : Number(form.daysToFinish),
      readerId: currentReader.id,
    };

    const url = isEdit ? `/api/works/${(initialData as any)?.id}` : "/api/works";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) { const work = await res.json(); router.push(`/works/${work.id}`); router.refresh(); }
    else setSaving(false);
  }

  const ic = "w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm placeholder:text-text-light/50 focus:ring-4 focus:ring-coral/15 focus:border-coral outline-none transition-all";
  const lc = "block text-sm font-bold text-text-warm mb-1.5";
  const sc = "bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6 space-y-5";
  const tc = "font-cute text-base font-extrabold text-text-warm flex items-center gap-2.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-coral to-lavender rounded-full" />📋 基础信息</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>标题 *</label><input className={ic} value={form.title} onChange={e => set("title", e.target.value)} required placeholder="作品标题" /></div>
          <div><label className={lc}>作者</label><input className={ic} value={form.author} onChange={e => set("author", e.target.value)} placeholder="作者名" /></div>
          <div><label className={lc}>类型 *</label><select className={ic} value={form.type} onChange={e => set("type", e.target.value)}>{TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div><label className={lc}>连载状态</label><select className={ic} value={form.serialStatus} onChange={e => set("serialStatus", e.target.value)}>{SERIAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div className="sm:col-span-2">
            <label className={lc}>🖼️ 封面图片</label>

            {/* Mode switcher */}
            <div className="flex gap-1 mb-3">
              <button
                type="button"
                onClick={() => setCoverMode("url")}
                className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-all ${
                  coverMode === "url" ? "bg-coral text-white" : "bg-coral/10 text-text-soft hover:bg-coral/20"
                }`}
              >
                🔗 粘贴链接
              </button>
              <button
                type="button"
                onClick={() => setCoverMode("upload")}
                className={`px-3 py-1.5 rounded-pill text-xs font-bold transition-all ${
                  coverMode === "upload" ? "bg-coral text-white" : "bg-coral/10 text-text-soft hover:bg-coral/20"
                }`}
              >
                📁 上传图片
              </button>
            </div>

            {/* Preview */}
            {form.coverUrl && (
              <div className="mb-3 relative inline-block">
                <img
                  src={form.coverUrl}
                  alt="封面预览"
                  className="w-24 h-32 object-cover rounded-2xl border-2 border-coral/20 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => set("coverUrl", "")}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-400 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {coverMode === "url" ? (
              <input
                className={ic}
                value={form.coverUrl}
                onChange={e => set("coverUrl", e.target.value)}
                placeholder="https://example.com/cover.jpg"
              />
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-[1.25rem] border-2 border-dashed p-8 text-center transition-all ${
                  dragOver
                    ? "border-coral bg-coral/5 scale-[1.02]"
                    : "border-coral/20 hover:border-coral/40 hover:bg-coral/3"
                } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-3 border-coral/30 border-t-coral rounded-full animate-spin" />
                    <span className="text-sm font-bold text-coral/60">上传中...</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-sm font-bold text-text-soft">
                      点击选择图片 <span className="text-text-light">或拖拽到此处</span>
                    </p>
                    <p className="text-[11px] text-text-light/60 mt-1">支持 JPG / PNG / GIF / WebP，最大 10MB</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-mint to-teal-400 rounded-full" />📊 阅读进度</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className={lc}>阅读状态</label><select className={ic} value={form.readingStatus} onChange={e => set("readingStatus", e.target.value)}>{STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
          <div><label className={lc}>当前进度</label><input className={ic} type="number" value={form.progressCurrent} onChange={e => set("progressCurrent", parseInt(e.target.value) || 0)} min={0} /></div>
          <div><label className={lc}>总章节/集数</label><input className={ic} type="number" value={form.progressTotal} onChange={e => set("progressTotal", e.target.value)} placeholder="可不填" min={0} /></div>
          <div><label className={lc}>⏱️ 几天看完</label><input className={ic} type="number" value={form.daysToFinish} onChange={e => set("daysToFinish", e.target.value)} placeholder="可不填" min={0} /></div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-sunny to-amber-400 rounded-full" />⭐ 评分与感想</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>个人评分 (1-10)</label><input className={ic} type="number" value={form.rating} onChange={e => set("rating", e.target.value)} min={1} max={10} placeholder="1-10" /></div>
          <div className="sm:col-span-2"><label className={lc}>💬 一句话评语</label><input className={ic} value={form.oneLineReview} onChange={e => set("oneLineReview", e.target.value)} placeholder="用一句话总结这部作品" /></div>
          <div className="sm:col-span-2"><label className={lc}>💕 触动我的内容</label><textarea className={ic} rows={4} value={form.touchingMoments} onChange={e => set("touchingMoments", e.target.value)} placeholder="记录那些打动你的片段、台词、情节..." /></div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-pink-400 to-coral rounded-full" />💕 CP 化学反应分析</h2>
        <div className="space-y-4">
          <div><label className={lc}>🌸 性格互补</label><textarea className={ic} rows={2} value={form.cpPersonality} onChange={e => set("cpPersonality", e.target.value)} placeholder="两人性格如何互补/反差..." /></div>
          <div><label className={lc}>⚡ 张力来源</label><textarea className={ic} rows={2} value={form.cpTension} onChange={e => set("cpTension", e.target.value)} placeholder="他们之间的张力从何而来..." /></div>
          <div><label className={lc}>💬 名台词</label><textarea className={ic} rows={2} value={form.cpFamousLines} onChange={e => set("cpFamousLines", e.target.value)} placeholder="印象深刻的CP台词..." /></div>
        </div>
      </div>

      <div className={sc}>
        <h2 className={tc}><span className="w-1.5 h-6 bg-gradient-to-b from-lavender to-purple-400 rounded-full" />🏷️ 标签分类</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>一般标签</label><input className={ic} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="爽文, 甜宠, 悬疑 (逗号分隔)" /></div>
          <div><label className={lc}>Trope 标签</label><input className={ic} value={form.tropes} onChange={e => set("tropes", e.target.value)} placeholder="宿敌, 青梅竹马, 救赎 (逗号分隔)" /></div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving}
          className="px-8 py-3.5 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark disabled:opacity-50 transition-all shadow-lg shadow-coral/20 hover:shadow-coral/30 hover:scale-105 active:scale-95"
        >
          {saving ? "保存中..." : isEdit ? "💾 保存修改" : "✨ 添加作品"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-3 text-text-soft hover:text-text-warm font-bold text-sm transition-colors">取消</button>
      </div>
    </form>
  );
}
