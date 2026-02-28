'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, KeyRound, Layers3, SearchCheck } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Dataset = {
  id: string;
  name: string;
  domain: string;
  therapeuticAreas: string[];
  sourceType: string;
  owner: string;
  accessOwner: string;
  accessLevel: string;
  storageType: string;
  systems: string[];
  refreshFrequency: string;
  recordGranularity: string;
  coverage: { regions: string[]; years: string; rowsApprox: string };
  schema: Array<{ field: string; type: string; description: string; sensitivity: string }>;
  tags: string[];
};

type Overview = {
  totalDatasets: number;
  domains: number;
  bySource: { internal: number; external: number; hybrid: number };
  restricted: number;
  controlled: number;
};

type QueryResponse = {
  ok: boolean;
  confidence: number;
  matches: Dataset[];
  overview: Overview;
  accessHint: { action: string; message: string };
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Data Agent',
    subtitle:
      'A natural-language data catalog for clinical development: what data exists, where it lives, who controls access, and what schema it has.',
    ask: 'Ask the data agent',
    placeholder:
      'Do we have claims and RWE datasets for oncology in US/EU? Who owns access and what key fields are available?',
    run: 'Query Catalog',
    confidence: 'Match confidence',
    results: 'Matched datasets',
    noResult: 'No confident match yet. Generate intake request with scope and timeline.',
    overview: 'Data estate overview',
    access: 'Access guidance',
    fields: 'Schema fields',
    owner: 'Owner',
    accessOwner: 'Access owner',
    source: 'Source',
    storage: 'Storage',
    refresh: 'Refresh',
    granularity: 'Granularity'
  },
  zh: {
    title: 'Data Agent',
    subtitle:
      '面向临床研发的数据目录 Agent：用自然语言知道“有哪些数据、在哪里、谁有权限、字段长什么样”。',
    ask: '向 Data Agent 提问',
    placeholder: '我们有没有肿瘤领域的 claims 和 RWE 数据？谁管理 access？关键字段有哪些？',
    run: '检索数据目录',
    confidence: '匹配置信度',
    results: '命中数据集',
    noResult: '当前没有高置信命中，建议生成 intake 申请并补充范围和时限。',
    overview: '数据资产总览',
    access: 'Access 指引',
    fields: 'Schema 字段',
    owner: '数据 Owner',
    accessOwner: 'Access Owner',
    source: '来源',
    storage: '存储',
    refresh: '刷新频率',
    granularity: '粒度'
  },
  de: {
    title: 'Data Agent',
    subtitle:
      'Natuerlichsprachiger Datenkatalog fuer Clinical Development: welche Daten existieren, wo sie liegen, wer Zugriff steuert und welches Schema verfuegbar ist.',
    ask: 'Data Agent fragen',
    placeholder:
      'Haben wir Claims- und RWE-Daten fuer Onkologie in US/EU? Wer ist Access Owner und welche Felder sind verfuegbar?',
    run: 'Katalog abfragen',
    confidence: 'Match-Konfidenz',
    results: 'Gefundene Datensaetze',
    noResult: 'Kein stabiler Treffer. Bitte Intake mit Scope und Timeline anlegen.',
    overview: 'Datenlandschaft Uebersicht',
    access: 'Access-Hinweis',
    fields: 'Schema-Felder',
    owner: 'Owner',
    accessOwner: 'Access Owner',
    source: 'Quelle',
    storage: 'Storage',
    refresh: 'Refresh',
    granularity: 'Granularitaet'
  }
};

function sourceBadge(source: string) {
  if (source === 'internal') return 'bg-accent1/20 border-accent1/50';
  if (source === 'external') return 'bg-accent2/20 border-accent2/50';
  return 'bg-accent3/20 border-accent3/50';
}

export function DataAgentPrototype({ locale, initial }: { locale: Locale; initial: Dataset[] }) {
  const t = labels[locale];
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<Dataset[]>(initial.slice(0, 6));
  const [overview, setOverview] = useState<Overview | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [accessHint, setAccessHint] = useState('');

  useEffect(() => {
    fetch('/api/data-agent/query')
      .then((r) => r.json())
      .then((data) => {
        if (!data?.ok) return;
        setOverview(data.overview);
      })
      .catch(() => undefined);
  }, []);

  async function runQuery() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/data-agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, locale })
      });
      const data = (await res.json()) as QueryResponse & { error?: string };
      if (!data.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      setMatches(data.matches);
      setOverview(data.overview);
      setConfidence(data.confidence);
      setAccessHint(data.accessHint?.message ?? '');
    } catch {
      setError('Data agent query failed.');
    } finally {
      setBusy(false);
    }
  }

  const overviewItems = useMemo(
    () =>
      overview
        ? [
            { label: 'datasets', value: String(overview.totalDatasets) },
            { label: 'domains', value: String(overview.domains) },
            { label: 'internal/external/hybrid', value: `${overview.bySource.internal}/${overview.bySource.external}/${overview.bySource.hybrid}` },
            { label: 'restricted/controlled', value: `${overview.restricted}/${overview.controlled}` }
          ]
        : [],
    [overview]
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 09</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <SearchCheck size={15} /> {t.ask}
        </p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="h-24 w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm"
          aria-label={t.ask}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="scanline rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50"
            onClick={runQuery}
            disabled={busy || query.trim().length < 4}
            aria-label={t.run}
          >
            {t.run}
          </button>
          <span className="text-xs text-ink/60">
            {t.confidence}: {(confidence * 100).toFixed(0)}%
          </span>
        </div>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </section>

      {overviewItems.length > 0 ? (
        <section className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Layers3 size={16} /> {t.overview}
          </h2>
          <div className="grid gap-3 md:grid-cols-4">
            {overviewItems.map((item) => (
              <div key={item.label} className="rounded border border-ink/15 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Database size={16} /> {t.results}
        </h2>
        {matches.length === 0 ? <p className="text-sm text-ink/60">{t.noResult}</p> : null}
        <div className="space-y-4">
          {matches.map((ds) => (
            <article key={ds.id} className="rounded border border-ink/15 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{ds.name}</h3>
                <span className={`rounded border px-2 py-0.5 text-[11px] uppercase ${sourceBadge(ds.sourceType)}`}>
                  {t.source}: {ds.sourceType}
                </span>
                <span className="rounded border border-ink/15 px-2 py-0.5 text-[11px] uppercase">{ds.domain}</span>
              </div>
              <p className="mt-1 text-xs text-ink/65">{ds.therapeuticAreas.join(' · ')}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1 text-xs">
                  <p>{t.owner}: {ds.owner}</p>
                  <p>{t.accessOwner}: {ds.accessOwner}</p>
                  <p>{t.storage}: {ds.storageType}</p>
                  <p>{t.refresh}: {ds.refreshFrequency}</p>
                  <p>{t.granularity}: {ds.recordGranularity}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold">{t.fields}</p>
                  <div className="space-y-1">
                    {ds.schema.slice(0, 4).map((f) => (
                      <div key={f.field} className="rounded border border-ink/15 px-2 py-1 text-xs">
                        <span className="font-mono">{f.field}</span> ({f.type}) - {f.description}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <KeyRound size={16} /> {t.access}
        </h2>
        <p className="text-sm text-ink/80">
          {accessHint || 'Run a query first. The agent will return owner, access level, and recommended request path.'}
        </p>
      </section>
    </div>
  );
}
