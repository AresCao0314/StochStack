import { NextResponse } from 'next/server';
import { getRun } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await getRun(params.runId);
    if (!run) {
      return NextResponse.json({ ok: false, error: 'Run not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: run });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
