'use client';

import { useMemo, useState } from 'react';
import { ClipboardCopy, FileText, SplitSquareVertical } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Sample = {
  id: string;
  title: string;
  therapeuticArea: string;
  indication: string;
  protocolSynopsis: string;
  bdsSummary: string;
  tflOrRtf: string;
};

type CsrDraft = {
  dataIndependent: {
    titlePage: string;
    synopsis: string;
    studyDesign: string;
    objectivesEndpoints: string;
    methodsGeneral: string;
  };
  dataDependent: {
    dispositionAndBaseline: string;
    efficacyResults: string;
    safetyResults: string;
    benefitRisk: string;
    conclusion: string;
  };
};

type CsrV2 = {
  draft: CsrDraft;
  ichE3Sections: Array<{
    id: string;
    title: string;
    content: string;
    dataType: 'data-independent' | 'data-dependent' | 'mixed';
  }>;
  tableFigureListing: Array<{
    id: string;
    type: 'Table' | 'Figure' | 'Listing';
    title: string;
    status: 'available' | 'placeholder';
    sourceRef: string;
  }>;
  traceability: Array<{
    sectionId: string;
    statement: string;
    tflRefs: string[];
  }>;
  dataAnchors: Array<{
    sectionId: string;
    metricText: string;
    value: string;
    unit?: string;
    sentenceExcerpt: string;
    anchored: boolean;
    anchorType: 'exact' | 'approximate' | 'missing';
    tflRefs: string[];
  }>;
  consistency: {
    overall: 'pass' | 'warn' | 'fail';
    checks: Array<{
      level: 'pass' | 'warn' | 'fail';
      check: string;
      detail: string;
    }>;
  };
};

const labels: Record<Locale, any> = {
  en: {
    title: 'CSR Drafting from BDS + TFL/RTF',
    subtitle:
      'Generate CSR draft blocks by separating data-independent and data-dependent sections from protocol synopsis, BDS, and TFL/RTF inputs.',
    sample: 'Sample Package',
    outputLang: 'Output Language',
    protocol: 'Protocol Synopsis',
    bds: 'BDS Summary',
    tfl: 'TFL/RTF Content',
    run: 'Generate CSR Draft',
    result: 'CSR Draft Output',
    independent: 'Data-Independent Draft',
    dependent: 'Data-Dependent Draft',
    copy: 'Copy JSON',
    ich: 'ICH E3 Section Assembly (9-14)',
    tflList: 'Table/Figure/Listing Placeholders',
    trace: 'Traceability to TFL IDs',
    consistency: 'Data Consistency Checks',
    anchors: 'Numeric Data Anchors'
  },
  zh: {
    title: '基于 BDS + TFL/RTF 的 CSR 草稿',
    subtitle: '从 protocol synopsis、BDS 和 TFL/RTF 输入自动生成 CSR 草稿，并拆分 data-independent 与 data-dependent 两部分。',
    sample: '示例包',
    outputLang: '输出语言',
    protocol: 'Protocol Synopsis',
    bds: 'BDS 摘要',
    tfl: 'TFL/RTF 内容',
    run: '生成 CSR 草稿',
    result: 'CSR 草稿输出',
    independent: 'Data-Independent 草稿',
    dependent: 'Data-Dependent 草稿',
    copy: '复制 JSON',
    ich: 'ICH E3 章节自动拼装（9-14）',
    tflList: '表格/图形/列表占位',
    trace: '到 TFL 编号的追溯',
    consistency: '数据一致性校验',
    anchors: '数字锚定详情'
  },
  de: {
    title: 'CSR Draft aus BDS + TFL/RTF',
    subtitle:
      'CSR-Entwurfsbloecke aus Protocol Synopsis, BDS und TFL/RTF erzeugen, klar getrennt in data-independent und data-dependent.',
    sample: 'Beispielpaket',
    outputLang: 'Ausgabesprache',
    protocol: 'Protocol Synopsis',
    bds: 'BDS-Zusammenfassung',
    tfl: 'TFL/RTF-Inhalt',
    run: 'CSR Draft erzeugen',
    result: 'CSR Draft Output',
    independent: 'Data-Independent Draft',
    dependent: 'Data-Dependent Draft',
    copy: 'JSON kopieren',
    ich: 'ICH E3 Abschnitt-Montage (9-14)',
    tflList: 'Table/Figure/Listing Platzhalter',
    trace: 'Traceability zu TFL-IDs',
    consistency: 'Datenkonsistenz-Checks',
    anchors: 'Numerische Datenanker'
  }
};

export function CsrDraftPrototype({ locale, samples }: { locale: Locale; samples: Sample[] }) {
  const t = labels[locale];
  const [sampleId, setSampleId] = useState(samples[0]?.id ?? '');
  const sample = useMemo(() => samples.find((x) => x.id === sampleId) ?? samples[0], [samples, sampleId]);
  const [protocolSynopsis, setProtocolSynopsis] = useState(sample?.protocolSynopsis ?? '');
  const [bdsSummary, setBdsSummary] = useState(sample?.bdsSummary ?? '');
  const [tflOrRtf, setTflOrRtf] = useState(sample?.tflOrRtf ?? '');
  const [outputLanguage, setOutputLanguage] = useState<'en' | 'de'>('en');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<CsrV2 | null>(null);

  function onSampleChange(id: string) {
    setSampleId(id);
    const next = samples.find((x) => x.id === id);
    if (!next) return;
    setProtocolSynopsis(next.protocolSynopsis);
    setBdsSummary(next.bdsSummary);
    setTflOrRtf(next.tflOrRtf);
  }

  async function onGenerate() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/csr-draft/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolSynopsis, bdsSummary, tflOrRtf, outputLanguage })
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || 'Generation failed.');
        return;
      }
      setResult(data.data as CsrV2);
      setSource(String(data.source || ''));
    } catch {
      setError('Generation failed.');
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
        <p className="section-title">prototype 13</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            {t.sample}
            <select value={sample.id} onChange={(e) => onSampleChange(e.target.value)} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2">
              {samples.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.outputLang}
            <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value === 'de' ? 'de' : 'en')} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2">
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 text-lg font-semibold">{t.protocol}</h2>
        <textarea value={protocolSynopsis} onChange={(e) => setProtocolSynopsis(e.target.value)} className="h-28 w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm" />
        <h2 className="mb-2 mt-4 text-lg font-semibold">{t.bds}</h2>
        <textarea value={bdsSummary} onChange={(e) => setBdsSummary(e.target.value)} className="h-24 w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm" />
        <h2 className="mb-2 mt-4 text-lg font-semibold">{t.tfl}</h2>
        <textarea value={tflOrRtf} onChange={(e) => setTflOrRtf(e.target.value)} className="h-36 w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm" />
        <button type="button" onClick={onGenerate} disabled={busy} className="scanline mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50">
          <FileText size={14} /> {busy ? '...' : t.run}
        </button>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </section>

      {result ? (
        <section className="space-y-4">
          <div className="noise-border rounded-lg p-4 text-xs text-ink/60">source: {source}</div>
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <SplitSquareVertical size={16} /> {t.independent}
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Title page:</span> {result.draft.dataIndependent.titlePage}</p>
                <p><span className="font-semibold">Synopsis:</span> {result.draft.dataIndependent.synopsis}</p>
                <p><span className="font-semibold">Study design:</span> {result.draft.dataIndependent.studyDesign}</p>
                <p><span className="font-semibold">Objectives/endpoints:</span> {result.draft.dataIndependent.objectivesEndpoints}</p>
                <p><span className="font-semibold">Methods:</span> {result.draft.dataIndependent.methodsGeneral}</p>
              </div>
            </article>
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <SplitSquareVertical size={16} /> {t.dependent}
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Disposition/baseline:</span> {result.draft.dataDependent.dispositionAndBaseline}</p>
                <p><span className="font-semibold">Efficacy:</span> {result.draft.dataDependent.efficacyResults}</p>
                <p><span className="font-semibold">Safety:</span> {result.draft.dataDependent.safetyResults}</p>
                <p><span className="font-semibold">Benefit-risk:</span> {result.draft.dataDependent.benefitRisk}</p>
                <p><span className="font-semibold">Conclusion:</span> {result.draft.dataDependent.conclusion}</p>
              </div>
            </article>
          </div>
          <article className="noise-border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.ich}</h2>
            <div className="space-y-2 text-sm">
              {result.ichE3Sections.map((s) => (
                <div key={s.id} className="rounded border border-ink/15 p-2">
                  <p className="font-medium">
                    {s.title} <span className="text-xs text-ink/60">[{s.dataType}]</span>
                  </p>
                  <p className="text-xs text-ink/75">{s.content}</p>
                </div>
              ))}
            </div>
          </article>
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.tflList}</h2>
              <div className="space-y-2 text-sm">
                {result.tableFigureListing.map((x) => (
                  <div key={x.id} className="rounded border border-ink/15 p-2">
                    <p className="font-medium">{x.type} · {x.title}</p>
                    <p className="text-xs text-ink/70">sourceRef: {x.sourceRef} · status: {x.status}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.trace}</h2>
              <div className="space-y-2 text-sm">
                {result.traceability.map((x, idx) => (
                  <div key={`${x.sectionId}-${idx}`} className="rounded border border-ink/15 p-2">
                    <p className="font-medium">Section {x.sectionId}</p>
                    <p className="text-xs text-ink/75">{x.statement}</p>
                    <p className="text-xs text-ink/65">TFL refs: {x.tflRefs.join(', ') || '-'}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.consistency}</h2>
              <p className="mb-2 text-xs text-ink/60">overall: {result.consistency.overall}</p>
              <div className="space-y-2 text-sm">
                {result.consistency.checks.map((x, idx) => (
                  <div key={`${x.check}-${idx}`} className={`rounded border p-2 ${x.level === 'pass' ? 'border-green-300 bg-green-50/60' : x.level === 'warn' ? 'border-amber-300 bg-amber-50/60' : 'border-red-300 bg-red-50/60'}`}>
                    <p className="font-medium">{x.check}</p>
                    <p className="text-xs">{x.detail}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.anchors}</h2>
              <div className="max-h-[320px] space-y-2 overflow-auto text-sm">
                {result.dataAnchors.map((a, idx) => (
                  <div key={`${a.sectionId}-${a.value}-${idx}`} className="rounded border border-ink/15 p-2">
                    <p className="font-medium">Section {a.sectionId} · {a.value}{a.unit || ''}</p>
                    <p className="text-xs text-ink/70">anchor: {a.anchorType} · refs: {a.tflRefs.join(', ') || '-'}</p>
                    <p className="text-xs text-ink/70">{a.sentenceExcerpt}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
          <article className="noise-border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.result}</h2>
            <pre className="h-[260px] overflow-auto rounded border border-ink/15 bg-white/50 p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
            <button type="button" onClick={copyJson} className="scanline mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm">
              <ClipboardCopy size={14} /> {t.copy}
            </button>
          </article>
        </section>
      ) : null}
    </div>
  );
}
