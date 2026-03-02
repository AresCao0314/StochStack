import { NextResponse } from 'next/server';
import { buildArtifactsForRun, transitionRunStatus } from '@/lib/protocolWorkflow';
import { RUN_STATUS } from '@/lib/protocolWorkflow/extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { runId: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const actor = String(body.actor ?? 'workflow.publisher');

    const artifacts = await buildArtifactsForRun(params.runId);

    await transitionRunStatus(params.runId, RUN_STATUS.published, actor, 'publish.completed', {
      usdm: true,
      ddf: true
    });

    return NextResponse.json({ ok: true, data: artifacts });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
