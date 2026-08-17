import type { CreativeEntry, Reader, Work } from "@/lib/githubStore";

const LEGACY_GIST_ID_KEY = "lis_tracker_gist_id";
const LEGACY_TOKEN_KEY = "lis_tracker_github_token";
const LEGACY_CURRENT_READER_KEY = "lis_tracker_current_reader";
const LEGACY_MIGRATION_MAP_KEY = "lis_legacy_migration_map_v1";
const PROFILE_PREFIX = "lis_local_vault_";
const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const GITHUB_API_VERSION = "2026-03-10";
const FETCH_TIMEOUT_MS = 20_000;

const encoder = new TextEncoder();

interface LegacyAppData {
  readers: Reader[];
  works: Work[];
  creativeEntries: CreativeEntry[];
}

interface StoredVault {
  version: 1;
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  cipher: {
    name: "AES-GCM";
    iv: string;
    data: string;
  };
}

interface MigrationRecord {
  profileKey: string;
  targetName: string;
  migratedAt: string;
}

type MigrationMap = Record<string, MigrationRecord>;

export interface LegacyReaderSummary {
  reader: Reader;
  worksCount: number;
  creativeCount: number;
  alreadyImported: boolean;
  suggestedName: string;
  duplicateName: boolean;
}

let legacySnapshot: LegacyAppData | null = null;

function browserStorage(): Storage {
  if (typeof window === "undefined") throw new Error("迁移只能在浏览器中进行");
  return window.localStorage;
}

function normalizeName(name: string): string {
  return name.trim().normalize("NFKC").toLocaleLowerCase();
}

function assertPin(pin: string) {
  if (!/^\d{6}$/.test(pin)) throw new Error("PIN 必须是 6 位数字");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function getMigrationMap(): MigrationMap {
  try {
    const raw = browserStorage().getItem(LEGACY_MIGRATION_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MigrationMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveMigrationMap(map: MigrationMap) {
  browserStorage().setItem(LEGACY_MIGRATION_MAP_KEY, JSON.stringify(map));
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function profileKeyForName(name: string): Promise<string> {
  const normalized = normalizeName(name);
  if (!normalized) throw new Error("昵称不能为空");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(normalized));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function deriveVaultKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  assertPin(pin);
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptLegacyReader(data: LegacyAppData, sourceReader: Reader, targetReader: Reader, pin: string): Promise<StoredVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(pin, salt);

  const payload = {
    reader: targetReader,
    works: data.works.filter(work => work.readerId === sourceReader.id),
    creativeEntries: data.creativeEntries.filter(entry => entry.readerId === sourceReader.id),
  };

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    encoder.encode(JSON.stringify(payload)),
  );

  return {
    version: VAULT_VERSION,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: {
      name: "AES-GCM",
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(encrypted)),
    },
  };
}

function validateLegacyData(value: unknown): LegacyAppData {
  const parsed = value as Partial<LegacyAppData> | null;
  if (!parsed || !Array.isArray(parsed.readers) || !Array.isArray(parsed.works)) {
    throw new Error("旧 Gist 的数据格式无法识别");
  }
  return {
    readers: parsed.readers,
    works: parsed.works,
    creativeEntries: Array.isArray(parsed.creativeEntries) ? parsed.creativeEntries : [],
  };
}

function githubHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function requestGist(gistId: string, token: string): Promise<any> {
  const url = `https://api.github.com/gists/${encodeURIComponent(gistId)}`;
  const attempts = token ? [token, ""] : [""];
  let lastStatus = 0;

  for (const attemptToken of attempts) {
    try {
      const response = await fetchWithTimeout(url, { headers: githubHeaders(attemptToken || undefined) });
      lastStatus = response.status;
      if (response.ok) return response.json();

      // A revoked/expired legacy token can turn an otherwise readable secret Gist into a 401/403.
      // Retry once without Authorization because secret Gists are unlisted rather than truly private.
      if (attemptToken && (response.status === 401 || response.status === 403 || response.status === 404)) continue;
      break;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("连接 GitHub 超时，请稍后重试或检查当前网络");
      }
      throw new Error("无法连接 GitHub 读取旧数据，请检查当前网络");
    }
  }

  if (lastStatus === 401) throw new Error("旧版 GitHub Token 已失效，且无法匿名读取这个 Gist");
  if (lastStatus === 403) throw new Error("GitHub 拒绝读取旧 Gist，可能是权限或访问频率限制");
  if (lastStatus === 404) throw new Error("找不到旧版 Gist，可能已被删除");
  throw new Error(`读取旧版 Gist 失败 (HTTP ${lastStatus || "unknown"})`);
}

async function readLegacyGistFile(gist: any, token: string): Promise<string> {
  const file = gist?.files?.["lis-tracker-data.json"];
  if (!file) throw new Error("旧 Gist 中没有找到 lis-tracker-data.json");

  if (!file.truncated && typeof file.content === "string") return file.content;
  if (!file.raw_url) throw new Error("旧 Gist 数据不完整，无法读取原始文件");
  if (typeof file.size === "number" && file.size > 10_000_000) {
    throw new Error("旧 Gist 数据超过 10 MB，无法在浏览器中自动迁移");
  }

  const attempts = ["", token].filter((value, index, list) => value || (index === 0 && !list.slice(0, index).includes(value)));
  let lastStatus = 0;

  for (const attemptToken of attempts) {
    try {
      const headers: Record<string, string> = { Accept: "text/plain" };
      if (attemptToken) headers.Authorization = `Bearer ${attemptToken}`;
      const response = await fetchWithTimeout(file.raw_url, { headers });
      lastStatus = response.status;
      if (response.ok) return response.text();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("读取旧 Gist 原始文件超时，请稍后重试");
      }
      throw new Error("无法读取旧 Gist 原始文件，请检查当前网络");
    }
  }

  throw new Error(`读取旧 Gist 原始文件失败 (HTTP ${lastStatus || "unknown"})`);
}

export function hasLegacyGistCredentials(): boolean {
  if (typeof window === "undefined") return false;
  const store = browserStorage();
  // Gist ID alone is enough to attempt read-only recovery; the stored token may already have been revoked.
  return Boolean(store.getItem(LEGACY_GIST_ID_KEY));
}

export function clearLegacyCredentials() {
  const store = browserStorage();
  store.removeItem(LEGACY_GIST_ID_KEY);
  store.removeItem(LEGACY_TOKEN_KEY);
  store.removeItem(LEGACY_CURRENT_READER_KEY);
  legacySnapshot = null;
}

export async function loadLegacyReaders(): Promise<LegacyReaderSummary[]> {
  const store = browserStorage();
  const gistId = store.getItem(LEGACY_GIST_ID_KEY);
  const token = store.getItem(LEGACY_TOKEN_KEY) || "";
  if (!gistId) {
    throw new Error("这台浏览器没有检测到旧版 Gist ID");
  }

  const gist = await requestGist(gistId, token);
  const text = await readLegacyGistFile(gist, token);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("旧 Gist 中的 JSON 数据已损坏");
  }

  legacySnapshot = validateLegacyData(parsed);
  const migrationMap = getMigrationMap();
  const normalizedCounts = new Map<string, number>();
  for (const reader of legacySnapshot.readers) {
    const normalized = normalizeName(reader.name);
    normalizedCounts.set(normalized, (normalizedCounts.get(normalized) || 0) + 1);
  }

  return Promise.all(
    legacySnapshot.readers.map(async reader => {
      const record = migrationMap[reader.id];
      const alreadyImported = Boolean(record && store.getItem(PROFILE_PREFIX + record.profileKey));
      return {
        reader,
        worksCount: legacySnapshot!.works.filter(work => work.readerId === reader.id).length,
        creativeCount: legacySnapshot!.creativeEntries.filter(entry => entry.readerId === reader.id).length,
        alreadyImported,
        suggestedName: record?.targetName || reader.name,
        duplicateName: (normalizedCounts.get(normalizeName(reader.name)) || 0) > 1,
      };
    }),
  );
}

export async function importLegacyReader(
  readerId: string,
  pin: string,
  targetName: string,
  overwrite = false,
): Promise<Reader> {
  assertPin(pin);
  const snapshot = legacySnapshot;
  if (!snapshot) throw new Error("请先读取旧版书架");

  const sourceReader = snapshot.readers.find(item => item.id === readerId);
  if (!sourceReader) throw new Error("没有找到这个旧版读者");

  const cleanName = targetName.trim();
  if (!cleanName) throw new Error("请输入新版本昵称");
  if (cleanName.length > 24) throw new Error("昵称最多 24 个字符");

  const targetReader: Reader = { ...sourceReader, name: cleanName };
  const profileKey = await profileKeyForName(cleanName);
  const key = PROFILE_PREFIX + profileKey;
  const store = browserStorage();
  if (store.getItem(key) && !overwrite) throw new Error("本机已经存在同名书架");

  const encrypted = await encryptLegacyReader(snapshot, sourceReader, targetReader, pin);
  store.setItem(key, JSON.stringify(encrypted));

  const migrationMap = getMigrationMap();
  migrationMap[sourceReader.id] = {
    profileKey,
    targetName: cleanName,
    migratedAt: new Date().toISOString(),
  };
  saveMigrationMap(migrationMap);

  const importedFlags = snapshot.readers.map(item => {
    const record = migrationMap[item.id];
    return Boolean(record && store.getItem(PROFILE_PREFIX + record.profileKey));
  });

  if (importedFlags.every(Boolean)) clearLegacyCredentials();
  return targetReader;
}
