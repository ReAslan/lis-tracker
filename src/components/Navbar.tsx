"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReader } from "@/context/ReaderContext";

const EMOJIS = ["🍑", "🍒", "🍓", "🍊", "🍋", "🍇", "🥝", "🫐", "🌸", "⭐", "🐱", "🐰", "🐻", "🦊", "🐼"];

export default function Navbar() {
  const pathname = usePathname();
  const { readers, currentReader, setCurrentReader, addReader, deleteReader, loading } = useReader();
  const [showManager, setShowManager] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🍑");

  const links = [
    { href: "/", label: "📚 作品库" },
    { href: "/add", label: "✏️ 添加作品" },
    { href: "/creative", label: "💡 创作角" },
  ];

  if (loading) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 glass-q shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group no-underline">
            <span className="text-2xl group-hover:animate-wiggle inline-block">🍑</span>
            <span className="font-cute text-xl font-extrabold text-text-warm tracking-tight">
              Li&apos;s 李子
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-pill text-sm font-semibold transition-all ${
                    active
                      ? "bg-coral/15 text-coral-dark"
                      : "text-text-soft hover:text-coral hover:bg-coral/8"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="w-px h-6 bg-coral/20 mx-1" />

            {/* Reader Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowManager(!showManager)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-pill bg-coral/10 hover:bg-coral/20 text-sm font-bold text-coral-dark transition-all"
              >
                <span>{currentReader?.emoji || "🍑"}</span>
                <span className="max-w-[60px] truncate">{currentReader?.name || "选择用户"}</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {showManager && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowManager(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-3xl shadow-xl border border-coral/15 p-4 min-w-[220px] animate-pop">
                    <p className="text-xs font-bold text-text-light uppercase tracking-wider mb-3">
                      切换阅读人
                    </p>
                    <div className="space-y-1 mb-4 max-h-[200px] overflow-y-auto">
                      {readers.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => { setCurrentReader(r); setShowManager(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                            currentReader?.id === r.id
                              ? "bg-coral/15 text-coral-dark"
                              : "text-text-soft hover:bg-coral/8"
                          }`}
                        >
                          <span className="text-lg">{r.emoji}</span>
                          <span>{r.name}</span>
                          {readers.length > 1 && (
                            <span
                              onClick={(e) => { e.stopPropagation(); deleteReader(r.id); }}
                              className="ml-auto text-xs text-text-light hover:text-red-400 px-1"
                            >
                              ✕
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Add new */}
                    <p className="text-xs font-bold text-text-light uppercase tracking-wider mb-2">
                      添加新人
                    </p>
                    <div className="flex gap-2 mb-1">
                      <div className="relative flex-1">
                        <select
                          value={newEmoji}
                          onChange={(e) => setNewEmoji(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        >
                          {EMOJIS.map((e) => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                        <div className="px-3 py-2 bg-coral/8 rounded-2xl text-lg text-center cursor-pointer hover:bg-coral/15 transition-colors">
                          {newEmoji}
                        </div>
                      </div>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="名字"
                        className="flex-[2] px-3 py-2 bg-coral/8 rounded-2xl text-sm outline-none focus:ring-2 ring-coral/30 text-text-warm placeholder:text-text-light"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newName.trim()) {
                            addReader(newName.trim(), newEmoji);
                            setNewName("");
                            setNewEmoji("🍑");
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newName.trim()) {
                            addReader(newName.trim(), newEmoji);
                            setNewName("");
                            setNewEmoji("🍑");
                          }
                        }}
                        disabled={!newName.trim()}
                        className="px-3 py-2 bg-coral text-white rounded-2xl text-sm font-bold hover:bg-coral-dark disabled:opacity-40 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
