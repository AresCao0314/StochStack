'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type Document, type ExtractionRun, type FeedbackAmendment, type Study } from '@prisma/client';
import { WorkflowStatusBadge } from '@/components/protocolWorkflow/status-badge';
import { workflowSteps, statusToStepState } from '@/lib/protocolWorkflow';
import { RUN_STATUS } from '@/lib/protocolWorkflow/extraction';

type StudyPayload = Study & {
  documents: Document[];
  runs: ExtractionRun[];
  feedback: FeedbackAmendment[];
};

export function WorkflowDashboard({ locale, initialStudy }: { locale: string; initialStudy: StudyPayload }) {
  const [study, setStudy] = useState(initialStudy);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const latestRun = study.runs[0] ?? null;

  const nav = [
    { href: `/${locale}/workflow/${study.id}`, label: 'Workflow' },
    { href: `/${locale}/documents`, label: 'Documents' },
    { href: `/${locale}/runs`, label: 'Runs' },
    latestRun ? { href: `/${locale}/review/${latestRun.id}`, label: 'Review' } : null,
    latestRun ? { href: `/${locale}/validate/${latestRun.id}`, label: 'Validate' } : null,
    latestRun ? { href: `/${locale}/artifact/usdm/${latestRun.id}`, label: 'USDM' } : null,
    latestRun ? { href: `/${locale}/artifact/ddf/${latestRun.id}`, label: 'DDF' } : null,
    { href: `/${locale}/feedback/${study.id}`, label: 'Feedback' },
    { href: `/${locale}/ops/${study.id}`, label: 'Ops' },
    { href: `/${locale}/diff`, label: 'Diff' }
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  const runStatus = latestRun?.status ?? null;

  const stats = useMemo(
    () => ({
      docs: study.documents.length,
      runs: study.runs.length,
      feedback: study.feedback.length
    }),
    [study]
  );

  async function uploadAndExtract(formData: FormData) {
    setUploading(true);
    setError('');

    formData.set('runImmediately', 'true');

    const res = await fetch(`/api/workflow/studies/${study.id}/documents`, {
      method: 'POST',
      body: formData
    });
    const payload = await res.json();

    if (!payload?.ok) {
      setError(payload?.error ?? 'Upload failed.');
      setUploading(false);
      return;
    }

    const doc = payload.data.document as Document;
    const run = payload.data.run as ExtractionRun;

    setStudy((prev) => ({
      ...prev,
      documents: [doc, ...prev.documents],
      runs: run ? [run, ...prev.runs] : prev.runs
    }));

    setUploading(false);
  }

  async function publishLatestRun() {
    if (!latestRun) return;
    setError('');
    const res = await fetch(`/api/workflow/runs/${latestRun.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor: 'workflow.publisher' })
    });
    const payload = await res.json();
    if (!payload?.ok) {
      setError(payload?.error ?? 'Publish failed.');
      return;
    }

    setStudy((prev) => ({
      ...prev,
      runs: prev.runs.map((run) => (run.id === latestRun.id ? { ...run, status: RUN_STATUS.published } : run))
    }));
  }

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">Protocol Workflow</h1>
        <p className="mt-2 max-w-4xl text-sm text-ink/75">
          Business view: this page shows where each study sits from ingestion to publish and feedback, without needing to understand USDM/DDF internals.
        </p>
      </section>

      <section className="noise-border rounded-lg p-4">
        <p className="section-title">Global Navigation</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em]">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded border border-ink/20 px-2 py-1 hover:border-ink/50">
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <article className="noise-border rounded-lg p-4">
          <h2 className="text-lg font-semibold">Study Snapshot</h2>
          <p className="mt-2 text-sm">{study.name}</p>
          <p className="text-xs text-ink/70">
            {study.indication} · {study.phase}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded border border-ink/15 bg-white/70 p-2">
              <p className="text-xl font-semibold">{stats.docs}</p>
              <p className="text-ink/60">docs</p>
            </div>
            <div className="rounded border border-ink/15 bg-white/70 p-2">
              <p className="text-xl font-semibold">{stats.runs}</p>
              <p className="text-ink/60">runs</p>
            </div>
            <div className="rounded border border-ink/15 bg-white/70 p-2">
              <p className="text-xl font-semibold">{stats.feedback}</p>
              <p className="text-ink/60">feedback</p>
            </div>
          </div>

          <form
            action={uploadAndExtract}
            className="mt-4 space-y-2 rounded border border-ink/15 bg-white/80 p-3 text-sm"
          >
            <p className="font-medium">Ingest Document + Extract</p>
            <input type="hidden" name="type" value="protocol" />
            <label className="block text-xs uppercase tracking-[0.12em] text-ink/60">
              version tag
              <input name="versionTag" defaultValue="v1.0" className="mt-1 w-full rounded border border-ink/20 px-2 py-2" />
            </label>
            <label className="block text-xs uppercase tracking-[0.12em] text-ink/60">
              paste protocol text
              <textarea name="text" required className="mt-1 h-36 w-full rounded border border-ink/20 px-2 py-2" />
            </label>
            <button type="submit" disabled={uploading} className="scanline rounded border border-ink/20 px-3 py-2 text-xs">
              {uploading ? 'Running...' : 'Upload + Extract'}
            </button>
          </form>

          {latestRun ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/${locale}/review/${latestRun.id}`} className="scanline rounded border border-ink/20 px-3 py-1 text-xs">
                Open Review
              </Link>
              <Link href={`/${locale}/validate/${latestRun.id}`} className="scanline rounded border border-ink/20 px-3 py-1 text-xs">
                Open Validate
              </Link>
              <button type="button" onClick={publishLatestRun} className="scanline rounded border border-accent1/40 bg-accent1/20 px-3 py-1 text-xs">
                Publish Artifacts
              </button>
            </div>
          ) : null}

          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </article>

        <article className="space-y-3">
          {workflowSteps.map((step) => (
            <div key={step.key} className="noise-border rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-title">{step.label}</p>
                  <p className="text-sm text-ink/75">{step.description}</p>
                </div>
                <WorkflowStatusBadge state={statusToStepState(runStatus, step.key)} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {step.key === 'extract' && latestRun ? (
                  <Link href={`/${locale}/review/${latestRun.id}`} className="rounded border border-ink/20 px-2 py-1 hover:border-ink/50">
                    Open extraction run
                  </Link>
                ) : null}
                {step.key === 'review' && latestRun ? (
                  <Link href={`/${locale}/review/${latestRun.id}`} className="rounded border border-ink/20 px-2 py-1 hover:border-ink/50">
                    Open review workbench
                  </Link>
                ) : null}
                {step.key === 'validate' && latestRun ? (
                  <Link href={`/${locale}/validate/${latestRun.id}`} className="rounded border border-ink/20 px-2 py-1 hover:border-ink/50">
                    Open validation report
                  </Link>
                ) : null}
                {step.key === 'publish' && latestRun ? (
                  <>
                    <Link href={`/${locale}/artifact/usdm/${latestRun.id}`} className="rounded border border-ink/20 px-2 py-1 hover:border-ink/50">
                      USDM preview
                    </Link>
                    <Link href={`/${locale}/artifact/ddf/${latestRun.id}`} className="rounded border border-ink/20 px-2 py-1 hover:border-ink/50">
                      DDF preview
                    </Link>
                  </>
                ) : null}
                {step.key === 'feedback' ? (
                  <Link href={`/${locale}/feedback/${study.id}`} className="rounded border border-ink/20 px-2 py-1 hover:border-ink/50">
                    Feedback import
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}
