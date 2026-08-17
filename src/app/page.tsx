"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WorkCard from "@/components/WorkCard";
import StatusTabs from "@/components/StatusTabs";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

const EMOJIS = ["🍑", "🍒", "🍓", "🍊", "🍋", "🍇", "🥝", "🫐", "🌸", "⭐", "🐱", "🐰", "🐻", "🦊", "🐼"];
const MAX_BACKUP_BYTES = 10_000_000;

type AuthMode = "login" | "register" | "import";

export default function HomePage() {
  const { currentReader, configured, loading: readerLoading } = useReader();
  const [works, setWorks] = useState<Work[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!currentReader) {
      setWorks([]);
      setLoading(false);
      setLoadError("");
      return;
    }
    setLoading(true);
    setLoadError("");
    store.getWorks(currentReader.id, activeTab || undefined)
      .then(data => setWorks(data))
      .catch(err => setLoadError(err instanceof Error ? err.message : "读取作品库失败"))
      .finally(() => setLoading(false));
  }, [activeTab, currentReader]);

  if (readerLoading) return <LoadingGrid />;

  if (!configured) {
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-[2rem] border border-white bg-white/85 p-8 text-center shadow-lg">
        <div className="text-5xl">🌧️</div>
        <h1 className="mt-4 font-cute text-2xl font-black text-text-warm">这个浏览器暂时打不开书架</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-soft">
          请换用最新版 Chrome、Edge、Safari 或 Firefox，并使用普通浏览模式重新打开。
        </p>
      </div>
    );
  }

  if (!currentReader) return <LocalAuthLanding />;
  if (loading) return <LoadingGrid />;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[2.25rem] border border-white/90 bg-white/75 p-5 shadow-[0_18px_55px_rgba(92,75,81,0.07)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill bg-coral/8 px-3 py-1 text-[11px] font-extrabold tracking-[0.14em] text-coral-dark">
              MY STORY SHELF
            </div>
            <h1 className="mt-3 flex items-center gap-3 font-cute text-3xl font-extrabold text-text-warm sm:text-4xl">
              <span className="inline-block animate-float">{currentReader.emoji}</span>
              {currentReader.name}的作品库
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-text-light">把喜欢过、追过、想反复翻看的故事，都慢慢留在这里。</p>
          </div>
          <Link
            href="/add"
            className="inline-flex self-start items-center gap-2 rounded-pill bg-coral px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-coral/20 transition-all hover:-translate-y-0.5 hover:bg-coral-dark sm:self-auto"
          >
            <span>＋</span> 添加作品
          </Link>
        </div>
      </div>

      <StatusTabs active={activeTab} onChange={setActiveTab} />

      {loadError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold leading-6 text-red-500">
          ❌ {loadError}
        </div>
      )}

      {works.length === 0 ? (
        <div className="rounded-[2.5rem] border border-white bg-white/55 py-24 text-center shadow-sm">
          <div className="inline-block animate-float text-7xl">📚</div>
          <p className="mt-6 font-cute text-xl font-bold text-text-soft">从第一部喜欢的作品开始吧</p>
          <p className="mt-2 text-sm font-semibold text-text-light">一本小说、一部漫画、一场追番，都可以成为书架的第一格。</p>
          <Link href="/add" className="mt-8 inline-block rounded-pill bg-coral px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/20 transition-all hover:scale-105 hover:bg-coral-dark hover:shadow-coral/30">✨ 添加第一部作品</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {works.map(work => <WorkCard key={work.id} work={work} />)}
        </div>
      )}
    </div>
  );
}

function LocalAuthLanding() {
  const { login, register, importBackup } = useReader();
  const [mode, setMode] = useState<AuthMode>("register");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [emoji, setEmoji] = useState("🍑");
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setPin("");
    setConfirmPin("");
  };

  const submitLoginOrRegister = async () => {
    setError("");
    const cleanName = name.trim();
    if (!cleanName) return setError("请输入昵称");
    if (!/^\d{6}$/.test(pin)) return setError("PIN 必须是 6 位数字");
    if (mode === "register" && pin !== confirmPin) return setError("两次输入的 PIN 不一致");

    setSubmitting(true);
    try {
      if (mode === "register") await register(cleanName, pin, emoji);
      else await login(cleanName, pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const submitImport = async () => {
    setError("");
    if (!backupFile) return setError("请选择备份文件");
    if (backupFile.size > MAX_BACKUP_BYTES) return setError("备份文件超过 10 MB，已停止读取以保护浏览器内存");
    if (!/^\d{6}$/.test(pin)) return setError("请输入备份对应的 6 位 PIN");

    setSubmitting(true);
    try {
      const text = await backupFile.text();
      try {
        await importBackup(text, pin, false);
      } catch (err) {
        if (err instanceof Error && err.message === "本机已经存在同名书架") {
          const overwrite = window.confirm("本机已有同名书架。是否用这个备份覆盖本机版本？");
          if (!overwrite) throw err;
          await importBackup(text, pin, true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "恢复失败，请检查备份文件和 PIN");
    } finally {
      setSubmitting(false);
    }
  };

  const featureItems = [
    { icon: "📚", title: "收藏作品", text: "小说、漫画、动漫慢慢归档" },
    { icon: "💗", title: "记住心动", text: "评分、片段和 CP 都有位置" },
    { icon: "💡", title: "留下灵感", text: "脑洞和创作随手记下来" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-8rem)] py-7 sm:py-12 lg:flex lg:items-center lg:py-16">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-5%] top-24 h-72 w-72 rounded-full bg-mint/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-[38%] h-56 w-56 rounded-full bg-lavender/20 blur-3xl" />

      <div className="relative grid w-full items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <section className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill border border-white/90 bg-white/70 px-4 py-2 text-[11px] font-black tracking-[0.18em] text-coral-dark shadow-sm backdrop-blur">
            <span className="text-base">🍑</span>
            LI&apos;S · STORY SHELF
          </div>

          <h1 className="mt-6 font-cute text-[2.8rem] font-black leading-[1.1] tracking-tight text-text-warm sm:text-6xl lg:text-[4.2rem]">
            把喜欢的故事，
            <span className="relative mt-1 inline-block text-coral-dark">
              留在这里。
              <span className="absolute -bottom-1 left-1 right-1 -z-10 h-4 rounded-full bg-coral/10" />
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-text-soft sm:text-lg">
            小说、漫画、动漫，还有突然冒出来的灵感。给每一份心动留一个位置，慢慢长成属于自己的小小作品库。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {featureItems.map(item => (
              <div key={item.title} className="group rounded-[1.6rem] border border-white/90 bg-white/65 p-4 shadow-[0_12px_35px_rgba(92,75,81,0.05)] backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white/85 hover:shadow-[0_18px_45px_rgba(92,75,81,0.08)]">
                <div className="text-2xl transition-transform group-hover:scale-110">{item.icon}</div>
                <p className="mt-2 text-sm font-extrabold text-text-warm">{item.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-text-light">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-bold text-text-light">
            {['小说', '漫画', '动漫', 'CP', '灵感', '名场面'].map(item => (
              <span key={item} className="rounded-pill border border-white bg-white/55 px-3 py-1.5 shadow-sm">{item}</span>
            ))}
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[470px]">
          <div className="absolute -left-7 -top-7 hidden rotate-[-8deg] rounded-[1.4rem] border border-white bg-white/75 px-4 py-3 shadow-lg backdrop-blur sm:block">
            <div className="text-xl">📖</div>
            <p className="mt-1 text-[10px] font-extrabold text-text-light">下一页见</p>
          </div>
          <div className="absolute -bottom-6 -right-5 hidden rotate-[7deg] rounded-[1.4rem] border border-white bg-peach/80 px-4 py-3 shadow-lg sm:block">
            <div className="text-xl">✨</div>
            <p className="mt-1 text-[10px] font-extrabold text-text-soft">今日也有好故事</p>
          </div>

          <div className="glass-q overflow-hidden rounded-[2.4rem] border border-white p-2 shadow-[0_28px_80px_rgba(92,75,81,0.13)]">
            <div className="rounded-[2rem] bg-white/92 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-coral-dark">WELCOME HOME</p>
                  <h2 className="mt-2 font-cute text-2xl font-black text-text-warm">今天想从哪一页继续？</h2>
                  <p className="mt-1.5 text-xs font-semibold leading-5 text-text-light">打开自己的书架，或者从一个全新的昵称开始。</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-peach text-2xl shadow-inner">🍑</div>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-1 rounded-[1.3rem] bg-coral/5 p-1">
                <ModeButton active={mode === "login"} onClick={() => selectMode("login")}>回到书架</ModeButton>
                <ModeButton active={mode === "register"} onClick={() => selectMode("register")}>新建书架</ModeButton>
                <ModeButton active={mode === "import"} onClick={() => selectMode("import")}>恢复备份</ModeButton>
              </div>

              {mode === "register" && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold text-text-light">先选一个喜欢的头像</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setEmoji(item)}
                        aria-label={`选择头像 ${item}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl transition-all ${emoji === item ? "scale-110 bg-coral/20 ring-2 ring-coral/30" : "bg-coral/5 hover:bg-coral/10"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "import" ? (
                <div className="mt-5 space-y-4">
                  <label className="block cursor-pointer rounded-[1.4rem] border-2 border-dashed border-coral/20 bg-coral/[0.035] p-5 text-center transition-colors hover:border-coral/35 hover:bg-coral/[0.06]">
                    <span className="block text-3xl">📦</span>
                    <span className="mt-2 block text-sm font-extrabold text-text-warm">
                      {backupFile ? backupFile.name : "选择 .json 备份文件"}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-text-light">选择之前导出的书架备份 · 最大 10 MB</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0] || null;
                        setBackupFile(file);
                        setError(file && file.size > MAX_BACKUP_BYTES ? "备份文件超过 10 MB，无法导入" : "");
                      }}
                    />
                  </label>
                  <PinInput value={pin} onChange={setPin} placeholder="备份对应的 6 位 PIN" onEnter={submitImport} />
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <input
                    value={name}
                    onChange={event => setName(event.target.value)}
                    maxLength={24}
                    autoComplete="username"
                    placeholder="昵称，例如：小李"
                    className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-[#fffdfc] px-4 py-3 text-sm text-text-warm outline-none transition-all placeholder:text-text-light/60 focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10"
                  />
                  <PinInput value={pin} onChange={setPin} placeholder="6 位数字 PIN" onEnter={mode === "login" ? submitLoginOrRegister : undefined} />
                  {mode === "register" && (
                    <PinInput value={confirmPin} onChange={setConfirmPin} placeholder="再次输入 PIN" onEnter={submitLoginOrRegister} />
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold leading-5 text-red-500">❌ {error}</div>
              )}

              <button
                type="button"
                onClick={mode === "import" ? submitImport : submitLoginOrRegister}
                disabled={submitting}
                className="mt-5 w-full rounded-[1.25rem] bg-coral px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-coral/15 transition-all hover:-translate-y-0.5 hover:bg-coral-dark disabled:opacity-50"
              >
                {submitting ? "⏳ 正在处理..." : mode === "login" ? "打开我的书架" : mode === "register" ? "创建我的书架" : "恢复我的书架"}
              </button>

              <p className="mt-5 text-center text-[11px] font-semibold leading-5 text-text-light">
                请记住自己的昵称和 PIN；需要换设备时，可以先在书架里导出备份。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1rem] px-2 py-2.5 text-[11px] font-extrabold transition-all sm:text-xs ${active ? "bg-white text-coral-dark shadow-sm" : "text-text-light hover:text-text-soft"}`}
    >
      {children}
    </button>
  );
}

function PinInput({ value, onChange, placeholder, onEnter }: { value: string; onChange: (value: string) => void; placeholder: string; onEnter?: () => void }) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDown={event => { if (event.key === "Enter" && onEnter) onEnter(); }}
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="current-password"
      type="password"
      placeholder={placeholder}
      className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-[#fffdfc] px-4 py-3 text-sm tracking-[0.28em] text-text-warm outline-none transition-all placeholder:tracking-normal placeholder:text-text-light/60 focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10"
    />
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-[2rem] bg-white">
          <div className="aspect-[3/4] bg-coral/8" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 rounded-full bg-coral/10" />
            <div className="h-3 w-1/2 rounded-full bg-coral/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
