'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n';

type Project = {
  id: string;
  name: string;
  keywords: string[];
};

type Signal = {
  id: string;
  project_id: string;
  topic: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
  link: string;
  tags: string[];
  relevance_score: number;
};

type Digest = {
  updated_at: string;
  today: string;
  total_signals: number;
  new_since_last_run: number;
  new_published_today: number;
  watchlist: {
    total_hits: number;
    highlights: Array<{
      title: string;
      project_id: string;
      published_at: string;
      source: string;
      link: string;
      companies: string[];
    }>;
  };
  new_items: Array<{
    title: string;
    project_id: string;
    published_at: string;
    source: string;
    link: string;
  }>;
};

type Props = {
  locale: Locale;
  projects: Project[];
  signals: Signal[];
  digest: Digest;
};

const text = {
  en: {
    title: 'Market Intelligence Console',
    subtitle:
      'A unified radar for clinical development programs, tech partnerships, and vendor movement.',
    updated: 'Updated',
    filters: { project: 'Project', topic: 'Topic', window: 'Window', all: 'All', days30: 'Last 30d', days90: 'Last 90d', days180: 'Last 180d' },
    metrics: { total: 'Total signals', delta: 'New this run', today: 'New today', watch: 'Big-tech hits' },
    dailyNew: 'New Signals',
    watch: 'Big-Tech Watch',
    radar: 'Program Radar',
    map: 'Program Map',
    source: 'source'
  },
  zh: {
    title: '市场情报控制台',
    subtitle: '把临床开发项目、技术合作与 vendor 动向收敛到一个统一雷达。',
    updated: '更新时间',
    filters: { project: '项目', topic: '主题', window: '时间窗', all: '全部', days30: '近30天', days90: '近90天', days180: '近180天' },
    metrics: { total: '总信号', delta: '本轮新增', today: '今日新增', watch: '科技巨头命中' },
    dailyNew: '新增信号',
    watch: '科技巨头动向',
    radar: '项目雷达',
    map: '项目地图',
    source: '来源'
  },
  de: {
    title: 'Market Intelligence Konsole',
    subtitle: 'Ein Radar fuer klinische Programme, Technologiepartnerschaften und Vendor-Bewegungen.',
    updated: 'Aktualisiert',
    filters: { project: 'Projekt', topic: 'Thema', window: 'Zeitraum', all: 'Alle', days30: 'Letzte 30T', days90: 'Letzte 90T', days180: 'Letzte 180T' },
    metrics: { total: 'Signale gesamt', delta: 'Neu im Lauf', today: 'Neu heute', watch: 'Big-Tech Treffer' },
    dailyNew: 'Neue Signale',
    watch: 'Big-Tech Watch',
    radar: 'Programm-Radar',
    map: 'Projektkarte',
    source: 'Quelle'
  }
} as const;

function inWindow(dateStr: string, days: number) {
  const now = new Date('2026-02-28T00:00:00Z').getTime();
  const ts = new Date(dateStr).getTime();
  const span = days * 24 * 60 * 60 * 1000;
  return now - ts <= span;
}

export function MarketIntelligencePrototype({ locale, projects, signals, digest }: Props) {
  const copy = text[locale];
  const [projectFilter, setProjectFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [windowFilter, setWindowFilter] = useState<'all' | '30' | '90' | '180'>('all');

  const topics = useMemo(() => Array.from(new Set(signals.map((item) => item.topic))), [signals]);

  const filtered = signals.filter((item) => {
    const projectPass = projectFilter === 'all' || item.project_id === projectFilter;
    const topicPass = topicFilter === 'all' || item.topic === topicFilter;
    const windowPass =
      windowFilter === 'all' ||
      (windowFilter === '30' && inWindow(item.published_at, 30)) ||
      (windowFilter === '90' && inWindow(item.published_at, 90)) ||
      (windowFilter === '180' && inWindow(item.published_at, 180));

    return projectPass && topicPass && windowPass;
  });

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="space-y-8">
      <section className="noise-border rounded-lg p-6">
        <p className="section-title">legacy upgraded</p>
        <h1 className="mt-2 text-4xl font-bold md:text-6xl">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-ink/75">{copy.subtitle}</p>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-ink/65">
          {copy.updated}: {new Date(digest.updated_at).toLocaleString()}
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="noise-border rounded p-3 text-sm">{copy.metrics.total}: {digest.total_signals}</div>
          <div className="noise-border rounded p-3 text-sm">{copy.metrics.delta}: {digest.new_since_last_run}</div>
          <div className="noise-border rounded p-3 text-sm">{copy.metrics.today}: {digest.new_published_today}</div>
          <div className="noise-border rounded p-3 text-sm">{copy.metrics.watch}: {digest.watchlist.total_hits}</div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <label className="text-sm">
          {copy.filters.project}
          <select
            aria-label={copy.filters.project}
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">{copy.filters.all}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {copy.filters.topic}
          <select
            aria-label={copy.filters.topic}
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
          >
            <option value="all">{copy.filters.all}</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          {copy.filters.window}
          <select
            aria-label={copy.filters.window}
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            value={windowFilter}
            onChange={(e) => setWindowFilter(e.target.value as 'all' | '30' | '90' | '180')}
          >
            <option value="all">{copy.filters.all}</option>
            <option value="30">{copy.filters.days30}</option>
            <option value="90">{copy.filters.days90}</option>
            <option value="180">{copy.filters.days180}</option>
          </select>
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{copy.radar}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((signal) => (
            <article key={signal.id} className="noise-border scanline rounded-lg p-4">
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink/60">
                <span>{projectName(signal.project_id)}</span>
                <span>•</span>
                <span>{signal.topic}</span>
                <span>•</span>
                <span>{Math.round(signal.relevance_score * 100)}%</span>
              </div>
              <h3 className="text-lg font-semibold">{signal.title}</h3>
              <p className="mt-2 text-sm text-ink/75">{signal.summary}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-ink/65">
                <span>{signal.published_at} · {signal.source}</span>
                <a href={signal.link} target="_blank" rel="noreferrer" className="glitch-link">
                  {copy.source}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h3 className="mb-3 text-xl font-semibold">{copy.dailyNew}</h3>
          <div className="space-y-3 text-sm">
            {digest.new_items.map((item) => (
              <div key={item.title}>
                <p className="font-medium">{item.title}</p>
                <p className="text-ink/65">{item.published_at} · {projectName(item.project_id)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h3 className="mb-3 text-xl font-semibold">{copy.watch}</h3>
          <div className="space-y-3 text-sm">
            {digest.watchlist.highlights.map((item) => (
              <div key={item.title}>
                <p className="font-medium">{item.title}</p>
                <p className="text-ink/65">{item.companies.join(', ')} · {item.published_at}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{copy.map}</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="noise-border rounded p-3">
              <p className="text-sm font-medium">{project.name}</p>
              <p className="mt-2 text-xs text-ink/65">{project.keywords.slice(0, 2).join(' · ')}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
