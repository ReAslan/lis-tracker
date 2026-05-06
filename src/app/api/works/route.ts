import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const readerId = searchParams.get("readerId");

  const where: any = {};
  if (status) where.readingStatus = status;
  if (readerId) where.readerId = parseInt(readerId);

  const works = await prisma.work.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(works);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const work = await prisma.work.create({ data: body });
  return NextResponse.json(work, { status: 201 });
}
