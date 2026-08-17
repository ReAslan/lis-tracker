export interface Reader {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
}

export interface Work {
  id: string;
  title: string;
  author?: string;
  type: string;
  serialStatus: string;
  coverUrl?: string;
  readingStatus: string;
  progressCurrent: number;
  progressTotal?: number | null;
  rating?: number | null;
  oneLineReview?: string;
  touchingMoments?: string;
  daysToFinish?: number | null;
  cpPersonality?: string;
  cpTension?: string;
  cpFamousLines?: string;
  tags?: string;
  tropes?: string;
  notes?: string;
  readerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeEntry {
  id: string;
  title: string;
  content: string;
  readerId: string;
  createdAt: string;
  updatedAt: string;
}

type AuthResult = { reader: Reader; token: string };

const SESSION_KEY = "lis_tracker_session";
const API_BASE = (process.env.NEXT_PUBLIC_LIS_API_URL || "").replace(/\/$/, "");
const isBrowser = typeof window !== "undefined";

function getToken(): string {
  if (!isBrowser) return "";
  try { return localStorage.getItem(SESSION_KEY) || ""; } catch { return ""; }
}

function setToken(token: string) {
  if (!isBrowser) return;
  try { localStorage.setItem(SESSION_KEY, token); } catch { /* noop */ }
}

export function logout() {
  if (!isBrowser) return;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) logout();
    throw new Error(payload?.error || `请求失败 (${res.status})`);
  }
  return payload as T;
}

async function request<T>(body: Record<string, unknown>, auth = true): Promise<T> {
  if (!API_BASE) {
    throw new Error("网站尚未配置国内数据服务地址 NEXT_PUBLIC_LIS_API_URL");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("请先登录");
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parseResponse<T>(res);
}

export function isConfigured(): boolean {
  return !!API_BASE;
}

export async function register(name: string, pin: string, emoji: string): Promise<Reader> {
  const result = await request<AuthResult>({ action: "register", name, pin, emoji }, false);
  setToken(result.token);
  return result.reader;
}

export async function login(name: string, pin: string): Promise<Reader> {
  const result = await request<AuthResult>({ action: "login", name, pin }, false);
  setToken(result.token);
  return result.reader;
}

export async function restoreSession(): Promise<Reader | null> {
  if (!getToken()) return null;
  try {
    return await request<Reader>({ action: "me" });
  } catch {
    logout();
    return null;
  }
}

export async function getWorks(_readerId: string, status?: string): Promise<Work[]> {
  return request<Work[]>({ action: "list-works", status });
}

export async function getWork(id: string): Promise<Work | null> {
  return request<Work | null>({ action: "get-work", id });
}

export async function createWork(work: Omit<Work, "id" | "createdAt" | "updatedAt">): Promise<Work> {
  return request<Work>({ action: "create-work", work });
}

export async function updateWork(id: string, updates: Partial<Work>): Promise<Work> {
  return request<Work>({ action: "update-work", id, updates });
}

export async function deleteWork(id: string): Promise<void> {
  await request({ action: "delete-work", id });
}

export async function getCreativeEntries(_readerId: string): Promise<CreativeEntry[]> {
  return request<CreativeEntry[]>({ action: "list-creative" });
}

export async function getCreativeEntry(id: string): Promise<CreativeEntry | null> {
  return request<CreativeEntry | null>({ action: "get-creative", id });
}

export async function createCreativeEntry(entry: Omit<CreativeEntry, "id" | "createdAt" | "updatedAt">): Promise<CreativeEntry> {
  return request<CreativeEntry>({ action: "create-creative", entry });
}

export async function updateCreativeEntry(id: string, updates: Partial<CreativeEntry>): Promise<CreativeEntry> {
  return request<CreativeEntry>({ action: "update-creative", id, updates });
}

export async function deleteCreativeEntry(id: string): Promise<void> {
  await request({ action: "delete-creative", id });
}
