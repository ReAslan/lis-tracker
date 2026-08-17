const crypto = require("crypto");

const DATA_FILE = "lis-tracker-data.json";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const LOCK_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

function config() {
  const token = process.env.LIS_GITHUB_TOKEN;
  const gistId = process.env.LIS_GIST_ID;
  const sessionSecret = process.env.LIS_SESSION_SECRET;
  const allowedOrigins = (process.env.LIS_ALLOWED_ORIGINS || "https://reaslan.github.io")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!token || !gistId || !sessionSecret) {
    throw new Error("服务器缺少 LIS_GITHUB_TOKEN、LIS_GIST_ID 或 LIS_SESSION_SECRET");
  }
  if (sessionSecret.length < 32) {
    throw new Error("LIS_SESSION_SECRET 至少需要 32 个字符");
  }
  return { token, gistId, sessionSecret, allowedOrigins };
}

function emptyData() {
  return { readers: [], works: [], creativeEntries: [] };
}

function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function publicReader(reader) {
  return {
    id: reader.id,
    name: reader.name,
    emoji: reader.emoji || "🍑",
    createdAt: reader.createdAt,
  };
}

function hashPin(pin, salt) {
  return crypto.pbkdf2Sync(pin, salt, 120000, 32, "sha256").toString("hex");
}

function createPinRecord(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { pinSalt: salt, pinHash: hashPin(pin, salt) };
}

function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(String(a || ""), "hex");
    const right = Buffer.from(String(b || ""), "hex");
    return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signSession(readerId) {
  const { sessionSecret } = config();
  const payload = base64url(JSON.stringify({ readerId, exp: Date.now() + SESSION_TTL_MS }));
  const signature = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySession(token) {
  const { sessionSecret } = config();
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.readerId || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function loadData() {
  const { token, gistId } = config();
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`读取 GitHub 数据失败 (${res.status})`);
  const gist = await res.json();
  const file = gist.files && gist.files[DATA_FILE];
  if (!file || !file.content) return emptyData();
  try {
    const parsed = JSON.parse(file.content);
    return {
      readers: Array.isArray(parsed.readers) ? parsed.readers : [],
      works: Array.isArray(parsed.works) ? parsed.works : [],
      creativeEntries: Array.isArray(parsed.creativeEntries) ? parsed.creativeEntries : [],
    };
  } catch {
    return emptyData();
  }
}

async function saveData(data) {
  const { token, gistId } = config();
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      files: {
        [DATA_FILE]: { content: JSON.stringify(data, null, 2) },
      },
    }),
  });
  if (!res.ok) throw new Error(`保存 GitHub 数据失败 (${res.status})`);
}

function requestOrigin(event) {
  const headers = event.headers || {};
  return headers.origin || headers.Origin || "";
}

function response(event, statusCode, data) {
  const { allowedOrigins } = config();
  const origin = requestOrigin(event);
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "https://reaslan.github.io";
  return {
    statusCode,
    isBase64Encoded: false,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    },
    body: JSON.stringify(data),
  };
}

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

function getBearer(event) {
  const headers = event.headers || {};
  const auth = headers.authorization || headers.Authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

function validatePin(pin) {
  return /^\d{6}$/.test(String(pin || ""));
}

function requireOwnedWork(data, id, readerId) {
  return data.works.findIndex((item) => item.id === id && item.readerId === readerId);
}

function requireOwnedCreative(data, id, readerId) {
  return data.creativeEntries.findIndex((item) => item.id === id && item.readerId === readerId);
}

exports.main = async (event) => {
  try {
    if ((event.httpMethod || "").toUpperCase() === "OPTIONS") {
      return response(event, 204, {});
    }

    const body = parseBody(event);
    const action = String(body.action || "");

    if (action === "health") {
      return response(event, 200, { ok: true });
    }

    const data = await loadData();
    const now = new Date().toISOString();

    if (action === "register") {
      const name = String(body.name || "").trim().replace(/\s+/g, " ");
      const pin = String(body.pin || "");
      const emoji = String(body.emoji || "🍑");
      if (!name || name.length > 20) return response(event, 400, { error: "名字需要 1–20 个字符" });
      if (!validatePin(pin)) return response(event, 400, { error: "PIN 必须是 6 位数字" });

      const existing = data.readers.find((reader) => normalizeName(reader.name) === normalizeName(name));
      if (existing && existing.pinHash) {
        return response(event, 409, { error: "这个名字已经注册，请直接登录" });
      }

      let reader = existing;
      if (reader) {
        Object.assign(reader, createPinRecord(pin), { emoji, failedAttempts: 0, lockedUntil: null });
      } else {
        reader = {
          id: generateId("reader"),
          name,
          emoji,
          createdAt: now,
          ...createPinRecord(pin),
          failedAttempts: 0,
          lockedUntil: null,
        };
        data.readers.push(reader);
      }
      await saveData(data);
      return response(event, 200, { reader: publicReader(reader), token: signSession(reader.id) });
    }

    if (action === "login") {
      const name = String(body.name || "").trim();
      const pin = String(body.pin || "");
      const reader = data.readers.find((item) => normalizeName(item.name) === normalizeName(name));
      if (!reader || !reader.pinHash || !reader.pinSalt) {
        return response(event, 401, { error: "名字或 PIN 不正确；旧用户请先注册并绑定 PIN" });
      }
      if (reader.lockedUntil && new Date(reader.lockedUntil).getTime() > Date.now()) {
        return response(event, 429, { error: "连续输错次数过多，请 10 分钟后再试" });
      }

      const candidate = hashPin(pin, reader.pinSalt);
      if (!safeEqualHex(candidate, reader.pinHash)) {
        const failed = Number(reader.failedAttempts || 0) + 1;
        if (failed >= MAX_FAILED_ATTEMPTS) {
          reader.failedAttempts = 0;
          reader.lockedUntil = new Date(Date.now() + LOCK_MS).toISOString();
        } else {
          reader.failedAttempts = failed;
          reader.lockedUntil = null;
        }
        await saveData(data);
        return response(event, 401, { error: "名字或 PIN 不正确" });
      }

      if (reader.failedAttempts || reader.lockedUntil) {
        reader.failedAttempts = 0;
        reader.lockedUntil = null;
        await saveData(data);
      }
      return response(event, 200, { reader: publicReader(reader), token: signSession(reader.id) });
    }

    const session = verifySession(getBearer(event));
    if (!session) return response(event, 401, { error: "登录已过期，请重新登录" });
    const reader = data.readers.find((item) => item.id === session.readerId);
    if (!reader) return response(event, 401, { error: "用户不存在，请重新登录" });
    const readerId = reader.id;

    if (action === "me") return response(event, 200, publicReader(reader));

    if (action === "list-works") {
      let works = data.works.filter((item) => item.readerId === readerId);
      if (body.status) works = works.filter((item) => item.readingStatus === body.status);
      works.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return response(event, 200, works);
    }

    if (action === "get-work") {
      return response(event, 200, data.works.find((item) => item.id === body.id && item.readerId === readerId) || null);
    }

    if (action === "create-work") {
      const work = {
        ...(body.work || {}),
        id: generateId("work"),
        readerId,
        createdAt: now,
        updatedAt: now,
      };
      data.works.push(work);
      await saveData(data);
      return response(event, 200, work);
    }

    if (action === "update-work") {
      const index = requireOwnedWork(data, body.id, readerId);
      if (index < 0) return response(event, 404, { error: "作品不存在" });
      const old = data.works[index];
      data.works[index] = {
        ...old,
        ...(body.updates || {}),
        id: old.id,
        readerId,
        createdAt: old.createdAt,
        updatedAt: now,
      };
      await saveData(data);
      return response(event, 200, data.works[index]);
    }

    if (action === "delete-work") {
      const index = requireOwnedWork(data, body.id, readerId);
      if (index < 0) return response(event, 404, { error: "作品不存在" });
      data.works.splice(index, 1);
      await saveData(data);
      return response(event, 200, { ok: true });
    }

    if (action === "list-creative") {
      const entries = data.creativeEntries
        .filter((item) => item.readerId === readerId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return response(event, 200, entries);
    }

    if (action === "get-creative") {
      return response(event, 200, data.creativeEntries.find((item) => item.id === body.id && item.readerId === readerId) || null);
    }

    if (action === "create-creative") {
      const entry = {
        ...(body.entry || {}),
        id: generateId("creative"),
        readerId,
        createdAt: now,
        updatedAt: now,
      };
      data.creativeEntries.push(entry);
      await saveData(data);
      return response(event, 200, entry);
    }

    if (action === "update-creative") {
      const index = requireOwnedCreative(data, body.id, readerId);
      if (index < 0) return response(event, 404, { error: "创作记录不存在" });
      const old = data.creativeEntries[index];
      data.creativeEntries[index] = {
        ...old,
        ...(body.updates || {}),
        id: old.id,
        readerId,
        createdAt: old.createdAt,
        updatedAt: now,
      };
      await saveData(data);
      return response(event, 200, data.creativeEntries[index]);
    }

    if (action === "delete-creative") {
      const index = requireOwnedCreative(data, body.id, readerId);
      if (index < 0) return response(event, 404, { error: "创作记录不存在" });
      data.creativeEntries.splice(index, 1);
      await saveData(data);
      return response(event, 200, { ok: true });
    }

    return response(event, 400, { error: "未知操作" });
  } catch (error) {
    console.error("[lis-api]", error);
    try {
      return response(event, 500, { error: error instanceof Error ? error.message : "服务器操作失败" });
    } catch {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: "服务器配置错误" }),
      };
    }
  }
};
