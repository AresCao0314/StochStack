import { NextResponse } from 'next/server';
import { db } from '@/lib/protocolWorkflow/db';
import { runValidationForRun, transitionRunStatus } from '@/lib/protocolWorkflow';
import { RUN_STATUS } from '@/lib/protocolWorkflow/extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await db.extractionRun.findUnique({
      where: { id: params.runId },
      include: { study: true, document: true }
    });

    if (!run) {
      return NextResponse.json({ ok: false, error: 'Run not found.' }, { status: 404 });
    }

    const report = await runValidationForRun(params.runId);

    return NextResponse.json({ ok: true, data: { run, report } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { runId: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const actor = String(body.actor ?? 'workflow.validator');
    const report = await runValidationForRun(params.runId);

    if (report.status === 'fail') {
      await transitionRunStatus(params.runId, RUN_STATUS.review, actor, 'validate.failed', {
        errors: report.errors.length,
        warnings: report.warnings.length
      });
    } else {
      await transitionRunStatus(params.runId, RUN_STATUS.validated, actor, 'validate.passed', {
        errors: 0,
        warnings: report.warnings.length
      });
    }

    return NextResponse.json({ ok: true, data: report });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
