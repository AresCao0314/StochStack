'use client';

import { useMemo, useState } from 'react';
import { Eye, GitBranch, SlidersHorizontal } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type OphScenario = {
  id: string;
  trialCode: string;
  indication: string;
  phase: string;
  endpoint: string;
  observedControl: {
    n: number;
    meanBcvaChange: number;
    sdBcvaChange: number;
    meanCstChange: number;
    sdCstChange: number;
  };
  historicalPool: {
    studies: string[];
    patients: number;
  };
  defaultProfile: {
    ageMean: number;
    ageSd: number;
    baselineBcvaMean: number;
    baselineBcvaSd: number;
    baselineCstMean: number;
    baselineCstSd: number;
    durationMean: number;
    durationSd: number;
  };
};

type SyntheticPatient = {
  id: string;
  age: number;
  baselineBcva: number;
  baselineCst: number;
  diseaseDurationYears: number;
  bcvaChangeW24: number;
  cstChangeW24: number;
  sourceWeight: number;
};

type RunResult = {
  seed: number;
  patients: SyntheticPatient[];
  lossCurve: number[];
  metrics: {
    syntheticBcvaMean: number;
    syntheticBcvaSd: number;
    syntheticCstMean: number;
    syntheticCstSd: number;
    ess: number;
    controlReductionPct: number;
  };
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Ophthalmology Digital Twin · Diffusion Synthetic Control (Mock)',
    subtitle:
      'Mock diffusion pipeline for synthetic control arm generation: latent noise -> denoising steps -> calibrated patient-level output.',
    scenario: 'Ophthalmology Scenario',
    sampleSize: 'Synthetic control size',
    denoiseSteps: 'Denoising steps',
    noiseScale: 'Noise scale',
    calibration: 'Calibration strength',
    generate: 'Generate Synthetic Control',
    section1: 'Setup',
    section2: 'Diffusion Run',
    section3: 'Observed vs Synthetic',
    section4: 'Synthetic Patient Samples',
    endpoint: 'Endpoint',
    historical: 'Historical pool',
    observedN: 'Observed control N',
    ess: 'Borrowed ESS',
    reduction: 'Estimated control reduction',
    bcva: 'BCVA change',
    cst: 'CST change',
    loss: 'Denoising convergence curve',
    method: 'Mock method note',
    methodText:
      'This is a product mock: generated patients are simulated with a deterministic pseudo-random denoising loop, then calibrated to scenario-level control moments.'
  },
  zh: {
    title: '眼科 Digital Twin · 扩散式合成对照（Mock）',
    subtitle: '使用 mock 扩散流程生成 synthetic control arm：潜变量噪声 -> 多步去噪 -> 校准到患者级输出。',
    scenario: '眼科场景',
    sampleSize: '合成对照样本量',
    denoiseSteps: '去噪步数',
    noiseScale: '噪声强度',
    calibration: '校准强度',
    generate: '生成 Synthetic Control',
    section1: '配置',
    section2: '扩散运行',
    section3: 'Observed vs Synthetic',
    section4: '合成患者样本',
    endpoint: '终点',
    historical: '历史池',
    observedN: '观察对照 N',
    ess: '借用 ESS',
    reduction: '预计对照组缩减',
    bcva: 'BCVA 变化',
    cst: 'CST 变化',
    loss: '去噪收敛曲线',
    method: 'Mock 方法说明',
    methodText: '当前为产品原型：患者数据通过可复现的伪随机去噪过程生成，再按场景对照组统计量进行校准。'
  },
  de: {
    title: 'Ophthalmology Digital Twin · Diffusion Synthetic Control (Mock)',
    subtitle:
      'Mock-Diffusionspipeline fuer Synthetic-Control-Generierung: latentes Rauschen -> Denoising-Schritte -> kalibriertes patientenbezogenes Ergebnis.',
    scenario: 'Ophthalmologie-Szenario',
    sampleSize: 'Synthetic-Control-Groesse',
    denoiseSteps: 'Denoising-Schritte',
    noiseScale: 'Rauschstaerke',
    calibration: 'Kalibrierungsstaerke',
    generate: 'Synthetic Control erzeugen',
    section1: 'Konfiguration',
    section2: 'Diffusion Run',
    section3: 'Observed vs Synthetic',
    section4: 'Synthetic-Patientenstichprobe',
    endpoint: 'Endpoint',
    historical: 'Historischer Pool',
    observedN: 'Observed Control N',
    ess: 'Borrowed ESS',
    reduction: 'Geschaetzte Kontrollarm-Reduktion',
    bcva: 'BCVA-Aenderung',
    cst: 'CST-Aenderung',
    loss: 'Denoising-Konvergenzkurve',
    method: 'Mock-Methodenhinweis',
    methodText:
      'Produkt-Mock: Patienten werden mit reproduzierbarer pseudo-zufaelliger Denoising-Logik simuliert und danach auf Szenario-Kontrollmomente kalibriert.'
  }
};

function lcg(seed: number) {
  let state = Math.max(1, seed % 2147483647);
  return () => {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function gaussian(random: () => number) {
  const u1 = Math.max(1e-9, random());
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function mean(values: number[]) {
  return values.reduce((acc, v) => acc + v, 0) / Math.max(1, values.length);
}

function sd(values: number[]) {
  const m = mean(values);
  const varx = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(varx);
}

function numberColor(delta: number) {
  if (Math.abs(delta) <= 0.5) return 'text-accent2';
  if (Math.abs(delta) <= 1.5) return 'text-accent1';
  return 'text-rose-500';
}

export function OphthalmologyDiffusionTwinPrototype({ locale, scenarios }: { locale: Locale; scenarios: OphScenario[] }) {
  const t = labels[locale];
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? '');
  const [sampleSize, setSampleSize] = useState(120);
  const [steps, setSteps] = useState(24);
  const [noiseScale, setNoiseScale] = useState(0.95);
  const [calibration, setCalibration] = useState(0.72);
  const [runIdx, setRunIdx] = useState(0);

  const scenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) ?? scenarios[0], [scenarioId, scenarios]);

  const run = useMemo<RunResult>(() => {
    const seed = 9001 + runIdx * 97 + scenario.id.length * 13 + sampleSize + Math.round(steps * 7 + noiseScale * 100 + calibration * 100);
    const rand = lcg(seed);
    const profile = scenario.defaultProfile;

    const patients: SyntheticPatient[] = [];
    const lossCurve: number[] = [];
    let loss = 1.25 + noiseScale * 0.8;

    for (let s = 0; s < steps; s += 1) {
      const decay = 0.86 - calibration * 0.14 + rand() * 0.02;
      loss = Math.max(0.02, loss * decay + 0.01 * gaussian(rand));
      lossCurve.push(Number(loss.toFixed(4)));
    }

    for (let i = 0; i < sampleSize; i += 1) {
      let age = profile.ageMean + gaussian(rand) * profile.ageSd * (0.8 + noiseScale * 0.25);
      let baselineBcva = profile.baselineBcvaMean + gaussian(rand) * profile.baselineBcvaSd * (0.85 + noiseScale * 0.2);
      let baselineCst = profile.baselineCstMean + gaussian(rand) * profile.baselineCstSd * (0.85 + noiseScale * 0.2);
      let duration = profile.durationMean + gaussian(rand) * profile.durationSd;
      let bcvaChange = scenario.observedControl.meanBcvaChange + gaussian(rand) * scenario.observedControl.sdBcvaChange;
      let cstChange = scenario.observedControl.meanCstChange + gaussian(rand) * scenario.observedControl.sdCstChange;

      for (let s = 0; s < steps; s += 1) {
        const stepWeight = (s + 1) / steps;
        const denoiseGain = calibration * 0.06 * stepWeight;
        const jitter = (1 - calibration) * 0.03;
        age = age + (profile.ageMean - age) * denoiseGain + gaussian(rand) * jitter;
        baselineBcva = baselineBcva + (profile.baselineBcvaMean - baselineBcva) * denoiseGain + gaussian(rand) * jitter * 1.1;
        baselineCst = baselineCst + (profile.baselineCstMean - baselineCst) * denoiseGain + gaussian(rand) * jitter * 10;
        duration = duration + (profile.durationMean - duration) * denoiseGain + gaussian(rand) * jitter * 0.3;
        bcvaChange = bcvaChange + (scenario.observedControl.meanBcvaChange - bcvaChange) * denoiseGain + gaussian(rand) * jitter * 1.6;
        cstChange = cstChange + (scenario.observedControl.meanCstChange - cstChange) * denoiseGain + gaussian(rand) * jitter * 18;
      }

      patients.push({
        id: `SYN-${String(i + 1).padStart(3, '0')}`,
        age: Number(age.toFixed(1)),
        baselineBcva: Number(baselineBcva.toFixed(1)),
        baselineCst: Number(baselineCst.toFixed(0)),
        diseaseDurationYears: Number(Math.max(0.3, duration).toFixed(1)),
        bcvaChangeW24: Number(bcvaChange.toFixed(1)),
        cstChangeW24: Number(cstChange.toFixed(0)),
        sourceWeight: Number((0.45 + calibration * 0.45 + rand() * 0.1).toFixed(2))
      });
    }

    const bcvaValues = patients.map((p) => p.bcvaChangeW24);
    const cstValues = patients.map((p) => p.cstChangeW24);
    const syntheticBcvaMean = mean(bcvaValues);
    const syntheticCstMean = mean(cstValues);
    const ess = Math.round(sampleSize * (0.55 + calibration * 0.3) * (0.7 + (1 - noiseScale) * 0.25));
    const controlReductionPct = Number(
      Math.max(0, ((scenario.observedControl.n - Math.max(40, scenario.observedControl.n - ess * 0.55)) / scenario.observedControl.n) * 100).toFixed(1)
    );

    return {
      seed,
      patients,
      lossCurve,
      metrics: {
        syntheticBcvaMean: Number(syntheticBcvaMean.toFixed(2)),
        syntheticBcvaSd: Number(sd(bcvaValues).toFixed(2)),
        syntheticCstMean: Number(syntheticCstMean.toFixed(1)),
        syntheticCstSd: Number(sd(cstValues).toFixed(1)),
        ess,
        controlReductionPct
      }
    };
  }, [scenario, sampleSize, steps, noiseScale, calibration, runIdx]);

  const lossSvg = useMemo(() => {
    const width = 840;
    const height = 210;
    const pad = 24;
    const maxLoss = Math.max(...run.lossCurve);
    const minLoss = Math.min(...run.lossCurve);
    const toX = (i: number) => pad + (i / Math.max(1, run.lossCurve.length - 1)) * (width - pad * 2);
    const toY = (v: number) => height - pad - ((v - minLoss) / Math.max(1e-6, maxLoss - minLoss)) * (height - pad * 2);
    const points = run.lossCurve.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
    return { width, height, pad, points };
  }, [run.lossCurve]);

  const bcvaDelta = Number((run.metrics.syntheticBcvaMean - scenario.observedControl.meanBcvaChange).toFixed(2));
  const cstDelta = Number((run.metrics.syntheticCstMean - scenario.observedControl.meanCstChange).toFixed(1));

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype · diffusion mock</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <SlidersHorizontal size={16} /> {t.section1}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-sm">
            {t.scenario}
            <select value={scenario.id} onChange={(e) => setScenarioId(e.target.value)} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2">
              {scenarios.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.trialCode} · {x.indication}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.sampleSize}: {sampleSize}
            <input type="range" min={80} max={260} step={10} value={sampleSize} onChange={(e) => setSampleSize(Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <label className="text-sm">
            {t.denoiseSteps}: {steps}
            <input type="range" min={8} max={48} step={2} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <label className="text-sm">
            {t.noiseScale}: {noiseScale.toFixed(2)}
            <input type="range" min={0.4} max={1.3} step={0.05} value={noiseScale} onChange={(e) => setNoiseScale(Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <label className="text-sm">
            {t.calibration}: {calibration.toFixed(2)}
            <input type="range" min={0.4} max={0.95} step={0.01} value={calibration} onChange={(e) => setCalibration(Number(e.target.value))} className="mt-1 w-full" />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between rounded border border-ink/20 bg-ink/5 px-3 py-2">
          <p className="text-xs text-ink/70">
            {t.endpoint}: <span className="font-semibold">{scenario.endpoint}</span> · {t.historical}:{' '}
            <span className="font-semibold">{scenario.historicalPool.studies.join(', ')}</span> ({scenario.historicalPool.patients})
          </p>
          <button
            type="button"
            onClick={() => setRunIdx((v) => v + 1)}
            className="rounded border border-ink/25 px-3 py-1.5 text-sm font-medium hover:bg-ink/10"
          >
            {t.generate}
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <GitBranch size={16} /> {t.section2}
          </h2>
          <p className="text-xs text-ink/65">seed: {run.seed}</p>
          <p className="mt-1 text-sm text-ink/80">{t.loss}</p>
          <svg viewBox={`0 0 ${lossSvg.width} ${lossSvg.height}`} className="mt-3 h-auto w-full rounded border border-ink/15 bg-white/40">
            <line x1={lossSvg.pad} y1={lossSvg.height - lossSvg.pad} x2={lossSvg.width - lossSvg.pad} y2={lossSvg.height - lossSvg.pad} stroke="currentColor" strokeOpacity="0.28" />
            <line x1={lossSvg.pad} y1={lossSvg.pad} x2={lossSvg.pad} y2={lossSvg.height - lossSvg.pad} stroke="currentColor" strokeOpacity="0.28" />
            <polyline points={lossSvg.points} fill="none" stroke="#00E47C" strokeWidth="2.5" />
          </svg>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <div className="rounded border border-ink/15 p-2">
              {t.observedN}: <span className="font-semibold">{scenario.observedControl.n}</span>
            </div>
            <div className="rounded border border-ink/15 p-2">
              {t.ess}: <span className="font-semibold">{run.metrics.ess}</span>
            </div>
            <div className="rounded border border-ink/15 p-2 md:col-span-2">
              {t.reduction}: <span className="font-semibold text-accent1">{run.metrics.controlReductionPct}%</span>
            </div>
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Eye size={16} /> {t.section3}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="rounded border border-ink/15 p-2">
              {t.bcva}: observed {scenario.observedControl.meanBcvaChange.toFixed(2)} ± {scenario.observedControl.sdBcvaChange.toFixed(2)} | synthetic{' '}
              {run.metrics.syntheticBcvaMean.toFixed(2)} ± {run.metrics.syntheticBcvaSd.toFixed(2)} ·
              <span className={`ml-1 font-semibold ${numberColor(bcvaDelta)}`}>Δ {bcvaDelta >= 0 ? '+' : ''}{bcvaDelta.toFixed(2)}</span>
            </div>
            <div className="rounded border border-ink/15 p-2">
              {t.cst}: observed {scenario.observedControl.meanCstChange.toFixed(1)} ± {scenario.observedControl.sdCstChange.toFixed(1)} | synthetic{' '}
              {run.metrics.syntheticCstMean.toFixed(1)} ± {run.metrics.syntheticCstSd.toFixed(1)} ·
              <span className={`ml-1 font-semibold ${numberColor(cstDelta)}`}>Δ {cstDelta >= 0 ? '+' : ''}{cstDelta.toFixed(1)}</span>
            </div>
          </div>
          <div className="mt-4 rounded border border-ink/15 bg-ink/5 px-3 py-2 text-xs text-ink/80">
            <p className="font-semibold">{t.method}</p>
            <p className="mt-1">{t.methodText}</p>
          </div>
        </article>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 text-lg font-semibold">{t.section4}</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-ink/15 text-left text-xs uppercase tracking-[0.12em] text-ink/70">
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Age</th>
                <th className="px-2 py-2">Base BCVA</th>
                <th className="px-2 py-2">Base CST</th>
                <th className="px-2 py-2">Duration (y)</th>
                <th className="px-2 py-2">BCVA Δ</th>
                <th className="px-2 py-2">CST Δ</th>
                <th className="px-2 py-2">Weight</th>
              </tr>
            </thead>
            <tbody>
              {run.patients.slice(0, 12).map((p) => (
                <tr key={p.id} className="border-b border-ink/10">
                  <td className="px-2 py-1.5 font-mono text-xs">{p.id}</td>
                  <td className="px-2 py-1.5">{p.age}</td>
                  <td className="px-2 py-1.5">{p.baselineBcva}</td>
                  <td className="px-2 py-1.5">{p.baselineCst}</td>
                  <td className="px-2 py-1.5">{p.diseaseDurationYears}</td>
                  <td className="px-2 py-1.5">{p.bcvaChangeW24}</td>
                  <td className="px-2 py-1.5">{p.cstChangeW24}</td>
                  <td className="px-2 py-1.5">{p.sourceWeight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

