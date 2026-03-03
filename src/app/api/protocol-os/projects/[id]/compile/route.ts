import { NextResponse } from 'next/server';
import { compileProjectArtifacts } from '@/core/protocol-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await compileProjectArtifacts(params.id, 'local-user');
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
