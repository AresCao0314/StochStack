import { NextResponse } from 'next/server';
import { createProject, listProjects } from '@/core/protocol-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await listProjects();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const indication = String(body.indication ?? '').trim();
    const phase = String(body.phase ?? '').trim();

    if (!name || !indication || !phase) {
      return NextResponse.json({ ok: false, error: 'name, indication, phase are required' }, { status: 400 });
    }

    const data = await createProject({ name, indication, phase });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
