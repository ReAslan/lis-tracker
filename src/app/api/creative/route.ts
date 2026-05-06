import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const readerId = searchParams.get("readerId");

  const where: any = {};
  if (readerId) where.readerId = parseInt(readerId);

  const entries = await prisma.creativeEntry.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const entry = await prisma.creativeEntry.create({ data: body });
  return NextResponse.json(entry, { status: 201 });
}
