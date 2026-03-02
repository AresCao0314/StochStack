'use client';

import { useMemo, useState } from 'react';
import type { ExtractedField, ExtractionRun } from '@prisma/client';

type RunPayload = ExtractionRun & {
  fields: ExtractedField[];
  document: { textExtract: string | null; filename: string };
};

type Summary = {
  total: number;
  pending: number;
  accepted: number;
  edited: number;
  rejected: number;
};

const moduleFilters = ['all', 'Eligibility', 'SoA', 'Endpoints', 'Arms', 'Visits'] as const;

function moduleFromPath(path: string) {
  if (path.startsWith('eligibility.')) return 'Eligibility';
  if (path.startsWith('soa.')) return 'SoA';
  if (path.startsWith('endpoint.')) return 'Endpoints';
  if (path.startsWith('studyDesign.arms')) return 'Arms';
  if (path.includes('.visits[') || path.startsWith('visits.')) return 'Visits';
  return 'Other';
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseJsonSafe<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ReviewWorkbench({
  locale,
  initialRun,
  initialSummary
}: {
  locale: string;
  initialRun: RunPayload;
  initialSummary: Summary;
}) {
  const [run, setRun] = useState<RunPayload>(initialRun);
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(initialRun.fields[0]?.id ?? '');
  const [moduleFilter, setModuleFilter] = useState<(typeof moduleFilters)[number]>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedField = run.fields.find((field) => field.id === selectedFieldId) ?? null;

  const visibleFields = useMemo(
    () =>
      run.fields.filter((field) => {
        const section = moduleFromPath(field.path);
        const byModule = moduleFilter === 'all' || section === moduleFilter;
        const byConfidence = field.confidence >= confidenceThreshold;
        return byModule && byConfidence;
      }),
    [run.fields, moduleFilter, confidenceThreshold]
  );

  const paragraphs = useMemo(() => splitParagraphs(run.document.textExtract ?? ''), [run.document.textExtract]);

  async function mutateField(action: 'accept' | 'edit' | 'reject') {
    if (!selectedField) return;
    setBusy(true);
    setError('');

    let editedValue: unknown = undefined;
    let reason = '';

    if (action === 'edit') {
      const current = parseJsonSafe(selectedField.value, selectedField.value);
      const next = window.prompt('Edit value as JSON or text', JSON.stringify(current));
      if (next === null) {
        setBusy(false);
        return;
      }
      try {
        editedValue = JSON.parse(next);
      } catch {
        editedValue = next;
      }
      reason = 'manual reviewer correction';
    }

    if (action === 'reject') {
      reason = window.prompt('Reject reason', 'insufficient evidence') ?? '';
      if (!reason) {
        setBusy(false);
        return;
      }
    }

    const res = await fetch(`/api/workflow/runs/${run.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldId: selectedField.id,
        action,
        editedValue,
        reason,
        actor: 'reviewer.demo'
      })
    });

    const payload = await res.json();
    if (!payload?.ok) {
      setError(payload?.error ?? 'Failed to update field.');
      setBusy(false);
      return;
    }

    const nextField = payload.data.field as ExtractedField;
    const nextFields = run.fields.map((field) => (field.id === nextField.id ? nextField : field));
    setRun({ ...run, fields: nextFields });
    setSummary(payload.data.summary as Summary);
    setBusy(false);
  }

  async function submitForValidate() {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/workflow/runs/${run.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'submit', actor: 'reviewer.demo' })
    });
    const payload = await res.json();
    if (!payload?.ok) {
      setError(payload?.error ?? 'Failed to submit review.');
      setBusy(false);
      return;
    }
    window.location.href = `${window.location.origin}/${locale}/validate/${run.id}`;
  }

  const evidence = selectedField ? parseJsonSafe<Record<string, unknown>>(selectedField.evidence, {}) : {};

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-4">
        <p className="text-sm text-ink/70">
          Business view: this review gate turns machine extraction into regulated evidence-backed data before it affects build and operations.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1.4fr]">
        <article className="noise-border rounded-lg p-4">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Document Reader</h2>
            <span className="text-xs text-ink/60">{run.document.filename}</span>
          </header>

          <div className="space-y-2 rounded border border-ink/15 bg-white/60 p-3 text-sm">
            {paragraphs.length === 0 ? <p className="text-ink/60">No document text available.</p> : null}
            {paragraphs.map((paragraph, idx) => {
              const quote = String(evidence.quote ?? '');
              const highlighted = quote && paragraph.includes(quote);
              return (
                <p key={`${idx}-${paragraph.slice(0, 16)}`} className={highlighted ? 'rounded bg-accent2/30 px-2 py-1' : ''}>
                  <span className="mr-2 text-xs text-ink/45">¶{idx + 1}</span>
                  {paragraph}
                </p>
              );
            })}
          </div>

          {selectedField ? (
            <div className="mt-3 rounded border border-accent2/40 bg-accent2/10 p-3 text-sm">
              <p className="font-medium">Evidence</p>
              <p className="text-xs text-ink/70">quote: {String(evidence.quote ?? '-')}</p>
              <p className="text-xs text-ink/70">page: {String(evidence.page ?? '-')} | chunk: {String(evidence.chunkId ?? '-')}</p>
            </div>
          ) : null}
        </article>

        <article className="noise-border rounded-lg p-4">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Review Workbench</h2>
            <div className="flex items-center gap-2 text-xs">
              <span>pending {summary.pending}</span>
              <span>accept {summary.accepted}</span>
              <span>edit {summary.edited}</span>
              <span>reject {summary.rejected}</span>
            </div>
          </header>

          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs uppercase tracking-[0.12em] text-ink/60">
              module
              <select
                className="mt-1 w-full rounded border border-ink/20 bg-white px-2 py-2 text-sm"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value as (typeof moduleFilters)[number])}
              >
                {moduleFilters.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs uppercase tracking-[0.12em] text-ink/60">
              confidence ≥ {confidenceThreshold.toFixed(2)}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
          </div>

          <div className="h-[360px] space-y-2 overflow-auto rounded border border-ink/15 bg-white/60 p-3">
            {visibleFields.map((field) => {
              const active = field.id === selectedFieldId;
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`w-full rounded border px-3 py-2 text-left text-sm ${
                    active ? 'border-accent1 bg-accent1/20' : 'border-ink/15 bg-white/80 hover:border-ink/40'
                  }`}
                >
                  <p className="font-medium">{field.path}</p>
                  <p className="text-xs text-ink/70">state: {field.reviewerState} · conf: {field.confidence.toFixed(2)}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-ink/80">{JSON.stringify(parseJsonSafe(field.value, field.value))}</p>
                </button>
              );
            })}
          </div>

          {selectedField ? (
            <div className="mt-3 rounded border border-ink/15 bg-white/80 p-3 text-sm">
              <p className="font-medium">Selected Value</p>
              <pre className="mt-2 overflow-auto rounded border border-ink/10 bg-white p-2 text-xs">
                {JSON.stringify(parseJsonSafe(selectedField.value, selectedField.value), null, 2)}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => mutateField('accept')} disabled={busy} className="scanline rounded border border-ink/20 px-3 py-1 text-xs">
                  Accept
                </button>
                <button type="button" onClick={() => mutateField('edit')} disabled={busy} className="scanline rounded border border-ink/20 px-3 py-1 text-xs">
                  Edit
                </button>
                <button type="button" onClick={() => mutateField('reject')} disabled={busy} className="scanline rounded border border-ink/20 px-3 py-1 text-xs">
                  Reject
                </button>
                <button type="button" onClick={submitForValidate} disabled={busy} className="scanline rounded border border-accent1/50 bg-accent1/20 px-3 py-1 text-xs">
                  Submit to Validate
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </article>
      </section>
    </div>
  );
}
