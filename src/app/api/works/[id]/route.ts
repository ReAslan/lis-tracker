import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const work = await prisma.work.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!work) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(work);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const work = await prisma.work.update({
    where: { id: parseInt(params.id) },
    data: body,
  });

  return NextResponse.json(work);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.work.delete({
    where: { id: parseInt(params.id) },
  });

  return NextResponse.json({ success: true });
}
