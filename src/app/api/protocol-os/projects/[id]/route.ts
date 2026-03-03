import { NextResponse } from 'next/server';
import { getProjectDetail } from '@/core/protocol-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await getProjectDetail(params.id);
    if (!data) {
      return NextResponse.json({ ok: false, error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
