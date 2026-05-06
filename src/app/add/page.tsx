"use client";

import WorkForm from "@/components/WorkForm";
import { useReader } from "@/context/ReaderContext";

export default function AddPage() {
  const { currentReader } = useReader();

  if (!currentReader) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-cute text-3xl font-extrabold text-text-warm flex items-center gap-3">
          <span>{currentReader.emoji}</span> 添加作品
        </h1>
        <p className="text-text-light mt-2 text-sm font-bold">
          记录一部新的小说、漫画或动漫 ✨
        </p>
      </div>
      <WorkForm />
    </div>
  );
}
