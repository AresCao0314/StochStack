'use client';

import { useMemo } from 'react';
import type { Locale } from '@/lib/i18n';
import type { AgentMessage } from '@/lib/opsTwin/types';

const remoteAgents = [
  'Country_Feasibility_Agent',
  'Site_Scout_Agent',
  'StartUp_Workflow_Agent',
  'Recruitment_Dynamics_Agent',
  'Risk_Officer_Agent'
] as const;

const copyByLocale: Record<Locale, { title: string; retryLabel: string; remoteCalls: string; failedCalls: string }> = {
  en: {
    title: 'A2A Topology',
    retryLabel: 'Remote Retry Counter',
    remoteCalls: 'Remote Calls',
    failedCalls: 'Fallbacks'
  },
  zh: {
    title: 'A2A 拓扑图',
    retryLabel: '远程重试计数器',
    remoteCalls: '远程调用次数',
    failedCalls: '回退次数'
  },
  de: {
    title: 'A2A-Topologie',
    retryLabel: 'Remote-Retry-Zähler',
    remoteCalls: 'Remote-Aufrufe',
    failedCalls: 'Fallbacks'
  }
};

function nodeColor(status: 'ok' | 'retry' | 'failed' | 'idle') {
  if (status === 'failed') return 'rgba(239,68,68,0.9)';
  if (status === 'retry') return 'rgba(245,158,11,0.9)';
  if (status === 'ok') return 'rgba(0,228,124,0.9)';
  return 'rgba(11,15,20,0.22)';
}

export function OpsTopologyPanel({ locale, messages }: { locale: Locale; messages: AgentMessage[] }) {
  const t = copyByLocale[locale];

  const metrics = useMemo(() => {
    const latestStatus = new Map<string, 'ok' | 'retry' | 'failed' | 'idle'>();
    const retries = messages.reduce((sum, m) => sum + (m.retryCount || 0), 0);
    const remoteCalls = messages.filter((m) => m.transport === 'remote').length;
    const fallbackCalls = messages.filter((m) => m.deliveryStatus === 'retry' && m.transport === 'local').length;

    for (const agent of remoteAgents) {
      latestStatus.set(agent, 'idle');
    }

    messages.forEach((m) => {
      if (remoteAgents.includes(m.agent as (typeof remoteAgents)[number])) {
        latestStatus.set(m.agent, m.deliveryStatus || 'ok');
      }
    });

    return {
      latestStatus,
      retries,
      remoteCalls,
      fallbackCalls
    };
  }, [messages]);

  const pos = {
    orchestrator: { x: 190, y: 120 },
    Country_Feasibility_Agent: { x: 70, y: 36 },
    Site_Scout_Agent: { x: 190, y: 28 },
    StartUp_Workflow_Agent: { x: 310, y: 36 },
    Recruitment_Dynamics_Agent: { x: 100, y: 210 },
    Risk_Officer_Agent: { x: 280, y: 210 }
  } as const;

  return (
    <section className="noise-border rounded-lg p-4">
      <p className="section-title">{t.title}</p>
      <div className="mt-2 grid gap-3 md:grid-cols-3">
        <div className="rounded border border-ink/15 p-2 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.retryLabel}</p>
          <p className="mt-1 text-xl font-semibold">{metrics.retries}</p>
        </div>
        <div className="rounded border border-ink/15 p-2 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.remoteCalls}</p>
          <p className="mt-1 text-xl font-semibold">{metrics.remoteCalls}</p>
        </div>
        <div className="rounded border border-ink/15 p-2 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.failedCalls}</p>
          <p className="mt-1 text-xl font-semibold">{metrics.fallbackCalls}</p>
        </div>
      </div>

      <svg viewBox="0 0 380 250" className="mt-3 h-[260px] w-full" role="img" aria-label="A2A topology graph">
        {remoteAgents.map((agent) => (
          <line
            key={`edge-${agent}`}
            x1={pos.orchestrator.x}
            y1={pos.orchestrator.y}
            x2={pos[agent].x}
            y2={pos[agent].y}
            stroke="rgba(11,15,20,0.2)"
            strokeWidth="1.2"
          />
        ))}

        <g>
          <circle cx={pos.orchestrator.x} cy={pos.orchestrator.y} r="26" fill="rgba(146,139,222,0.9)" />
          <text x={pos.orchestrator.x} y={pos.orchestrator.y + 4} textAnchor="middle" fontSize="10" fill="#0b0f14">
            ORCH
          </text>
        </g>

        {remoteAgents.map((agent) => {
          const status = metrics.latestStatus.get(agent) || 'idle';
          return (
            <g key={`node-${agent}`}>
              <circle cx={pos[agent].x} cy={pos[agent].y} r="20" fill={nodeColor(status)} />
              <text x={pos[agent].x} y={pos[agent].y + 3} textAnchor="middle" fontSize="8" fill="#0b0f14">
                {agent.split('_')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
