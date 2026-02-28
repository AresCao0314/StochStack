'use client';

import { useMemo, useState } from 'react';
import { ClipboardCopy, ScanSearch, Table2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Sample = {
  id: string;
  title: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  rawText: string;
};

type SoaRow = { visit: string; window: string; activities: string[] };
type Digitized = {
  title: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  inclusionCriteria: Array<{ id: string; text: string }>;
  exclusionCriteria: Array<{ id: string; text: string }>;
  soa: SoaRow[];
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Historical Protocol Digitizer',
    subtitle:
      'Convert unstructured protocol text into structured Inclusion/Exclusion criteria and SoA blocks, starting from historical protocol archives.',
    sample: 'Sample Protocol',
    raw: 'Unstructured Protocol Text',
    run: 'Digitize Now',
    result: 'Structured Output',
    quality: 'Digitization Quality',
    coverage: 'Coverage',
    copy: 'Copy JSON'
  },
  zh: {
    title: '历史 Protocol 结构化引擎',
    subtitle: '把历史 protocol 的非结构化文本转换成结构化字段，先从 Inclusion/Exclusion 与 SoA 开始。',
    sample: '示例协议',
    raw: '非结构化 Protocol 文本',
    run: '开始结构化',
    result: '结构化结果',
    quality: '结构化质量',
    coverage: '覆盖率',
    copy: '复制 JSON'
  },
  de: {
    title: 'Historical Protocol Digitizer',
    subtitle:
      'Unstrukturierte historische Protocol-Texte in strukturierte Inclusion/Exclusion- und SoA-Bloecke umwandeln.',
    sample: 'Beispiel-Protocol',
    raw: 'Unstrukturierter Protocol-Text',
    run: 'Jetzt strukturieren',
    result: 'Strukturierte Ausgabe',
    quality: 'Digitalisierungsqualitaet',
    coverage: 'Abdeckung',
    copy: 'JSON kopieren'
  }
};

function cleanLine(line: string) {
  return line.replace(/^\s*[-*•\d.)]+\s*/, '').trim();
}

function parseSoaLine(line: string): SoaRow | null {
  const parts = line.split('|').map((x) => x.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  return {
    visit: parts[0],
    window: parts[1],
    activities: parts[2].split(/[;,；]/).map((x) => x.trim()).filter(Boolean)
  };
}

function digitize(sample: Sample, rawText: string): Digitized {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  let section: 'none' | 'inclusion' | 'exclusion' | 'soa' = 'none';
  const inclusion: Array<{ id: string; text: string }> = [];
  const exclusion: Array<{ id: string; text: string }> = [];
  const soa: SoaRow[] = [];

  for (const line of lines) {
    const l = line.toLowerCase();
    if (
      l.includes('inclusion criteria') ||
      l.includes('纳入标准') ||
      l.includes('einschluss')
    ) {
      section = 'inclusion';
      continue;
    }
    if (
      l.includes('exclusion criteria') ||
      l.includes('排除标准') ||
      l.includes('ausschluss')
    ) {
      section = 'exclusion';
      continue;
    }
    if (l.includes('schedule of activities') || l === 'soa：' || l.startsWith('soa') || l.includes('访视')) {
      section = 'soa';
      continue;
    }

    if (section === 'inclusion') {
      const text = cleanLine(line);
      if (text) inclusion.push({ id: `I${inclusion.length + 1}`, text });
    } else if (section === 'exclusion') {
      const text = cleanLine(line);
      if (text) exclusion.push({ id: `E${exclusion.length + 1}`, text });
    } else if (section === 'soa') {
      const row = parseSoaLine(line);
      if (row) soa.push(row);
    }
  }

  return {
    title: sample.title,
    therapeuticArea: sample.therapeuticArea,
    indication: sample.indication,
    phase: sample.phase,
    inclusionCriteria: inclusion,
    exclusionCriteria: exclusion,
    soa
  };
}

export function ProtocolDigitizationPrototype({ locale, samples }: { locale: Locale; samples: Sample[] }) {
  const t = labels[locale];
  const [sampleId, setSampleId] = useState(samples[0]?.id ?? '');
  const sample = useMemo(() => samples.find((x) => x.id === sampleId) ?? samples[0], [samples, sampleId]);
  const [raw, setRaw] = useState(sample?.rawText ?? '');
  const [submittedRaw, setSubmittedRaw] = useState(sample?.rawText ?? '');

  const structured = useMemo(() => digitize(sample, submittedRaw), [sample, submittedRaw]);
  const coverage = useMemo(() => {
    const maxScore = 3;
    let score = 0;
    if (structured.inclusionCriteria.length > 0) score += 1;
    if (structured.exclusionCriteria.length > 0) score += 1;
    if (structured.soa.length > 0) score += 1;
    return { score, maxScore, pct: Math.round((score / maxScore) * 100) };
  }, [structured]);

  function onSampleChange(id: string) {
    setSampleId(id);
    const next = samples.find((x) => x.id === id);
    if (next) {
      setRaw(next.rawText);
      setSubmittedRaw(next.rawText);
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(structured, null, 2));
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 11</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <label className="text-sm">
          {t.sample}
          <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={sample.id} onChange={(e) => onSampleChange(e.target.value)}>
            {samples.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title} · {x.therapeuticArea} · {x.indication}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <ScanSearch size={16} /> {t.raw}
          </h2>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} className="h-[420px] w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm" />
          <button type="button" onClick={() => setSubmittedRaw(raw)} className="scanline mt-3 rounded border border-ink/20 px-3 py-2 text-sm">
            {t.run}
          </button>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Table2 size={16} /> {t.result}
          </h2>
          <div className="mb-3 rounded border border-ink/15 p-3 text-sm">
            <p>{t.quality}: {coverage.score}/{coverage.maxScore}</p>
            <p>{t.coverage}: {coverage.pct}%</p>
          </div>
          <pre className="h-[360px] overflow-auto rounded border border-ink/15 bg-white/50 p-3 text-xs">
            {JSON.stringify(structured, null, 2)}
          </pre>
          <button type="button" onClick={copyJson} className="scanline mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm">
            <ClipboardCopy size={14} /> {t.copy}
          </button>
        </article>
      </section>
    </div>
  );
}
