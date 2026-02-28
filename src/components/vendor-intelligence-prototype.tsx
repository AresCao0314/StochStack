'use client';

import { useMemo, useState } from 'react';
import { BookOpenText, Building2, Cpu, Radar } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export type Scenario = {
  id: string;
  name: Record<Locale, string>;
  summary: Record<Locale, string>;
};

export type VendorProduct = {
  name: string;
  status: 'alpha' | 'beta' | 'live';
  scenarios: string[];
  technologies: string[];
  description: string;
  link: string;
};

export type Vendor = {
  id: string;
  name: string;
  type: string;
  products: VendorProduct[];
};

export type Literature = {
  id: string;
  title: string;
  year: number;
  source: string;
  link: string;
  scenarios: string[];
  technologies: string[];
  signal: 'low' | 'medium' | 'high';
};

export type Catalog = {
  updatedAt: string;
  scenarios: Scenario[];
  technologyTaxonomy: string[];
  vendors: Vendor[];
  literature: Literature[];
};

export type SignalItem = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  link: string;
  scenarios: string[];
  technologies: string[];
  kind: 'vendor_update' | 'literature';
};

export type Signals = {
  updatedAt: string;
  items: SignalItem[];
};

const copy = {
  en: {
    title: 'Clinical AI Vendor Intelligence Radar',
    subtitle:
      'Scenario-first signal board for CRO and clinical-tech landscape: map who solves what, with which technologies, and what literature is moving the frontier.',
    updated: 'Updated',
    all: 'All scenarios',
    scenarios: 'Application Scenario Cards',
    vendors: 'Vendor Solutions',
    literature: 'Literature Signals',
    latest: 'Latest Auto-Collected Signals',
    technologies: 'Technology surface',
    vendorCount: 'vendors',
    productCount: 'products',
    litCount: 'papers',
    open: 'open'
  },
  zh: {
    title: '临床 AI Vendor 情报雷达',
    subtitle:
      '按应用场景组织 CRO 与临床科技版图：谁在解决什么问题、使用什么技术、哪些文献正在推动前沿。',
    updated: '更新时间',
    all: '全部场景',
    scenarios: '应用场景卡片',
    vendors: 'Vendor 解决方案',
    literature: '文献信号',
    latest: '最新自动采集信号',
    technologies: '技术面',
    vendorCount: '家 vendor',
    productCount: '个产品',
    litCount: '篇文献',
    open: '打开'
  },
  de: {
    title: 'Clinical AI Vendor Intelligence Radar',
    subtitle:
      'Szenario-basierte CRO- und Clinical-Tech-Landkarte: wer welches Problem loest, mit welchen Technologien, und welche Literatur neue Impulse setzt.',
    updated: 'Aktualisiert',
    all: 'Alle Szenarien',
    scenarios: 'Anwendungsszenario-Karten',
    vendors: 'Vendor-Loesungen',
    literature: 'Literatur-Signale',
    latest: 'Neueste automatisch erfasste Signale',
    technologies: 'Technologie-Flaeche',
    vendorCount: 'Vendor',
    productCount: 'Produkte',
    litCount: 'Publikationen',
    open: 'oeffnen'
  }
} as const;

function uniq<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function VendorIntelligencePrototype({
  locale,
  catalog,
  signals
}: {
  locale: Locale;
  catalog: Catalog;
  signals: Signals;
}) {
  const t = copy[locale];
  const [scenario, setScenario] = useState('all');

  const scenarioStats = useMemo(() => {
    return catalog.scenarios.map((item) => {
      const vendors = catalog.vendors.filter((vendor) => vendor.products.some((product) => product.scenarios.includes(item.id)));
      const products = vendors.flatMap((vendor) => vendor.products.filter((product) => product.scenarios.includes(item.id)));
      const papers = catalog.literature.filter((lit) => lit.scenarios.includes(item.id));
      return { id: item.id, vendors: vendors.length, products: products.length, papers: papers.length };
    });
  }, [catalog]);

  const filteredVendors = useMemo(() => {
    if (scenario === 'all') return catalog.vendors;
    return catalog.vendors
      .map((vendor) => ({
        ...vendor,
        products: vendor.products.filter((product) => product.scenarios.includes(scenario))
      }))
      .filter((vendor) => vendor.products.length > 0);
  }, [catalog.vendors, scenario]);

  const filteredLiterature = useMemo(() => {
    if (scenario === 'all') return catalog.literature;
    return catalog.literature.filter((lit) => lit.scenarios.includes(scenario));
  }, [catalog.literature, scenario]);

  const filteredSignals = useMemo(() => {
    if (scenario === 'all') return signals.items;
    return signals.items.filter((item) => item.scenarios.includes(scenario));
  }, [signals.items, scenario]);

  const technologySurface = useMemo(() => {
    const tech = filteredVendors.flatMap((vendor) => vendor.products.flatMap((product) => product.technologies));
    const litTech = filteredLiterature.flatMap((lit) => lit.technologies);
    return uniq([...tech, ...litTech]).sort();
  }, [filteredLiterature, filteredVendors]);

  const scenarioName = (id: string) => catalog.scenarios.find((item) => item.id === id)?.name[locale] ?? id;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 18</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-5xl text-ink/75">{t.subtitle}</p>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink/65">
          {t.updated}: {new Date(catalog.updatedAt).toLocaleString()} · signals: {new Date(signals.updatedAt).toLocaleString()}
        </p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <label className="text-sm">
          {t.scenarios}
          <select
            aria-label="scenario filter"
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2 md:w-96"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          >
            <option value="all">{t.all}</option>
            {catalog.scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name[locale]}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {catalog.scenarios.map((item) => {
            const stat = scenarioStats.find((s) => s.id === item.id);
            const active = scenario === item.id || scenario === 'all';
            return (
              <article key={item.id} className={`rounded border p-3 ${active ? 'border-accent1/50 bg-accent1/10' : 'border-ink/15'}`}>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{item.id}</p>
                <h3 className="mt-1 text-sm font-semibold">{item.name[locale]}</h3>
                <p className="mt-1 text-xs text-ink/70">{item.summary[locale]}</p>
                <p className="mt-2 text-[11px] text-ink/65">
                  {stat?.vendors ?? 0} {t.vendorCount} · {stat?.products ?? 0} {t.productCount} · {stat?.papers ?? 0} {t.litCount}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="noise-border rounded-lg p-4 xl:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <Building2 size={16} /> {t.vendors}
          </h2>
          <div className="space-y-3">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id} className="rounded border border-ink/15 p-3">
                <p className="text-sm font-semibold">{vendor.name} <span className="text-xs font-normal text-ink/60">({vendor.type})</span></p>
                <div className="mt-2 space-y-2">
                  {vendor.products.map((product) => (
                    <div key={product.name} className="rounded border border-ink/15 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{product.name}</p>
                        <span className="rounded border border-ink/15 px-2 py-0.5 text-[11px] uppercase">{product.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink/70">{product.description}</p>
                      <p className="mt-1 text-xs text-ink/65">{product.scenarios.map(scenarioName).join(' · ')}</p>
                      <p className="mt-1 text-xs text-ink/65">{product.technologies.join(' · ')}</p>
                      <a className="glitch-link mt-1 inline-block text-xs" href={product.link} target="_blank" rel="noreferrer">
                        {t.open}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <Cpu size={16} /> {t.technologies}
          </h2>
          <div className="flex flex-wrap gap-2">
            {technologySurface.map((tech) => (
              <span key={tech} className="rounded border border-ink/15 px-2 py-1 text-xs uppercase tracking-[0.12em]">
                {tech}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <BookOpenText size={16} /> {t.literature}
          </h2>
          <div className="space-y-2">
            {filteredLiterature.map((lit) => (
              <div key={lit.id} className="rounded border border-ink/15 p-3">
                <p className="text-sm font-medium">{lit.title}</p>
                <p className="mt-1 text-xs text-ink/70">{lit.year} · {lit.source} · {lit.signal}</p>
                <p className="mt-1 text-xs text-ink/65">{lit.technologies.join(' · ')}</p>
                <a className="glitch-link mt-1 inline-block text-xs" href={lit.link} target="_blank" rel="noreferrer">
                  {t.open}
                </a>
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
            <Radar size={16} /> {t.latest}
          </h2>
          <div className="space-y-2">
            {filteredSignals.map((item) => (
              <div key={item.id} className="rounded border border-ink/15 p-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-ink/70">
                  {item.publishedAt} · {item.source} · {item.kind}
                </p>
                <p className="mt-1 text-xs text-ink/65">{item.technologies.join(' · ')}</p>
                <a className="glitch-link mt-1 inline-block text-xs" href={item.link} target="_blank" rel="noreferrer">
                  {t.open}
                </a>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
