import { NextRequest, NextResponse } from "next/server";

type Reader = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
};

type Work = {
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
};

type CreativeEntry = {
  id: string;
  title: string;
  content: string;
  readerId: string;
  createdAt: string;
  updatedAt: string;
};

type AppData = {
  readers: Reader[];
  works: Work[];
  creativeEntries: CreativeEntry[];
};

const DATA_FILE = "lis-tracker-data.json";

function config() {
  const token = process.env.LIS_GITHUB_TOKEN;
  const gistId = process.env.LIS_GIST_ID;
  if (!token || !gistId) {
    throw new Error("服务器尚未配置 LIS_GITHUB_TOKEN / LIS_GIST_ID");
  }
  return { token, gistId };
}

function emptyData(): AppData {
  return { readers: [], works: [], creativeEntries: [] };
}

function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

async function loadData(): Promise<AppData> {
  const { token, gistId } = config();
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`读取 GitHub 数据失败 (${res.status})`);
  }

  const gist = await res.json();
  const file = gist.files?.[DATA_FILE];
  if (!file?.content) return emptyData();

  try {
    const parsed = JSON.parse(file.content) as Partial<AppData>;
    return {
      readers: Array.isArray(parsed.readers) ? parsed.readers : [],
      works: Array.isArray(parsed.works) ? parsed.works : [],
      creativeEntries: Array.isArray(parsed.creativeEntries) ? parsed.creativeEntries : [],
    };
  } catch {
    return emptyData();
  }
}

async function saveData(data: AppData): Promise<void> {
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
        [DATA_FILE]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`保存 GitHub 数据失败 (${res.status})`);
  }
}

function ok(data: unknown = { ok: true }) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "服务器操作失败";
  console.error("[lis-tracker api]", error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const data = await loadData();
    const type = request.nextUrl.searchParams.get("type");
    const readerId = request.nextUrl.searchParams.get("readerId");
    const status = request.nextUrl.searchParams.get("status");
    const id = request.nextUrl.searchParams.get("id");

    if (type === "readers") return ok(data.readers);
    if (type === "work") return ok(data.works.find((item) => item.id === id) || null);
    if (type === "works") {
      let works = data.works.filter((item) => item.readerId === readerId);
      if (status) works = works.filter((item) => item.readingStatus === status);
      works.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      return ok(works);
    }
    if (type === "creative-entry") {
      return ok(data.creativeEntries.find((item) => item.id === id) || null);
    }
    if (type === "creative-entries") {
      return ok(
        data.creativeEntries
          .filter((item) => item.readerId === readerId)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      );
    }

    return NextResponse.json({ error: "Unknown query type" }, { status: 400 });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;
    const data = await loadData();
    const now = new Date().toISOString();

    if (action === "add-reader") {
      const name = String(body.name || "").trim();
      const emoji = String(body.emoji || "🍑");
      if (!name) return NextResponse.json({ error: "名字不能为空" }, { status: 400 });

      const duplicate = data.readers.find((reader) => reader.name.toLowerCase() === name.toLowerCase());
      if (duplicate) return ok(duplicate);

      const reader: Reader = { id: generateId(), name, emoji, createdAt: now };
      data.readers.push(reader);
      await saveData(data);
      return ok(reader);
    }

    if (action === "delete-reader") {
      const id = String(body.id || "");
      data.readers = data.readers.filter((reader) => reader.id !== id);
      data.works = data.works.filter((work) => work.readerId !== id);
      data.creativeEntries = data.creativeEntries.filter((entry) => entry.readerId !== id);
      await saveData(data);
      return ok();
    }

    if (action === "create-work") {
      const work: Work = { ...body.work, id: generateId(), createdAt: now, updatedAt: now };
      data.works.push(work);
      await saveData(data);
      return ok(work);
    }

    if (action === "update-work") {
      const index = data.works.findIndex((work) => work.id === body.id);
      if (index < 0) return NextResponse.json({ error: "Work not found" }, { status: 404 });
      data.works[index] = { ...data.works[index], ...body.updates, id: data.works[index].id, updatedAt: now };
      await saveData(data);
      return ok(data.works[index]);
    }

    if (action === "delete-work") {
      data.works = data.works.filter((work) => work.id !== body.id);
      await saveData(data);
      return ok();
    }

    if (action === "create-creative-entry") {
      const entry: CreativeEntry = { ...body.entry, id: generateId(), createdAt: now, updatedAt: now };
      data.creativeEntries.push(entry);
      await saveData(data);
      return ok(entry);
    }

    if (action === "update-creative-entry") {
      const index = data.creativeEntries.findIndex((entry) => entry.id === body.id);
      if (index < 0) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
      data.creativeEntries[index] = {
        ...data.creativeEntries[index],
        ...body.updates,
        id: data.creativeEntries[index].id,
        updatedAt: now,
      };
      await saveData(data);
      return ok(data.creativeEntries[index]);
    }

    if (action === "delete-creative-entry") {
      data.creativeEntries = data.creativeEntries.filter((entry) => entry.id !== body.id);
      await saveData(data);
      return ok();
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return fail(error);
  }
}
