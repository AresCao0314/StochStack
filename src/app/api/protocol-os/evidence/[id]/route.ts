import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { protocolOsDb } from '@/core/protocol-os/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data = await protocolOsDb.evidenceSnippet.update({
      where: { id: params.id },
      data: {
        title: body.title ? String(body.title) : undefined,
        text: body.text ? String(body.text) : undefined,
        sourceType: body.sourceType ? String(body.sourceType) : undefined,
        sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : undefined,
        confidence: typeof body.confidence === 'number' ? body.confidence : undefined,
        tagsJson: Array.isArray(body.tags) ? (body.tags as Prisma.JsonArray) : undefined
      }
    });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await protocolOsDb.evidenceSnippet.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
