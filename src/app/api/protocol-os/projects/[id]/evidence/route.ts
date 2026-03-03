import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { protocolOsDb } from '@/core/protocol-os/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await protocolOsDb.evidenceSnippet.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    const data = await protocolOsDb.evidenceSnippet.create({
      data: {
        projectId: params.id,
        title: String(body.title ?? 'Untitled snippet'),
        text: String(body.text ?? ''),
        sourceType: String(body.sourceType ?? 'internal_note'),
        sourceRef: body.sourceRef ? String(body.sourceRef) : null,
        confidence: Number(body.confidence ?? 0.7),
        publishedDate: body.publishedDate ? new Date(String(body.publishedDate)) : null,
        tagsJson: Array.isArray(body.tags) ? (body.tags as Prisma.JsonArray) : []
      }
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
