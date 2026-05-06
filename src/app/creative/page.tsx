"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { CreativeEntry } from "@/lib/githubStore";

function CreativeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentReader } = useReader();
  const id = searchParams.get("id");
  const editId = searchParams.get("edit");

  if (editId) return <CreativeEditView editId={editId} />;
  if (id) return <CreativeDetailView id={id} />;
  return <CreativeListView currentReader={currentReader} />;
}

function CreativeListView({ currentReader }: { currentReader: any }) {
  const [entries, setEntries] = useState<CreativeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!currentReader) return;
    setLoading(true);
    store.getCreativeEntries(currentReader.id).then(d => { setEntries(d); setLoading(false); });
  }
  useEffect(() => { load(); }, [currentReader]);

  async function handleDelete(id: string) {
    if (!confirm("确定删除吗？")) return;
    await store.deleteCreativeEntry(id);
    load();
  }

  if (!currentReader) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="font-cute text-3xl font-extrabold text-text-warm flex items-center gap-3"><span className="animate-float inline-block">{currentReader.emoji}</span> 创作角</h1><p className="text-text-light mt-2 text-sm font-bold">灵感脑洞、CP 重组、代餐小剧场... 💡</p></div>
        <Link href="/creative/new" className="px-5 py-3 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark transition-all shadow-lg shadow-coral/15 hover:scale-105">✨ 新建创作</Link>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="bg-white rounded-[2rem] border-2 border-coral/10 p-6 animate-pulse"><div className="h-5 bg-coral/10 rounded-full w-1/3 mb-3" /></div>))}</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-24"><div className="text-6xl animate-float">💡</div><p className="text-text-soft text-lg mt-6 font-cute font-bold">创作角还是空的~</p></div>
      ) : (
        <div className="space-y-3">{entries.map(entry => (
          <div key={entry.id} className="group bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm hover:shadow-lg p-6 transition-all hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-4">
              <Link href={`/creative?id=${entry.id}`} className="flex-1 min-w-0">
                <h3 className="font-cute font-bold text-text-warm group-hover:text-coral transition-colors text-lg">✨ {entry.title}</h3>
                <p className="text-text-soft text-sm mt-2 line-clamp-2 whitespace-pre-wrap">{entry.content}</p>
                <p className="text-xs text-text-light/60 mt-3 font-bold">{new Date(entry.updatedAt).toLocaleDateString("zh-CN")}</p>
              </Link>
              <div className="flex gap-1 flex-shrink-0">
                <Link href={`/creative?edit=${entry.id}`} className="px-3 py-1.5 text-xs font-bold text-text-light hover:text-coral hover:bg-coral/5 rounded-pill transition-colors">编辑</Link>
                <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 text-xs font-bold text-text-light hover:text-red-400 hover:bg-red-50 rounded-pill transition-colors">删除</button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function CreativeDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [entry, setEntry] = useState<CreativeEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.getCreativeEntry(id).then(d => { setEntry(d); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!confirm("确定删除吗？")) return;
    await store.deleteCreativeEntry(id);
    router.push("/creative");
  }

  if (loading) return <div className="max-w-2xl mx-auto animate-pulse space-y-4"><div className="h-7 bg-coral/10 rounded-full w-1/2" /></div>;
  if (!entry) return <div className="text-center py-24"><p className="text-text-soft">创作不存在</p><Link href="/creative" className="text-coral font-bold mt-3 inline-block">返回</Link></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div><h1 className="font-cute text-2xl font-extrabold text-text-warm">✨ {entry.title}</h1><p className="text-xs text-text-light/60 mt-2">{new Date(entry.updatedAt).toLocaleDateString("zh-CN")}</p></div>
      <div className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6"><p className="text-text-soft leading-relaxed whitespace-pre-wrap">{entry.content}</p></div>
      <div className="flex gap-3 pt-6 border-t-2 border-coral/10">
        <Link href={`/creative?edit=${entry.id}`} className="px-5 py-2.5 bg-coral text-white rounded-pill text-sm font-bold hover:bg-coral-dark transition-all shadow-md shadow-coral/15">✏️ 编辑</Link>
        <button onClick={handleDelete} className="px-5 py-2.5 bg-red-50 text-red-400 rounded-pill text-sm font-bold hover:bg-red-100">🗑️ 删除</button>
        <Link href="/creative" className="px-5 py-2.5 text-text-light hover:text-text-warm text-sm font-bold">← 返回</Link>
      </div>
    </div>
  );
}

function CreativeEditView({ editId }: { editId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    store.getCreativeEntry(editId).then(d => {
      if (d) { setTitle(d.title); setContent(d.content); }
      setLoading(false);
    });
  }, [editId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await store.updateCreativeEntry(editId, { title, content });
    router.push(`/creative?id=${editId}`);
  }

  if (loading) return <div className="max-w-2xl mx-auto animate-pulse"><div className="h-7 bg-coral/10 rounded-full w-1/3" /></div>;

  const ic = "w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm placeholder:text-text-light/50 focus:ring-4 focus:ring-coral/15 focus:border-coral outline-none transition-all";
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="font-cute text-3xl font-extrabold text-text-warm">编辑创作</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6 space-y-5">
        <div><label className="block text-sm font-bold text-text-warm mb-1.5">标题 *</label><input className={ic} value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div><label className="block text-sm font-bold text-text-warm mb-1.5">正文 *</label><textarea className={ic} rows={14} value={content} onChange={e => setContent(e.target.value)} required /></div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-3 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark disabled:opacity-50 transition-all shadow-lg shadow-coral/15 hover:scale-105">💾 {saving ? "保存中..." : "保存修改"}</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 text-text-soft hover:text-text-warm font-bold text-sm transition-colors">取消</button>
        </div>
      </form>
    </div>
  );
}

export default function CreativePage() {
  return <Suspense fallback={<div className="text-center py-24">加载中...</div>}><CreativeContent /></Suspense>;
}
