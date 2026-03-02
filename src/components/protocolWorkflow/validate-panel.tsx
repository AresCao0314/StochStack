'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ValidationIssue } from '@/lib/protocolWorkflow/types';

type ReportPayload = {
  status: 'pass' | 'fail';
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  issues: ValidationIssue[];
};

export function ValidatePanel({ locale, runId, initialReport }: { locale: string; runId: string; initialReport: ReportPayload }) {
  const [report, setReport] = useState(initialReport);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function rerunValidation() {
    setBusy(true);
    setError('');

    const res = await fetch(`/api/workflow/runs/${runId}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor: 'validator.demo' })
    });
    const payload = await res.json();

    if (!payload?.ok) {
      setError(payload?.error ?? 'Validation failed.');
      setBusy(false);
      return;
    }

    setReport(payload.data as ReportPayload);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-4">
        <p className="text-sm text-ink/70">
          Business view: validation turns reviewed fields into a trustable package by checking structural completeness and cross-section consistency.
        </p>
      </section>

      <section className="noise-border rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Validation Report</h2>
            <p className="text-xs text-ink/60">
              status: <span className={report.status === 'pass' ? 'text-green-700' : 'text-red-700'}>{report.status}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={rerunValidation} disabled={busy} className="scanline rounded border border-ink/20 px-3 py-2 text-xs">
              {busy ? 'Running...' : 'Run Validate'}
            </button>
            <Link href={`/${locale}/review/${runId}`} className="scanline rounded border border-ink/20 px-3 py-2 text-xs">
              Back to Review
            </Link>
          </div>
        </div>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-700">Errors ({report.errors.length})</h3>
          <ul className="mt-2 space-y-2">
            {report.errors.length === 0 ? <li className="text-sm text-ink/60">No blocking errors.</li> : null}
            {report.errors.map((issue) => (
              <li key={`${issue.ruleId}-${issue.path}`} className="rounded border border-red-200 bg-red-50/70 p-2 text-sm">
                <p className="font-medium">{issue.ruleId}</p>
                <p>{issue.message}</p>
                <p className="text-xs text-ink/65">path: {issue.path}</p>
                <p className="text-xs text-ink/65">suggestion: {issue.suggestion}</p>
                <Link href={`/${locale}/review/${runId}`} className="mt-1 inline-block text-xs underline">
                  Jump to review
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-amber-700">Warnings ({report.warnings.length})</h3>
          <ul className="mt-2 space-y-2">
            {report.warnings.length === 0 ? <li className="text-sm text-ink/60">No warnings.</li> : null}
            {report.warnings.map((issue) => (
              <li key={`${issue.ruleId}-${issue.path}`} className="rounded border border-amber-200 bg-amber-50/70 p-2 text-sm">
                <p className="font-medium">{issue.ruleId}</p>
                <p>{issue.message}</p>
                <p className="text-xs text-ink/65">path: {issue.path}</p>
                <p className="text-xs text-ink/65">suggestion: {issue.suggestion}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
