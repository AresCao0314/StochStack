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
    copy: 'Copy JSON'
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
    copy: '复制 JSON'
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
    copy: 'JSON kopieren'
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
  const [result, setResult] = useState<CsrDraft | null>(null);

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
      setResult(data.data as CsrDraft);
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
                <p><span className="font-semibold">Title page:</span> {result.dataIndependent.titlePage}</p>
                <p><span className="font-semibold">Synopsis:</span> {result.dataIndependent.synopsis}</p>
                <p><span className="font-semibold">Study design:</span> {result.dataIndependent.studyDesign}</p>
                <p><span className="font-semibold">Objectives/endpoints:</span> {result.dataIndependent.objectivesEndpoints}</p>
                <p><span className="font-semibold">Methods:</span> {result.dataIndependent.methodsGeneral}</p>
              </div>
            </article>
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <SplitSquareVertical size={16} /> {t.dependent}
              </h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Disposition/baseline:</span> {result.dataDependent.dispositionAndBaseline}</p>
                <p><span className="font-semibold">Efficacy:</span> {result.dataDependent.efficacyResults}</p>
                <p><span className="font-semibold">Safety:</span> {result.dataDependent.safetyResults}</p>
                <p><span className="font-semibold">Benefit-risk:</span> {result.dataDependent.benefitRisk}</p>
                <p><span className="font-semibold">Conclusion:</span> {result.dataDependent.conclusion}</p>
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
