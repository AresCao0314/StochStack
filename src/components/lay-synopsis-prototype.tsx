'use client';

import { useMemo, useState } from 'react';
import { ClipboardCopy, Languages, ListChecks, Sparkles } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Sample = {
  id: string;
  title: string;
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
    copy: 'Copy Output JSON'
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
    copy: '复制输出 JSON'
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
    copy: 'Output-JSON kopieren'
  }
};

export function LaySynopsisPrototype({ locale, samples }: { locale: Locale; samples: Sample[] }) {
  const t = labels[locale];
  const [sampleId, setSampleId] = useState(samples[0]?.id ?? '');
  const sample = useMemo(() => samples.find((x) => x.id === sampleId) ?? samples[0], [samples, sampleId]);
  const [text, setText] = useState(sample?.text ?? '');
  const [outputLanguage, setOutputLanguage] = useState<'en' | 'de'>('en');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LaySynopsis | null>(null);
  const [source, setSource] = useState('');
  const [readability, setReadability] = useState<{ avgSentenceWords: number; jargonFlags: string[] } | null>(null);
  const [checklist, setChecklist] = useState<Array<{ item: string; pass: boolean }>>([]);

  function onSampleChange(id: string) {
    setSampleId(id);
    const next = samples.find((x) => x.id === id);
    if (next) setText(next.text);
  }

  async function onGenerate() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/lay-synopsis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, locale, outputLanguage })
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
            <div className="mt-1 flex items-center gap-2 rounded border border-ink/20 px-2 py-2">
              <Languages size={14} />
              <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value === 'de' ? 'de' : 'en')} className="w-full bg-transparent text-sm outline-none">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 text-lg font-semibold">{t.input}</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="h-[220px] w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm" />
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
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
