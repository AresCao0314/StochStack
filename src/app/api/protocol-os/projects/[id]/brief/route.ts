import { NextResponse } from 'next/server';
import { protocolOsDb } from '@/core/protocol-os/db';
import { upsertBrief } from '@/core/protocol-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const brief = await protocolOsDb.brief.findUnique({ where: { projectId: params.id } });
    return NextResponse.json({ ok: true, data: brief });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const fieldsJson = typeof body.fieldsJson === 'object' && body.fieldsJson ? body.fieldsJson : {};
    const data = await upsertBrief(params.id, fieldsJson);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
