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
  sex: 'M' | 'F';
  baselineBcva: number;
  baselineCst: number;
  lesionType: 'classic' | 'occult' | 'mixed';
  priorInjections: number;
  diseaseDurationYears: number;
  bcvaChangeW24: number;
  cstChangeW24: number;
  sourceWeight: number;
  qcFlag: 'ok' | 'missing' | 'outlier';
};

type TreatedPatient = {
  id: string;
  age: number;
  sex: 'M' | 'F';
  baselineBcva: number;
  baselineCst: number;
  lesionType: 'classic' | 'occult' | 'mixed';
  priorInjections: number;
  diseaseDurationYears: number;
  bcvaChangeW24: number;
  cstChangeW24: number;
  qcFlag: 'ok' | 'missing' | 'outlier';
};

type TwinBandPoint = {
  week: number;
  mean: number;
  lower: number;
  upper: number;
};

type CounterfactualTwinResult = {
  patientId: string;
  k: number;
  bands: TwinBandPoint[];
};

type RunResult = {
  seed: number;
  patients: SyntheticPatient[];
  treatedPatients: TreatedPatient[];
  treatedArmValues: {
    bcva: number[];
    cst: number[];
  };
  lossCurve: number[];
  metrics: {
    syntheticBcvaMean: number;
    syntheticBcvaSd: number;
    syntheticCstMean: number;
    syntheticCstSd: number;
    treatedBcvaMean: number;
    treatedBcvaSd: number;
    treatedCstMean: number;
    treatedCstSd: number;
    bcvaAlignmentScore: number;
    cstAlignmentScore: number;
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
    treated: 'Treated arm',
    synthetic: 'Synthetic arm',
    alignment: 'Distribution alignment',
    histogram: 'Histogram overlay',
    qq: 'Q-Q plot',
    downloadCsv: 'Download CSV',
    downloadSyntheticCsv: 'Synthetic patients CSV',
    metric: 'Metric',
    section5: 'External Control Methodology Pipeline',
    step1: 'Step 1: Data cleaning',
    step2: 'Step 2: Cohort definition',
    step3: 'Step 3: Propensity score / weighting / matching',
    step4: 'Step 4: Primary endpoint estimation',
    step5: 'Step 5: Sensitivity analysis',
    methodType: 'Method',
    caliper: 'Matching caliper',
    trim: 'PS trimming',
    rawN: 'Raw N',
    cleanedN: 'After cleaning',
    eligibleN: 'Cohort eligible',
    balanceBefore: 'Balance before (mean |SMD|)',
    balanceAfter: 'Balance after (mean |SMD|)',
    primaryEffect: 'Primary effect (treated - external control)',
    ci95: '95% CI',
    sensScenario: 'Scenario',
    sensEffect: 'Effect',
    sensDelta: 'Delta vs primary',
    sensNote: 'Interpretation',
    section6: 'Conditional Twin Generator (X→Y(t))',
    patientPicker: 'Patient picker',
    generateTwins: 'Generate 50 twins',
    twinCount: 'Twin count (K)',
    baselineX: 'Baseline condition X',
    sex: 'Sex',
    lesionType: 'Lesion type',
    priorInjections: 'Prior injections',
    trajectory: 'Counterfactual control trajectory',
    bandLegend: 'Mean with 95% prediction interval',
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
    treated: '治疗臂',
    synthetic: '合成臂',
    alignment: '分布对齐',
    histogram: '直方图叠加',
    qq: 'Q-Q 图',
    downloadCsv: '下载分布 CSV',
    downloadSyntheticCsv: '下载合成患者 CSV',
    metric: '指标',
    section5: '外部对照方法学管线',
    step1: '步骤1：数据清洗',
    step2: '步骤2：Cohort 定义',
    step3: '步骤3：倾向评分 / 加权 / 匹配',
    step4: '步骤4：主要终点估计',
    step5: '步骤5：敏感性分析',
    methodType: '方法',
    caliper: '匹配卡尺',
    trim: 'PS 截尾',
    rawN: '原始 N',
    cleanedN: '清洗后 N',
    eligibleN: '入组可比 N',
    balanceBefore: '平衡性前（平均 |SMD|）',
    balanceAfter: '平衡性后（平均 |SMD|）',
    primaryEffect: '主要效应（治疗臂 - 外部对照）',
    ci95: '95% 置信区间',
    sensScenario: '情景',
    sensEffect: '效应值',
    sensDelta: '相对主分析变化',
    sensNote: '解释',
    section6: '条件化 Twin 生成（X→Y(t)）',
    patientPicker: '患者选择',
    generateTwins: '生成 50 条 twin',
    twinCount: 'Twin 数量 (K)',
    baselineX: '基线条件 X',
    sex: '性别',
    lesionType: '病灶类型',
    priorInjections: '既往注射次数',
    trajectory: '反事实对照轨迹',
    bandLegend: '均值与 95% 预测区间',
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
    treated: 'Behandlungsarm',
    synthetic: 'Synthetischer Arm',
    alignment: 'Verteilungsabgleich',
    histogram: 'Histogramm-Overlay',
    qq: 'Q-Q-Plot',
    downloadCsv: 'CSV herunterladen',
    downloadSyntheticCsv: 'Synthetic-Patienten CSV',
    metric: 'Metrik',
    section5: 'Methodik-Pipeline fuer externe Kontrolle',
    step1: 'Schritt 1: Datenbereinigung',
    step2: 'Schritt 2: Cohort-Definition',
    step3: 'Schritt 3: Propensity Score / Gewichtung / Matching',
    step4: 'Schritt 4: Primaerer Endpunkt',
    step5: 'Schritt 5: Sensitivitaetsanalyse',
    methodType: 'Methode',
    caliper: 'Matching-Caliper',
    trim: 'PS-Trimming',
    rawN: 'Raw N',
    cleanedN: 'Nach Bereinigung',
    eligibleN: 'Cohort geeignet',
    balanceBefore: 'Balance vorher (mittl. |SMD|)',
    balanceAfter: 'Balance nachher (mittl. |SMD|)',
    primaryEffect: 'Primaerer Effekt (Behandlung - externe Kontrolle)',
    ci95: '95%-KI',
    sensScenario: 'Szenario',
    sensEffect: 'Effekt',
    sensDelta: 'Delta vs primaer',
    sensNote: 'Interpretation',
    section6: 'Konditionale Twin-Generierung (X→Y(t))',
    patientPicker: 'Patientenauswahl',
    generateTwins: '50 Twins generieren',
    twinCount: 'Twin-Anzahl (K)',
    baselineX: 'Baseline-Bedingung X',
    sex: 'Geschlecht',
    lesionType: 'Laesionstyp',
    priorInjections: 'Vorherige Injektionen',
    trajectory: 'Kontrafaktische Kontrolltrajektorie',
    bandLegend: 'Mittelwert mit 95%-Vorhersageintervall',
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

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function weightedMean(values: number[], weights: number[]) {
  const sw = weights.reduce((a, b) => a + b, 0);
  if (sw <= 0) return 0;
  return values.reduce((acc, v, i) => acc + v * weights[i], 0) / sw;
}

function weightedVar(values: number[], weights: number[]) {
  const m = weightedMean(values, weights);
  const sw = weights.reduce((a, b) => a + b, 0);
  if (sw <= 0) return 0;
  return values.reduce((acc, v, i) => acc + weights[i] * (v - m) ** 2, 0) / sw;
}

function smd(a: number[], b: number[]) {
  const ma = mean(a);
  const mb = mean(b);
  const sda = sd(a);
  const sdb = sd(b);
  const sp = Math.sqrt((sda ** 2 + sdb ** 2) / 2);
  return sp <= 1e-9 ? 0 : (ma - mb) / sp;
}

function quantile(values: number[], q: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, q * (sorted.length - 1)));
  const lo = Math.floor(idx);
  const hi = Math.min(sorted.length - 1, lo + 1);
  const t = idx - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

function lesionEffect(lesionType: 'classic' | 'occult' | 'mixed') {
  if (lesionType === 'classic') return -0.8;
  if (lesionType === 'occult') return 0.4;
  return -0.2;
}

function getTreatmentShift(indication: string) {
  if (indication.toLowerCase().includes('namd')) {
    return { bcva: 5.2, cst: -58 };
  }
  if (indication.toLowerCase().includes('dme')) {
    return { bcva: 4.1, cst: -52 };
  }
  return { bcva: 2.4, cst: -21 };
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(sorted.length - 1, lo + 1);
  const t = idx - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

function histogram(values: number[], bins: number, minV: number, maxV: number) {
  const counts = Array.from({ length: bins }, () => 0);
  const width = Math.max(1e-6, (maxV - minV) / bins);
  values.forEach((v) => {
    const idx = Math.max(0, Math.min(bins - 1, Math.floor((v - minV) / width)));
    counts[idx] += 1;
  });
  return counts;
}

function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(',')
    )
    .join('\n');
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function OphthalmologyDiffusionTwinPrototype({ locale, scenarios }: { locale: Locale; scenarios: OphScenario[] }) {
  const t = labels[locale];
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? '');
  const [sampleSize, setSampleSize] = useState(120);
  const [steps, setSteps] = useState(24);
  const [noiseScale, setNoiseScale] = useState(0.95);
  const [calibration, setCalibration] = useState(0.72);
  const [runIdx, setRunIdx] = useState(0);
  const [metric, setMetric] = useState<'bcva' | 'cst'>('bcva');
  const [methodType, setMethodType] = useState<'iptw' | 'matching'>('iptw');
  const [caliper, setCaliper] = useState(0.12);
  const [trimPs, setTrimPs] = useState(0.03);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [twinCount, setTwinCount] = useState(50);
  const [twinRunIdx, setTwinRunIdx] = useState(0);

  const scenario = useMemo(() => scenarios.find((s) => s.id === scenarioId) ?? scenarios[0], [scenarioId, scenarios]);

  const run = useMemo<RunResult>(() => {
    const seed = 9001 + runIdx * 97 + scenario.id.length * 13 + sampleSize + Math.round(steps * 7 + noiseScale * 100 + calibration * 100);
    const rand = lcg(seed);
    const profile = scenario.defaultProfile;

    const patients: SyntheticPatient[] = [];
    const treatedPatients: TreatedPatient[] = [];
    const treatedBcvaValues: number[] = [];
    const treatedCstValues: number[] = [];
    const lossCurve: number[] = [];
    let loss = 1.25 + noiseScale * 0.8;
    const shift = getTreatmentShift(scenario.indication);

    for (let s = 0; s < steps; s += 1) {
      const decay = 0.86 - calibration * 0.14 + rand() * 0.02;
      loss = Math.max(0.02, loss * decay + 0.01 * gaussian(rand));
      lossCurve.push(Number(loss.toFixed(4)));
    }

    for (let i = 0; i < sampleSize; i += 1) {
      const sex: 'M' | 'F' = rand() < 0.48 ? 'M' : 'F';
      const lesionRoll = rand();
      const lesionType: 'classic' | 'occult' | 'mixed' = lesionRoll < 0.3 ? 'classic' : lesionRoll < 0.72 ? 'occult' : 'mixed';
      const priorInjections = Math.max(0, Math.round(2 + gaussian(rand) * 1.7 + (scenario.indication.toLowerCase().includes('dme') ? 1 : 0)));
      let age = profile.ageMean + gaussian(rand) * profile.ageSd * (0.8 + noiseScale * 0.25);
      let baselineBcva = profile.baselineBcvaMean + gaussian(rand) * profile.baselineBcvaSd * (0.85 + noiseScale * 0.2);
      let baselineCst = profile.baselineCstMean + gaussian(rand) * profile.baselineCstSd * (0.85 + noiseScale * 0.2);
      let duration = profile.durationMean + gaussian(rand) * profile.durationSd;
      let bcvaChange = scenario.observedControl.meanBcvaChange + gaussian(rand) * scenario.observedControl.sdBcvaChange;
      let cstChange = scenario.observedControl.meanCstChange + gaussian(rand) * scenario.observedControl.sdCstChange;
      let treatedBcva = scenario.observedControl.meanBcvaChange + shift.bcva + gaussian(rand) * scenario.observedControl.sdBcvaChange * 0.9;
      let treatedCst = scenario.observedControl.meanCstChange + shift.cst + gaussian(rand) * scenario.observedControl.sdCstChange * 0.9;
      const qcRoll = rand();
      const qcFlag: 'ok' | 'missing' | 'outlier' = qcRoll < 0.05 ? 'missing' : qcRoll < 0.09 ? 'outlier' : 'ok';

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
        treatedBcva = treatedBcva + (scenario.observedControl.meanBcvaChange + shift.bcva - treatedBcva) * denoiseGain + gaussian(rand) * jitter * 1.3;
        treatedCst = treatedCst + (scenario.observedControl.meanCstChange + shift.cst - treatedCst) * denoiseGain + gaussian(rand) * jitter * 15;
      }

      patients.push({
        id: `SYN-${String(i + 1).padStart(3, '0')}`,
        age: Number(age.toFixed(1)),
        sex,
        baselineBcva: Number(baselineBcva.toFixed(1)),
        baselineCst: Number(baselineCst.toFixed(0)),
        lesionType,
        priorInjections,
        diseaseDurationYears: Number(Math.max(0.3, duration).toFixed(1)),
        bcvaChangeW24: Number(bcvaChange.toFixed(1)),
        cstChangeW24: Number(cstChange.toFixed(0)),
        sourceWeight: Number((0.45 + calibration * 0.45 + rand() * 0.1).toFixed(2)),
        qcFlag
      });

      treatedPatients.push({
        id: `TRT-${String(i + 1).padStart(3, '0')}`,
        age: Number((age - 0.8 + gaussian(rand) * 1.3).toFixed(1)),
        sex,
        baselineBcva: Number((baselineBcva - 1.2 + gaussian(rand) * 1.2).toFixed(1)),
        baselineCst: Number((baselineCst + 14 + gaussian(rand) * 8).toFixed(0)),
        lesionType,
        priorInjections: Math.max(0, priorInjections + (rand() < 0.4 ? 1 : 0)),
        diseaseDurationYears: Number(Math.max(0.3, duration + 0.4 + gaussian(rand) * 0.5).toFixed(1)),
        bcvaChangeW24: Number(treatedBcva.toFixed(1)),
        cstChangeW24: Number(treatedCst.toFixed(0)),
        qcFlag
      });

      treatedBcvaValues.push(Number(treatedBcva.toFixed(1)));
      treatedCstValues.push(Number(treatedCst.toFixed(0)));
    }

    const bcvaValues = patients.map((p) => p.bcvaChangeW24);
    const cstValues = patients.map((p) => p.cstChangeW24);
    const syntheticBcvaMean = mean(bcvaValues);
    const syntheticCstMean = mean(cstValues);
    const treatedBcvaMean = mean(treatedBcvaValues);
    const treatedCstMean = mean(treatedCstValues);
    const ess = Math.round(sampleSize * (0.55 + calibration * 0.3) * (0.7 + (1 - noiseScale) * 0.25));
    const controlReductionPct = Number(
      Math.max(0, ((scenario.observedControl.n - Math.max(40, scenario.observedControl.n - ess * 0.55)) / scenario.observedControl.n) * 100).toFixed(1)
    );

    const bcvaMeanGap = Math.abs(treatedBcvaMean - syntheticBcvaMean);
    const cstMeanGap = Math.abs(treatedCstMean - syntheticCstMean);
    const bcvaSdGap = Math.abs(sd(treatedBcvaValues) - sd(bcvaValues));
    const cstSdGap = Math.abs(sd(treatedCstValues) - sd(cstValues));
    const bcvaAlignmentScore = Number(Math.max(0, 100 - (bcvaMeanGap * 8 + bcvaSdGap * 6)).toFixed(1));
    const cstAlignmentScore = Number(Math.max(0, 100 - (cstMeanGap * 0.55 + cstSdGap * 0.45)).toFixed(1));

    return {
      seed,
      patients,
      treatedPatients,
      treatedArmValues: {
        bcva: treatedBcvaValues,
        cst: treatedCstValues
      },
      lossCurve,
      metrics: {
        syntheticBcvaMean: Number(syntheticBcvaMean.toFixed(2)),
        syntheticBcvaSd: Number(sd(bcvaValues).toFixed(2)),
        syntheticCstMean: Number(syntheticCstMean.toFixed(1)),
        syntheticCstSd: Number(sd(cstValues).toFixed(1)),
        treatedBcvaMean: Number(treatedBcvaMean.toFixed(2)),
        treatedBcvaSd: Number(sd(treatedBcvaValues).toFixed(2)),
        treatedCstMean: Number(treatedCstMean.toFixed(1)),
        treatedCstSd: Number(sd(treatedCstValues).toFixed(1)),
        bcvaAlignmentScore,
        cstAlignmentScore,
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

  const metricSeries = useMemo(() => {
    const syntheticValues = metric === 'bcva' ? run.patients.map((p) => p.bcvaChangeW24) : run.patients.map((p) => p.cstChangeW24);
    const treatedValues = metric === 'bcva' ? run.treatedArmValues.bcva : run.treatedArmValues.cst;
    const minV = Math.min(...syntheticValues, ...treatedValues);
    const maxV = Math.max(...syntheticValues, ...treatedValues);
    const bins = 14;
    const histSyn = histogram(syntheticValues, bins, minV, maxV);
    const histTreat = histogram(treatedValues, bins, minV, maxV);
    const maxCount = Math.max(...histSyn, ...histTreat, 1);

    const synSorted = [...syntheticValues].sort((a, b) => a - b);
    const treatSorted = [...treatedValues].sort((a, b) => a - b);
    const n = Math.min(36, synSorted.length, treatSorted.length);
    const qq = Array.from({ length: n }, (_, i) => {
      const q = (i + 0.5) / n;
      return { x: percentile(treatSorted, q), y: percentile(synSorted, q) };
    });

    return {
      minV,
      maxV,
      bins,
      histSyn,
      histTreat,
      maxCount,
      qq
    };
  }, [metric, run.patients, run.treatedArmValues]);

  const methodology = useMemo(() => {
    const isClean = (p: { qcFlag: string; age: number; baselineBcva: number; baselineCst: number; diseaseDurationYears: number }) =>
      p.qcFlag === 'ok' && p.age >= 45 && p.age <= 90 && p.baselineBcva >= 20 && p.baselineBcva <= 90 && p.baselineCst >= 180 && p.baselineCst <= 780 && p.diseaseDurationYears <= 12;
    const isEligible = (p: { age: number; baselineBcva: number; baselineCst: number; diseaseDurationYears: number }) =>
      p.age <= 86 && p.baselineBcva >= 35 && p.baselineBcva <= 78 && p.baselineCst >= 250 && p.baselineCst <= 650 && p.diseaseDurationYears <= 8;

    const cleanedTreated = run.treatedPatients.filter(isClean);
    const cleanedExternal = run.patients.filter(isClean);
    const eligibleTreated = cleanedTreated.filter(isEligible);
    const eligibleExternal = cleanedExternal.filter(isEligible);

    const withPsTreated = eligibleTreated.map((p) => {
      const x = -8.6 + 0.07 * p.age - 0.045 * p.baselineBcva + 0.0042 * p.baselineCst + 0.2 * p.diseaseDurationYears;
      return { ...p, ps: sigmoid(x) };
    });
    const withPsExternal = eligibleExternal.map((p) => {
      const x = -8.6 + 0.07 * p.age - 0.045 * p.baselineBcva + 0.0042 * p.baselineCst + 0.2 * p.diseaseDurationYears;
      return { ...p, ps: sigmoid(x) };
    });

    const covariates: Array<'age' | 'baselineBcva' | 'baselineCst' | 'diseaseDurationYears'> = ['age', 'baselineBcva', 'baselineCst', 'diseaseDurationYears'];
    const beforeBalance = mean(
      covariates.map((k) =>
        Math.abs(
          smd(
            withPsTreated.map((p) => p[k] as number),
            withPsExternal.map((p) => p[k] as number)
          )
        )
      )
    );

    let analysisTreated = withPsTreated.map((p) => ({ ...p, w: 1 }));
    let analysisExternal = withPsExternal.map((p) => ({ ...p, w: 1 }));

    if (methodType === 'iptw') {
      analysisTreated = withPsTreated
        .filter((p) => p.ps >= trimPs && p.ps <= 1 - trimPs)
        .map((p) => ({ ...p, w: 1 / Math.max(0.05, p.ps) }));
      analysisExternal = withPsExternal
        .filter((p) => p.ps >= trimPs && p.ps <= 1 - trimPs)
        .map((p) => ({ ...p, w: 1 / Math.max(0.05, 1 - p.ps) }));
    } else {
      const used = new Set<string>();
      const matchedT: typeof analysisTreated = [];
      const matchedE: typeof analysisExternal = [];
      type ExternalWithPs = (typeof withPsExternal)[number];
      withPsTreated.forEach((tp) => {
        let best: ExternalWithPs | null = null;
        let bestDist = Infinity;
        withPsExternal.forEach((cp: ExternalWithPs) => {
          if (used.has(cp.id)) return;
          const d = Math.abs(tp.ps - cp.ps);
          if (d <= caliper && d < bestDist) {
            bestDist = d;
            best = cp;
          }
        });
        if (best) {
          const bestItem = best as {
            id: string;
            ps: number;
            age: number;
            sex: 'M' | 'F';
            baselineBcva: number;
            baselineCst: number;
            lesionType: 'classic' | 'occult' | 'mixed';
            priorInjections: number;
            diseaseDurationYears: number;
            bcvaChangeW24: number;
            cstChangeW24: number;
            sourceWeight: number;
            qcFlag: 'ok' | 'missing' | 'outlier';
          };
          used.add(bestItem.id);
          matchedT.push({ ...tp, w: 1 });
          matchedE.push({ ...bestItem, w: 1 });
        }
      });
      analysisTreated = matchedT;
      analysisExternal = matchedE;
    }

    const afterBalance = mean(
      covariates.map((k) =>
        Math.abs(
          smd(
            analysisTreated.map((p) => p[k] as number),
            analysisExternal.map((p) => p[k] as number)
          )
        )
      )
    );

    const trtY = analysisTreated.map((p) => p.bcvaChangeW24);
    const ctlY = analysisExternal.map((p) => p.bcvaChangeW24);
    const wtT = analysisTreated.map((p) => p.w);
    const wtC = analysisExternal.map((p) => p.w);
    const muT = weightedMean(trtY, wtT);
    const muC = weightedMean(ctlY, wtC);
    const effect = muT - muC;
    const varT = weightedVar(trtY, wtT);
    const varC = weightedVar(ctlY, wtC);
    const neffT = Math.max(1, (wtT.reduce((a, b) => a + b, 0) ** 2) / Math.max(1e-6, wtT.reduce((a, b) => a + b * b, 0)));
    const neffC = Math.max(1, (wtC.reduce((a, b) => a + b, 0) ** 2) / Math.max(1e-6, wtC.reduce((a, b) => a + b * b, 0)));
    const se = Math.sqrt(varT / neffT + varC / neffC);
    const ciLo = effect - 1.96 * se;
    const ciHi = effect + 1.96 * se;

    const strictT = analysisTreated.filter((p) => p.baselineBcva >= 40 && p.baselineBcva <= 75 && p.diseaseDurationYears <= 6);
    const strictC = analysisExternal.filter((p) => p.baselineBcva >= 40 && p.baselineBcva <= 75 && p.diseaseDurationYears <= 6);
    const strictEffect =
      weightedMean(
        strictT.map((p) => p.bcvaChangeW24),
        strictT.map((p) => p.w)
      ) -
      weightedMean(
        strictC.map((p) => p.bcvaChangeW24),
        strictC.map((p) => p.w)
      );

    const trimmedT = withPsTreated.filter((p) => p.ps >= trimPs + 0.03 && p.ps <= 1 - (trimPs + 0.03));
    const trimmedC = withPsExternal.filter((p) => p.ps >= trimPs + 0.03 && p.ps <= 1 - (trimPs + 0.03));
    const trimmedEffect = mean(trimmedT.map((p) => p.bcvaChangeW24)) - mean(trimmedC.map((p) => p.bcvaChangeW24));
    const hiddenBiasEffect = effect - 0.8;

    return {
      raw: {
        treated: run.treatedPatients.length,
        external: run.patients.length
      },
      cleaned: {
        treated: cleanedTreated.length,
        external: cleanedExternal.length
      },
      eligible: {
        treated: withPsTreated.length,
        external: withPsExternal.length
      },
      beforeBalance: Number(beforeBalance.toFixed(3)),
      afterBalance: Number(afterBalance.toFixed(3)),
      analysisN: {
        treated: analysisTreated.length,
        external: analysisExternal.length
      },
      effect: Number(effect.toFixed(2)),
      ciLo: Number(ciLo.toFixed(2)),
      ciHi: Number(ciHi.toFixed(2)),
      sensitivity: [
        {
          name: 'Strict cohort window',
          effect: Number(strictEffect.toFixed(2)),
          delta: Number((strictEffect - effect).toFixed(2)),
          note: Math.abs(strictEffect - effect) <= 0.6 ? 'Stable' : 'Moderate shift'
        },
        {
          name: 'More aggressive PS trim',
          effect: Number(trimmedEffect.toFixed(2)),
          delta: Number((trimmedEffect - effect).toFixed(2)),
          note: Math.abs(trimmedEffect - effect) <= 0.6 ? 'Stable' : 'Moderate shift'
        },
        {
          name: 'Hidden bias stress (Gamma-like)',
          effect: Number(hiddenBiasEffect.toFixed(2)),
          delta: Number((hiddenBiasEffect - effect).toFixed(2)),
          note: Math.abs(hiddenBiasEffect - effect) <= 0.8 ? 'Robust' : 'Potentially sensitive'
        }
      ]
    };
  }, [run.treatedPatients, run.patients, methodType, trimPs, caliper]);

  const selectedPatient = useMemo(() => {
    if (run.treatedPatients.length === 0) return null;
    return run.treatedPatients.find((p) => p.id === selectedPatientId) ?? run.treatedPatients[0];
  }, [run.treatedPatients, selectedPatientId]);

  const counterfactualTwin = useMemo<CounterfactualTwinResult | null>(() => {
    if (!selectedPatient) return null;
    const seed = run.seed + twinRunIdx * 137 + selectedPatient.id.length * 17 + twinCount * 11;
    const rand = lcg(seed);
    const visits = [0, 4, 8, 12, 16, 20, 24];
    const series: number[][] = [];

    const baselinePenalty =
      (selectedPatient.age - 65) * 0.015 -
      (selectedPatient.baselineBcva - 55) * 0.08 +
      (selectedPatient.baselineCst - 400) * 0.0025 +
      selectedPatient.priorInjections * 0.11 +
      lesionEffect(selectedPatient.lesionType);
    const sexEffect = selectedPatient.sex === 'F' ? 0.15 : 0;

    for (let i = 0; i < twinCount; i += 1) {
      let y = selectedPatient.baselineBcva;
      const path: number[] = [Number(y.toFixed(2))];
      const randomSlope = -0.06 + gaussian(rand) * 0.07;
      for (let v = 1; v < visits.length; v += 1) {
        const w = visits[v];
        const drift = randomSlope * (w / 4) + baselinePenalty * 0.24 + sexEffect;
        const noise = gaussian(rand) * (0.9 + (24 - w) * 0.02);
        y = y + drift + noise;
        path.push(Number(y.toFixed(2)));
      }
      series.push(path);
    }

    const bands = visits.map((week, idx) => {
      const vals = series.map((s) => s[idx]);
      return {
        week,
        mean: Number(mean(vals).toFixed(2)),
        lower: Number(quantile(vals, 0.025).toFixed(2)),
        upper: Number(quantile(vals, 0.975).toFixed(2))
      };
    });

    return {
      patientId: selectedPatient.id,
      k: twinCount,
      bands
    };
  }, [selectedPatient, run.seed, twinRunIdx, twinCount]);

  const twinSvg = useMemo(() => {
    if (!counterfactualTwin) return null;
    const width = 860;
    const height = 260;
    const pad = 30;
    const vals = counterfactualTwin.bands.flatMap((p) => [p.lower, p.upper, p.mean]);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const toX = (week: number) => pad + (week / 24) * (width - pad * 2);
    const toY = (v: number) => height - pad - ((v - minV) / Math.max(1e-6, maxV - minV)) * (height - pad * 2);

    const meanPts = counterfactualTwin.bands.map((p) => `${toX(p.week)},${toY(p.mean)}`).join(' ');
    const upperPts = counterfactualTwin.bands.map((p) => `${toX(p.week)},${toY(p.upper)}`).join(' ');
    const lowerPts = [...counterfactualTwin.bands]
      .reverse()
      .map((p) => `${toX(p.week)},${toY(p.lower)}`)
      .join(' ');

    return {
      width,
      height,
      pad,
      minV,
      maxV,
      meanPts,
      bandPolygon: `${upperPts} ${lowerPts}`
    };
  }, [counterfactualTwin]);

  const downloadAlignmentCsv = () => {
    const rows: string[][] = [['arm', 'metric', 'value']];
    run.treatedArmValues.bcva.forEach((v) => rows.push([t.treated, 'BCVA_change', String(v)]));
    run.patients.forEach((p) => rows.push([t.synthetic, 'BCVA_change', String(p.bcvaChangeW24)]));
    run.treatedArmValues.cst.forEach((v) => rows.push([t.treated, 'CST_change', String(v)]));
    run.patients.forEach((p) => rows.push([t.synthetic, 'CST_change', String(p.cstChangeW24)]));
    downloadTextFile(`${scenario.trialCode}-alignment.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };

  const downloadSyntheticCsv = () => {
    const rows: string[][] = [
      ['id', 'age', 'sex', 'baseline_bcva', 'baseline_cst', 'lesion_type', 'prior_injections', 'disease_duration_years', 'bcva_change_w24', 'cst_change_w24', 'source_weight']
    ];
    run.patients.forEach((p) => {
      rows.push([
        p.id,
        String(p.age),
        p.sex,
        String(p.baselineBcva),
        String(p.baselineCst),
        p.lesionType,
        String(p.priorInjections),
        String(p.diseaseDurationYears),
        String(p.bcvaChangeW24),
        String(p.cstChangeW24),
        String(p.sourceWeight)
      ]);
    });
    downloadTextFile(`${scenario.trialCode}-synthetic-patients.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };

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
              {t.bcva}: observed {scenario.observedControl.meanBcvaChange.toFixed(2)} ± {scenario.observedControl.sdBcvaChange.toFixed(2)} | {t.synthetic}{' '}
              {run.metrics.syntheticBcvaMean.toFixed(2)} ± {run.metrics.syntheticBcvaSd.toFixed(2)} ·
              <span className={`ml-1 font-semibold ${numberColor(bcvaDelta)}`}>Δ {bcvaDelta >= 0 ? '+' : ''}{bcvaDelta.toFixed(2)}</span>
            </div>
            <div className="rounded border border-ink/15 p-2">
              {t.cst}: observed {scenario.observedControl.meanCstChange.toFixed(1)} ± {scenario.observedControl.sdCstChange.toFixed(1)} | {t.synthetic}{' '}
              {run.metrics.syntheticCstMean.toFixed(1)} ± {run.metrics.syntheticCstSd.toFixed(1)} ·
              <span className={`ml-1 font-semibold ${numberColor(cstDelta)}`}>Δ {cstDelta >= 0 ? '+' : ''}{cstDelta.toFixed(1)}</span>
            </div>
            <div className="rounded border border-ink/15 p-2">
              {t.treated} vs {t.synthetic} {t.alignment}: BCVA <span className="font-semibold">{run.metrics.bcvaAlignmentScore}</span> / 100 · CST{' '}
              <span className="font-semibold">{run.metrics.cstAlignmentScore}</span> / 100
            </div>
          </div>
          <div className="mt-4 rounded border border-ink/15 bg-ink/5 px-3 py-2 text-xs text-ink/80">
            <p className="font-semibold">{t.method}</p>
            <p className="mt-1">{t.methodText}</p>
          </div>
        </article>
      </section>

      <section className="noise-border rounded-lg p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {t.treated} vs {t.synthetic} · {t.alignment}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-[0.12em] text-ink/70">{t.metric}</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value as 'bcva' | 'cst')} className="rounded border border-ink/20 bg-transparent px-2 py-1 text-sm">
              <option value="bcva">BCVA</option>
              <option value="cst">CST</option>
            </select>
            <button type="button" onClick={downloadAlignmentCsv} className="rounded border border-ink/25 px-2 py-1 text-sm hover:bg-ink/10">
              {t.downloadCsv}
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded border border-ink/15 p-3">
            <p className="text-sm font-semibold">{t.histogram}</p>
            <svg viewBox="0 0 820 260" className="mt-2 h-auto w-full rounded border border-ink/10 bg-white/40">
              <line x1="30" y1="230" x2="790" y2="230" stroke="currentColor" strokeOpacity="0.3" />
              <line x1="30" y1="20" x2="30" y2="230" stroke="currentColor" strokeOpacity="0.3" />
              {metricSeries.histTreat.map((count, i) => {
                const x = 38 + i * (740 / metricSeries.bins);
                const w = (740 / metricSeries.bins) * 0.42;
                const h = (count / metricSeries.maxCount) * 180;
                return <rect key={`t-${i}`} x={x} y={230 - h} width={w} height={h} fill="#0B0F14" fillOpacity="0.4" />;
              })}
              {metricSeries.histSyn.map((count, i) => {
                const x = 38 + i * (740 / metricSeries.bins) + (740 / metricSeries.bins) * 0.46;
                const w = (740 / metricSeries.bins) * 0.42;
                const h = (count / metricSeries.maxCount) * 180;
                return <rect key={`s-${i}`} x={x} y={230 - h} width={w} height={h} fill="#00E47C" fillOpacity="0.6" />;
              })}
            </svg>
            <div className="mt-2 flex items-center gap-3 text-xs text-ink/70">
              <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 bg-ink/50" />{t.treated}</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-3 bg-accent1/80" />{t.synthetic}</span>
            </div>
          </article>

          <article className="rounded border border-ink/15 p-3">
            <p className="text-sm font-semibold">{t.qq}</p>
            <svg viewBox="0 0 820 260" className="mt-2 h-auto w-full rounded border border-ink/10 bg-white/40">
              <line x1="30" y1="230" x2="790" y2="230" stroke="currentColor" strokeOpacity="0.3" />
              <line x1="30" y1="20" x2="30" y2="230" stroke="currentColor" strokeOpacity="0.3" />
              <line x1="30" y1="230" x2="790" y2="20" stroke="#6AD2E2" strokeOpacity="0.8" strokeDasharray="5 4" />
              {metricSeries.qq.map((p, i) => {
                const x = 30 + ((p.x - metricSeries.minV) / Math.max(1e-6, metricSeries.maxV - metricSeries.minV)) * 760;
                const y = 230 - ((p.y - metricSeries.minV) / Math.max(1e-6, metricSeries.maxV - metricSeries.minV)) * 210;
                return <circle key={i} cx={x} cy={y} r="3.2" fill="#00E47C" fillOpacity="0.85" />;
              })}
            </svg>
            <p className="mt-2 text-xs text-ink/70">x-axis: {t.treated} quantiles · y-axis: {t.synthetic} quantiles</p>
          </article>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t.section5}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            {t.methodType}
            <select value={methodType} onChange={(e) => setMethodType(e.target.value as 'iptw' | 'matching')} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2">
              <option value="iptw">IPTW</option>
              <option value="matching">PS Matching</option>
            </select>
          </label>
          <label className="text-sm">
            {t.caliper}: {caliper.toFixed(2)}
            <input type="range" min={0.04} max={0.3} step={0.01} value={caliper} onChange={(e) => setCaliper(Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <label className="text-sm">
            {t.trim}: {trimPs.toFixed(2)}
            <input type="range" min={0.01} max={0.1} step={0.01} value={trimPs} onChange={(e) => setTrimPs(Number(e.target.value))} className="mt-1 w-full" />
          </label>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          <article className="rounded border border-ink/15 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-ink/65">{t.step1}</p>
            <p className="mt-2 text-sm">{t.rawN}: T {methodology.raw.treated} / C {methodology.raw.external}</p>
            <p className="text-sm">{t.cleanedN}: T {methodology.cleaned.treated} / C {methodology.cleaned.external}</p>
          </article>
          <article className="rounded border border-ink/15 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-ink/65">{t.step2}</p>
            <p className="mt-2 text-sm">{t.eligibleN}: T {methodology.eligible.treated} / C {methodology.eligible.external}</p>
          </article>
          <article className="rounded border border-ink/15 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-ink/65">{t.step3}</p>
            <p className="mt-2 text-sm">{t.balanceBefore}: <span className="font-semibold">{methodology.beforeBalance}</span></p>
            <p className="text-sm">{t.balanceAfter}: <span className="font-semibold">{methodology.afterBalance}</span></p>
          </article>
          <article className="rounded border border-ink/15 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-ink/65">{t.step4}</p>
            <p className="mt-2 text-sm">{t.primaryEffect}: <span className="font-semibold">{methodology.effect}</span></p>
            <p className="text-sm">{t.ci95}: [{methodology.ciLo}, {methodology.ciHi}]</p>
          </article>
          <article className="rounded border border-ink/15 p-3">
            <p className="text-xs uppercase tracking-[0.1em] text-ink/65">{t.step5}</p>
            <p className="mt-2 text-sm">n(T/C): {methodology.analysisN.treated} / {methodology.analysisN.external}</p>
          </article>
        </div>

        <div className="overflow-auto rounded border border-ink/15">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-ink/15 bg-ink/5 text-left text-xs uppercase tracking-[0.1em] text-ink/70">
                <th className="px-3 py-2">{t.sensScenario}</th>
                <th className="px-3 py-2">{t.sensEffect}</th>
                <th className="px-3 py-2">{t.sensDelta}</th>
                <th className="px-3 py-2">{t.sensNote}</th>
              </tr>
            </thead>
            <tbody>
              {methodology.sensitivity.map((row) => (
                <tr key={row.name} className="border-b border-ink/10">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 font-semibold">{row.effect}</td>
                  <td className={`px-3 py-2 ${numberColor(row.delta)}`}>{row.delta >= 0 ? '+' : ''}{row.delta}</td>
                  <td className="px-3 py-2">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t.section6}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            {t.patientPicker}
            <select
              value={selectedPatient?.id ?? ''}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            >
              {run.treatedPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.age}y · BCVA {p.baselineBcva} · CST {p.baselineCst}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.twinCount}: {twinCount}
            <input type="range" min={20} max={120} step={5} value={twinCount} onChange={(e) => setTwinCount(Number(e.target.value))} className="mt-1 w-full" />
          </label>
        </div>

        {selectedPatient ? (
          <div className="rounded border border-ink/15 bg-ink/5 p-3 text-sm">
            <p className="font-semibold">{t.baselineX}</p>
            <p className="mt-1 text-ink/80">
              age {selectedPatient.age} · {t.sex} {selectedPatient.sex} · baseline BCVA {selectedPatient.baselineBcva} · baseline CST {selectedPatient.baselineCst} · {t.lesionType}{' '}
              {selectedPatient.lesionType} · {t.priorInjections} {selectedPatient.priorInjections}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setTwinRunIdx((v) => v + 1)}
            className="rounded border border-ink/25 px-3 py-1.5 text-sm font-medium hover:bg-ink/10"
          >
            {t.generateTwins}
          </button>
        </div>

        {counterfactualTwin && twinSvg ? (
          <article className="rounded border border-ink/15 p-3">
            <p className="text-sm font-semibold">{t.trajectory}</p>
            <svg viewBox={`0 0 ${twinSvg.width} ${twinSvg.height}`} className="mt-2 h-auto w-full rounded border border-ink/10 bg-white/40">
              <line x1={twinSvg.pad} y1={twinSvg.height - twinSvg.pad} x2={twinSvg.width - twinSvg.pad} y2={twinSvg.height - twinSvg.pad} stroke="currentColor" strokeOpacity="0.3" />
              <line x1={twinSvg.pad} y1={twinSvg.pad} x2={twinSvg.pad} y2={twinSvg.height - twinSvg.pad} stroke="currentColor" strokeOpacity="0.3" />
              <polygon points={twinSvg.bandPolygon} fill="#6AD2E2" fillOpacity="0.28" />
              <polyline points={twinSvg.meanPts} fill="none" stroke="#00E47C" strokeWidth="2.6" />
            </svg>
            <p className="mt-2 text-xs text-ink/70">
              {t.bandLegend} · K={counterfactualTwin.k}
            </p>
          </article>
        ) : null}
      </section>

      <section className="noise-border rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t.section4}</h2>
          <button type="button" onClick={downloadSyntheticCsv} className="rounded border border-ink/25 px-2 py-1 text-sm hover:bg-ink/10">
            {t.downloadSyntheticCsv}
          </button>
        </div>
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
