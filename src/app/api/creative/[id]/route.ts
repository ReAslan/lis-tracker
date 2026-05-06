import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const entry = await prisma.creativeEntry.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const entry = await prisma.creativeEntry.update({
    where: { id: parseInt(params.id) },
    data: body,
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.creativeEntry.delete({
    where: { id: parseInt(params.id) },
  });

  return NextResponse.json({ success: true });
}
