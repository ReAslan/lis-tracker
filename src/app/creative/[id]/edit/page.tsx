"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCreativePage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/creative/${id}`).then(r => r.json()).then(data => { setTitle(data.title); setContent(data.content); setLoading(false); });
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch(`/api/creative/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
    if (res.ok) { router.push(`/creative/${id}`); router.refresh(); }
    else setSaving(false);
  }

  if (loading) return <div className="max-w-2xl mx-auto animate-pulse space-y-4"><div className="h-7 bg-coral/10 rounded-full w-1/3" /><div className="h-40 bg-coral/5 rounded-[2rem]" /></div>;

  const ic = "w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm placeholder:text-text-light/50 focus:ring-4 focus:ring-coral/15 focus:border-coral outline-none transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="font-cute text-3xl font-extrabold text-text-warm">编辑创作</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6 space-y-5">
        <div><label className="block text-sm font-bold text-text-warm mb-1.5">标题 *</label><input className={ic} value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div><label className="block text-sm font-bold text-text-warm mb-1.5">正文 *</label><textarea className={ic} rows={14} value={content} onChange={e => setContent(e.target.value)} required /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark disabled:opacity-50 transition-all shadow-lg shadow-coral/15 hover:scale-105 active:scale-95">💾 {saving ? "保存中..." : "保存修改"}</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 text-text-soft hover:text-text-warm font-bold text-sm transition-colors">取消</button>
        </div>
      </form>
    </div>
  );
}
