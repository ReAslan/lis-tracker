const PROFILE_PREFIX = "lis_local_vault_";
const BACKUP_FORMAT = "lis-local-vault";
const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;

const isBrowser = typeof window !== "undefined";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface VaultData {
  reader: Reader;
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

interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  profileKey: string;
  vault: StoredVault;
}

interface ActiveVault {
  profileKey: string;
  key: CryptoKey;
  stored: StoredVault;
  data: VaultData;
}

let activeVault: ActiveVault | null = null;

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

function storage(): Storage {
  if (!isBrowser) throw new Error("本地存储只能在浏览器中使用");
  return window.localStorage;
}

function writeStorage(key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch (err) {
    if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      throw new Error("浏览器本地存储空间不足。请先导出备份并清理部分站点数据后再试");
    }
    throw new Error("浏览器拒绝写入本地数据，请检查隐私/存储设置");
  }
}

function normalizeName(name: string): string {
  return name.trim().normalize("NFKC").toLocaleLowerCase();
}

function assertPin(pin: string) {
  if (!/^\d{6}$/.test(pin)) throw new Error("PIN 必须是 6 位数字");
}

function generateId(): string {
  if (isBrowser && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function profileKeyForName(name: string): Promise<string> {
  const normalized = normalizeName(name);
  if (!normalized) throw new Error("请输入昵称");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(normalized));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function deriveVaultKey(pin: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  assertPin(pin);
  if (iterations !== PBKDF2_ITERATIONS) throw new Error("不支持的加密参数");
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptVault(data: VaultData, key: CryptoKey, stored: StoredVault): Promise<StoredVault> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    encoder.encode(JSON.stringify(data)),
  );

  return {
    ...stored,
    cipher: {
      name: "AES-GCM",
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(encrypted)),
    },
  };
}

async function decryptVault(stored: StoredVault, key: CryptoKey): Promise<VaultData> {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(stored.cipher.iv)) },
      key,
      toArrayBuffer(base64ToBytes(stored.cipher.data)),
    );
    const parsed = JSON.parse(decoder.decode(decrypted)) as VaultData;
    if (!parsed?.reader?.id || !Array.isArray(parsed.works) || !Array.isArray(parsed.creativeEntries)) {
      throw new Error("invalid vault");
    }
    return parsed;
  } catch {
    throw new Error("昵称或 PIN 不正确，或本地书架数据已损坏");
  }
}

function parseStoredVault(raw: string): StoredVault {
  const parsed = JSON.parse(raw) as StoredVault;
  if (
    parsed?.version !== VAULT_VERSION ||
    parsed?.kdf?.name !== "PBKDF2" ||
    parsed?.kdf?.hash !== "SHA-256" ||
    parsed?.kdf?.iterations !== PBKDF2_ITERATIONS ||
    parsed?.cipher?.name !== "AES-GCM" ||
    !parsed.kdf.salt ||
    !parsed.cipher.iv ||
    !parsed.cipher.data
  ) {
    throw new Error("本地书架数据格式无效");
  }
  return parsed;
}

function getActive(): ActiveVault {
  if (!activeVault) throw new Error("书架已锁定，请重新登录");
  return activeVault;
}

async function commitActive(nextData: VaultData): Promise<void> {
  const active = getActive();
  const nextStored = await encryptVault(nextData, active.key, active.stored);
  writeStorage(PROFILE_PREFIX + active.profileKey, JSON.stringify(nextStored));
  active.stored = nextStored;
  active.data = nextData;
}

export function isConfigured(): boolean {
  if (!isBrowser) return false;
  try {
    const testKey = "__lis_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return Boolean(window.crypto?.subtle);
  } catch {
    return false;
  }
}

export async function register(name: string, pin: string, emoji: string): Promise<Reader> {
  if (!isConfigured()) throw new Error("当前浏览器不支持安全本地存储");
  assertPin(pin);
  const cleanName = name.trim();
  if (!cleanName) throw new Error("请输入昵称");
  if (cleanName.length > 24) throw new Error("昵称最多 24 个字符");

  const profileKey = await profileKeyForName(cleanName);
  if (storage().getItem(PROFILE_PREFIX + profileKey)) {
    throw new Error("这个昵称已经在本机注册，请直接登录");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const stored: StoredVault = {
    version: VAULT_VERSION,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: { name: "AES-GCM", iv: "", data: "" },
  };
  const key = await deriveVaultKey(pin, salt, PBKDF2_ITERATIONS);
  const reader: Reader = {
    id: generateId(),
    name: cleanName,
    emoji: emoji || "🍑",
    createdAt: new Date().toISOString(),
  };
  const data: VaultData = { reader, works: [], creativeEntries: [] };
  const encrypted = await encryptVault(data, key, stored);
  writeStorage(PROFILE_PREFIX + profileKey, JSON.stringify(encrypted));
  activeVault = { profileKey, key, stored: encrypted, data };
  return reader;
}

export async function login(name: string, pin: string): Promise<Reader> {
  if (!isConfigured()) throw new Error("当前浏览器不支持安全本地存储");
  assertPin(pin);
  const profileKey = await profileKeyForName(name);
  const raw = storage().getItem(PROFILE_PREFIX + profileKey);
  if (!raw) throw new Error("昵称或 PIN 不正确");

  let stored: StoredVault;
  try {
    stored = parseStoredVault(raw);
  } catch {
    throw new Error("本地书架数据损坏，请尝试从备份恢复");
  }

  const key = await deriveVaultKey(pin, base64ToBytes(stored.kdf.salt), stored.kdf.iterations);
  const data = await decryptVault(stored, key);
  activeVault = { profileKey, key, stored, data };
  return data.reader;
}

export function logout() {
  activeVault = null;
}

export async function restoreSession(): Promise<Reader | null> {
  return activeVault?.data.reader ?? null;
}

export async function exportBackup(): Promise<string> {
  const active = getActive();
  const latestRaw = storage().getItem(PROFILE_PREFIX + active.profileKey);
  if (!latestRaw) throw new Error("没有可导出的本地书架");
  const backup: BackupFile = {
    format: BACKUP_FORMAT,
    version: VAULT_VERSION,
    exportedAt: new Date().toISOString(),
    profileKey: active.profileKey,
    vault: parseStoredVault(latestRaw),
  };
  return JSON.stringify(backup, null, 2);
}

export async function importBackup(text: string, pin: string, overwrite = false): Promise<Reader> {
  assertPin(pin);
  let backup: BackupFile;
  try {
    backup = JSON.parse(text) as BackupFile;
  } catch {
    throw new Error("备份文件不是有效的 JSON 文件");
  }

  if (backup?.format !== BACKUP_FORMAT || backup?.version !== VAULT_VERSION || !backup.profileKey || !backup.vault) {
    throw new Error("这不是 Li's 李子的有效备份文件");
  }

  const stored = backup.vault;
  parseStoredVault(JSON.stringify(stored));
  const key = await deriveVaultKey(pin, base64ToBytes(stored.kdf.salt), stored.kdf.iterations);
  const data = await decryptVault(stored, key);
  const expectedProfileKey = await profileKeyForName(data.reader.name);
  if (expectedProfileKey !== backup.profileKey) throw new Error("备份文件校验失败");

  const storageKey = PROFILE_PREFIX + backup.profileKey;
  if (storage().getItem(storageKey) && !overwrite) {
    throw new Error("本机已经存在同名书架");
  }

  writeStorage(storageKey, JSON.stringify(stored));
  activeVault = { profileKey: backup.profileKey, key, stored, data };
  return data.reader;
}

export async function getWorks(readerId: string, status?: string): Promise<Work[]> {
  const active = getActive();
  if (active.data.reader.id !== readerId) return [];
  let works = [...active.data.works];
  if (status) works = works.filter(work => work.readingStatus === status);
  return works.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getWork(id: string): Promise<Work | null> {
  const active = getActive();
  return active.data.works.find(work => work.id === id && work.readerId === active.data.reader.id) || null;
}

export async function createWork(work: Omit<Work, "id" | "createdAt" | "updatedAt">): Promise<Work> {
  const active = getActive();
  const now = new Date().toISOString();
  const newWork: Work = {
    ...work,
    readerId: active.data.reader.id,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const nextData: VaultData = {
    ...active.data,
    works: [...active.data.works, newWork],
  };
  await commitActive(nextData);
  return newWork;
}

export async function updateWork(id: string, updates: Partial<Work>): Promise<Work> {
  const active = getActive();
  const index = active.data.works.findIndex(work => work.id === id && work.readerId === active.data.reader.id);
  if (index === -1) throw new Error("作品不存在");
  const current = active.data.works[index];
  const updated: Work = {
    ...current,
    ...updates,
    id: current.id,
    readerId: active.data.reader.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };
  const works = [...active.data.works];
  works[index] = updated;
  await commitActive({ ...active.data, works });
  return updated;
}

export async function deleteWork(id: string): Promise<void> {
  const active = getActive();
  const works = active.data.works.filter(
    work => !(work.id === id && work.readerId === active.data.reader.id),
  );
  await commitActive({ ...active.data, works });
}

export async function getCreativeEntries(readerId: string): Promise<CreativeEntry[]> {
  const active = getActive();
  if (active.data.reader.id !== readerId) return [];
  return [...active.data.creativeEntries]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getCreativeEntry(id: string): Promise<CreativeEntry | null> {
  const active = getActive();
  return active.data.creativeEntries.find(
    entry => entry.id === id && entry.readerId === active.data.reader.id,
  ) || null;
}

export async function createCreativeEntry(
  entry: Omit<CreativeEntry, "id" | "createdAt" | "updatedAt">,
): Promise<CreativeEntry> {
  const active = getActive();
  const now = new Date().toISOString();
  const newEntry: CreativeEntry = {
    ...entry,
    readerId: active.data.reader.id,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const nextData: VaultData = {
    ...active.data,
    creativeEntries: [...active.data.creativeEntries, newEntry],
  };
  await commitActive(nextData);
  return newEntry;
}

export async function updateCreativeEntry(
  id: string,
  updates: Partial<CreativeEntry>,
): Promise<CreativeEntry> {
  const active = getActive();
  const index = active.data.creativeEntries.findIndex(
    entry => entry.id === id && entry.readerId === active.data.reader.id,
  );
  if (index === -1) throw new Error("创作不存在");
  const current = active.data.creativeEntries[index];
  const updated: CreativeEntry = {
    ...current,
    ...updates,
    id: current.id,
    readerId: active.data.reader.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };
  const creativeEntries = [...active.data.creativeEntries];
  creativeEntries[index] = updated;
  await commitActive({ ...active.data, creativeEntries });
  return updated;
}

export async function deleteCreativeEntry(id: string): Promise<void> {
  const active = getActive();
  const creativeEntries = active.data.creativeEntries.filter(
    entry => !(entry.id === id && entry.readerId === active.data.reader.id),
  );
  await commitActive({ ...active.data, creativeEntries });
}
