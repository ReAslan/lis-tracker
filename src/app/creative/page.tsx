"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";

interface CreativeEntry {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
}

export default function CreativeListPage() {
  const { currentReader } = useReader();
  const [entries, setEntries] = useState<CreativeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function fetchEntries() {
    if (!currentReader) return;
    setLoading(true);
    fetch(`/api/creative?readerId=${currentReader.id}`)
      .then(r => r.json())
      .then(data => { setEntries(data); setLoading(false); });
  }

  useEffect(() => { fetchEntries(); }, [currentReader]);

  async function handleDelete(id: number) {
    if (!confirm("确定删除这条创作吗？")) return;
    await fetch(`/api/creative/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  if (!currentReader) return null;

  const inputClass = "w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm placeholder:text-text-light/50 focus:ring-4 focus:ring-coral/15 focus:border-coral outline-none transition-all";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cute text-3xl font-extrabold text-text-warm flex items-center gap-3">
            <span className="animate-float inline-block">{currentReader.emoji}</span> 创作角
          </h1>
          <p className="text-text-light mt-2 text-sm font-bold">灵感脑洞、CP 重组、代餐小剧场... 💡</p>
        </div>
        <Link href="/creative/new" className="px-5 py-3 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark transition-all shadow-lg shadow-coral/15 hover:scale-105">
          ✨ 新建创作
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border-2 border-coral/10 p-6 animate-pulse">
              <div className="h-5 bg-coral/10 rounded-full w-1/3 mb-3" />
              <div className="h-4 bg-coral/5 rounded-full w-full mb-2" />
              <div className="h-4 bg-coral/5 rounded-full w-2/3" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl animate-float inline-block">💡</div>
          <p className="text-text-soft text-lg mt-6 font-cute font-bold">创作角还是空的~</p>
          <p className="text-text-light text-sm mt-1">灵感来了就记下来吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="group bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm hover:shadow-lg hover:border-coral/20 p-6 transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <Link href={`/creative/${entry.id}`} className="flex-1 min-w-0">
                  <h3 className="font-cute font-bold text-text-warm group-hover:text-coral transition-colors text-lg">✨ {entry.title}</h3>
                  <p className="text-text-soft text-sm mt-2 line-clamp-2 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                  <p className="text-xs text-text-light/60 mt-3 font-bold">{new Date(entry.updatedAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </Link>
                <div className="flex gap-1 flex-shrink-0">
                  <Link href={`/creative/${entry.id}/edit`} className="px-3 py-1.5 text-xs font-bold text-text-light hover:text-coral hover:bg-coral/5 rounded-pill transition-colors">编辑</Link>
                  <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 text-xs font-bold text-text-light hover:text-red-400 hover:bg-red-50 rounded-pill transition-colors">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
