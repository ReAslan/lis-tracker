"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import WorkForm from "@/components/WorkForm";
import * as store from "@/lib/githubStore";
import type { Work } from "@/lib/githubStore";

function EditContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      store.getWork(id).then(d => { setData(d); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (!id) return <div className="text-center py-24"><p className="text-text-soft">未指定作品 ID</p></div>;
  if (loading) return <div className="max-w-2xl mx-auto animate-pulse space-y-4"><div className="h-7 bg-coral/10 rounded-full w-1/3" /><div className="h-64 bg-coral/5 rounded-[2rem]" /></div>;
  if (!data) return <div className="text-center py-24"><p className="text-text-soft">作品不存在</p></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div><h1 className="font-cute text-3xl font-extrabold text-text-warm">编辑作品</h1><p className="text-text-light mt-2 text-sm font-bold">{data.title}</p></div>
      <WorkForm initialData={data} />
    </div>
  );
}

export default function EditPage() {
  return <Suspense fallback={<div>加载中...</div>}><EditContent /></Suspense>;
}
