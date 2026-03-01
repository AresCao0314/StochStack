import type { Metadata } from 'next';
import { Activity, Clock3, GitCommitHorizontal } from 'lucide-react';
import { readRecentRefreshRuns, readRepoChangelog } from '@/lib/server/ops-logs-store';
import type { Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const text = {
  en: {
    title: 'Ops Review Panel',
    subtitle: 'Repository evolution and latest cron refresh runs in one internal board.',
    repo: 'Repository Changelog',
    runs: 'Recent Cron Refresh Runs',
    noRepo: 'No changelog entries found.',
    noRuns: 'No refresh runs found yet.',
    status: 'status',
    warnings: 'warnings',
    errors: 'errors'
  },
  zh: {
    title: '运维审阅面板',
    subtitle: '把仓库演进日志与最近 cron 刷新运行结果汇总到一个内部面板。',
    repo: '仓库更新日志',
    runs: '最近 Cron 刷新运行',
    noRepo: '暂无变更日志。',
    noRuns: '暂无刷新运行记录。',
    status: '状态',
    warnings: '告警',
    errors: '错误'
  },
  de: {
    title: 'Ops Review Panel',
    subtitle: 'Repository-Entwicklung und letzte Cron-Runs in einem internen Board.',
    repo: 'Repository Changelog',
    runs: 'Letzte Cron-Refresh-Runs',
    noRepo: 'Keine Changelog-Eintraege gefunden.',
    noRuns: 'Noch keine Refresh-Runs gefunden.',
    status: 'Status',
    warnings: 'Warnungen',
    errors: 'Fehler'
  }
} as const;

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = text[params.locale] || text.en;
  return {
    title: `${t.title} | StochStack`,
    description: t.subtitle,
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function OpsLogsPage({ params }: { params: { locale: Locale } }) {
  const t = text[params.locale] || text.en;
  const [repoEntries, recentRuns] = await Promise.all([readRepoChangelog(14), readRecentRefreshRuns(12)]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">internal ops</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
          <GitCommitHorizontal size={16} /> {t.repo}
        </h2>
        {repoEntries.length === 0 ? <p className="text-sm text-ink/65">{t.noRepo}</p> : null}
        <ol className="space-y-3 border-l border-ink/20 pl-4">
          {repoEntries.map((entry, idx) => (
            <li key={`${entry.date}-${entry.title}-${idx}`} className="relative rounded border border-ink/15 p-3">
              <span className="absolute -left-[1.15rem] top-4 h-2 w-2 rounded-full bg-accent1" />
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink/60">{entry.date}</p>
              <p className="mt-1 text-sm font-semibold">{entry.title}</p>
              <ul className="mt-2 space-y-1 text-xs text-ink/75">
                {entry.items.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
          <Activity size={16} /> {t.runs}
        </h2>
        {recentRuns.length === 0 ? <p className="text-sm text-ink/65">{t.noRuns}</p> : null}
        <div className="space-y-3">
          {recentRuns.map((run) => (
            <article key={run.startedAt} className="rounded border border-ink/15 p-3">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <p className="flex items-center gap-1 font-mono text-ink/70">
                  <Clock3 size={12} /> {run.startedAt}
                </p>
                <span className="rounded border border-ink/20 px-2 py-0.5 uppercase">
                  {t.status}: {run.status}
                </span>
                <span className="rounded border border-ink/20 px-2 py-0.5">{t.warnings}: {run.warnings}</span>
                <span className="rounded border border-ink/20 px-2 py-0.5">{t.errors}: {run.errors}</span>
              </div>
              <pre className="mt-2 overflow-x-auto rounded bg-warm p-2 text-[11px] text-ink/80">
                {run.lines.join('\n')}
              </pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
