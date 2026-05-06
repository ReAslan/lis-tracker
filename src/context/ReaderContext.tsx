"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as store from "@/lib/githubStore";

const isBrowser = typeof window !== "undefined";
const ls = {
  get(key: string): string | null {
    if (!isBrowser) return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, v: string) {
    if (!isBrowser) return;
    try { localStorage.setItem(key, v); } catch { /* noop */ }
  },
  remove(key: string) {
    if (!isBrowser) return;
    try { localStorage.removeItem(key); } catch { /* noop */ }
  },
};

interface Reader {
  id: string;
  name: string;
  emoji: string;
}

interface ReaderContextType {
  readers: Reader[];
  currentReader: Reader | null;
  setCurrentReader: (reader: Reader) => void;
  addReader: (name: string, emoji: string) => Promise<void>;
  deleteReader: (id: string) => Promise<void>;
  loading: boolean;
  configured: boolean;
}

const ReaderContext = createContext<ReaderContextType>({} as ReaderContextType);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [currentReader, setCurrentReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = store.isConfigured();

  function loadReaders() {
    store.getReaders().then(data => {
      setReaders(data);
      if (data.length > 0) {
        const saved = ls.get("lis_tracker_current_reader");
        const target = saved ? data.find(r => r.id === saved) : data[0];
        setCurrentReader(target || data[0]);
      } else {
        setCurrentReader(null);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }

  useEffect(() => {
    if (configured) loadReaders();
    else setLoading(false);
  }, [configured]);

  const changeReader = (reader: Reader) => {
    setCurrentReader(reader);
    ls.set("lis_tracker_current_reader", reader.id);
  };

  const addReader = async (name: string, emoji: string) => {
    const reader = await store.addReader(name, emoji);
    setReaders(prev => [...prev, reader]);
    changeReader(reader);
  };

  const deleteReader = async (id: string) => {
    await store.deleteReader(id);
    const remaining = readers.filter(r => r.id !== id);
    setReaders(remaining);
    if (currentReader?.id === id) {
      const next = remaining[0] || null;
      setCurrentReader(next);
      if (next) ls.set("lis_tracker_current_reader", next.id);
      else ls.remove("lis_tracker_current_reader");
    }
  };

  return (
    <ReaderContext.Provider value={{ readers, currentReader, setCurrentReader: changeReader, addReader, deleteReader, loading, configured }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  return useContext(ReaderContext);
}
