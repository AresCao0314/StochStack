'use client';

import { useState } from 'react';
type FeedbackRow = {
  id: string;
  studyId: string;
  amendmentDate: string | Date;
  category: string;
  description: string;
  createdAt: string | Date;
  linkedUsdmPaths: string[];
};

export function FeedbackWorkbench({ locale, studyId, initialRows }: { locale: string; studyId: string; initialRows: FeedbackRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function importCsv(formData: FormData) {
    setBusy(true);
    setError('');

    const res = await fetch(`/api/workflow/studies/${studyId}/feedback/import`, {
      method: 'POST',
      body: formData
    });
    const payload = await res.json();

    if (!payload?.ok) {
      setError(payload?.error ?? 'Import failed.');
      setBusy(false);
      return;
    }

    const imported = payload.data.rows as Array<{
      id: string;
      studyId: string;
      amendmentDate: string;
      category: string;
      description: string;
      createdAt: string;
      linkedUsdmPaths: string;
    }>;
    setRows((prev) => [
      ...imported.map((item) => ({ ...item, linkedUsdmPaths: JSON.parse((item.linkedUsdmPaths as unknown as string) || '[]') })),
      ...prev
    ]);

    setBusy(false);
  }

  async function relink(feedbackId: string, current: string[]) {
    const next = window.prompt('Edit linked USDM paths (comma separated)', current.join(', '));
    if (next === null) return;

    const linkedUsdmPaths = next
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    const res = await fetch(`/api/workflow/feedback/${feedbackId}/link`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedUsdmPaths, actor: 'feedback.demo' })
    });

    const payload = await res.json();
    if (!payload?.ok) {
      setError(payload?.error ?? 'Link update failed.');
      return;
    }

    setRows((prev) => prev.map((row) => (row.id === feedbackId ? { ...row, linkedUsdmPaths } : row)));
  }

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">Feedback Intake</h1>
        <p className="mt-2 text-sm text-ink/70">
          Business view: import operational amendments and attach them to design objects so the next protocol cycle learns from reality.
        </p>
      </section>

      <section className="noise-border rounded-lg p-4">
        <form action={importCsv} className="space-y-2 text-sm">
          <p className="font-medium">Import CSV</p>
          <p className="text-xs text-ink/60">Columns: date,category,description</p>
          <textarea
            name="csv"
            className="h-36 w-full rounded border border-ink/20 px-2 py-2"
            defaultValue={`date,category,description\n2026-02-15,eligibility,Expanded age upper bound to improve recruitment\n2026-02-26,soa,Reduced screening window to accelerate startup`}
          />
          <button type="submit" disabled={busy} className="scanline rounded border border-ink/20 px-3 py-2 text-xs">
            {busy ? 'Importing...' : 'Import Amendment CSV'}
          </button>
        </form>
      </section>

      <section className="noise-border rounded-lg p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Imported Amendments ({rows.length})</h2>
          <a href={`/${locale}/ops/${studyId}`} className="scanline rounded border border-ink/20 px-3 py-1 text-xs">
            Open Ops View
          </a>
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <article key={row.id} className="rounded border border-ink/15 bg-white/70 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{row.category}</p>
                <span className="text-xs text-ink/60">{new Date(row.amendmentDate).toLocaleDateString()}</span>
              </div>
              <p className="mt-1">{row.description}</p>
              <p className="mt-2 text-xs text-ink/60">Linked paths: {row.linkedUsdmPaths.join(' · ')}</p>
              <button type="button" onClick={() => relink(row.id, row.linkedUsdmPaths)} className="mt-2 rounded border border-ink/20 px-2 py-1 text-xs">
                Edit links
              </button>
            </article>
          ))}
        </div>
      </section>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
