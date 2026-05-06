"use client";

import { useEffect, useState } from "react";
import WorkCard from "@/components/WorkCard";
import StatusTabs from "@/components/StatusTabs";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

export default function HomePage() {
  const { currentReader, configured, loading: readerLoading } = useReader();
  const [works, setWorks] = useState<Work[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentReader) return;
    setLoading(true);
    store.getWorks(currentReader.id, activeTab || undefined)
      .then(data => { setWorks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab, currentReader]);

  if (!configured) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-8 text-center space-y-6">
          <div className="text-6xl animate-float">🍑</div>
          <h1 className="font-cute text-2xl font-extrabold text-text-warm">欢迎来到 Li&apos;s 李子</h1>
          <p className="text-text-soft text-sm leading-relaxed">
            需要一个 GitHub Token 来存储数据
          </p>
          <SetupForm />
        </div>
      </div>
    );
  }

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

  if (!currentReader) {
    return (
      <div className="text-center py-32">
        <div className="text-7xl animate-float inline-block">🍑</div>
        <p className="text-text-soft text-lg mt-6 font-cute font-bold">还没有阅读人呢~</p>
        <p className="text-text-light text-sm mt-2">点击右上角 + 添加一个吧</p>
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

function SetupForm() {
  const [token, setToken] = useState("");
  const [setting, setSetting] = useState(false);
  const [error, setError] = useState("");

  async function handleSetup() {
    if (!token.trim()) return;
    setSetting(true);
    setError("");
    try {
      await store.initializeGist(token.trim());
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Token 无效，请检查后重试");
    }
    setSetting(false);
  }

  return (
    <div className="space-y-3">
      <div className="text-left">
        <p className="text-xs text-text-light mb-2">
          1. 打开{" "}
          <a href="https://github.com/settings/tokens/new?scopes=gist&description=lis-tracker" target="_blank" className="text-coral font-bold underline">
            GitHub Token 创建页
          </a>
        </p>
        <p className="text-xs text-text-light mb-2">
          2. Expiration 选 <b>No expiration</b> → 点 Generate token
        </p>
        <p className="text-xs text-text-light mb-2">
          3. 复制生成的 token（以 ghp_ 开头），粘贴到下面
        </p>
      </div>
      <input
        value={token}
        onChange={e => setToken(e.target.value)}
        placeholder="ghp_xxxxxxxxxxxx"
        className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm outline-none focus:ring-4 focus:ring-coral/15 focus:border-coral transition-all"
      />
      {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
      <button
        onClick={handleSetup}
        disabled={setting || !token.trim()}
        className="w-full px-6 py-3 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark disabled:opacity-40 transition-all shadow-lg shadow-coral/15"
      >
        {setting ? "⏳ 连接中..." : "🔗 连接 GitHub"}
      </button>
      <p className="text-[10px] text-text-light/60">
        Token 保存在浏览器本地，不会上传到任何服务器
      </p>
    </div>
  );
}
