import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { ReaderProvider } from "@/context/ReaderContext";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-cute", weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Li's 李子 | 我的作品书架",
  description: "收藏喜欢的小说、漫画、动漫，记录心动片段、CP 与创作灵感。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body
        className={`${inter.variable} ${nunito.variable} font-body min-h-full antialiased relative`}
      >
        <ReaderProvider>
          <div className="bg-bubbles" aria-hidden="true">
            {[
              { left: "5%", size: 18, color: "#ff8fab", delay: "0s", dur: "12s" },
              { left: "15%", size: 12, color: "#b5e8d5", delay: "3s", dur: "15s" },
              { left: "25%", size: 22, color: "#d4b8ff", delay: "6s", dur: "10s" },
              { left: "40%", size: 14, color: "#b8d8ff", delay: "2s", dur: "14s" },
              { left: "55%", size: 20, color: "#ffe5a0", delay: "8s", dur: "11s" },
              { left: "65%", size: 10, color: "#ff8fab", delay: "4s", dur: "16s" },
              { left: "75%", size: 16, color: "#b5e8d5", delay: "7s", dur: "13s" },
              { left: "85%", size: 24, color: "#d4b8ff", delay: "1s", dur: "9s" },
              { left: "92%", size: 13, color: "#ffe5a0", delay: "5s", dur: "17s" },
            ].map((b, i) => (
              <div
                key={i}
                className="bubble"
                style={{
                  left: b.left,
                  width: b.size,
                  height: b.size,
                  background: `${b.color}40`,
                  border: `1px solid ${b.color}60`,
                  animationDelay: b.delay,
                  animationDuration: b.dur,
                }}
              />
            ))}
          </div>
          <div className="relative z-10">
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:py-10 sm:pb-10">{children}</main>
          </div>
        </ReaderProvider>
      </body>
    </html>
  );
}
