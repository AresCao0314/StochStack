'use client';

import type { AgentMessage, ContextRoot } from '@/lib/opsTwin/types';

export function OpsTwinDiffDrawer({
  open,
  message,
  context,
  onClose
}: {
  open: boolean;
  message: AgentMessage | null;
  context: ContextRoot | null;
  onClose: () => void;
}) {
  if (!open || !message || !context) return null;
  const events = context.eventLog.filter((evt) => message.eventIds.includes(evt.id));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/20" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl overflow-y-auto border-l border-ink/20 bg-base p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Context Diff · {message.agent}</h3>
          <button type="button" onClick={onClose} className="rounded border border-ink/20 px-2 py-1 text-xs">
            Close
          </button>
        </div>

        <div className="space-y-3">
          {events.map((event) => (
            <article key={event.id} className="rounded border border-ink/15 p-3 text-xs">
              <p className="font-mono text-ink/60">{event.timestamp}</p>
              <p className="mt-1 font-semibold">{event.patch.op.toUpperCase()} {event.patch.path}</p>
              <p className="mt-1 text-ink/70">{event.patch.rationale}</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div className="rounded border border-ink/10 p-2">
                  <p className="mb-1 font-semibold">Before</p>
                  <pre className="whitespace-pre-wrap break-all text-[11px] text-ink/70">
                    {JSON.stringify(event.before, null, 2)}
                  </pre>
                </div>
                <div className="rounded border border-ink/10 p-2">
                  <p className="mb-1 font-semibold">After</p>
                  <pre className="whitespace-pre-wrap break-all text-[11px] text-ink/70">
                    {JSON.stringify(event.after, null, 2)}
                  </pre>
                </div>
              </div>
            </article>
          ))}
          {events.length === 0 ? <p className="text-sm text-ink/65">No patches linked to this message.</p> : null}
        </div>
      </aside>
    </div>
  );
}
