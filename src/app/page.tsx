"use client";

import { useEffect, useState } from "react";
import WorkCard from "@/components/WorkCard";
import StatusTabs from "@/components/StatusTabs";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

export default function HomePage() {
  const { currentReader, loading: readerLoading } = useReader();
  const [works, setWorks] = useState<Work[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentReader) {
      setWorks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    store.getWorks(currentReader.id, activeTab || undefined)
      .then(data => {
        setWorks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "读取数据失败");
        setLoading(false);
      });
  }, [activeTab, currentReader]);

  if (readerLoading || loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[2rem] overflow-hidden animate-pulse">
            <div className="aspect-[3/4] bg-coral/8" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-coral/10 rounded-full w-3/4" />
              <div className="h-3 bg-coral/5 rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-20 bg-white rounded-[2rem] border-2 border-red-100 p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-cute text-xl font-extrabold text-text-warm">数据服务暂时不可用</h1>
        <p className="text-sm text-red-500 mt-3 break-words">{error}</p>
        <p className="text-xs text-text-light mt-3">请联系站点管理员检查服务端 GitHub 存储配置。</p>
      </div>
    );
  }

  if (!currentReader) {
    return (
      <div className="text-center py-32">
        <div className="text-7xl animate-float inline-block">🍑</div>
        <p className="text-text-soft text-lg mt-6 font-cute font-bold">欢迎来到 Li&apos;s 李子</p>
        <p className="text-text-light text-sm mt-2">点击右上角“选择用户”，输入名字即可开始使用</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cute text-3xl font-extrabold text-text-warm flex items-center gap-3">
          <span className="animate-float inline-block">{currentReader.emoji}</span>
          {currentReader.name}的作品库
        </h1>
        <p className="text-text-light mt-2 text-sm font-bold">记录每一部心动作品 ✨</p>
      </div>

      <StatusTabs active={activeTab} onChange={setActiveTab} />

      {works.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-7xl animate-float inline-block">📚</div>
          <p className="text-text-soft text-lg mt-6 font-cute font-bold">书架还是空的呢~</p>
          <a href="/add" className="inline-block mt-8 px-8 py-3.5 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark transition-all shadow-lg shadow-coral/20 hover:shadow-coral/30 hover:scale-105">✨ 添加第一部作品</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {works.map(work => <WorkCard key={work.id} work={work} />)}
        </div>
      )}
    </div>
  );
}
