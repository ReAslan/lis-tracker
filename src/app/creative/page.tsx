"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { CreativeEntry } from "@/lib/githubStore";

function CreativeContent() {
  const searchParams = useSearchParams();
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
    store.getCreativeEntries(currentReader.id).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, [currentReader]);

  async function handleDelete(id: string) {
    if (!confirm("确定删除吗？")) return;
    await store.deleteCreativeEntry(id);
    load();
  }

  if (!currentReader) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-[0_18px_60px_rgba(92,75,81,0.08)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lavender/35 text-xl">💡</span>
              <span className="rounded-pill bg-lavender/25 px-3 py-1 text-[11px] font-extrabold tracking-[0.14em] text-purple-600">IDEA CORNER</span>
            </div>
            <h1 className="font-cute text-3xl font-extrabold tracking-tight text-text-warm sm:text-4xl">{currentReader.name}的创作角</h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-text-light">灵感、CP 重组、代餐小剧场、突然冒出来的台词，都可以先放在这里。</p>
          </div>
          <Link href="/creative/new" className="inline-flex items-center justify-center rounded-pill bg-coral px-5 py-3 text-sm font-bold text-white shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:bg-coral-dark">
            ✨ 新建创作
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-h-[170px] animate-pulse rounded-[2rem] border border-white/90 bg-white/85 p-6 shadow-sm">
              <div className="h-5 w-1/3 rounded-full bg-coral/10" />
              <div className="mt-4 h-3 w-4/5 rounded-full bg-coral/5" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-coral/20 bg-white/55 px-5 py-16 text-center sm:py-20">
          <div className="text-6xl">💭</div>
          <p className="mt-5 font-cute text-xl font-extrabold text-text-warm">还没有留下第一条灵感</p>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-text-light">不用等到想完整再开始。哪怕只有一句话，也可以先存下来。</p>
          <Link href="/creative/new" className="mt-6 inline-flex rounded-pill bg-coral/10 px-5 py-2.5 text-sm font-bold text-coral-dark hover:bg-coral/15">写第一条 ✨</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {entries.map((entry, index) => (
            <article key={entry.id} className="group relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-[0_12px_35px_rgba(92,75,81,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(92,75,81,0.10)] sm:p-6">
              <div className="absolute right-5 top-4 font-cute text-5xl font-extrabold text-coral/5">{String(index + 1).padStart(2, "0")}</div>
              <Link href={`/creative?id=${entry.id}`} className="relative block min-h-[130px] pr-10">
                <div className="mb-3 text-[10px] font-extrabold tracking-[0.16em] text-text-light">IDEA NOTE</div>
                <h2 className="font-cute text-xl font-extrabold text-text-warm transition-colors group-hover:text-coral-dark">{entry.title}</h2>
                <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm font-medium leading-6 text-text-soft">{entry.content}</p>
              </Link>
              <div className="relative mt-5 flex items-center justify-between border-t border-coral/8 pt-4">
                <span className="text-[11px] font-bold text-text-light">更新于 {new Date(entry.updatedAt).toLocaleDateString("zh-CN")}</span>
                <div className="flex gap-1">
                  <Link href={`/creative?edit=${entry.id}`} className="rounded-pill px-3 py-1.5 text-xs font-bold text-text-light hover:bg-coral/5 hover:text-coral-dark">编辑</Link>
                  <button onClick={() => handleDelete(entry.id)} className="rounded-pill px-3 py-1.5 text-xs font-bold text-text-light hover:bg-red-50 hover:text-red-400">删除</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CreativeDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [entry, setEntry] = useState<CreativeEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.getCreativeEntry(id).then((data) => {
      setEntry(data);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    if (!confirm("确定删除吗？")) return;
    await store.deleteCreativeEntry(id);
    router.push("/creative");
  }

  if (loading) return <div className="mx-auto max-w-3xl animate-pulse space-y-4"><div className="h-8 w-1/2 rounded-full bg-coral/10" /></div>;
  if (!entry) return <div className="py-24 text-center"><p className="text-text-soft">创作不存在</p><Link href="/creative" className="mt-3 inline-block font-bold text-coral">返回创作角</Link></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <div className="rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-[0_18px_60px_rgba(92,75,81,0.08)] backdrop-blur-xl sm:p-7">
        <Link href="/creative" className="mb-5 inline-flex text-xs font-bold text-text-light hover:text-coral-dark">← 返回创作角</Link>
        <div className="text-[10px] font-extrabold tracking-[0.18em] text-purple-500">IDEA NOTE</div>
        <h1 className="mt-2 font-cute text-3xl font-extrabold leading-tight text-text-warm sm:text-4xl">{entry.title}</h1>
        <p className="mt-3 text-xs font-bold text-text-light">最后更新 · {new Date(entry.updatedAt).toLocaleDateString("zh-CN")}</p>
      </div>

      <article className="rounded-[2rem] border border-white/90 bg-[#fffdfb] p-6 shadow-[0_16px_45px_rgba(92,75,81,0.06)] sm:p-8">
        <p className="whitespace-pre-wrap text-[15px] font-medium leading-8 text-text-soft">{entry.content}</p>
      </article>

      <div className="flex flex-wrap gap-2 rounded-[1.6rem] border border-white/90 bg-white/80 p-3 shadow-sm">
        <Link href={`/creative?edit=${entry.id}`} className="rounded-pill bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-coral-dark">✏️ 编辑</Link>
        <button onClick={handleDelete} className="rounded-pill bg-red-50 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-100">🗑️ 删除</button>
        <Link href="/creative" className="rounded-pill px-5 py-2.5 text-sm font-bold text-text-light hover:bg-coral/5 hover:text-text-warm">返回列表</Link>
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
    store.getCreativeEntry(editId).then((data) => {
      if (data) {
        setTitle(data.title);
        setContent(data.content);
      }
      setLoading(false);
    });
  }, [editId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await store.updateCreativeEntry(editId, { title, content });
    router.push(`/creative?id=${editId}`);
  }

  if (loading) return <div className="mx-auto max-w-3xl animate-pulse"><div className="h-8 w-1/3 rounded-full bg-coral/10" /></div>;

  const inputClass = "w-full rounded-[1.15rem] border border-coral/15 bg-[#fffdfc] px-4 py-3 text-sm text-text-warm outline-none focus:border-coral/50 focus:bg-white focus:ring-4 focus:ring-coral/10";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-[2rem] border border-white/90 bg-white/85 p-5 shadow-[0_18px_60px_rgba(92,75,81,0.08)] sm:p-7">
        <button onClick={() => router.back()} className="mb-4 text-xs font-bold text-text-light hover:text-coral-dark">← 返回</button>
        <div className="text-[10px] font-extrabold tracking-[0.18em] text-purple-500">EDIT IDEA</div>
        <h1 className="mt-2 font-cute text-3xl font-extrabold text-text-warm">编辑创作</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-[0_16px_50px_rgba(92,75,81,0.06)] sm:p-7">
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-extrabold tracking-wide text-text-soft">标题 *</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-extrabold tracking-wide text-text-soft">正文 *</label>
              <span className="text-[10px] font-bold text-text-light">{content.length} 字</span>
            </div>
            <textarea className={`${inputClass} min-h-[360px] resize-y leading-7`} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-coral/10 pt-5">
          <button type="button" onClick={() => router.back()} className="rounded-pill px-5 py-3 text-sm font-bold text-text-soft hover:bg-coral/5">取消</button>
          <button type="submit" disabled={saving} className="rounded-pill bg-coral px-7 py-3 text-sm font-bold text-white shadow-lg shadow-coral/20 hover:bg-coral-dark disabled:opacity-50">{saving ? "保存中..." : "💾 保存修改"}</button>
        </div>
      </form>
    </div>
  );
}

export default function CreativePage() {
  return <Suspense fallback={<div className="py-24 text-center text-text-light">加载中...</div>}><CreativeContent /></Suspense>;
}
