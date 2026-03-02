import { db } from '@/lib/protocolWorkflow/db';
import { REVIEW_STATE, RUN_STATUS } from '@/lib/protocolWorkflow/extraction';

export async function updateReviewField(input: {
  runId: string;
  fieldId: string;
  action: 'accept' | 'edit' | 'reject';
  actor: string;
  editedValue?: unknown;
  reason?: string;
}) {
  const field = await db.extractedField.findUnique({ where: { id: input.fieldId } });
  if (!field || field.runId !== input.runId) {
    throw new Error('Field not found in run');
  }

  const nextState =
    input.action === 'accept'
      ? REVIEW_STATE.accepted
      : input.action === 'edit'
        ? REVIEW_STATE.edited
        : REVIEW_STATE.rejected;

  const updated = await db.extractedField.update({
    where: { id: input.fieldId },
    data: {
      reviewerState: nextState,
      reviewerEdits: input.action === 'edit' ? JSON.stringify(input.editedValue ?? null) : null,
      reviewReason: input.reason ?? null
    }
  });

  await db.auditLog.create({
    data: {
      actor: input.actor,
      action: `review.${input.action}`,
      entityType: 'ExtractedField',
      entityId: input.fieldId,
      payload: JSON.stringify({
        runId: input.runId,
        fieldPath: field.path,
        editedValue: input.editedValue ?? null,
        reason: input.reason ?? null
      })
    }
  });

  return updated;
}

export async function getReviewSummary(runId: string) {
  const fields = await db.extractedField.findMany({ where: { runId } });
  const pending = fields.filter((field) => field.reviewerState === REVIEW_STATE.pending).length;
  const accepted = fields.filter((field) => field.reviewerState === REVIEW_STATE.accepted).length;
  const edited = fields.filter((field) => field.reviewerState === REVIEW_STATE.edited).length;
  const rejected = fields.filter((field) => field.reviewerState === REVIEW_STATE.rejected).length;

  return {
    total: fields.length,
    pending,
    accepted,
    edited,
    rejected
  };
}

export async function submitReviewForValidation(runId: string, actor: string) {
  const run = await db.extractionRun.update({
    where: { id: runId },
    data: {
      status: RUN_STATUS.validated
    }
  });

  await db.auditLog.create({
    data: {
      actor,
      action: 'review.submitted_for_validation',
      entityType: 'ExtractionRun',
      entityId: runId,
      payload: JSON.stringify({ status: RUN_STATUS.validated })
    }
  });

  return run;
}
