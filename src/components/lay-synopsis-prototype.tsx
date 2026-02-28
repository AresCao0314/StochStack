'use client';

import { useMemo, useState } from 'react';
import { ClipboardCopy, Languages, ListChecks, Sparkles } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Sample = {
  id: string;
  title: string;
  therapeuticArea: string;
  indication: string;
  language: string;
  text: string;
};

type LaySynopsis = {
  title: string;
  plainSummary: string;
  whyStudy: string;
  whoCanJoin: string;
  whatWillHappen: string[];
  possibleBenefits: string;
  possibleRisks: string[];
  participantRights: string[];
  dataPrivacy: string;
  contactAndNextSteps: string;
};

type TraceEntry = {
  section: keyof LaySynopsis;
  layText: string;
  sourceExcerpt: string;
  sourceIndex: number;
  matchScore: number;
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Lay Language Protocol Synopsis (EU)',
    subtitle:
      'Generate participant-friendly lay synopsis from protocol or protocol synopsis text for EU submission workflows.',
    sample: 'Sample Input',
    input: 'Protocol / Synopsis Text',
    outputLang: 'Output Language',
    generate: 'Generate Lay Synopsis',
    result: 'Generated Lay Synopsis',
    checklist: 'EU Readiness Checklist',
    readability: 'Readability',
    copy: 'Copy Output JSON',
    review: 'Protocol vs Lay Review',
    layCol: 'Lay sentence',
    srcCol: 'Protocol evidence',
    score: 'Match',
    ta: 'Therapeutic Area',
    indication: 'Indication',
    meddra: 'Apply MedDRA lay mapping',
    custom: 'Custom Lexicon (one per line: source => target)',
    lexicon: 'Lexicon Injection'
  },
  zh: {
    title: 'Lay Language Protocol Synopsis（EU）',
    subtitle: '从 protocol 或 protocol synopsis 自动生成适合受试者阅读的 lay language synopsis，用于 EU 递交流程。',
    sample: '示例输入',
    input: 'Protocol / Synopsis 文本',
    outputLang: '输出语言',
    generate: '生成 Lay Synopsis',
    result: '生成结果',
    checklist: 'EU 检查清单',
    readability: '可读性指标',
    copy: '复制输出 JSON',
    review: 'Protocol vs Lay 对照审阅',
    layCol: 'Lay 句子',
    srcCol: 'Protocol 证据',
    score: '匹配度',
    ta: '治疗领域',
    indication: '适应症',
    meddra: '启用 MedDRA lay 映射',
    custom: '自定义术语库（每行：source => target）',
    lexicon: '词库注入'
  },
  de: {
    title: 'Lay Language Protocol Synopsis (EU)',
    subtitle:
      'Teilnehmerverstaendliche Lay-Synopsis aus Protocol/Synopsis-Text fuer EU-Einreichungen generieren.',
    sample: 'Beispielinput',
    input: 'Protocol / Synopsis Text',
    outputLang: 'Ausgabesprache',
    generate: 'Lay-Synopsis generieren',
    result: 'Generierte Lay-Synopsis',
    checklist: 'EU-Checkliste',
    readability: 'Lesbarkeit',
    copy: 'Output-JSON kopieren',
    review: 'Protocol-vs-Lay Review',
    layCol: 'Lay-Satz',
    srcCol: 'Protocol-Evidenz',
    score: 'Match',
    ta: 'Therapiegebiet',
    indication: 'Indikation',
    meddra: 'MedDRA Lay-Mapping anwenden',
    custom: 'Custom-Lexikon (pro Zeile: source => target)',
    lexicon: 'Lexikon-Injektion'
  }
};

export function LaySynopsisPrototype({ locale, samples }: { locale: Locale; samples: Sample[] }) {
  const t = labels[locale];
  const [sampleId, setSampleId] = useState(samples[0]?.id ?? '');
  const sample = useMemo(() => samples.find((x) => x.id === sampleId) ?? samples[0], [samples, sampleId]);
  const [text, setText] = useState(sample?.text ?? '');
  const [outputLanguage, setOutputLanguage] = useState<'en' | 'de'>('en');
  const [therapeuticArea, setTherapeuticArea] = useState(sample?.therapeuticArea ?? 'Oncology');
  const [indication, setIndication] = useState(sample?.indication ?? 'NSCLC');
  const [useMeddraMap, setUseMeddraMap] = useState(true);
  const [customLexiconText, setCustomLexiconText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LaySynopsis | null>(null);
  const [source, setSource] = useState('');
  const [readability, setReadability] = useState<{ avgSentenceWords: number; jargonFlags: string[] } | null>(null);
  const [checklist, setChecklist] = useState<Array<{ item: string; pass: boolean }>>([]);
  const [traceability, setTraceability] = useState<TraceEntry[]>([]);
  const [appliedLexicon, setAppliedLexicon] = useState<Array<{ source: string; target: string; scope: string; hits: number }>>([]);

  function onSampleChange(id: string) {
    setSampleId(id);
    const next = samples.find((x) => x.id === id);
    if (next) {
      setText(next.text);
      setTherapeuticArea(next.therapeuticArea);
      setIndication(next.indication);
    }
  }

  function parseCustomLexicon(input: string) {
    return input
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf('=>');
        if (idx < 0) return null;
        const source = line.slice(0, idx).trim();
        const target = line.slice(idx + 2).trim();
        if (!source || !target) return null;
        return { source, target };
      })
      .filter(Boolean) as Array<{ source: string; target: string }>;
  }

  async function onGenerate() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/lay-synopsis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          locale,
          outputLanguage,
          therapeuticArea,
          indication,
          useMeddraMap,
          customLexicon: parseCustomLexicon(customLexiconText)
        })
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || 'Generation failed.');
        return;
      }
      setResult(data.data as LaySynopsis);
      setSource(String(data.source || ''));
      setReadability(data.readability || null);
      setChecklist(Array.isArray(data.euChecklist) ? data.euChecklist : []);
      setTraceability(Array.isArray(data.traceability) ? (data.traceability as TraceEntry[]) : []);
      setAppliedLexicon(Array.isArray(data?.lexiconInjection?.applied) ? data.lexiconInjection.applied : []);
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
        <p className="section-title">prototype 12</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-4">
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
            <div className="mt-1 flex items-center gap-2 rounded border border-ink/20 px-2 py-2">
              <Languages size={14} />
              <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value === 'de' ? 'de' : 'en')} className="w-full bg-transparent text-sm outline-none">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </label>
          <label className="text-sm">
            {t.ta}
            <input value={therapeuticArea} onChange={(e) => setTherapeuticArea(e.target.value)} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" />
          </label>
          <label className="text-sm">
            {t.indication}
            <input value={indication} onChange={(e) => setIndication(e.target.value)} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" />
          </label>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 text-lg font-semibold">{t.input}</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="h-[220px] w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm" />
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useMeddraMap} onChange={(e) => setUseMeddraMap(e.target.checked)} />
            <span>{t.meddra}</span>
          </label>
          <label className="text-sm">
            {t.custom}
            <textarea
              value={customLexiconText}
              onChange={(e) => setCustomLexiconText(e.target.value)}
              className="mt-1 h-24 w-full rounded border border-ink/20 bg-transparent px-2 py-2 text-xs"
              placeholder="metastatic => cancer that has spread&#10;randomization => assignment by chance"
            />
          </label>
        </div>
        <button type="button" onClick={onGenerate} disabled={busy || text.trim().length < 40} className="scanline mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50">
          <Sparkles size={14} /> {busy ? '...' : t.generate}
        </button>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </section>

      {result ? (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 text-lg font-semibold">{t.result}</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Title:</span> {result.title}</p>
                <p><span className="font-semibold">Summary:</span> {result.plainSummary}</p>
                <p><span className="font-semibold">Why this study:</span> {result.whyStudy}</p>
                <p><span className="font-semibold">Who can join:</span> {result.whoCanJoin}</p>
                <p><span className="font-semibold">Benefits:</span> {result.possibleBenefits}</p>
                <p><span className="font-semibold">Data privacy:</span> {result.dataPrivacy}</p>
                <p><span className="font-semibold">Contact:</span> {result.contactAndNextSteps}</p>
              </div>
              <pre className="mt-3 h-[220px] overflow-auto rounded border border-ink/15 bg-white/50 p-3 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
              <button type="button" onClick={copyJson} className="scanline mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm">
                <ClipboardCopy size={14} /> {t.copy}
              </button>
            </article>

            <article className="noise-border rounded-lg p-4">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                <ListChecks size={16} /> {t.checklist}
              </h2>
              <p className="mb-2 text-xs text-ink/60">source: {source}</p>
              <ul className="space-y-2 text-sm">
                {checklist.map((x) => (
                  <li key={x.item} className={`rounded border px-3 py-2 ${x.pass ? 'border-green-300 bg-green-50/60' : 'border-red-300 bg-red-50/60'}`}>
                    {x.item} - {x.pass ? 'pass' : 'check needed'}
                  </li>
                ))}
              </ul>
              {readability ? (
                <div className="mt-4 rounded border border-ink/15 p-3 text-sm">
                  <p className="font-semibold">{t.readability}</p>
                  <p className="text-xs text-ink/70">avg sentence words: {readability.avgSentenceWords}</p>
                  <p className="text-xs text-ink/70">
                    jargon flags: {readability.jargonFlags.length ? readability.jargonFlags.join(', ') : 'none'}
                  </p>
                </div>
              ) : null}
              <div className="mt-4 rounded border border-ink/15 p-3 text-sm">
                <p className="font-semibold">{t.lexicon}</p>
                {appliedLexicon.length === 0 ? <p className="text-xs text-ink/70">No mapping applied.</p> : null}
                {appliedLexicon.map((x, idx) => (
                  <p key={`${x.source}-${idx}`} className="text-xs text-ink/70">
                    [{x.scope}] {x.source} {'=>'} {x.target} (hits: {x.hits})
                  </p>
                ))}
              </div>
            </article>
          </section>

          <section className="noise-border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.review}</h2>
            <div className="space-y-2 text-sm">
              {traceability.map((x, idx) => (
                <div key={`${x.section}-${idx}`} className="grid gap-2 rounded border border-ink/15 p-2 md:grid-cols-12">
                  <div className="md:col-span-1 text-[11px] uppercase tracking-[0.12em] text-ink/60">{x.section}</div>
                  <div className="md:col-span-4">
                    <p className="text-xs font-semibold text-ink/65">{t.layCol}</p>
                    <p className="text-sm">{x.layText}</p>
                  </div>
                  <div className="md:col-span-6">
                    <p className="text-xs font-semibold text-ink/65">{t.srcCol}</p>
                    <p className="text-sm text-ink/80">{x.sourceExcerpt || '-'}</p>
                  </div>
                  <div className="md:col-span-1 text-right">
                    <p className="text-xs font-semibold text-ink/65">{t.score}</p>
                    <p className={`text-sm font-semibold ${x.matchScore >= 0.35 ? 'text-green-700' : x.matchScore >= 0.2 ? 'text-amber-700' : 'text-red-700'}`}>
                      {(x.matchScore * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))}
              {traceability.length === 0 ? <p className="text-xs text-ink/60">No traceability map generated.</p> : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
