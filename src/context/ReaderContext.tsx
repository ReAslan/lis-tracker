"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Reader {
  id: number;
  name: string;
  emoji: string;
}

interface ReaderContextType {
  readers: Reader[];
  currentReader: Reader | null;
  setCurrentReader: (reader: Reader) => void;
  addReader: (name: string, emoji: string) => Promise<void>;
  deleteReader: (id: number) => Promise<void>;
  loading: boolean;
}

const ReaderContext = createContext<ReaderContextType>({} as ReaderContextType);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [currentReader, setCurrentReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/readers")
      .then((r) => r.json())
      .then((data) => {
        setReaders(data);
        if (data.length > 0) {
          const saved = localStorage.getItem("currentReaderId");
          const target = saved ? data.find((r: Reader) => r.id === parseInt(saved)) : data[0];
          setCurrentReader(target || data[0]);
        }
        setLoading(false);
      });
  }, []);

  const changeReader = (reader: Reader) => {
    setCurrentReader(reader);
    localStorage.setItem("currentReaderId", String(reader.id));
  };

  const addReader = async (name: string, emoji: string) => {
    const res = await fetch("/api/readers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji }),
    });
    const reader = await res.json();
    setReaders((prev) => [...prev, reader]);
    changeReader(reader);
  };

  const deleteReader = async (id: number) => {
    await fetch(`/api/readers/${id}`, { method: "DELETE" });
    setReaders((prev) => prev.filter((r) => r.id !== id));
    if (currentReader?.id === id) {
      const remaining = readers.filter((r) => r.id !== id);
      const next = remaining[0] || null;
      setCurrentReader(next);
      if (next) localStorage.setItem("currentReaderId", String(next.id));
      else localStorage.removeItem("currentReaderId");
    }
  };

  return (
    <ReaderContext.Provider
      value={{ readers, currentReader, setCurrentReader: changeReader, addReader, deleteReader, loading }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  return useContext(ReaderContext);
}
