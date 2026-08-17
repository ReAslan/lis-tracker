"use client";

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
  const { currentReader, loading } = useReader();

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
                PRIVATE SHELF
              </span>
            </div>
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            {currentReader && (
              <div className="hidden items-center gap-1 rounded-pill bg-white p-1 shadow-sm ring-1 ring-coral/10 sm:flex">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-pill px-3.5 py-2 text-sm font-bold transition-all ${
                        active
                          ? "bg-coral/15 text-coral-dark"
                          : "text-text-soft hover:bg-coral/8 hover:text-coral-dark"
                      }`}
                    >
                      <span className="mr-1.5">{item.emoji}</span>{item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {currentReader ? (
              <div className="flex max-w-[150px] items-center gap-2 rounded-pill bg-coral/10 px-3 py-2 text-sm font-bold text-coral-dark ring-1 ring-coral/10">
                <span className="text-base">{currentReader.emoji}</span>
                <span className="truncate">{currentReader.name}</span>
              </div>
            ) : (
              <a
                href="#github-login"
                className="rounded-pill bg-[#24292f] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:text-sm"
              >
                GitHub 登录
              </a>
            )}
          </div>
        </div>
      </nav>

      {currentReader && (
        <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-around rounded-[1.6rem] border border-white/90 bg-white/90 p-1.5 shadow-[0_18px_55px_rgba(92,75,81,0.18)] backdrop-blur-xl sm:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[82px] flex-col items-center gap-0.5 rounded-[1.2rem] px-3 py-2 text-[11px] font-bold transition-all ${
                  active ? "bg-coral/12 text-coral-dark" : "text-text-light"
                }`}
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
