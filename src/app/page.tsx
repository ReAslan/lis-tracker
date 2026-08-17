"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WorkCard from "@/components/WorkCard";
import StatusTabs from "@/components/StatusTabs";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

const EMOJIS = ["🍑", "🍒", "🍓", "🍊", "🍋", "🍇", "🥝", "🫐", "🌸", "⭐", "🐱", "🐰", "🐻", "🦊", "🐼"];

export default function HomePage() {
  const { currentReader, loading: readerLoading, configured } = useReader();
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

  if (readerLoading) {
    return <LoadingGrid />;
  }

  if (!configured) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white rounded-[2rem] border-2 border-amber-100 p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">🛠️</div>
        <h1 className="font-cute text-xl font-extrabold text-text-warm">国内数据服务还差最后一步配置</h1>
        <p className="text-sm text-text-soft mt-3 leading-relaxed">
          GitHub Pages 需要设置公开变量 <b>NEXT_PUBLIC_LIS_API_URL</b>，指向 CloudBase HTTP 云函数地址。
        </p>
      </div>
    );
  }

  if (!currentReader) {
    return <AuthCard />;
  }

  if (loading) return <LoadingGrid />;

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-20 bg-white rounded-[2rem] border-2 border-red-100 p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="font-cute text-xl font-extrabold text-text-warm">数据服务暂时不可用</h1>
        <p className="text-sm text-red-500 mt-3 break-words">{error}</p>
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
          <Link href="/add" className="inline-block mt-8 px-8 py-3.5 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark transition-all shadow-lg shadow-coral/20 hover:shadow-coral/30 hover:scale-105">✨ 添加第一部作品</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {works.map(work => <WorkCard key={work.id} work={work} />)}
        </div>
      )}
    </div>
  );
}

function AuthCard() {
  const { login, register } = useReader();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [emoji, setEmoji] = useState("🍑");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const cleanName = name.trim();
    if (!cleanName) return setError("请输入名字");
    if (!/^\d{6}$/.test(pin)) return setError("PIN 必须是 6 位数字");
    if (mode === "register" && pin !== confirmPin) return setError("两次输入的 PIN 不一致");

    setSubmitting(true);
    try {
      if (mode === "login") await login(cleanName, pin);
      else await register(cleanName, pin, emoji);
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="bg-white rounded-[2rem] border-2 border-coral/10 shadow-sm p-7 sm:p-8 space-y-6">
        <div className="text-center">
          <div className="text-6xl animate-float">🍑</div>
          <h1 className="font-cute text-2xl font-extrabold text-text-warm mt-4">欢迎来到 Li&apos;s 李子</h1>
          <p className="text-text-soft text-sm mt-2">每个人都有自己的私人书架</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-coral/5 rounded-pill p-1">
          <button onClick={() => { setMode("login"); setError(""); }} className={`py-2 rounded-pill text-sm font-bold transition-all ${mode === "login" ? "bg-white text-coral-dark shadow-sm" : "text-text-soft"}`}>登录</button>
          <button onClick={() => { setMode("register"); setError(""); }} className={`py-2 rounded-pill text-sm font-bold transition-all ${mode === "register" ? "bg-white text-coral-dark shadow-sm" : "text-text-soft"}`}>第一次使用 / 注册</button>
        </div>

        {mode === "register" && (
          <div>
            <p className="text-xs font-bold text-text-light mb-2">选择头像</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(item => (
                <button key={item} onClick={() => setEmoji(item)} className={`w-10 h-10 rounded-2xl text-xl transition-all ${emoji === item ? "bg-coral/20 ring-2 ring-coral/30 scale-110" : "bg-coral/5 hover:bg-coral/10"}`}>{item}</button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} maxLength={20} placeholder="你的名字，例如：小李" className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm outline-none focus:ring-4 focus:ring-coral/10 focus:border-coral" />
          <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" type="password" placeholder="6 位数字 PIN" className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm outline-none focus:ring-4 focus:ring-coral/10 focus:border-coral" onKeyDown={e => { if (e.key === "Enter" && mode === "login") submit(); }} />
          {mode === "register" && (
            <input value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" type="password" placeholder="再次输入 PIN" className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm outline-none focus:ring-4 focus:ring-coral/10 focus:border-coral" onKeyDown={e => { if (e.key === "Enter") submit(); }} />
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-xs font-bold text-red-500">❌ {error}</div>}

        <button onClick={submit} disabled={submitting} className="w-full px-6 py-3.5 bg-coral text-white rounded-pill font-bold text-sm hover:bg-coral-dark disabled:opacity-40 transition-all shadow-lg shadow-coral/15">
          {submitting ? "⏳ 请稍候..." : mode === "login" ? "登录我的书架" : "创建我的书架"}
        </button>

        <p className="text-[11px] text-text-light leading-relaxed text-center">
          PIN 只用于这个小站登录。连续输错 5 次会暂时锁定 10 分钟。
        </p>
      </div>
    </div>
  );
}

function LoadingGrid() {
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
