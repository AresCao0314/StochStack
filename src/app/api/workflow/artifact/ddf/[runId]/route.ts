import { NextResponse } from 'next/server';
import { buildArtifactsForRun } from '@/lib/protocolWorkflow';
import { db } from '@/lib/protocolWorkflow/db';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { runId: string } }) {
  const run = await db.extractionRun.findUnique({ where: { id: params.runId }, include: { ddfArtifact: true } });
  if (!run) {
    return NextResponse.json({ ok: false, error: 'Run not found.' }, { status: 404 });
  }

  const ddf = run.ddfArtifact?.ddfJson ? JSON.parse(run.ddfArtifact.ddfJson) : (await buildArtifactsForRun(run.id)).ddf;
  return NextResponse.json({ ok: true, data: ddf }, {
    headers: {
      'Content-Disposition': `attachment; filename="ddf-${run.id}.json"`
    }
  });
}
