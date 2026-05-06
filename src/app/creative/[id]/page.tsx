"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface CreativeEntry {
  id: number; title: string; content: string; updatedAt: string;
}

export default function CreativeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<CreativeEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/creative/${id}`).then(r => r.json()).then(data => { setEntry(data); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!confirm("确定删除这条创作吗？")) return;
    setDeleting(true);
    await fetch(`/api/creative/${id}`, { method: "DELETE" });
    router.push("/creative"); router.refresh();
  }

  if (loading) return <div className="max-w-2xl mx-auto animate-pulse space-y-4"><div className="h-7 bg-coral/10 rounded-full w-1/2" /><div className="h-40 bg-coral/5 rounded-[2rem]" /></div>;

  if (!entry) return (
    <div className="text-center py-24">
      <p className="text-text-soft text-lg font-cute font-bold">创作不存在</p>
      <Link href="/creative" className="text-coral hover:text-coral-dark mt-3 inline-block font-bold transition-colors">返回创作角</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-cute text-2xl font-extrabold text-text-warm leading-snug">✨ {entry.title}</h1>
        <p className="text-xs text-text-light/60 mt-2 font-bold">{new Date(entry.updatedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <div className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-6">
        <p className="text-text-soft leading-relaxed whitespace-pre-wrap">{entry.content}</p>
      </div>
      <div className="flex gap-3 pt-6 border-t-2 border-coral/10">
        <Link href={`/creative/${entry.id}/edit`} className="px-5 py-2.5 bg-coral text-white rounded-pill text-sm font-bold hover:bg-coral-dark transition-all shadow-md shadow-coral/15">✏️ 编辑</Link>
        <button onClick={handleDelete} disabled={deleting} className="px-5 py-2.5 bg-red-50 text-red-400 rounded-pill text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-50">🗑️ {deleting ? "删除中..." : "删除"}</button>
        <Link href="/creative" className="px-5 py-2.5 text-text-light hover:text-text-warm text-sm font-bold transition-colors">← 返回列表</Link>
      </div>
    </div>
  );
}
