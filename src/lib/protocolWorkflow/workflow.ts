import type { WorkflowStepKey, WorkflowStepState } from '@/lib/protocolWorkflow/types';
import { RUN_STATUS } from '@/lib/protocolWorkflow/extraction';

export const workflowSteps: Array<{ key: WorkflowStepKey; label: string; description: string }> = [
  {
    key: 'ingest',
    label: 'Ingest',
    description: 'Import protocol/amendment files and preserve source-of-truth text for traceability.'
  },
  {
    key: 'extract',
    label: 'Extract',
    description: 'Use LLM/parser to convert unstructured protocol text into structured fields with evidence.'
  },
  {
    key: 'review',
    label: 'Review',
    description: 'Human reviewers accept, edit, or reject extracted fields while keeping audit history.'
  },
  {
    key: 'validate',
    label: 'Validate',
    description: 'Rule engine checks structure consistency and highlights potential quality/compliance risks.'
  },
  {
    key: 'publish',
    label: 'Publish',
    description: 'Generate USDM and DDF artifacts and package outputs for downstream use.'
  },
  {
    key: 'feedback',
    label: 'Feedback',
    description: 'Import operational amendments and connect signals back to design objects for continuous improvement.'
  }
];

export function statusToStepState(status: string | null, step: WorkflowStepKey): WorkflowStepState {
  if (!status) {
    return step === 'ingest' ? 'not_started' : 'not_started';
  }

  const order: WorkflowStepKey[] = ['ingest', 'extract', 'review', 'validate', 'publish', 'feedback'];
  const current =
    status === RUN_STATUS.queued || status === RUN_STATUS.running
      ? 'extract'
      : status === RUN_STATUS.review
        ? 'review'
        : status === RUN_STATUS.validated
          ? 'validate'
          : status === RUN_STATUS.published
            ? 'publish'
            : status === RUN_STATUS.failed
              ? 'extract'
              : 'extract';

  const idx = order.indexOf(step);
  const currentIdx = order.indexOf(current);

  if (status === RUN_STATUS.failed && step === current) {
    return 'failed';
  }

  if (idx < currentIdx) return 'completed';
  if (idx === currentIdx) return status === RUN_STATUS.running ? 'in_progress' : 'completed';

  if (step === 'feedback' && status === RUN_STATUS.published) return 'in_progress';

  return 'not_started';
}
