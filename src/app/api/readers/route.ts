import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const readers = await prisma.reader.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(readers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const reader = await prisma.reader.create({
    data: { name: body.name, emoji: body.emoji || "🍑" },
  });
  return NextResponse.json(reader, { status: 201 });
}
