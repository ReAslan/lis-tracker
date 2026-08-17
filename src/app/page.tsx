"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WorkCard from "@/components/WorkCard";
import StatusTabs from "@/components/StatusTabs";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

const EMOJIS = ["🍑", "🍒", "🍓", "🍊", "🍋", "🍇", "🥝", "🫐", "🌸", "⭐", "🐱", "🐰", "🐻", "🦊", "🐼"];

type AuthMode = "login" | "register" | "import";

export default function HomePage() {
  const { currentReader, configured, loading: readerLoading } = useReader();
  const [works, setWorks] = useState<Work[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentReader) {
      setWorks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    store.getWorks(currentReader.id, activeTab || undefined)
      .then(data => setWorks(data))
      .finally(() => setLoading(false));
  }, [activeTab, currentReader]);

  if (readerLoading) return <LoadingGrid />;

  if (!configured) {
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-[2rem] border border-white bg-white/85 p-8 text-center shadow-lg">
        <div className="text-5xl">⚠️</div>
        <h1 className="mt-4 font-cute text-2xl font-black text-text-warm">当前浏览器无法启用安全书架</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-text-soft">
          这个版本需要 HTTPS、Web Crypto 和可用的本地存储。请使用最新版 Chrome、Edge、Safari 或 Firefox，并避免无痕模式。
        </p>
      </div>
    );
  }

  if (!currentReader) return <LocalAuthLanding />;
  if (loading) return <LoadingGrid />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-pill border border-white bg-white/80 px-3 py-1 text-[11px] font-extrabold tracking-[0.14em] text-coral-dark shadow-sm">
            MY LITTLE LIBRARY
          </div>
          <h1 className="mt-3 flex items-center gap-3 font-cute text-3xl font-extrabold text-text-warm">
            <span className="inline-block animate-float">{currentReader.emoji}</span>
            {currentReader.name}的作品库
          </h1>
          <p className="mt-2 text-sm font-bold text-text-light">记录每一部心动作品 · 数据只保存在这台设备 ✨</p>
        </div>
        <Link
          href="/add"
          className="inline-flex self-start items-center gap-2 rounded-pill bg-coral px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-coral/20 hover:-translate-y-0.5 hover:bg-coral-dark sm:self-auto"
        >
          <span>＋</span> 添加作品
        </Link>
      </div>

      <StatusTabs active={activeTab} onChange={setActiveTab} />

      {works.length === 0 ? (
        <div className="rounded-[2.5rem] border border-white bg-white/55 py-24 text-center shadow-sm">
          <div className="inline-block animate-float text-7xl">📚</div>
          <p className="mt-6 font-cute text-lg font-bold text-text-soft">书架还是空的呢~</p>
          <p className="mt-2 text-sm text-text-light">从第一部让你心动的作品开始记录吧</p>
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
  const [mode, setMode] = useState<AuthMode>("login");
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
    { icon: "🫥", title: "不需要 Token", text: "朋友打开网页就能注册" },
    { icon: "🔐", title: "本机加密", text: "PIN 派生密钥后再保存" },
    { icon: "📦", title: "可以搬家", text: "导出备份后换设备恢复" },
  ];

  return (
    <div className="relative py-8 sm:py-14 lg:py-20">
      <div className="pointer-events-none absolute -top-12 left-[6%] h-36 w-36 rounded-full bg-coral/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[3%] top-32 h-44 w-44 rounded-full bg-mint/25 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill border border-coral/15 bg-white/75 px-4 py-2 text-xs font-extrabold text-coral-dark shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-coral shadow-[0_0_0_4px_rgba(255,143,171,0.12)]" />
            LOCAL · ENCRYPTED · YOURS
          </div>

          <h1 className="mt-6 font-cute text-[2.75rem] font-black leading-[1.12] tracking-tight text-text-warm sm:text-6xl">
            把喜欢的故事，
            <span className="relative inline-block text-coral-dark">
              收进自己的书架。
              <span className="absolute -bottom-2 left-1 right-1 -z-10 h-3 rounded-full bg-coral/10" />
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-text-soft sm:text-lg">
            不需要 GitHub Token，也不需要云服务器。每个人用昵称和 6 位 PIN 打开自己的本地加密书架，想换设备时再导出备份带走。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {featureItems.map(item => (
              <div key={item.title} className="rounded-[1.6rem] border border-white/90 bg-white/65 p-4 shadow-sm backdrop-blur-sm">
                <div className="text-2xl">{item.icon}</div>
                <p className="mt-2 text-sm font-extrabold text-text-warm">{item.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-text-light">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[470px]">
          <div className="glass-q overflow-hidden rounded-[2.3rem] border border-white p-2 shadow-[0_24px_70px_rgba(92,75,81,0.12)]">
            <div className="rounded-[1.9rem] bg-white/90 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black tracking-[0.18em] text-text-light">WELCOME TO</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-3xl">🍑</span>
                    <span className="font-cute text-2xl font-black text-text-warm">Li&apos;s 李子</span>
                  </div>
                </div>
                <div className="rounded-pill bg-mint/35 px-3 py-1.5 text-[11px] font-extrabold text-text-soft">本机加密</div>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-1 rounded-[1.3rem] bg-coral/5 p-1">
                <ModeButton active={mode === "login"} onClick={() => selectMode("login")}>登录</ModeButton>
                <ModeButton active={mode === "register"} onClick={() => selectMode("register")}>第一次使用</ModeButton>
                <ModeButton active={mode === "import"} onClick={() => selectMode("import")}>恢复备份</ModeButton>
              </div>

              {mode === "register" && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-bold text-text-light">选一个头像</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setEmoji(item)}
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${emoji === item ? "scale-110 bg-coral/20 ring-2 ring-coral/30" : "bg-coral/5 hover:bg-coral/10"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "import" ? (
                <div className="mt-5 space-y-4">
                  <label className="block cursor-pointer rounded-[1.4rem] border-2 border-dashed border-coral/20 bg-coral/[0.035] p-5 text-center hover:border-coral/35 hover:bg-coral/[0.06]">
                    <span className="block text-3xl">📦</span>
                    <span className="mt-2 block text-sm font-extrabold text-text-warm">
                      {backupFile ? backupFile.name : "选择 .json 备份文件"}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-text-light">备份本身仍然是加密的</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={event => setBackupFile(event.target.files?.[0] || null)}
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
                    className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm outline-none focus:border-coral focus:ring-4 focus:ring-coral/10"
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
                className="mt-5 w-full rounded-[1.25rem] bg-coral px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-coral/15 hover:-translate-y-0.5 hover:bg-coral-dark disabled:opacity-50"
              >
                {submitting ? "⏳ 正在处理..." : mode === "login" ? "打开我的书架" : mode === "register" ? "创建加密书架" : "恢复并打开书架"}
              </button>

              <div className="mt-5 rounded-[1.2rem] bg-peach/60 px-4 py-3 text-[11px] font-semibold leading-5 text-text-soft">
                💡 数据不会自动上传到云端。清理浏览器数据、卸载浏览器或更换设备前，请先在登录后点击“导出备份”。无痕模式关闭后可能会清除本地数据。
              </div>
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
      className={`rounded-[1rem] px-2 py-2.5 text-[11px] font-extrabold sm:text-xs ${active ? "bg-white text-coral-dark shadow-sm" : "text-text-light hover:text-text-soft"}`}
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
      className="w-full rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm tracking-[0.28em] text-text-warm outline-none placeholder:tracking-normal focus:border-coral focus:ring-4 focus:ring-coral/10"
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
