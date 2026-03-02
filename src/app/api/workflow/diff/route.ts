import { NextResponse } from 'next/server';
import { computeImpactList, generateChangeSet } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const baseRunId = String(body.baseRunId ?? '').trim();
    const compareRunId = String(body.compareRunId ?? '').trim();

    if (!baseRunId || !compareRunId) {
      return NextResponse.json({ ok: false, error: 'baseRunId and compareRunId are required.' }, { status: 400 });
    }

    const changeSet = await generateChangeSet(baseRunId, compareRunId);
    const impacts = computeImpactList(JSON.parse(changeSet.changes) as never);

    return NextResponse.json({ ok: true, data: { changeSet, impacts } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
