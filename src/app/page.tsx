"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    if (!currentReader) {
      setLoading(false);
      return;
    }
    setLoading(true);
    store.getWorks(currentReader.id, activeTab || undefined)
      .then(data => { setWorks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeTab, currentReader]);

  if (!configured || !currentReader) {
    return <GitHubLanding />;
  }

  if (readerLoading || loading) {
    return <LoadingGrid />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-pill bg-white/80 border border-white px-3 py-1 text-[11px] font-extrabold tracking-[0.14em] text-coral-dark shadow-sm">
            MY LITTLE LIBRARY
          </div>
          <h1 className="font-cute text-3xl font-extrabold text-text-warm flex items-center gap-3 mt-3">
            <span className="animate-float inline-block">{currentReader.emoji}</span>
            {currentReader.name}的作品库
          </h1>
          <p className="text-text-light mt-2 text-sm font-bold">记录每一部心动作品 ✨</p>
        </div>
        <Link
          href="/add"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-pill bg-coral text-white text-sm font-extrabold shadow-lg shadow-coral/20 hover:bg-coral-dark hover:-translate-y-0.5"
        >
          <span>＋</span> 添加作品
        </Link>
      </div>

      <StatusTabs active={activeTab} onChange={setActiveTab} />

      {works.length === 0 ? (
        <div className="text-center py-24 bg-white/55 border border-white rounded-[2.5rem] shadow-sm">
          <div className="text-7xl animate-float inline-block">📚</div>
          <p className="text-text-soft text-lg mt-6 font-cute font-bold">书架还是空的呢~</p>
          <p className="text-text-light text-sm mt-2">从第一部让你心动的作品开始记录吧</p>
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

function GitHubLanding() {
  const featureItems = [
    { icon: "🔐", title: "不用再填 Token", text: "GitHub 授权一次即可" },
    { icon: "☁️", title: "跨设备同步", text: "换电脑也能找回书架" },
    { icon: "🌷", title: "每个人独立", text: "只管理自己的阅读记录" },
  ];

  return (
    <div className="relative py-8 sm:py-14 lg:py-20">
      <div className="pointer-events-none absolute -top-12 left-[6%] h-36 w-36 rounded-full bg-coral/10 blur-3xl" />
      <div className="pointer-events-none absolute top-32 right-[3%] h-44 w-44 rounded-full bg-mint/25 blur-3xl" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-pill border border-coral/15 bg-white/75 px-4 py-2 text-xs font-extrabold text-coral-dark shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-coral shadow-[0_0_0_4px_rgba(255,143,171,0.12)]" />
            PRIVATE · SYNCED · YOURS
          </div>

          <h1 className="mt-6 font-cute text-[2.75rem] font-black leading-[1.12] tracking-tight text-text-warm sm:text-6xl">
            把喜欢的故事，
            <span className="relative inline-block text-coral-dark">
              收进自己的书架。
              <span className="absolute -bottom-2 left-1 right-1 h-3 rounded-full bg-coral/10 -z-10" />
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-text-soft sm:text-lg">
            小说、漫画、动漫和那些舍不得忘记的瞬间，都可以慢慢记在这里。使用 GitHub 登录后，每个人拥有独立的阅读空间。
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {featureItems.map((item) => (
              <div key={item.title} className="rounded-[1.6rem] border border-white/90 bg-white/65 p-4 shadow-sm backdrop-blur-sm">
                <div className="text-2xl">{item.icon}</div>
                <p className="mt-2 text-sm font-extrabold text-text-warm">{item.title}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-text-light">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[460px]">
          <div className="absolute -left-7 top-12 hidden h-20 w-20 rotate-[-8deg] items-center justify-center rounded-[2rem] bg-mint/70 text-4xl shadow-lg shadow-mint/20 sm:flex">📖</div>
          <div className="absolute -right-5 bottom-10 hidden h-16 w-16 rotate-[10deg] items-center justify-center rounded-[1.7rem] bg-peach text-3xl shadow-lg sm:flex">✨</div>

          <div className="glass-q overflow-hidden rounded-[2.3rem] border border-white p-2 shadow-[0_24px_70px_rgba(92,75,81,0.12)]">
            <div className="rounded-[1.9rem] bg-white/90 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black tracking-[0.18em] text-text-light">WELCOME TO</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-3xl">🍑</span>
                    <span className="font-cute text-2xl font-black text-text-warm">Li&apos;s 李子</span>
                  </div>
                </div>
                <div className="rounded-pill bg-mint/35 px-3 py-1.5 text-[11px] font-extrabold text-text-soft">安全同步</div>
              </div>

              <div className="mt-7 rounded-[1.7rem] border border-coral/10 bg-gradient-to-br from-coral/[0.055] to-mint/[0.09] p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-sm font-black text-white shadow-sm">1</div>
                  <div>
                    <p className="text-sm font-extrabold text-text-warm">先使用 GitHub 登录</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-text-light">不再要求你复制、粘贴或保存 GitHub Token。</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                aria-label="使用 GitHub 登录"
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-[#24292f] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-black/10 hover:-translate-y-0.5 hover:bg-black"
              >
                <GitHubMark />
                使用 GitHub 登录
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-coral/10" />
                <span className="text-[10px] font-extrabold tracking-[0.13em] text-text-light">登录之后</span>
                <div className="h-px flex-1 bg-coral/10" />
              </div>

              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-black text-text-warm shadow-sm">2</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-text-warm">设置昵称与 6 位 PIN</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-text-light">第一次登录时完成，以后回到自己的书架更方便。</p>

                  <div className="mt-4 rounded-[1.35rem] border border-coral/10 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-peach text-2xl">🍓</div>
                      <div className="flex-1">
                        <div className="h-2.5 w-20 rounded-full bg-text-warm/10" />
                        <div className="mt-2 h-2 w-28 rounded-full bg-text-light/10" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="flex h-9 flex-1 items-center justify-center rounded-xl bg-coral/[0.07] text-lg font-black text-coral-dark">•</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] font-semibold leading-5 text-text-light">
                GitHub 用于身份与数据同步；PIN 用于保护你的私人书架。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12 .7C5.7.7.6 5.8.6 12.2c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.3.8-.6v-2.2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.4-1.3-1.8-1.3-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C16.3 4.8 17.3 5.1 17.3 5.1c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1 .8 2.1v3.1c0 .3.2.7.8.6a11.6 11.6 0 0 0 7.8-10.9C23.4 5.8 18.3.7 12 .7Z" />
    </svg>
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
