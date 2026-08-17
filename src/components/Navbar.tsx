"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReader } from "@/context/ReaderContext";

export default function Navbar() {
  const pathname = usePathname();
  const { currentReader, loading } = useReader();

  const links = [
    { href: "/", label: "📚 作品库" },
    { href: "/add", label: "✏️ 添加作品" },
    { href: "/creative", label: "💡 创作角" },
  ];

  if (loading) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/65 shadow-[0_1px_20px_rgba(92,75,81,0.04)] backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group no-underline shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-coral/10 text-xl group-hover:animate-wiggle">🍑</span>
          <div className="leading-none">
            <span className="font-cute text-xl font-extrabold text-text-warm tracking-tight block">Li&apos;s 李子</span>
            <span className="hidden sm:block mt-1 text-[9px] font-black tracking-[0.16em] text-text-light">MY LITTLE LIBRARY</span>
          </div>
        </Link>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {currentReader ? (
            <>
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`hidden sm:inline-flex px-3 py-2 rounded-pill text-sm font-semibold transition-all ${
                      active
                        ? "bg-coral/15 text-coral-dark"
                        : "text-text-soft hover:text-coral hover:bg-coral/8"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="hidden sm:block w-px h-6 bg-coral/15 mx-1" />
              <div className="flex max-w-[150px] items-center gap-2 rounded-pill border border-coral/10 bg-white/80 px-3 py-2 text-sm font-extrabold text-text-warm shadow-sm">
                <span>{currentReader.emoji}</span>
                <span className="truncate">{currentReader.name}</span>
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-1.5 rounded-pill bg-mint/25 px-3 py-2 text-[11px] font-extrabold text-text-soft">
                <span>🔒</span>
                私人书架
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-pill bg-[#24292f] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-sm hover:-translate-y-0.5 hover:bg-black"
              >
                <GitHubMark />
                <span className="hidden xs:inline">GitHub </span>登录
              </Link>
            </>
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

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 .7C5.7.7.6 5.8.6 12.2c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.8-1.3-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C16.3 4.8 17.3 5.1 17.3 5.1c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1 .8 2.1v3.1c0 .3.2.7.8.6a11.6 11.6 0 0 0 7.8-10.9C23.4 5.8 18.3.7 12 .7Z" />
    </svg>
  );
}
