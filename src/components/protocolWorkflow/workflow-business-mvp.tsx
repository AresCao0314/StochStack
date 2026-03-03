'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Locale = 'en' | 'zh' | 'de';

type StudyLite = {
  id: string;
  name: string;
  indication: string;
  phase: string;
  createdAt?: string;
};

type StepStatus = 'ready' | 'in_progress' | 'blocked';

type StepItem = {
  key: string;
  title: string;
  outcome: string;
  owner: string;
  sla: string;
  status: StepStatus;
};

type CopyPack = {
  badge: string;
  title: string;
  subtitle: string;
  modeLabel: string;
  mockMode: string;
  liveMode: string;
  whyTitle: string;
  whyPoints: string[];
  queueTitle: string;
  queueSubtitle: string;
  queueItems: string[];
  stepsTitle: string;
  studyTitle: string;
  noLiveStudy: string;
  openAdvanced: string;
  openLatest: string;
  demoRun: string;
  demoRunning: string;
  demoDone: string;
};

const COPY: Record<Locale, CopyPack> = {
  en: {
    badge: 'Workflow MVP+',
    title: 'Business Workflow Console',
    subtitle: 'Give CTM teams one clear daily loop: decide, act, review, and publish evidence.',
    modeLabel: 'Data Mode',
    mockMode: 'Mock (stable demo)',
    liveMode: 'Live (database connected)',
    whyTitle: 'Business Meaning',
    whyPoints: [
      'Turn protocol operations from ad-hoc tasks into a visible pipeline.',
      'Make every review decision traceable for QA and leadership reporting.',
      'Shorten time from protocol change to operational action plan.'
    ],
    queueTitle: 'Today Action Queue',
    queueSubtitle: 'Start with these items in order. Complex analytics can stay mocked at this phase.',
    queueItems: [
      'Ingest new protocol/amendment text and create one extraction run.',
      'Review high-impact fields (eligibility, SoA, endpoints) first.',
      'Validate core rules and publish a usable USDM/DDF package.',
      'Link field changes to one operational impact card for CTM follow-up.'
    ],
    stepsTitle: '6-Step Delivery Spine',
    studyTitle: 'Live Study Context',
    noLiveStudy: 'No live study found. You can still demo the full flow with mock mode.',
    openAdvanced: 'Open Advanced Console',
    openLatest: 'Open latest study',
    demoRun: 'Run 90-second Demo',
    demoRunning: 'Demo running...',
    demoDone: 'Demo completed: ready for leadership walkthrough.'
  },
  zh: {
    badge: 'Workflow MVP+',
    title: '业务流程驾驶舱',
    subtitle: '给 CTM 团队一个清晰的日常闭环：决策、执行、审阅、发布证据。',
    modeLabel: '数据模式',
    mockMode: 'Mock（稳定演示）',
    liveMode: 'Live（已连接数据库）',
    whyTitle: '业务意义',
    whyPoints: [
      '把协议运营从零散任务变成可见的流水线。',
      '让每次审阅决策都可追溯，便于 QA 与管理层复盘。',
      '缩短从 protocol 变更到运营动作落地的时间。'
    ],
    queueTitle: '今日任务队列',
    queueSubtitle: '按顺序推进即可。当前阶段复杂分析可以先用 mock 支撑演示。',
    queueItems: [
      '导入新的 protocol/amendment 文本并创建一次抽取 run。',
      '优先审阅高影响字段（入排、SoA、终点）。',
      '完成基础规则校验后发布可用的 USDM/DDF 包。',
      '将关键字段变更关联到一张运营影响卡，便于 CTM 跟进。'
    ],
    stepsTitle: '6 步交付主链路',
    studyTitle: 'Live 研究上下文',
    noLiveStudy: '当前未发现 live study，你仍可用 mock 模式完整演示流程。',
    openAdvanced: '打开高级控制台',
    openLatest: '打开最新 study',
    demoRun: '运行 90 秒演示',
    demoRunning: '演示运行中...',
    demoDone: '演示完成：可直接用于管理层走查。'
  },
  de: {
    badge: 'Workflow MVP+',
    title: 'Business-Workflow-Konsole',
    subtitle: 'Ein klarer Tageszyklus für CTM-Teams: entscheiden, ausführen, prüfen, veröffentlichen.',
    modeLabel: 'Datenmodus',
    mockMode: 'Mock (stabiles Demo)',
    liveMode: 'Live (Datenbank verbunden)',
    whyTitle: 'Geschäftlicher Nutzen',
    whyPoints: [
      'Macht aus ad-hoc Aufgaben eine sichtbare Prozesskette.',
      'Jede Review-Entscheidung wird für QA und Management nachvollziehbar.',
      'Verkürzt die Zeit von Protokolländerung bis operativem Maßnahmenplan.'
    ],
    queueTitle: 'Heutige Aufgaben',
    queueSubtitle: 'Diese Reihenfolge genügt. Komplexe Analytik kann in dieser Phase gemockt bleiben.',
    queueItems: [
      'Neuen Protocol/Amendment-Text aufnehmen und einen Extraction-Run starten.',
      'High-Impact-Felder zuerst prüfen (Eligibility, SoA, Endpoints).',
      'Kernregeln validieren und ein nutzbares USDM/DDF-Paket veröffentlichen.',
      'Feldänderungen mit einer Operations-Impact-Karte für CTM verknüpfen.'
    ],
    stepsTitle: '6-stufige Delivery-Chain',
    studyTitle: 'Live-Studienkontext',
    noLiveStudy: 'Keine Live-Studie gefunden. Das gesamte Demo läuft trotzdem im Mock-Modus.',
    openAdvanced: 'Advanced Console öffnen',
    openLatest: 'Neueste Studie öffnen',
    demoRun: '90-Sekunden-Demo starten',
    demoRunning: 'Demo läuft...',
    demoDone: 'Demo abgeschlossen: bereit für Management-Demo.'
  }
};

const STEP_LIBRARY: Array<Omit<StepItem, 'status'>> = [
  {
    key: 'ingest',
    title: '1) Ingest',
    outcome: 'Document intake is registered with owner and version tag.',
    owner: 'Clinical Ops',
    sla: 'same day'
  },
  {
    key: 'extract',
    title: '2) Extract',
    outcome: 'JSON fields + evidence spans generated (mock/LLM).',
    owner: 'AI Engine',
    sla: '15 min'
  },
  {
    key: 'review',
    title: '3) Review',
    outcome: 'Human accept/edit/reject decisions recorded in audit log.',
    owner: 'Medical + Ops',
    sla: '24 h'
  },
  {
    key: 'validate',
    title: '4) Validate',
    outcome: 'Critical structural and consistency checks completed.',
    owner: 'Standards QA',
    sla: 'same day'
  },
  {
    key: 'publish',
    title: '5) Publish',
    outcome: 'USDM / DDF artifacts and handoff package are available.',
    owner: 'Platform',
    sla: 'same day'
  },
  {
    key: 'feedback',
    title: '6) Feedback',
    outcome: 'Amendment signals are linked back to design objects.',
    owner: 'CTM',
    sla: 'weekly cycle'
  }
];

function normalizeLocale(locale: string): Locale {
  if (locale === 'zh' || locale === 'de') return locale;
  return 'en';
}

function statusClass(status: StepStatus): string {
  if (status === 'ready') return 'border-emerald-600/35 bg-emerald-500/10 text-emerald-800';
  if (status === 'in_progress') return 'border-amber-600/35 bg-amber-500/10 text-amber-800';
  return 'border-ink/20 bg-white/70 text-ink/70';
}

export function WorkflowBusinessMvp({ locale }: { locale: string }) {
  const t = COPY[normalizeLocale(locale)];
  const [liveStudies, setLiveStudies] = useState<StudyLite[]>([]);
  const [liveConnected, setLiveConnected] = useState(false);
  const [demoStep, setDemoStep] = useState(-1);

  useEffect(() => {
    let active = true;

    async function loadStudies() {
      try {
        const res = await fetch('/api/workflow/studies', { cache: 'no-store' });
        const payload = (await res.json()) as { ok: boolean; data?: StudyLite[] };
        if (!active) return;
        if (payload.ok && Array.isArray(payload.data)) {
          setLiveStudies(payload.data);
          setLiveConnected(true);
        }
      } catch {
        if (!active) return;
        setLiveConnected(false);
      }
    }

    loadStudies();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (demoStep < 0 || demoStep >= STEP_LIBRARY.length) return;

    const timer = window.setTimeout(() => {
      setDemoStep((prev) => (prev + 1 >= STEP_LIBRARY.length ? STEP_LIBRARY.length : prev + 1));
    }, 900);

    return () => window.clearTimeout(timer);
  }, [demoStep]);

  const steps = useMemo<StepItem[]>(() => {
    return STEP_LIBRARY.map((step, index) => {
      let status: StepStatus = 'blocked';
      if (demoStep >= STEP_LIBRARY.length) {
        status = 'ready';
      } else if (index < demoStep) {
        status = 'ready';
      } else if (index === demoStep) {
        status = 'in_progress';
      }

      return { ...step, status };
    });
  }, [demoStep]);

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-5">
        <p className="section-title">{t.badge}</p>
        <h1 className="mt-1 text-3xl font-bold md:text-5xl">{t.title}</h1>
        <p className="mt-2 max-w-4xl text-sm text-ink/75">{t.subtitle}</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded border border-ink/20 bg-white/70 px-3 py-1 text-xs uppercase tracking-[0.12em]">
          <span className="text-ink/65">{t.modeLabel}</span>
          <span className={liveConnected ? 'text-emerald-700' : 'text-amber-700'}>
            {liveConnected ? t.liveMode : t.mockMode}
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="text-lg font-semibold">{t.whyTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {t.whyPoints.map((point) => (
              <li key={point} className="rounded border border-ink/10 bg-white/70 px-3 py-2">
                {point}
              </li>
            ))}
          </ul>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="text-lg font-semibold">{t.queueTitle}</h2>
          <p className="mt-1 text-xs text-ink/60">{t.queueSubtitle}</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {t.queueItems.map((item) => (
              <li key={item} className="rounded border border-ink/10 bg-white/70 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDemoStep(0)}
              className="scanline rounded border border-ink/20 px-3 py-2 text-xs"
            >
              {demoStep >= 0 && demoStep < STEP_LIBRARY.length ? t.demoRunning : t.demoRun}
            </button>
            {demoStep >= STEP_LIBRARY.length ? <span className="text-xs text-emerald-700">{t.demoDone}</span> : null}
          </div>
        </article>
      </section>

      <section className="noise-border rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t.stepsTitle}</h2>
          <Link href={`/${locale}/documents`} className="text-xs uppercase tracking-[0.12em] text-ink/70 hover:text-ink">
            {t.openAdvanced}
          </Link>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => (
            <article key={step.key} className="rounded-lg border border-ink/15 bg-white/75 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{step.title}</p>
                <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${statusClass(step.status)}`}>
                  {step.status === 'ready' ? 'ready' : step.status === 'in_progress' ? 'running' : 'queued'}
                </span>
              </div>
              <p className="mt-2 text-xs text-ink/70">{step.outcome}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.11em] text-ink/55">
                {step.owner} · SLA {step.sla}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="text-lg font-semibold">{t.studyTitle}</h2>
        {liveStudies.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/workflow/${liveStudies[0].id}`}
              className="scanline rounded border border-accent1/30 bg-accent1/15 px-3 py-2 text-xs"
            >
              {t.openLatest}: {liveStudies[0].name}
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink/70">{t.noLiveStudy}</p>
        )}
      </section>
    </div>
  );
}
