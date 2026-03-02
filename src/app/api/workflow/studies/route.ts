import { NextResponse } from 'next/server';
import { createStudy, listStudies } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const studies = await listStudies();
    return NextResponse.json({ ok: true, data: studies });
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
      return NextResponse.json({ ok: false, error: 'name, indication, phase are required.' }, { status: 400 });
    }

    const study = await createStudy({ name, indication, phase });
    return NextResponse.json({ ok: true, data: study });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
