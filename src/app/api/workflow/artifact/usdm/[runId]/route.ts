import { NextResponse } from 'next/server';
import { buildArtifactsForRun } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { runId: string } }) {
  const run = await db.extractionRun.findUnique({ where: { id: params.runId }, include: { usdmArtifact: true } });
  if (!run) {
    return NextResponse.json({ ok: false, error: 'Run not found.' }, { status: 404 });
  }

  const usdm = run.usdmArtifact?.usdmJson ? JSON.parse(run.usdmArtifact.usdmJson) : (await buildArtifactsForRun(run.id)).usdm;
  return NextResponse.json({ ok: true, data: usdm }, {
    headers: {
      'Content-Disposition': `attachment; filename="usdm-${run.id}.json"`
    }
  });
}
