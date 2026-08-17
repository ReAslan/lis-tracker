"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReader } from "@/context/ReaderContext";

export default function Navbar() {
  const pathname = usePathname();
  const { currentReader, logout, loading } = useReader();

  const links = [
    { href: "/", label: "📚 作品库" },
    { href: "/add", label: "✏️ 添加作品" },
    { href: "/creative", label: "💡 创作角" },
  ];

  if (loading) return null;

  return (
    <nav className="sticky top-0 z-50 glass-q shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 group no-underline shrink-0">
          <span className="text-2xl group-hover:animate-wiggle inline-block">🍑</span>
          <span className="font-cute text-xl font-extrabold text-text-warm tracking-tight">
            Li&apos;s 李子
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {currentReader && links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hidden sm:inline-block px-3 py-2 rounded-pill text-sm font-semibold transition-all ${
                  active
                    ? "bg-coral/15 text-coral-dark"
                    : "text-text-soft hover:text-coral hover:bg-coral/8"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {currentReader ? (
            <>
              <div className="hidden sm:block w-px h-6 bg-coral/20 mx-1" />
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-pill bg-coral/10 text-sm font-bold text-coral-dark max-w-[140px]">
                <span>{currentReader.emoji}</span>
                <span className="truncate">{currentReader.name}</span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-pill text-xs sm:text-sm font-bold text-text-soft hover:text-coral-dark hover:bg-coral/10 transition-all"
              >
                退出
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="px-4 py-2 rounded-pill bg-coral/10 text-sm font-bold text-coral-dark hover:bg-coral/20 transition-all"
            >
              登录 / 注册
            </Link>
          )}
        </div>
      </div>

      {currentReader && (
        <div className="sm:hidden px-3 pb-2 flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap px-3 py-1.5 rounded-pill text-xs font-semibold ${
                  active ? "bg-coral/15 text-coral-dark" : "text-text-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
