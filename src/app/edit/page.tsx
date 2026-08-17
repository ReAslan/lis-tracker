"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import WorkForm from "@/components/WorkForm";
import LockedShelf from "@/components/LockedShelf";
import { useReader } from "@/context/ReaderContext";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

function EditContent() {
  const searchParams = useSearchParams();
  const { currentReader, loading: readerLoading } = useReader();
  const id = searchParams.get("id");
  const [data, setData] = useState<Work | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !currentReader) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    store.getWork(id)
      .then((work) => setData(work))
      .catch((err) => setError(err instanceof Error ? err.message : "读取作品失败"))
      .finally(() => setLoading(false));
  }, [id, currentReader]);

  if (readerLoading) return <div className="py-24 text-center text-sm font-bold text-text-light">正在检查书架状态...</div>;
  if (!currentReader) return <LockedShelf />;
  if (!id) return <div className="py-24 text-center"><p className="text-text-soft">未指定作品 ID</p><Link href="/" className="mt-3 inline-block font-bold text-coral">返回作品库</Link></div>;
  if (loading) return <div className="max-w-2xl mx-auto animate-pulse space-y-4"><div className="h-7 bg-coral/10 rounded-full w-1/3" /><div className="h-64 bg-coral/5 rounded-[2rem]" /></div>;
  if (error) return <div className="py-24 text-center"><p className="font-bold text-red-500">{error}</p><Link href="/" className="mt-3 inline-block font-bold text-coral">返回作品库</Link></div>;
  if (!data) return <div className="py-24 text-center"><p className="text-text-soft">作品不存在</p><Link href="/" className="mt-3 inline-block font-bold text-coral">返回作品库</Link></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div><h1 className="font-cute text-3xl font-extrabold text-text-warm">编辑作品</h1><p className="text-text-light mt-2 text-sm font-bold">{data.title}</p></div>
      <WorkForm initialData={data} />
    </div>
  );
}

export default function EditPage() {
  return <Suspense fallback={<div className="py-24 text-center text-text-light">加载中...</div>}><EditContent /></Suspense>;
}
