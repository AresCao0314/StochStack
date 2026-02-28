'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ChartSpline, Sigma, WandSparkles } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type WeekPoint = { week: number; planned: number; actual: number };
type HistoricalBasis = {
  sourceTrial: string;
  region: string;
  sites: number;
  meanWeeklyEnrollment: number;
  stdWeeklyEnrollment: number;
  startupDelayDaysP50: number;
};
type Trial = {
  id: string;
  trialCode: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  targetEnrollment: number;
  plannedEndDate: string;
  historyWeeks: WeekPoint[];
  historicalBasis: HistoricalBasis[];
};

type ForecastWeek = {
  week: number;
  planned: number;
  actual: number | null;
  p10: number;
  p50: number;
  p90: number;
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Enrollment Forecast (Monte Carlo)',
    subtitle:
      'Forecast enrollment trajectory with Monte Carlo simulation. Compare planned vs actual vs forecast and trigger delay alerts with mitigation actions.',
    trial: 'Trial',
    sims: 'Simulations',
    horizon: 'Forecast Horizon (weeks)',
    rerun: 'Re-run Simulation',
    chart: 'Planned / Actual / Forecast',
    risk: 'Delay Risk',
    mitigation: 'Mitigation Plan',
    method: 'How Monte Carlo Is Computed',
    basis: 'Historical Basis',
    probability: 'Probability of hitting target by planned end',
    expected: 'Expected completion week (P50)',
    behind: 'Current gap vs planned'
  },
  zh: {
    title: '入组预测（Monte Carlo）',
    subtitle: '基于蒙特卡罗模拟未来入组轨迹，对比 planned / actual / forecast，并给出 delay 风险预警与缓解计划。',
    trial: '试验',
    sims: '模拟次数',
    horizon: '预测周期（周）',
    rerun: '重新模拟',
    chart: 'Planned / Actual / Forecast',
    risk: '延迟风险',
    mitigation: '缓解计划',
    method: '蒙特卡罗计算方式',
    basis: '历史数据依据',
    probability: '计划结束前达标概率',
    expected: '预计达标周（P50）',
    behind: '当前相对计划缺口'
  },
  de: {
    title: 'Enrollment Forecast (Monte Carlo)',
    subtitle:
      'Monte-Carlo-Prognose fuer Enrollment-Verlauf mit Vergleich von Plan, Ist und Forecast inklusive Delay-Warnung und Mitigation.',
    trial: 'Studie',
    sims: 'Simulationen',
    horizon: 'Forecast-Horizont (Wochen)',
    rerun: 'Simulation neu starten',
    chart: 'Plan / Ist / Forecast',
    risk: 'Delay-Risiko',
    mitigation: 'Mitigation-Plan',
    method: 'Monte-Carlo-Berechnung',
    basis: 'Historische Basis',
    probability: 'Wahrscheinlichkeit, Ziel bis Plan-Ende zu erreichen',
    expected: 'Erwartete Zielwoche (P50)',
    behind: 'Aktuelle Luecke ggü. Plan'
  }
};

function gaussian(mean: number, std: number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * std;
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

function avg(arr: number[]) {
  return arr.reduce((s, n) => s + n, 0) / (arr.length || 1);
}

function runMonteCarlo(trial: Trial, simulations: number, horizonWeeks: number) {
  const history = trial.historyWeeks;
  const actualCurrent = history[history.length - 1]?.actual ?? 0;
  const plannedCurrent = history[history.length - 1]?.planned ?? 0;

  const weightedMean =
    trial.historicalBasis.reduce((s, x) => s + x.meanWeeklyEnrollment * x.sites, 0) /
    Math.max(1, trial.historicalBasis.reduce((s, x) => s + x.sites, 0));
  const weightedStd =
    trial.historicalBasis.reduce((s, x) => s + x.stdWeeklyEnrollment * x.sites, 0) /
    Math.max(1, trial.historicalBasis.reduce((s, x) => s + x.sites, 0));

  const paths: number[][] = [];
  for (let i = 0; i < simulations; i++) {
    let cum = actualCurrent;
    const one: number[] = [];
    for (let w = 1; w <= horizonWeeks; w++) {
      const draw = Math.max(0, gaussian(weightedMean, weightedStd));
      cum += draw;
      one.push(Number(cum.toFixed(1)));
    }
    paths.push(one);
  }

  const forecastWeeks: ForecastWeek[] = [];
  for (let i = 0; i < horizonWeeks; i++) {
    const week = history.length + i + 1;
    const plannedSlope = (trial.targetEnrollment - plannedCurrent) / Math.max(1, horizonWeeks);
    const planned = Number((plannedCurrent + plannedSlope * (i + 1)).toFixed(1));
    const dist = paths.map((p) => p[i]).sort((a, b) => a - b);
    forecastWeeks.push({
      week,
      planned,
      actual: null,
      p10: Number(percentile(dist, 0.1).toFixed(1)),
      p50: Number(percentile(dist, 0.5).toFixed(1)),
      p90: Number(percentile(dist, 0.9).toFixed(1))
    });
  }

  const hitByEnd = paths.filter((p) => p[horizonWeeks - 1] >= trial.targetEnrollment).length / Math.max(1, paths.length);
  const completionWeeks = paths.map((p) => {
    const found = p.findIndex((x) => x >= trial.targetEnrollment);
    return found >= 0 ? history.length + found + 1 : history.length + horizonWeeks + 1;
  });
  completionWeeks.sort((a, b) => a - b);
  const p50CompletionWeek = percentile(completionWeeks, 0.5);

  const gap = plannedCurrent - actualCurrent;
  const riskLevel = hitByEnd >= 0.75 ? 'low' : hitByEnd >= 0.5 ? 'moderate' : 'high';

  const mitigationPlan =
    riskLevel === 'low'
      ? [
          'Keep current site mix and monitor weekly variance.',
          'Use targeted nudges for sites below P25 productivity.',
          'Preserve contingency budget, do not expand footprint yet.'
        ]
      : riskLevel === 'moderate'
        ? [
            'Activate 5-8 backup sites in high-performing countries.',
            'Tighten screening-to-randomization conversion workflow.',
            'Increase recruitment support in bottom-quartile sites.'
          ]
        : [
            'Immediate footprint expansion with additional high-yield sites.',
            'Rebalance enrollment targets away from persistently delayed regions.',
            'Run weekly command-center review with country-level accountability.'
          ];

  return {
    weightedMean: Number(weightedMean.toFixed(2)),
    weightedStd: Number(weightedStd.toFixed(2)),
    hitByEnd: Number(hitByEnd.toFixed(2)),
    p50CompletionWeek: Number(p50CompletionWeek.toFixed(0)),
    gap: Number(gap.toFixed(1)),
    riskLevel,
    mitigationPlan,
    forecastWeeks
  };
}

function polyline(points: Array<{ x: number; y: number }>) {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function EnrollmentForecastPrototype({ locale, trials }: { locale: Locale; trials: Trial[] }) {
  const t = labels[locale];
  const [trialId, setTrialId] = useState(trials[0]?.id ?? '');
  const [simulations, setSimulations] = useState(600);
  const [horizonWeeks, setHorizonWeeks] = useState(24);
  const [version, setVersion] = useState(0);

  const trial = useMemo(() => trials.find((x) => x.id === trialId) ?? trials[0], [trials, trialId]);
  const result = useMemo(
    () => {
      const seed = version;
      void seed;
      return runMonteCarlo(trial, simulations, horizonWeeks);
    },
    [trial, simulations, horizonWeeks, version]
  );

  const chartData = useMemo(() => {
    const merged = [
      ...trial.historyWeeks.map((x) => ({
        week: x.week,
        planned: x.planned,
        actual: x.actual,
        p50: null as number | null,
        p10: null as number | null,
        p90: null as number | null
      })),
      ...result.forecastWeeks
    ];
    const width = 960;
    const height = 420;
    const pad = 40;
    const maxY = Math.max(trial.targetEnrollment * 1.08, ...merged.map((x) => x.p90 ?? x.actual ?? x.planned));
    const minY = 0;
    const toX = (w: number) => pad + ((w - 1) / Math.max(1, merged.length - 1)) * (width - pad * 2);
    const toY = (v: number) => height - pad - ((v - minY) / Math.max(1, maxY - minY)) * (height - pad * 2);

    const plannedPoints = merged.map((m) => ({ x: toX(m.week), y: toY(m.planned) }));
    const actualPoints = trial.historyWeeks.map((m) => ({ x: toX(m.week), y: toY(m.actual) }));
    const p50Points = result.forecastWeeks.map((m) => ({ x: toX(m.week), y: toY(m.p50) }));
    const p10Points = result.forecastWeeks.map((m) => ({ x: toX(m.week), y: toY(m.p10) }));
    const p90Points = result.forecastWeeks.map((m) => ({ x: toX(m.week), y: toY(m.p90) }));

    const band = [...p10Points, ...[...p90Points].reverse()];
    return { width, height, pad, maxY, toX, toY, plannedPoints, actualPoints, p50Points, band };
  }, [trial, result]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 07</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            {t.trial}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={trial.id} onChange={(e) => setTrialId(e.target.value)}>
              {trials.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.trialCode} · {x.therapeuticArea} · {x.indication}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.sims}
            <input type="number" min={200} max={5000} step={100} value={simulations} onChange={(e) => setSimulations(Number(e.target.value || 600))} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" />
          </label>
          <label className="text-sm">
            {t.horizon}
            <input type="number" min={8} max={52} step={2} value={horizonWeeks} onChange={(e) => setHorizonWeeks(Number(e.target.value || 24))} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => setVersion((v) => v + 1)} className="scanline w-full rounded border border-ink/20 px-3 py-2 text-sm">
              {t.rerun}
            </button>
          </div>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <ChartSpline size={16} /> {t.chart}
        </h2>
        <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="h-auto w-full rounded border border-ink/15 bg-white/40">
          <line x1={chartData.pad} y1={chartData.height - chartData.pad} x2={chartData.width - chartData.pad} y2={chartData.height - chartData.pad} stroke="currentColor" strokeOpacity="0.35" />
          <line x1={chartData.pad} y1={chartData.pad} x2={chartData.pad} y2={chartData.height - chartData.pad} stroke="currentColor" strokeOpacity="0.35" />

          <polyline fill="none" stroke="#0B0F14" strokeWidth="2" strokeDasharray="4 4" points={polyline(chartData.plannedPoints)} />
          <polyline fill="none" stroke="#00E47C" strokeWidth="2.6" points={polyline(chartData.actualPoints)} />

          <polygon points={polyline(chartData.band)} fill="#6AD2E2" fillOpacity="0.18" />
          <polyline fill="none" stroke="#928BDE" strokeWidth="2.6" points={polyline(chartData.p50Points)} />

          <text x={chartData.pad + 8} y={chartData.pad + 12} fontSize="11" fill="currentColor">
            Enrollment
          </text>
          <text x={chartData.width - chartData.pad - 110} y={chartData.height - chartData.pad - 8} fontSize="11" fill="currentColor">
            Week
          </text>
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <span className="rounded border border-ink/15 px-2 py-1">Planned (dashed)</span>
          <span className="rounded border border-ink/15 px-2 py-1">Actual (green)</span>
          <span className="rounded border border-ink/15 px-2 py-1">Forecast P50 (violet)</span>
          <span className="rounded border border-ink/15 px-2 py-1">Forecast Band P10-P90 (cyan)</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle size={16} /> {t.risk}
          </h2>
          <div className="space-y-2 text-sm">
            <p>{t.probability}: <span className="font-semibold">{(result.hitByEnd * 100).toFixed(0)}%</span></p>
            <p>{t.expected}: <span className="font-semibold">W{result.p50CompletionWeek}</span></p>
            <p>{t.behind}: <span className="font-semibold">{result.gap > 0 ? `${result.gap} patients behind` : 'on track / ahead'}</span></p>
            <p>
              Risk level:{' '}
              <span className={`rounded px-2 py-1 text-xs uppercase ${result.riskLevel === 'high' ? 'bg-red-100 text-red-700' : result.riskLevel === 'moderate' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                {result.riskLevel}
              </span>
            </p>
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <WandSparkles size={16} /> {t.mitigation}
          </h2>
          <ul className="space-y-2 text-sm">
            {result.mitigationPlan.map((x) => (
              <li key={x} className="rounded border border-ink/15 px-3 py-2">
                {x}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Sigma size={16} /> {t.method}
          </h2>
          <div className="space-y-2 text-sm text-ink/85">
            <p>1. Select trial-specific historical enrollment basis by therapeutic area and indication.</p>
            <p>2. Compute weighted mean and volatility from historical weekly enrollment rates.</p>
            <p>3. For each simulation path, sample weekly increment from N(mean, std), clipped at zero.</p>
            <p>4. Aggregate paths into percentile envelopes (P10/P50/P90) and estimate delay probability.</p>
            <p className="rounded border border-ink/15 px-3 py-2 font-mono text-xs">
              increment_w ~ max(0, Normal(mu_weighted, sigma_weighted))
              <br />
              cumulative_w = cumulative_(w-1) + increment_w
            </p>
            <p>Current mu={result.weightedMean}/week, sigma={result.weightedStd}/week from historical basis.</p>
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 text-lg font-semibold">{t.basis}</h2>
          <div className="space-y-2 text-sm">
            {trial.historicalBasis.map((h) => (
              <div key={h.sourceTrial} className="rounded border border-ink/15 p-3">
                <p className="font-medium">{h.sourceTrial}</p>
                <p className="text-xs text-ink/70">{h.region} · {h.sites} sites</p>
                <p className="text-xs text-ink/70">mean {h.meanWeeklyEnrollment}/week · std {h.stdWeeklyEnrollment}</p>
                <p className="text-xs text-ink/70">startup delay P50: {h.startupDelayDaysP50} days</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
