"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WorkForm from "@/components/WorkForm";

export default function EditPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/works/${id}`).then(r => r.json()).then(setData);
  }, [id]);

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-7 bg-coral/10 rounded-full w-1/3" />
        <div className="h-64 bg-coral/5 rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-cute text-3xl font-extrabold text-text-warm">编辑作品</h1>
        <p className="text-text-light mt-2 text-sm font-bold">{data.title}</p>
      </div>
      <WorkForm initialData={{ ...data, id: data.id }} />
    </div>
  );
}
