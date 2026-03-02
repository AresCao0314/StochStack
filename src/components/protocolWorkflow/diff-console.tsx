'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ChangeSet, ExtractionRun, Study } from '@prisma/client';
import type { DiffChange, ImpactItem } from '@/lib/protocolWorkflow';

type RunWithStudy = ExtractionRun & { study: Study };

type InitialPayload = {
  runs: RunWithStudy[];
  initialChangeSet: ChangeSet | null;
  initialImpacts: ImpactItem[];
};

export function DiffConsole({ locale, payload }: { locale: string; payload: InitialPayload }) {
  const [baseRunId, setBaseRunId] = useState(payload.runs[1]?.id ?? payload.runs[0]?.id ?? '');
  const [compareRunId, setCompareRunId] = useState(payload.runs[0]?.id ?? '');
  const [changeSet, setChangeSet] = useState<ChangeSet | null>(payload.initialChangeSet);
  const [impacts, setImpacts] = useState<ImpactItem[]>(payload.initialImpacts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const runOptions = useMemo(
    () => payload.runs.map((run) => ({ id: run.id, label: `${run.study.name} · ${run.id.slice(0, 8)} · ${run.status}` })),
    [payload.runs]
  );

  async function runDiff() {
    if (!baseRunId || !compareRunId) return;
    setBusy(true);
    setError('');

    const res = await fetch('/api/workflow/diff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseRunId, compareRunId })
    });
    const data = await res.json();
    if (!data?.ok) {
      setError(data?.error ?? 'Diff generation failed.');
      setBusy(false);
      return;
    }

    setChangeSet(data.data.changeSet as ChangeSet);
    setImpacts(data.data.impacts as ImpactItem[]);
    setBusy(false);
  }

  const changes = changeSet?.changes ? (JSON.parse(changeSet.changes as unknown as string) as DiffChange[]) : [];

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">Object-level Diff</h1>
        <p className="mt-2 text-sm text-ink/70">
          Business view: compare two extraction/review versions and immediately see operational impact domains.
        </p>
      </section>

      <section className="noise-border rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.12em] text-ink/60">
            base run
            <select className="mt-1 w-full rounded border border-ink/20 bg-white px-2 py-2 text-sm" value={baseRunId} onChange={(e) => setBaseRunId(e.target.value)}>
              {runOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.12em] text-ink/60">
            compare run
            <select className="mt-1 w-full rounded border border-ink/20 bg-white px-2 py-2 text-sm" value={compareRunId} onChange={(e) => setCompareRunId(e.target.value)}>
              {runOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={runDiff} disabled={busy} className="scanline rounded border border-ink/20 px-3 py-2 text-xs">
            {busy ? 'Computing...' : 'Generate ChangeSet'}
          </button>
          {changeSet ? (
            <Link href={`/${locale}/impact/${changeSet.id}`} className="scanline rounded border border-accent1/40 bg-accent1/20 px-3 py-2 text-xs">
              Open Impact List
            </Link>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="text-lg font-semibold">ChangeSet ({changes.length})</h2>
          <p className="text-xs text-ink/60">{changeSet?.summary ?? 'No diff generated yet.'}</p>
          <div className="mt-3 h-[420px] space-y-2 overflow-auto rounded border border-ink/15 bg-white/60 p-3">
            {changes.map((change, idx) => (
              <div key={`${change.path}-${idx}`} className="rounded border border-ink/15 bg-white/80 p-2 text-sm">
                <p className="font-medium">{change.type.toUpperCase()} · {change.path}</p>
                <p className="mt-1 text-xs text-ink/70">before: {JSON.stringify(change.before)}</p>
                <p className="text-xs text-ink/70">after: {JSON.stringify(change.after)}</p>
                <p className="text-xs text-ink/60">
                  confidence: {change.beforeConfidence ?? '-'} {'->'} {change.afterConfidence ?? '-'}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="text-lg font-semibold">Impact Preview ({impacts.length})</h2>
          <div className="mt-3 h-[420px] space-y-2 overflow-auto rounded border border-ink/15 bg-white/60 p-3">
            {impacts.map((impact, idx) => (
              <div key={`${impact.path}-${idx}`} className="rounded border border-ink/15 bg-white/80 p-2 text-sm">
                <p className="font-medium">{impact.domain} · {impact.changeType}</p>
                <p className="text-xs text-ink/65">{impact.path}</p>
                <p className="mt-1 text-xs text-ink/70">{impact.rationale}</p>
                <p className="mt-1 text-xs text-ink/60">Downstream: {impact.downstream.join(' / ')}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
