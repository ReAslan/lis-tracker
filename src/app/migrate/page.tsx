"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReader } from "@/context/ReaderContext";
import {
  clearLegacyCredentials,
  hasLegacyGistCredentials,
  importLegacyReader,
  loadLegacyReaders,
  type LegacyReaderSummary,
} from "@/lib/legacyMigration";

export default function LegacyMigrationPage() {
  const router = useRouter();
  const { login } = useReader();
  const [readers, setReaders] = useState<LegacyReaderSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const hasLegacy = hasLegacyGistCredentials();
  const selected = readers.find(item => item.reader.id === selectedId);

  async function handleLoad() {
    setLoading(true);
    setError("");
    try {
      const result = await loadLegacyReaders();
      setReaders(result);
      setLoaded(true);
      const firstPending = result.find(item => !item.alreadyImported);
      setSelectedId(firstPending?.reader.id || result[0]?.reader.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取旧版数据失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleMigrate() {
    if (!selected) return setError("请选择要迁移的旧版读者");
    if (!/^\d{6}$/.test(pin)) return setError("请输入新的 6 位数字 PIN");
    if (pin !== confirmPin) return setError("两次输入的 PIN 不一致");

    setMigrating(true);
    setError("");
    try {
      try {
        await importLegacyReader(selected.reader.id, pin, false);
      } catch (err) {
        if (err instanceof Error && err.message === "本机已经存在同名书架") {
          const overwrite = window.confirm(
            `本机已经存在「${selected.reader.name}」的加密书架。是否用旧 Gist 数据覆盖本机版本？`,
          );
          if (!overwrite) throw err;
          await importLegacyReader(selected.reader.id, pin, true);
        } else {
          throw err;
        }
      }

      await login(selected.reader.name, pin);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "迁移失败，请重试");
    } finally {
      setMigrating(false);
    }
  }

  function handleForgetLegacy() {
    const ok = window.confirm(
      "确定清除这台浏览器保存的旧版 GitHub Token 和 Gist ID 吗？这不会删除远端 Gist，但清除后将无法继续自动迁移未迁移的旧版读者。",
    );
    if (!ok) return;
    clearLegacyCredentials();
    setReaders([]);
    setLoaded(false);
    setSelectedId("");
    setError("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-pill border border-white bg-white/80 px-3 py-1 text-[11px] font-extrabold tracking-[0.14em] text-coral-dark shadow-sm">
            ONE-TIME MIGRATION
          </div>
          <h1 className="mt-3 font-cute text-3xl font-black text-text-warm">📦 从旧版 Gist 搬家</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-text-soft">
            只读取旧版 Gist，把每个读者的数据重新加密保存到当前浏览器。旧 Gist 不会被修改或删除。
          </p>
        </div>
        <Link href="/" className="shrink-0 rounded-pill bg-white/80 px-4 py-2 text-sm font-bold text-text-soft shadow-sm ring-1 ring-coral/10 hover:text-coral-dark">
          ← 返回
        </Link>
      </div>

      {!hasLegacy ? (
        <div className="rounded-[2rem] border border-white bg-white/80 p-7 shadow-sm sm:p-9">
          <div className="text-4xl">🔎</div>
          <h2 className="mt-4 font-cute text-xl font-black text-text-warm">这台浏览器没有发现旧版登录信息</h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-text-soft">
            自动迁移依赖旧版网站以前保存在同一浏览器、同一网站域名下的 Gist ID 和 GitHub Token。请在你原来使用旧版 Li&apos;s 李子的浏览器中打开正式 GitHub Pages 网站后再迁移。
          </p>
          <div className="mt-5 rounded-[1.3rem] bg-peach/60 px-4 py-3 text-xs font-semibold leading-6 text-text-soft">
            Vercel 预览地址和 GitHub Pages 属于不同网站来源，因此预览页看不到正式站点原来的 localStorage，这是正常现象。
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-cute text-xl font-black text-text-warm">① 读取旧版书架</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-text-light">只发起 GET 请求，不会写回或删除 Gist。</p>
              </div>
              <button
                type="button"
                onClick={handleLoad}
                disabled={loading}
                className="rounded-pill bg-[#24292f] px-5 py-3 text-sm font-extrabold text-white shadow-md hover:-translate-y-0.5 hover:bg-black disabled:opacity-50"
              >
                {loading ? "正在读取..." : loaded ? "重新读取" : "读取旧版数据"}
              </button>
            </div>
          </div>

          {loaded && (
            <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-sm sm:p-8">
              <h2 className="font-cute text-xl font-black text-text-warm">② 选择一个读者</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-text-light">每个旧版读者会变成一个独立的本地加密书架。</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {readers.map(item => {
                  const active = selectedId === item.reader.id;
                  return (
                    <button
                      key={item.reader.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.reader.id);
                        setPin("");
                        setConfirmPin("");
                        setError("");
                      }}
                      className={`rounded-[1.5rem] border-2 p-4 text-left transition-all ${
                        active ? "border-coral/40 bg-coral/[0.07] shadow-sm" : "border-coral/10 bg-white hover:border-coral/25"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-peach text-2xl">{item.reader.emoji || "🍑"}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-extrabold text-text-warm">{item.reader.name}</p>
                            {item.alreadyImported && <span className="rounded-pill bg-mint/45 px-2 py-0.5 text-[10px] font-extrabold text-text-soft">已迁移</span>}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-text-light">📚 {item.worksCount} 部作品 · 💡 {item.creativeCount} 条创作</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selected && (
            <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-sm sm:p-8">
              <h2 className="font-cute text-xl font-black text-text-warm">③ 给「{selected.reader.name}」设置新 PIN</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-text-light">这个 PIN 只用于新版本的本地加密书架，不会写回 GitHub。</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={pin}
                  onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="新的 6 位 PIN"
                  className="rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm outline-none focus:border-coral focus:ring-4 focus:ring-coral/10"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={confirmPin}
                  onChange={event => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="再次输入 PIN"
                  className="rounded-[1.25rem] border-2 border-coral/15 bg-white px-4 py-3 text-sm text-text-warm outline-none focus:border-coral focus:ring-4 focus:ring-coral/10"
                />
              </div>

              {error && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold leading-5 text-red-500">❌ {error}</div>}

              <button
                type="button"
                onClick={handleMigrate}
                disabled={migrating}
                className="mt-5 w-full rounded-[1.25rem] bg-coral px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-coral/15 hover:-translate-y-0.5 hover:bg-coral-dark disabled:opacity-50"
              >
                {migrating ? "⏳ 正在迁移..." : selected.alreadyImported ? "重新迁移并打开书架" : "迁移并打开书架"}
              </button>
            </div>
          )}

          <div className="rounded-[1.7rem] border border-amber-100 bg-amber-50/75 p-5">
            <p className="text-xs font-bold leading-6 text-amber-700">
              🔐 为了能继续迁移其他旧版读者，旧 Token 会暂时保留在这台浏览器里；当所有旧版读者都已迁移后会自动清除。你也可以确认不再需要迁移后手动清除。
            </p>
            <button type="button" onClick={handleForgetLegacy} className="mt-3 text-xs font-extrabold text-amber-700 underline underline-offset-4 hover:text-amber-800">
              我已完成迁移，立即清除旧版凭据
            </button>
          </div>
        </>
      )}
    </div>
  );
}
