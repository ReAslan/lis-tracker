"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReader } from "@/context/ReaderContext";

const NAV_ITEMS = [
  { href: "/", label: "作品库", emoji: "📚" },
  { href: "/add", label: "添加", emoji: "✏️" },
  { href: "/creative", label: "创作角", emoji: "💡" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { currentReader, loading, logout, exportBackup } = useReader();
  const [exporting, setExporting] = useState(false);

  const downloadBackup = async () => {
    if (!currentReader || exporting) return;
    setExporting(true);
    try {
      const content = await exportBackup();
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = currentReader.name.replace(/[\\/:*?\"<>|]/g, "_").slice(0, 30) || "reader";
      link.href = url;
      link.download = `lis-${safeName}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/80 bg-white/75 shadow-[0_8px_30px_rgba(92,75,81,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2 no-underline">
            <span className="inline-block text-2xl group-hover:animate-wiggle">🍑</span>
            <div className="leading-tight">
              <span className="block font-cute text-lg font-extrabold tracking-tight text-text-warm sm:text-xl">
                Li&apos;s 李子
              </span>
              <span className="hidden text-[10px] font-bold tracking-[0.18em] text-text-light sm:block">
                LOCAL PRIVATE SHELF
              </span>
            </div>
          </Link>

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {currentReader && (
              <div className="hidden items-center gap-1 rounded-pill bg-white p-1 shadow-sm ring-1 ring-coral/10 sm:flex">
                {NAV_ITEMS.map(item => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-pill px-3.5 py-2 text-sm font-bold transition-all ${active ? "bg-coral/15 text-coral-dark" : "text-text-soft hover:bg-coral/8 hover:text-coral-dark"}`}
                    >
                      <span className="mr-1.5">{item.emoji}</span>{item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {currentReader ? (
              <>
                <div className="flex max-w-[120px] items-center gap-2 rounded-pill bg-coral/10 px-3 py-2 text-sm font-bold text-coral-dark ring-1 ring-coral/10 sm:max-w-[150px]">
                  <span className="text-base">{currentReader.emoji}</span>
                  <span className="truncate">{currentReader.name}</span>
                </div>
                <button
                  type="button"
                  onClick={downloadBackup}
                  disabled={exporting}
                  title="导出加密备份"
                  aria-label="导出加密备份"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm shadow-sm ring-1 ring-coral/10 hover:-translate-y-0.5 hover:text-coral-dark disabled:opacity-50 sm:h-auto sm:w-auto sm:rounded-pill sm:px-3 sm:py-2"
                >
                  <span>📦</span><span className="ml-1.5 hidden text-xs font-bold sm:inline">{exporting ? "导出中" : "备份"}</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  title="锁定书架"
                  aria-label="锁定书架"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm shadow-sm ring-1 ring-coral/10 hover:-translate-y-0.5 hover:text-coral-dark sm:h-auto sm:w-auto sm:rounded-pill sm:px-3 sm:py-2"
                >
                  <span>🔒</span><span className="ml-1.5 hidden text-xs font-bold sm:inline">锁定</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/migrate"
                  className={`rounded-pill px-3 py-2 text-xs font-extrabold transition-all sm:px-4 sm:text-sm ${pathname === "/migrate" ? "bg-coral/15 text-coral-dark" : "bg-white/85 text-text-soft shadow-sm ring-1 ring-coral/10 hover:text-coral-dark"}`}
                >
                  📦 <span className="hidden sm:inline">旧版迁移</span><span className="sm:hidden">迁移</span>
                </Link>
                <div className="hidden rounded-pill bg-mint/35 px-3 py-2 text-xs font-bold text-text-soft sm:block">🔐 本地加密</div>
              </>
            )}
          </div>
        </div>
      </nav>

      {currentReader && (
        <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-around rounded-[1.6rem] border border-white/90 bg-white/90 p-1.5 shadow-[0_18px_55px_rgba(92,75,81,0.18)] backdrop-blur-xl sm:hidden">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[82px] flex-col items-center gap-0.5 rounded-[1.2rem] px-3 py-2 text-[11px] font-bold transition-all ${active ? "bg-coral/12 text-coral-dark" : "text-text-light"}`}
              >
                <span className="text-lg leading-none">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
