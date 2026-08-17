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

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `请求失败 (${res.status})`);
  }
  return payload as T;
}

async function query<T>(params: Record<string, string | undefined>): Promise<T> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) qs.set(key, value);
  });
  const res = await fetch(`/api/data?${qs.toString()}`, { cache: "no-store" });
  return parseResponse<T>(res);
}

async function mutate<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}

// The app is configured server-side. No GitHub token is stored in the browser.
export function isConfigured(): boolean {
  return true;
}

export async function getReaders(): Promise<Reader[]> {
  return query<Reader[]>({ type: "readers" });
}

export async function addReader(name: string, emoji: string): Promise<Reader> {
  return mutate<Reader>({ action: "add-reader", name, emoji });
}

export async function deleteReader(id: string): Promise<void> {
  await mutate({ action: "delete-reader", id });
}

export async function getWorks(readerId: string, status?: string): Promise<Work[]> {
  return query<Work[]>({ type: "works", readerId, status });
}

export async function getWork(id: string): Promise<Work | null> {
  return query<Work | null>({ type: "work", id });
}

export async function createWork(work: Omit<Work, "id" | "createdAt" | "updatedAt">): Promise<Work> {
  return mutate<Work>({ action: "create-work", work });
}

export async function updateWork(id: string, updates: Partial<Work>): Promise<Work> {
  return mutate<Work>({ action: "update-work", id, updates });
}

export async function deleteWork(id: string): Promise<void> {
  await mutate({ action: "delete-work", id });
}

export async function getCreativeEntries(readerId: string): Promise<CreativeEntry[]> {
  return query<CreativeEntry[]>({ type: "creative-entries", readerId });
}

export async function getCreativeEntry(id: string): Promise<CreativeEntry | null> {
  return query<CreativeEntry | null>({ type: "creative-entry", id });
}

export async function createCreativeEntry(entry: Omit<CreativeEntry, "id" | "createdAt" | "updatedAt">): Promise<CreativeEntry> {
  return mutate<CreativeEntry>({ action: "create-creative-entry", entry });
}

export async function updateCreativeEntry(id: string, updates: Partial<CreativeEntry>): Promise<CreativeEntry> {
  return mutate<CreativeEntry>({ action: "update-creative-entry", id, updates });
}

export async function deleteCreativeEntry(id: string): Promise<void> {
  await mutate({ action: "delete-creative-entry", id });
}
