'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Compass, Database, PlayCircle } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type SourceStatus = 'healthy' | 'warning' | 'lagging';

type TrialSource = {
  name: string;
  status: SourceStatus;
  lastSync: string;
  coverage: string;
};

type TrialKpi = {
  key: string;
  label: string;
  planned: number;
  actual: number;
  unit: string;
  thresholdPct: number;
  owner: string;
};

export type TrialRecord = {
  id: string;
  name: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  region: string;
  sources: TrialSource[];
  kpis: TrialKpi[];
};

export type SkillPack = {
  header: string;
  intentKeywords: string[];
  description: string;
  sopSteps: string[];
  outputs: string[];
};

type ActionPlan = {
  kpi: string;
  severity: 'critical' | 'watch';
  driftPct: number;
  owner: string;
  skill: SkillPack | null;
};

const labels: Record<Locale, Record<string, string>> = {
  en: {
    title: 'CTM Daily Control Panel',
    subtitle:
      'Unified trial operations dashboard for CTM: fuse CTMS/EDC/RTSM/Excel signals, detect KPI drift, and execute SOP-as-code playbooks with ReAct routing.',
    sourceHealth: 'Data Source Health',
    kpiBoard: 'KPI Drift Board',
    mitigation: 'Mitigation Planner',
    dailyTodo: 'Today Action Queue',
    react: 'ReAct Skill Router',
    ask: 'Ask what to do today',
    route: 'Route to SOP Skill',
    intent: 'Intent match',
    reasoning: 'Reasoning trace',
    action: 'Action steps',
    output: 'Expected outputs',
    noRoute: 'No high-confidence skill matched. Put this request into backlog intake.',
    planned: 'Planned',
    actual: 'Actual',
    owner: 'Owner',
    drift: 'Drift',
    status: 'Status',
    healthy: 'Healthy',
    warning: 'Warning',
    lagging: 'Lagging',
    critical: 'Critical',
    watch: 'Watch'
  },
  zh: {
    title: 'CTM 每日控制面板',
    subtitle:
      '给 CTM 的统一运营驾驶舱：融合 CTMS/EDC/RTSM/Excel 信号，检测指标偏移，并通过 SOP as code + ReAct 路由给出行动方案。',
    sourceHealth: '数据源健康度',
    kpiBoard: 'KPI 偏移看板',
    mitigation: 'Mitigation 方案',
    dailyTodo: '今日行动队列',
    react: 'ReAct Skill 路由',
    ask: '输入今天要解决的问题',
    route: '路由到 SOP Skill',
    intent: '意图匹配',
    reasoning: '推理轨迹',
    action: '执行动作',
    output: '预期输出',
    noRoute: '当前没有高置信 skill 命中，建议进入 backlog intake。',
    planned: '计划值',
    actual: '实际值',
    owner: 'Owner',
    drift: '偏移',
    status: '状态',
    healthy: '正常',
    warning: '预警',
    lagging: '滞后',
    critical: '高风险',
    watch: '观察'
  },
  de: {
    title: 'CTM Daily Control Panel',
    subtitle:
      'Einheitliches CTM-Dashboard: CTMS/EDC/RTSM/Excel Signale zusammenfuehren, KPI-Drift erkennen und SOP-as-code mit ReAct ausfuehren.',
    sourceHealth: 'Datenquellen-Status',
    kpiBoard: 'KPI-Drift Board',
    mitigation: 'Mitigation Planner',
    dailyTodo: 'Heute: Action Queue',
    react: 'ReAct Skill Router',
    ask: 'Frage: Was ist heute zu tun?',
    route: 'Zu SOP Skill routen',
    intent: 'Intent Match',
    reasoning: 'Reasoning-Trace',
    action: 'Aktionen',
    output: 'Outputs',
    noRoute: 'Kein Skill mit hoher Konfidenz. Bitte in Backlog Intake aufnehmen.',
    planned: 'Plan',
    actual: 'Ist',
    owner: 'Owner',
    drift: 'Abweichung',
    status: 'Status',
    healthy: 'Healthy',
    warning: 'Warning',
    lagging: 'Lagging',
    critical: 'Kritisch',
    watch: 'Beobachten'
  }
};

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function sourceBadge(status: SourceStatus) {
  if (status === 'healthy') return 'border-accent1/50 bg-accent1/15';
  if (status === 'warning') return 'border-accent2/50 bg-accent2/20';
  return 'border-red-300 bg-red-50';
}

function severityBadge(level: 'critical' | 'watch') {
  return level === 'critical' ? 'border-red-300 bg-red-50 text-red-700' : 'border-accent2/50 bg-accent2/20';
}

function findBestSkill(skills: SkillPack[], query: string) {
  const lower = query.toLowerCase();
  const scored = skills
    .map((skill) => {
      const hits = skill.intentKeywords.filter((kw) => lower.includes(kw.toLowerCase()));
      return { skill, score: hits.length, hits };
    })
    .sort((a, b) => b.score - a.score);

  if (!scored[0] || scored[0].score === 0) return null;
  return scored[0];
}

export function CtmDashboardPrototype({
  locale,
  trials,
  skills
}: {
  locale: Locale;
  trials: TrialRecord[];
  skills: SkillPack[];
}) {
  const t = labels[locale];
  const [trialId, setTrialId] = useState(trials[0]?.id ?? '');
  const [query, setQuery] = useState('Enrollment curve is 12% behind plan in DE/FR. What should CTM do this week?');

  const trial = useMemo(() => trials.find((item) => item.id === trialId) ?? trials[0], [trialId, trials]);

  const kpiBoard = useMemo(() => {
    return trial.kpis.map((kpi) => {
      const driftPct = ((kpi.actual - kpi.planned) / Math.max(kpi.planned, 1)) * 100;
      const limit = Math.abs(kpi.thresholdPct);
      const isBad = kpi.thresholdPct < 0 ? driftPct <= -limit : driftPct >= limit;
      return {
        ...kpi,
        driftPct,
        level: isBad ? ('critical' as const) : ('watch' as const)
      };
    });
  }, [trial]);

  const actionPlans = useMemo<ActionPlan[]>(() => {
    return kpiBoard
      .filter((kpi) => kpi.level === 'critical')
      .map((kpi) => {
        const mapped =
          kpi.key === 'siteStartup'
            ? 'SOP.SKILL.SITE_STARTUP_RECOVERY'
            : kpi.key === 'recruitment'
              ? 'SOP.SKILL.RECRUITMENT_RECOVERY'
              : kpi.key === 'budget'
                ? 'SOP.SKILL.BUDGET_GUARDRAIL'
                : 'SOP.SKILL.FTE_REALLOCATION';
        return {
          kpi: kpi.label,
          severity: kpi.level,
          driftPct: kpi.driftPct,
          owner: kpi.owner,
          skill: skills.find((item) => item.header === mapped) ?? null
        };
      });
  }, [kpiBoard, skills]);

  const route = useMemo(() => findBestSkill(skills, query), [skills, query]);

  const reasoningTrace = useMemo(() => {
    if (!route) return [];
    return [
      `Detected intent keywords: ${route.hits.join(', ')}`,
      `Matched SOP header: ${route.skill.header}`,
      'Cross-check current KPI drift and source freshness before action.',
      'Execute SOP steps and produce auditable outputs for CTM governance.'
    ];
  }, [route]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 17</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Trial
            <select
              value={trialId}
              onChange={(e) => setTrialId(e.target.value)}
              className="ml-2 rounded border border-ink/20 bg-transparent px-2 py-1"
              aria-label="trial selector"
            >
              {trials.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <span className="rounded border border-ink/15 px-2 py-1 text-xs uppercase tracking-[0.12em]">
            {trial.therapeuticArea} · {trial.indication} · {trial.phase} · {trial.region}
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Database size={16} /> {t.sourceHealth}
          </h2>
          <div className="space-y-2 text-sm">
            {trial.sources.map((source) => (
              <div key={source.name} className="rounded border border-ink/15 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{source.name}</p>
                  <span className={`rounded border px-2 py-0.5 text-xs uppercase ${sourceBadge(source.status)}`}>
                    {t[source.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/70">{source.coverage}</p>
                <p className="mt-1 text-xs text-ink/60">last sync: {new Date(source.lastSync).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Compass size={16} /> {t.kpiBoard}
          </h2>
          <div className="space-y-2 text-sm">
            {kpiBoard.map((kpi) => (
              <div key={kpi.key} className="rounded border border-ink/15 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{kpi.label}</p>
                  <span className={`rounded border px-2 py-0.5 text-xs uppercase ${severityBadge(kpi.level)}`}>
                    {t[kpi.level]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink/70">
                  {t.planned}: {kpi.planned} {kpi.unit} · {t.actual}: {kpi.actual} {kpi.unit}
                </p>
                <p className="mt-1 text-xs text-ink/70">
                  {t.drift}: {formatPercent(kpi.driftPct)} · {t.owner}: {kpi.owner}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle size={16} /> {t.mitigation}
          </h2>
          <div className="space-y-3 text-sm">
            {actionPlans.length === 0 ? <p className="text-ink/65">No critical drift now.</p> : null}
            {actionPlans.map((plan) => (
              <div key={plan.kpi} className="rounded border border-ink/15 p-3">
                <p className="font-medium">
                  {plan.kpi} ({formatPercent(plan.driftPct)})
                </p>
                <p className="mt-1 text-xs text-ink/70">{t.owner}: {plan.owner}</p>
                {plan.skill ? (
                  <>
                    <p className="mt-1 text-xs text-ink/70">{plan.skill.header}</p>
                    <ul className="mt-2 space-y-1 text-xs text-ink/75">
                      {plan.skill.sopSteps.slice(0, 2).map((step) => (
                        <li key={step}>- {step}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 size={16} /> {t.dailyTodo}
          </h2>
          <ol className="space-y-2 text-sm">
            {actionPlans.slice(0, 4).map((plan, idx) => (
              <li key={plan.kpi} className="rounded border border-ink/15 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/60">task {idx + 1}</p>
                <p className="mt-1 font-medium">{plan.kpi} mitigation standup</p>
                <p className="mt-1 text-xs text-ink/70">
                  owner: {plan.owner} · skill: {plan.skill?.header ?? 'Backlog'}
                </p>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <PlayCircle size={16} /> {t.react}
        </h2>
        <label className="text-sm">
          {t.ask}
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1 h-24 w-full rounded border border-ink/20 bg-transparent px-3 py-2"
            aria-label={t.ask}
          />
        </label>

        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <article className="rounded border border-ink/15 p-3 lg:col-span-1">
            <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.intent}</p>
            {route ? (
              <>
                <p className="mt-1 text-sm font-semibold">{route.skill.header}</p>
                <p className="mt-1 text-xs text-ink/70">score: {route.score}</p>
                <p className="mt-1 text-xs text-ink/70">{route.skill.description}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-ink/70">{t.noRoute}</p>
            )}
          </article>

          <article className="rounded border border-ink/15 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.reasoning}</p>
            <ul className="mt-2 space-y-1 text-xs text-ink/75">
              {reasoningTrace.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </article>

          <article className="rounded border border-ink/15 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.action}</p>
            <ul className="mt-2 space-y-1 text-xs text-ink/75">
              {(route?.skill.sopSteps ?? []).slice(0, 3).map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink/60">{t.output}</p>
            <p className="mt-1 text-xs text-ink/75">{(route?.skill.outputs ?? []).join(' · ') || 'Backlog intake record'}</p>
          </article>
        </div>
      </section>
    </div>
  );
}
