const GIST_ID_KEY = "lis_tracker_gist_id";
const TOKEN_KEY = "lis_tracker_github_token";

const isBrowser = typeof window !== "undefined";

function getItem(key: string): string | null {
  if (!isBrowser) return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function setItem(key: string, value: string) {
  if (!isBrowser) return;
  try { localStorage.setItem(key, value); } catch { /* noop */ }
}

function removeItem(key: string) {
  if (!isBrowser) return;
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

interface AppData {
  readers: Reader[];
  works: Work[];
  creativeEntries: CreativeEntry[];
}

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

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function getToken(): string {
  return getItem(TOKEN_KEY) || "";
}

function getGistId(): string {
  return getItem(GIST_ID_KEY) || "";
}

function setGistId(id: string) {
  setItem(GIST_ID_KEY, id);
}

async function fetchGist(): Promise<AppData> {
  const gistId = getGistId();
  const token = getToken();

  if (!gistId || !token) {
    return { readers: [], works: [], creativeEntries: [] };
  }

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });

  if (!res.ok) throw new Error("Failed to load data");

  const gist = await res.json();
  const file = gist.files?.["lis-tracker-data.json"];
  if (!file?.content) return { readers: [], works: [], creativeEntries: [] };

  try {
    return JSON.parse(file.content);
  } catch {
    return { readers: [], works: [], creativeEntries: [] };
  }
}

async function saveGist(data: AppData): Promise<void> {
  const gistId = getGistId();
  const token = getToken();
  if (!gistId || !token) throw new Error("No gist configured");

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/vnd.github+json" },
    body: JSON.stringify({
      files: { "lis-tracker-data.json": { content: JSON.stringify(data, null, 2) } },
    }),
  });

  if (!res.ok) throw new Error("Failed to save data");
}

// --- Public API ---

export function isConfigured(): boolean {
  return !!(getToken() && getGistId());
}

export function getStoredToken(): string {
  return getToken();
}

export function setToken(token: string) {
  setItem(TOKEN_KEY, token);
}

export function clearConfig() {
  removeItem(TOKEN_KEY);
  removeItem(GIST_ID_KEY);
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function initializeGist(token: string): Promise<string> {
  // Validate token by checking user info (with timeout)
  let userRes: Response;
  try {
    userRes = await fetchWithTimeout("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("连接 GitHub 超时，请检查网络或使用代理");
    throw new Error("无法连接 GitHub，请检查网络是否正常");
  }

  if (!userRes.ok) {
    if (userRes.status === 401) throw new Error("Token 无效，请检查是否完整复制（以 ghp_ 开头）");
    if (userRes.status === 403) throw new Error("Token 没有权限，请确认勾选了 gist 权限");
    throw new Error(`验证失败 (HTTP ${userRes.status})，请重试`);
  }

  // Check if gist scope is present
  const scopes = userRes.headers.get("X-OAuth-Scopes") || "";
  if (!scopes.includes("gist")) {
    throw new Error("Token 缺少 gist 权限！创建时请务必勾选 gist 选项（不是 repo，是 gist）");
  }

  // Create gist
  let res: Response;
  try {
    res = await fetchWithTimeout("https://api.github.com/gists", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/vnd.github+json" },
      body: JSON.stringify({
        description: "Li's 李子 - 数据存储",
        public: false,
        files: { "lis-tracker-data.json": { content: JSON.stringify({ readers: [], works: [], creativeEntries: [] }) } },
      }),
    });
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("创建存储超时，请检查网络或使用代理");
    throw new Error("无法连接 GitHub，请检查网络是否正常");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `创建失败 (HTTP ${res.status})，请重试`);
  }

  const gist = await res.json();
  setToken(token);
  setGistId(gist.id);
  return gist.id;
}

// Readers
export async function getReaders(): Promise<Reader[]> {
  const data = await fetchGist();
  return data.readers;
}

export async function addReader(name: string, emoji: string): Promise<Reader> {
  const data = await fetchGist();
  const reader: Reader = { id: generateId(), name, emoji, createdAt: new Date().toISOString() };
  data.readers.push(reader);
  await saveGist(data);
  return reader;
}

export async function deleteReader(id: string): Promise<void> {
  const data = await fetchGist();
  data.readers = data.readers.filter((r) => r.id !== id);
  data.works = data.works.filter((w) => w.readerId !== id);
  data.creativeEntries = data.creativeEntries.filter((e) => e.readerId !== id);
  await saveGist(data);
}

// Works
export async function getWorks(readerId: string, status?: string): Promise<Work[]> {
  const data = await fetchGist();
  let works = data.works.filter((w) => w.readerId === readerId);
  if (status) works = works.filter((w) => w.readingStatus === status);
  works.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return works;
}

export async function getWork(id: string): Promise<Work | null> {
  const data = await fetchGist();
  return data.works.find((w) => w.id === id) || null;
}

export async function createWork(work: Omit<Work, "id" | "createdAt" | "updatedAt">): Promise<Work> {
  const data = await fetchGist();
  const now = new Date().toISOString();
  const newWork: Work = { ...work, id: generateId(), createdAt: now, updatedAt: now };
  data.works.push(newWork);
  await saveGist(data);
  return newWork;
}

export async function updateWork(id: string, updates: Partial<Work>): Promise<Work> {
  const data = await fetchGist();
  const idx = data.works.findIndex((w) => w.id === id);
  if (idx === -1) throw new Error("Work not found");
  data.works[idx] = { ...data.works[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveGist(data);
  return data.works[idx];
}

export async function deleteWork(id: string): Promise<void> {
  const data = await fetchGist();
  data.works = data.works.filter((w) => w.id !== id);
  await saveGist(data);
}

// Creative Entries
export async function getCreativeEntries(readerId: string): Promise<CreativeEntry[]> {
  const data = await fetchGist();
  return data.creativeEntries
    .filter((e) => e.readerId === readerId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getCreativeEntry(id: string): Promise<CreativeEntry | null> {
  const data = await fetchGist();
  return data.creativeEntries.find((e) => e.id === id) || null;
}

export async function createCreativeEntry(entry: Omit<CreativeEntry, "id" | "createdAt" | "updatedAt">): Promise<CreativeEntry> {
  const data = await fetchGist();
  const now = new Date().toISOString();
  const newEntry: CreativeEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now };
  data.creativeEntries.push(newEntry);
  await saveGist(data);
  return newEntry;
}

export async function updateCreativeEntry(id: string, updates: Partial<CreativeEntry>): Promise<CreativeEntry> {
  const data = await fetchGist();
  const idx = data.creativeEntries.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Entry not found");
  data.creativeEntries[idx] = { ...data.creativeEntries[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveGist(data);
  return data.creativeEntries[idx];
}

export async function deleteCreativeEntry(id: string): Promise<void> {
  const data = await fetchGist();
  data.creativeEntries = data.creativeEntries.filter((e) => e.id !== id);
  await saveGist(data);
}
