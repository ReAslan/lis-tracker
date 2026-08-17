import type { CreativeEntry, Reader, Work } from "@/lib/githubStore";

const LEGACY_GIST_ID_KEY = "lis_tracker_gist_id";
const LEGACY_TOKEN_KEY = "lis_tracker_github_token";
const LEGACY_CURRENT_READER_KEY = "lis_tracker_current_reader";
const PROFILE_PREFIX = "lis_local_vault_";
const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;

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

export interface LegacyReaderSummary {
  reader: Reader;
  worksCount: number;
  creativeCount: number;
  alreadyImported: boolean;
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

async function profileKeyForName(name: string): Promise<string> {
  const normalized = normalizeName(name);
  if (!normalized) throw new Error("旧版读者昵称为空，无法迁移");
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

async function encryptLegacyReader(data: LegacyAppData, reader: Reader, pin: string): Promise<StoredVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(pin, salt);

  const payload = {
    reader,
    works: data.works.filter(work => work.readerId === reader.id),
    creativeEntries: data.creativeEntries.filter(entry => entry.readerId === reader.id),
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
  if (!parsed || !Array.isArray(parsed.readers) || !Array.isArray(parsed.works) || !Array.isArray(parsed.creativeEntries)) {
    throw new Error("旧 Gist 的数据格式无法识别");
  }
  return parsed as LegacyAppData;
}

async function readLegacyGistFile(gist: any, token: string): Promise<string> {
  const file = gist?.files?.["lis-tracker-data.json"];
  if (!file) throw new Error("旧 Gist 中没有找到 lis-tracker-data.json");

  if (!file.truncated && typeof file.content === "string") return file.content;
  if (!file.raw_url) throw new Error("旧 Gist 数据不完整，无法读取原始文件");

  const response = await fetch(file.raw_url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.raw+json",
    },
  });
  if (!response.ok) throw new Error(`读取旧 Gist 原始文件失败 (HTTP ${response.status})`);
  return response.text();
}

export function hasLegacyGistCredentials(): boolean {
  if (typeof window === "undefined") return false;
  const store = browserStorage();
  return Boolean(store.getItem(LEGACY_GIST_ID_KEY) && store.getItem(LEGACY_TOKEN_KEY));
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
  const token = store.getItem(LEGACY_TOKEN_KEY);
  if (!gistId || !token) {
    throw new Error("这台浏览器没有检测到旧版 Gist 登录信息");
  }

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/gists/${encodeURIComponent(gistId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
  } catch {
    throw new Error("无法连接 GitHub 读取旧数据，请检查当前网络");
  }

  if (response.status === 401) throw new Error("旧版 GitHub Token 已失效，无法自动迁移");
  if (response.status === 403) throw new Error("旧版 Token 无权读取这个 Gist");
  if (response.status === 404) throw new Error("找不到旧版 Gist，可能已被删除或当前 Token 无权访问");
  if (!response.ok) throw new Error(`读取旧版 Gist 失败 (HTTP ${response.status})`);

  const gist = await response.json();
  const text = await readLegacyGistFile(gist, token);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("旧 Gist 中的 JSON 数据已损坏");
  }

  legacySnapshot = validateLegacyData(parsed);

  return Promise.all(
    legacySnapshot.readers.map(async reader => {
      const profileKey = await profileKeyForName(reader.name);
      return {
        reader,
        worksCount: legacySnapshot!.works.filter(work => work.readerId === reader.id).length,
        creativeCount: legacySnapshot!.creativeEntries.filter(entry => entry.readerId === reader.id).length,
        alreadyImported: Boolean(store.getItem(PROFILE_PREFIX + profileKey)),
      };
    }),
  );
}

export async function importLegacyReader(readerId: string, pin: string, overwrite = false): Promise<Reader> {
  assertPin(pin);
  const snapshot = legacySnapshot;
  if (!snapshot) throw new Error("请先读取旧版书架");

  const reader = snapshot.readers.find(item => item.id === readerId);
  if (!reader) throw new Error("没有找到这个旧版读者");

  const profileKey = await profileKeyForName(reader.name);
  const key = PROFILE_PREFIX + profileKey;
  const store = browserStorage();
  if (store.getItem(key) && !overwrite) throw new Error("本机已经存在同名书架");

  const encrypted = await encryptLegacyReader(snapshot, reader, pin);
  store.setItem(key, JSON.stringify(encrypted));

  const importedFlags = await Promise.all(
    snapshot.readers.map(async item => {
      const itemProfileKey = await profileKeyForName(item.name);
      return Boolean(store.getItem(PROFILE_PREFIX + itemProfileKey));
    }),
  );

  if (importedFlags.every(Boolean)) clearLegacyCredentials();
  return reader;
}
