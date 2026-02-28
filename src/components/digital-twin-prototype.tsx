'use client';

import { useMemo, useState } from 'react';
import { Activity, Calculator, FlaskConical } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Scenario = {
  id: string;
  trialCode: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  endpoint: string;
  historicalSource: {
    system: string;
    trials: string[];
    historicalPatients: number;
  };
  observed: {
    treatedN: number;
    controlN: number;
  };
  visitTrajectory: Array<{
    visit: number;
    treated: number;
    observedControl: number;
    syntheticControl: number;
  }>;
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Digital Twin Synthetic Control',
    subtitle:
      'Use historical EDC data to build synthetic control evidence, reduce randomized control arm size, and test ProCOVA-style sample-size reduction.',
    scenario: 'Trial Scenario',
    borrowing: 'Historical Borrowing Ratio',
    matchQuality: 'Match Quality Score',
    sectionA: 'Part A · Synthetic Control from Historical EDC',
    sectionB: 'Part B · ProCOVA-style Sample Size Reduction',
    chart: 'Endpoint Trajectory',
    reduction: 'Control Arm Reduction',
    classic: 'Classic RCT',
    hybrid: 'Observed + Synthetic Control',
    method: 'Computation Notes'
  },
  zh: {
    title: '数字孪生合成对照',
    subtitle: '基于历史 EDC 数据构建 synthetic control，减少随机对照组规模，并提供 ProCOVA 风格样本量降低 demo。',
    scenario: '试验场景',
    borrowing: '历史数据借用比例',
    matchQuality: '匹配质量分数',
    sectionA: '第一部分 · 历史 EDC 合成对照',
    sectionB: '第二部分 · ProCOVA 风格样本量降低',
    chart: '终点轨迹',
    reduction: '对照组缩减',
    classic: '经典 RCT',
    hybrid: '观察对照 + 合成对照',
    method: '计算说明'
  },
  de: {
    title: 'Digital Twin Synthetic Control',
    subtitle:
      'Historische EDC-Daten fuer Synthetic Control nutzen, Kontrollarmgroesse reduzieren und ProCOVA-aehnliche Sample-Size-Reduktion demonstrieren.',
    scenario: 'Studien-Szenario',
    borrowing: 'Borrowing-Quote historischer Daten',
    matchQuality: 'Matching-Qualitaet',
    sectionA: 'Teil A · Synthetic Control aus historischem EDC',
    sectionB: 'Teil B · ProCOVA-Style Sample-Size-Reduktion',
    chart: 'Endpoint-Verlauf',
    reduction: 'Kontrollarm-Reduktion',
    classic: 'Klassische RCT',
    hybrid: 'Beobachtet + Synthetic Control',
    method: 'Berechnungsnotizen'
  }
};

function zAlpha(alpha: number) {
  if (alpha <= 0.01) return 2.58;
  if (alpha <= 0.025) return 2.24;
  return 1.96;
}

function zBeta(power: number) {
  if (power >= 0.9) return 1.28;
  if (power >= 0.85) return 1.04;
  return 0.84;
}

function sampleSizePerArm(effectSize: number, sigma: number, alpha: number, power: number) {
  const za = zAlpha(alpha);
  const zb = zBeta(power);
  const n = (2 * (za + zb) * (za + zb) * sigma * sigma) / Math.max(effectSize * effectSize, 1e-6);
  return Math.ceil(n);
}

function poly(points: Array<{ x: number; y: number }>) {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

export function DigitalTwinPrototype({ locale, scenarios }: { locale: Locale; scenarios: Scenario[] }) {
  const t = labels[locale];
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? '');
  const [borrowRatio, setBorrowRatio] = useState(0.45);
  const [matchQuality, setMatchQuality] = useState(0.78);
  const [effectSize, setEffectSize] = useState(0.22);
  const [sigma, setSigma] = useState(1);
  const [r2, setR2] = useState(0.35);
  const [alpha, setAlpha] = useState(0.05);
  const [power, setPower] = useState(0.8);

  const scenario = useMemo(() => scenarios.find((x) => x.id === scenarioId) ?? scenarios[0], [scenarios, scenarioId]);

  const synthetic = useMemo(() => {
    const baseControl = scenario.observed.controlN;
    const borrowedEss = scenario.historicalSource.historicalPatients * borrowRatio * matchQuality * 0.35;
    const effectiveControl = Math.round(baseControl + borrowedEss);
    const recommendedObservedControl = Math.max(40, Math.round(baseControl - borrowedEss * 0.6));
    const reductionPct = Math.max(0, (1 - recommendedObservedControl / baseControl) * 100);
    return {
      baseControl,
      borrowedEss: Math.round(borrowedEss),
      effectiveControl,
      recommendedObservedControl,
      reductionPct: Number(reductionPct.toFixed(1))
    };
  }, [scenario, borrowRatio, matchQuality]);

  const procova = useMemo(() => {
    const classic = sampleSizePerArm(effectSize, sigma, alpha, power);
    const adjustedSigma = sigma * Math.sqrt(Math.max(0.05, 1 - r2));
    const procovaN = sampleSizePerArm(effectSize, adjustedSigma, alpha, power);
    const reductionPct = (1 - procovaN / classic) * 100;
    return {
      classic,
      procovaN,
      adjustedSigma: Number(adjustedSigma.toFixed(3)),
      reductionPct: Number(reductionPct.toFixed(1))
    };
  }, [effectSize, sigma, alpha, power, r2]);

  const chart = useMemo(() => {
    const width = 900;
    const height = 320;
    const pad = 34;
    const rows = scenario.visitTrajectory;
    const maxY = 0.85;
    const minY = 0.2;
    const toX = (v: number) => pad + ((v - 1) / Math.max(1, rows.length - 1)) * (width - pad * 2);
    const toY = (v: number) => height - pad - ((v - minY) / (maxY - minY)) * (height - pad * 2);
    const treated = rows.map((r) => ({ x: toX(r.visit), y: toY(r.treated) }));
    const observed = rows.map((r) => ({ x: toX(r.visit), y: toY(r.observedControl) }));
    const syntheticControl = rows.map((r) => ({ x: toX(r.visit), y: toY(r.syntheticControl) }));
    return { width, height, pad, treated, observed, syntheticControl };
  }, [scenario]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 05</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            {t.scenario}
            <select value={scenario.id} onChange={(e) => setScenarioId(e.target.value)} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2">
              {scenarios.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.trialCode} · {x.therapeuticArea} · {x.indication}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.borrowing}: {Math.round(borrowRatio * 100)}%
            <input type="range" min={0.1} max={0.8} step={0.05} value={borrowRatio} onChange={(e) => setBorrowRatio(Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <label className="text-sm">
            {t.matchQuality}: {matchQuality.toFixed(2)}
            <input type="range" min={0.5} max={0.95} step={0.01} value={matchQuality} onChange={(e) => setMatchQuality(Number(e.target.value))} className="mt-1 w-full" />
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Activity size={16} /> {t.sectionA}
          </h2>
          <p className="text-sm text-ink/80">
            {scenario.trialCode} · {scenario.phase} · endpoint: {scenario.endpoint}
          </p>
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="mt-3 h-auto w-full rounded border border-ink/15 bg-white/40">
            <line x1={chart.pad} y1={chart.height - chart.pad} x2={chart.width - chart.pad} y2={chart.height - chart.pad} stroke="currentColor" strokeOpacity="0.35" />
            <line x1={chart.pad} y1={chart.pad} x2={chart.pad} y2={chart.height - chart.pad} stroke="currentColor" strokeOpacity="0.35" />
            <polyline points={poly(chart.treated)} fill="none" stroke="#00E47C" strokeWidth="2.5" />
            <polyline points={poly(chart.observed)} fill="none" stroke="#0B0F14" strokeWidth="2.2" strokeDasharray="4 4" />
            <polyline points={poly(chart.syntheticControl)} fill="none" stroke="#6AD2E2" strokeWidth="2.5" />
          </svg>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <div className="rounded border border-ink/15 p-2">{t.classic} control N: <span className="font-semibold">{synthetic.baseControl}</span></div>
            <div className="rounded border border-ink/15 p-2">Borrowed ESS: <span className="font-semibold">{synthetic.borrowedEss}</span></div>
            <div className="rounded border border-ink/15 p-2">{t.hybrid} effective control N: <span className="font-semibold">{synthetic.effectiveControl}</span></div>
            <div className="rounded border border-ink/15 p-2">{t.reduction}: <span className="font-semibold text-accent1">{synthetic.reductionPct}%</span></div>
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Calculator size={16} /> {t.sectionB}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Effect Size (Delta)
              <input type="number" value={effectSize} min={0.05} max={1} step={0.01} onChange={(e) => setEffectSize(Number(e.target.value))} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" />
            </label>
            <label className="text-sm">Sigma
              <input type="number" value={sigma} min={0.3} max={2.5} step={0.05} onChange={(e) => setSigma(Number(e.target.value))} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" />
            </label>
            <label className="text-sm">ProCOVA R^2
              <input type="number" value={r2} min={0.05} max={0.8} step={0.01} onChange={(e) => setR2(Number(e.target.value))} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" />
            </label>
            <label className="text-sm">Power
              <select value={power} onChange={(e) => setPower(Number(e.target.value))} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2">
                <option value={0.8}>0.80</option>
                <option value={0.85}>0.85</option>
                <option value={0.9}>0.90</option>
              </select>
            </label>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded border border-ink/15 p-2">{t.classic} n/arm: <span className="font-semibold">{procova.classic}</span></div>
            <div className="rounded border border-ink/15 p-2">ProCOVA adjusted sigma: <span className="font-semibold">{procova.adjustedSigma}</span></div>
            <div className="rounded border border-ink/15 p-2">ProCOVA n/arm: <span className="font-semibold">{procova.procovaN}</span></div>
            <div className="rounded border border-ink/15 p-2">Sample size reduction: <span className="font-semibold text-accent1">{procova.reductionPct}%</span></div>
          </div>
        </article>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <FlaskConical size={16} /> {t.method}
        </h2>
        <div className="space-y-2 text-sm text-ink/80">
          <p>Historical source: {scenario.historicalSource.system} · trials {scenario.historicalSource.trials.join(', ')} · patients {scenario.historicalSource.historicalPatients}.</p>
          <p>Synthetic control ESS = historicalPatients × borrowingRatio × matchQuality × calibrationFactor.</p>
          <p>Recommended observed control N = base control N - 0.6 × borrowed ESS (floored for minimum operational control).</p>
          <p>ProCOVA-style reduction assumes covariate-adjusted variance: sigma_adj = sigma × sqrt(1 - R^2).</p>
          <p className="rounded border border-ink/15 px-3 py-2 font-mono text-xs">
            n_classic = 2 * (Zalpha/2 + Zbeta)^2 * sigma^2 / delta^2
            <br />
            n_procova = 2 * (Zalpha/2 + Zbeta)^2 * sigma_adj^2 / delta^2
          </p>
        </div>
      </section>
    </div>
  );
}
