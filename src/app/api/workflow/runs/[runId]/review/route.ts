import { NextResponse } from 'next/server';
import { getRun, getReviewSummary, submitReviewForValidation, updateReviewField } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { runId: string } }) {
  try {
    const run = await getRun(params.runId);
    if (!run) {
      return NextResponse.json({ ok: false, error: 'Run not found.' }, { status: 404 });
    }

    const summary = await getReviewSummary(params.runId);

    return NextResponse.json({ ok: true, data: { run, summary } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { runId: string } }) {
  try {
    const body = await request.json();
    const mode = String(body.mode ?? 'field');

    if (mode === 'submit') {
      const actor = String(body.actor ?? 'workflow.reviewer');
      const run = await submitReviewForValidation(params.runId, actor);
      return NextResponse.json({ ok: true, data: run });
    }

    const fieldId = String(body.fieldId ?? '');
    const action = String(body.action ?? '') as 'accept' | 'edit' | 'reject';
    const actor = String(body.actor ?? 'workflow.reviewer');

    if (!fieldId || !['accept', 'edit', 'reject'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'fieldId and action are required.' }, { status: 400 });
    }

    const updated = await updateReviewField({
      runId: params.runId,
      fieldId,
      action,
      actor,
      editedValue: body.editedValue,
      reason: body.reason
    });

    const summary = await getReviewSummary(params.runId);

    return NextResponse.json({ ok: true, data: { field: updated, summary } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
