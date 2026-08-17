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
  exportBackup: () => Promise<string>;
  importBackup: (text: string, pin: string, overwrite?: boolean) => Promise<void>;
}

const ReaderContext = createContext<ReaderContextType>({} as ReaderContextType);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [currentReader, setCurrentReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    setConfigured(store.isConfigured());
    store.restoreSession()
      .then(setCurrentReader)
      .finally(() => setLoading(false));
  }, []);

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

  const exportBackup = () => store.exportBackup();

  const importBackup = async (text: string, pin: string, overwrite = false) => {
    const reader = await store.importBackup(text, pin, overwrite);
    setCurrentReader(reader);
  };

  return (
    <ReaderContext.Provider
      value={{
        currentReader,
        loading,
        configured,
        login,
        register,
        logout,
        exportBackup,
        importBackup,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  return useContext(ReaderContext);
}
