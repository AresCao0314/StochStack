'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ArrowRightLeft, Bot, ShieldAlert } from 'lucide-react';
import type { AgentMessage } from '@/lib/opsTwin/types';

const roleColor: Record<string, string> = {
  CTM_Orchestrator: 'bg-accent1/20 border-accent1/50',
  Country_Feasibility_Agent: 'bg-accent2/20 border-accent2/50',
  Site_Scout_Agent: 'bg-accent3/20 border-accent3/50',
  StartUp_Workflow_Agent: 'bg-orange-100 border-orange-300',
  Recruitment_Dynamics_Agent: 'bg-blue-100 border-blue-300',
  Risk_Officer_Agent: 'bg-red-100 border-red-300'
};

export function AgentTimeline({
  messages,
  onViewDiff
}: {
  messages: AgentMessage[];
  onViewDiff: (message: AgentMessage) => void;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const rendered = useMemo(() => messages, [messages]);

  return (
    <section className="noise-border rounded-lg p-4">
      <p className="section-title">A2A Conversation Thread</p>
      <div className="mt-3 max-h-[720px] space-y-3 overflow-y-auto pr-1">
        {rendered.map((msg) => (
          <article key={msg.id} className="scanline rounded border border-ink/15 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`rounded border px-2 py-0.5 text-xs ${roleColor[msg.agent] || 'border-ink/20 bg-warm'}`}>
                  <Bot size={12} className="mr-1 inline" />
                  {msg.agent}
                </span>
                <span className="text-xs text-ink/60">{msg.role}</span>
                {msg.transport ? (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
                      msg.transport === 'remote' ? 'bg-blue-100 text-blue-700' : 'bg-ink/10 text-ink/70'
                    }`}
                  >
                    {msg.transport}
                  </span>
                ) : null}
                {msg.handoffTo ? (
                  <span className="text-xs text-ink/60">
                    <ArrowRightLeft size={12} className="mr-1 inline" />handoff to {msg.handoffTo}
                  </span>
                ) : null}
              </div>
              <span className="font-mono text-xs text-ink/60">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>

            <p className="mt-2 text-sm text-ink/85">{msg.text}</p>

            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-ink/60">
              {typeof msg.latencyMs === 'number' ? <span>latency: {msg.latencyMs}ms</span> : null}
              {msg.remoteEndpoint ? <span>endpoint: {msg.remoteEndpoint}</span> : null}
              {msg.deliveryStatus ? <span>delivery: {msg.deliveryStatus}</span> : null}
              {typeof msg.retryCount === 'number' && msg.retryCount > 0 ? <span>retries: {msg.retryCount}</span> : null}
            </div>

            {msg.attachments?.length ? (
              <div className="mt-2 grid gap-2">
                {msg.attachments.map((att, idx) => (
                  <div key={`${msg.id}-att-${idx}`} className="rounded border border-ink/15 bg-base/60 p-2 text-xs">
                    <p className="font-semibold">{att.type}</p>
                    <p className="mt-1 text-ink/70">{JSON.stringify(att.data)}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-ink/60">context events: {msg.eventIds.length}</span>
              <button
                type="button"
                disabled={msg.eventIds.length === 0}
                onClick={() => onViewDiff(msg)}
                className="rounded border border-ink/20 px-2 py-1 text-xs disabled:opacity-40"
              >
                <ShieldAlert size={12} className="mr-1 inline" /> View context diff
              </button>
            </div>
          </article>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  );
}
