import type { WorkflowStepState } from '@/lib/protocolWorkflow/types';

const stateClass: Record<WorkflowStepState, string> = {
  not_started: 'border-ink/20 text-ink/55',
  in_progress: 'border-accent2 text-ink bg-accent2/20',
  completed: 'border-accent1 text-ink bg-accent1/20',
  failed: 'border-red-400 text-red-700 bg-red-100/70'
};

export function WorkflowStatusBadge({ state }: { state: WorkflowStepState }) {
  return (
    <span className={`inline-flex rounded border px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${stateClass[state]}`}>
      {state.replace('_', ' ')}
    </span>
  );
}
