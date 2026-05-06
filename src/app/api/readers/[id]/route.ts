import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.reader.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ success: true });
}
