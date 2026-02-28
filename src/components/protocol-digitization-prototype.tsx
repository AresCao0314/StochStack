'use client';

import { useMemo, useState } from 'react';
import { ClipboardCopy, FileUp, GitBranch, ShieldCheck } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Sample = {
  id: string;
  title: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  rawText: string;
};

type ExtractResult = {
  metadata: { title: string; therapeuticArea: string; indication: string; phase: string };
  inclusionCriteria: Array<{ id: string; text: string; confidence: number }>;
  exclusionCriteria: Array<{ id: string; text: string; confidence: number }>;
  soa: Array<{ visit: string; window: string; activities: string[]; confidence: number }>;
  validation: { valid: boolean; coverage: number; errors: string[]; warnings: string[] };
  confidence: { overall: number; metadata: number; inclusion: number; exclusion: number; soa: number };
  usdm: {
    study: { id: string; title: string };
    studyDesign: { therapeuticArea: string; indication: string; phase: string };
    eligibilityCriteria: Array<{ id: string; type: 'inclusion' | 'exclusion'; text: string; sourceId: string }>;
    scheduleOfActivities: Array<{ encounter: string; window: string; activities: string[] }>;
    dataFlow: Array<{ from: string; to: string; note: string }>;
  };
  source: 'qwen' | 'local-parser';
  rawStats: { chars: number; fileName?: string };
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Historical Protocol Digitizer',
    subtitle:
      'v0.2.0: PDF or unstructured text -> structured extraction -> JSON schema validation -> field confidence scoring, with USDM data-flow linkage.',
    sample: 'Sample Text',
    raw: 'Unstructured Text',
    upload: 'PDF Upload (optional)',
    run: 'Extract & Validate',
    result: 'Structured JSON',
    validation: 'Schema Validation',
    confidence: 'Field Confidence',
    usdm: 'USDM Mapping',
    flow: 'Digital Data Flow',
    copy: 'Copy JSON'
  },
  zh: {
    title: '历史 Protocol 结构化引擎',
    subtitle:
      'v0.2.0：支持 PDF/非结构化文本 -> 结构化抽取 -> JSON schema 校验 -> 字段置信度，并连接 USDM data flow。',
    sample: '示例文本',
    raw: '非结构化文本',
    upload: '上传 PDF（可选）',
    run: '抽取并校验',
    result: '结构化 JSON',
    validation: 'Schema 校验',
    confidence: '字段置信度',
    usdm: 'USDM 映射',
    flow: 'Digital Data Flow',
    copy: '复制 JSON'
  },
  de: {
    title: 'Historical Protocol Digitizer',
    subtitle:
      'v0.2.0: PDF oder unstrukturierter Text -> strukturierte Extraktion -> JSON-Schema-Validierung -> Feld-Konfidenz inkl. USDM Data-Flow Mapping.',
    sample: 'Beispieltext',
    raw: 'Unstrukturierter Text',
    upload: 'PDF Upload (optional)',
    run: 'Extrahieren & validieren',
    result: 'Strukturiertes JSON',
    validation: 'Schema-Validierung',
    confidence: 'Feld-Konfidenz',
    usdm: 'USDM-Mapping',
    flow: 'Digital Data Flow',
    copy: 'JSON kopieren'
  }
};

export function ProtocolDigitizationPrototype({ locale, samples }: { locale: Locale; samples: Sample[] }) {
  const t = labels[locale];
  const [sampleId, setSampleId] = useState(samples[0]?.id ?? '');
  const sample = useMemo(() => samples.find((x) => x.id === sampleId) ?? samples[0], [samples, sampleId]);
  const [text, setText] = useState(sample?.rawText ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExtractResult | null>(null);

  function onSampleChange(id: string) {
    setSampleId(id);
    const next = samples.find((x) => x.id === id);
    if (next) setText(next.rawText);
  }

  async function onExtract() {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('locale', locale);
      form.append('text', text);
      if (file) form.append('file', file);
      const res = await fetch('/api/protocol-digitization/extract', {
        method: 'POST',
        body: form
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || 'Extraction failed.');
        return;
      }
      setResult(data.data as ExtractResult);
    } catch {
      setError('Extraction failed.');
    } finally {
      setBusy(false);
    }
  }

  async function copyJson() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 11</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            {t.sample}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={sample.id} onChange={(e) => onSampleChange(e.target.value)}>
              {samples.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title} · {x.therapeuticArea}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.upload}
            <input type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2 text-sm" />
          </label>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 text-lg font-semibold">{t.raw}</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="h-[220px] w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm" />
        <button type="button" onClick={onExtract} disabled={busy} className="scanline mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50">
          <FileUp size={14} /> {busy ? '...' : t.run}
        </button>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </section>

      {result ? (
        <>
          <section className="grid gap-4 xl:grid-cols-3">
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck size={16} /> {t.validation}
              </h2>
              <p className="text-sm">valid: {String(result.validation.valid)}</p>
              <p className="text-sm">coverage: {result.validation.coverage}%</p>
              <p className="text-xs text-ink/70">errors: {result.validation.errors.length}</p>
              <p className="text-xs text-ink/70">warnings: {result.validation.warnings.length}</p>
            </article>
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.confidence}</h2>
              <p className="text-sm">overall: {(result.confidence.overall * 100).toFixed(0)}%</p>
              <p className="text-xs text-ink/70">metadata: {(result.confidence.metadata * 100).toFixed(0)}%</p>
              <p className="text-xs text-ink/70">inclusion: {(result.confidence.inclusion * 100).toFixed(0)}%</p>
              <p className="text-xs text-ink/70">exclusion: {(result.confidence.exclusion * 100).toFixed(0)}%</p>
              <p className="text-xs text-ink/70">soa: {(result.confidence.soa * 100).toFixed(0)}%</p>
            </article>
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">Source</h2>
              <p className="text-sm">{result.source}</p>
              <p className="text-xs text-ink/70">chars: {result.rawStats.chars}</p>
              <p className="text-xs text-ink/70">file: {result.rawStats.fileName || '-'}</p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.result}</h2>
              <pre className="h-[360px] overflow-auto rounded border border-ink/15 bg-white/50 p-3 text-xs">
                {JSON.stringify(
                  {
                    metadata: result.metadata,
                    inclusionCriteria: result.inclusionCriteria,
                    exclusionCriteria: result.exclusionCriteria,
                    soa: result.soa
                  },
                  null,
                  2
                )}
              </pre>
              <button type="button" onClick={copyJson} className="scanline mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm">
                <ClipboardCopy size={14} /> {t.copy}
              </button>
            </article>

            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.usdm}</h2>
              <pre className="h-[360px] overflow-auto rounded border border-ink/15 bg-white/50 p-3 text-xs">
                {JSON.stringify(result.usdm, null, 2)}
              </pre>
            </article>
          </section>

          <section className="noise-border rounded-lg p-4">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <GitBranch size={16} /> {t.flow}
            </h2>
            <ol className="space-y-2 border-l border-ink/20 pl-4 text-sm">
              {result.usdm.dataFlow.map((x, idx) => (
                <li key={`${x.from}-${x.to}-${idx}`} className="relative rounded border border-ink/15 p-2">
                  <span className="absolute -left-[1.1rem] top-3 h-2 w-2 rounded-full bg-accent2" />
                  <p className="font-medium">
                    {x.from} {'->'} {x.to}
                  </p>
                  <p className="text-xs text-ink/70">{x.note}</p>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}
    </div>
  );
}
