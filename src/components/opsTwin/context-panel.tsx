'use client';

import { useMemo, useState } from 'react';
import type { ContextRoot } from '@/lib/opsTwin/types';

type Props = {
  context: ContextRoot | null;
  onExport: () => void;
  onReplay: () => void;
};

type TabKey = 'assumptions' | 'sites' | 'risks' | 'decisions';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'assumptions', label: 'Assumptions' },
  { key: 'sites', label: 'Candidate Sites' },
  { key: 'risks', label: 'Risk Register' },
  { key: 'decisions', label: 'Decision Log' }
];

function TabButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-1 text-xs uppercase tracking-[0.12em] ${
        active ? 'border-ink/40 bg-ink/10' : 'border-ink/20'
      }`}
    >
      {label}
    </button>
  );
}

export function OpsTwinContextPanel({ context, onExport, onReplay }: Props) {
  const [tab, setTab] = useState<TabKey>('assumptions');

  const assumptionsRows = useMemo(() => {
    if (!context) return [];
    return Object.entries(context.assumptions).map(([key, value]) => ({ key, ...value }));
  }, [context]);

  return (
    <section className="noise-border rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="section-title">MCP-like Shared Context</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReplay}
            disabled={!context || context.eventLog.length === 0}
            className="rounded border border-ink/20 px-2 py-1 text-xs disabled:opacity-45"
            aria-label="Replay context from event log"
          >
            Replay
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={!context}
            className="rounded border border-ink/20 px-2 py-1 text-xs disabled:opacity-45"
            aria-label="Export context as JSON"
          >
            Export JSON
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <TabButton key={item.key} active={tab === item.key} label={item.label} onClick={() => setTab(item.key)} />
        ))}
      </div>

      {!context ? (
        <p className="mt-4 text-sm text-ink/70">Run a simulation to populate shared context.</p>
      ) : (
        <div className="mt-3">
          {tab === 'assumptions' ? (
            <div className="max-h-[320px] overflow-auto rounded border border-ink/15">
              <table className="w-full text-left text-xs">
                <thead className="bg-warm/70 text-ink/75">
                  <tr>
                    <th className="px-2 py-2">key</th>
                    <th className="px-2 py-2">value</th>
                    <th className="px-2 py-2">source</th>
                    <th className="px-2 py-2">version</th>
                  </tr>
                </thead>
                <tbody>
                  {assumptionsRows.map((row) => (
                    <tr key={row.key} className="border-t border-ink/10">
                      <td className="px-2 py-2 font-mono">{row.key}</td>
                      <td className="px-2 py-2 font-mono">{String(row.value)}</td>
                      <td className="px-2 py-2">{row.sourceAgent}</td>
                      <td className="px-2 py-2">v{row.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'sites' ? (
            <div className="max-h-[320px] overflow-auto rounded border border-ink/15">
              <table className="w-full text-left text-xs">
                <thead className="bg-warm/70 text-ink/75">
                  <tr>
                    <th className="px-2 py-2">site_name</th>
                    <th className="px-2 py-2">country</th>
                    <th className="px-2 py-2">startup_days_p50</th>
                    <th className="px-2 py-2">startup_risk</th>
                    <th className="px-2 py-2">expected_recruitment_rate</th>
                    <th className="px-2 py-2">score</th>
                  </tr>
                </thead>
                <tbody>
                  {context.candidateSites.map((site) => (
                    <tr key={site.id} className="border-t border-ink/10">
                      <td className="px-2 py-2">{site.site_name}</td>
                      <td className="px-2 py-2">{site.country}</td>
                      <td className="px-2 py-2">{site.startup_days_p50}</td>
                      <td className="px-2 py-2">{site.startup_risk}</td>
                      <td className="px-2 py-2">{site.expected_recruitment_rate}</td>
                      <td className="px-2 py-2">{site.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'risks' ? (
            <div className="max-h-[320px] overflow-auto rounded border border-ink/15">
              <table className="w-full text-left text-xs">
                <thead className="bg-warm/70 text-ink/75">
                  <tr>
                    <th className="px-2 py-2">risk_id</th>
                    <th className="px-2 py-2">title</th>
                    <th className="px-2 py-2">likelihood</th>
                    <th className="px-2 py-2">impact</th>
                    <th className="px-2 py-2">owner_agent</th>
                  </tr>
                </thead>
                <tbody>
                  {context.risks.map((risk) => (
                    <tr key={risk.risk_id} className="border-t border-ink/10">
                      <td className="px-2 py-2 font-mono">{risk.risk_id}</td>
                      <td className="px-2 py-2">{risk.title}</td>
                      <td className="px-2 py-2">{risk.likelihood}</td>
                      <td className="px-2 py-2">{risk.impact}</td>
                      <td className="px-2 py-2">{risk.owner_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'decisions' ? (
            <ol className="max-h-[320px] space-y-2 overflow-auto rounded border border-ink/15 p-3">
              {context.decisions.map((item, idx) => (
                <li key={`${item.timestamp}-${idx}`} className="rounded border border-ink/10 bg-base/70 p-2 text-xs">
                  <p className="font-mono text-ink/60">{new Date(item.timestamp).toLocaleString()}</p>
                  <p className="mt-1 font-semibold">{item.decision}</p>
                  <p className="mt-1 text-ink/75">{item.rationale}</p>
                  <p className="mt-1 text-ink/60">Tradeoff: {item.tradeoff}</p>
                </li>
              ))}
            </ol>
          ) : null}

          <p className="mt-3 font-mono text-[11px] text-ink/60">
            runId={context.meta.runId} | version={context.meta.version} | events={context.eventLog.length}
          </p>
        </div>
      )}
    </section>
  );
}
