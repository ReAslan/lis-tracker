"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as store from "@/lib/githubStore";
import type { Reader } from "@/lib/githubStore";

interface ReaderContextType {
  currentReader: Reader | null;
  loading: boolean;
  configured: boolean;
  login: (name: string, pin: string) => Promise<void>;
  register: (name: string, pin: string, emoji: string) => Promise<void>;
  logout: () => void;
}

const ReaderContext = createContext<ReaderContextType>({} as ReaderContextType);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [currentReader, setCurrentReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = store.isConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    store.restoreSession()
      .then(setCurrentReader)
      .finally(() => setLoading(false));
  }, [configured]);

  const login = async (name: string, pin: string) => {
    const reader = await store.login(name, pin);
    setCurrentReader(reader);
  };

  const register = async (name: string, pin: string, emoji: string) => {
    const reader = await store.register(name, pin, emoji);
    setCurrentReader(reader);
  };

  const logout = () => {
    store.logout();
    setCurrentReader(null);
  };

  return (
    <ReaderContext.Provider value={{ currentReader, loading, configured, login, register, logout }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  return useContext(ReaderContext);
}
