'use client';

import { useMemo, useState } from 'react';
import { Download, SlidersHorizontal } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type ConditionProfile = {
  therapeuticArea: string;
  indication: string;
  phase: string;
  studyType: string;
  ctgovTrials: number;
  competitorTrials: number;
  avgEnrollment: number;
};

type SiteRecord = {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  startupMedianDays: number;
  piCount: number;
  stabilityScore: number;
  recentTrialYears: number[];
  sponsorAffinity: {
    globalPharma: number;
    biotech: number;
  };
  conditionProfiles: ConditionProfile[];
};

type RankedSite = {
  site: SiteRecord;
  score: number;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  breakdown: {
    experience: number;
    speed: number;
    investigators: number;
    competitor: number;
    relevance: number;
    stability: number;
    sponsorFit: number;
  };
  matchedProfiles: ConditionProfile[];
  explanation: string;
};

type Copy = {
  title: string;
  subtitle: string;
  formulaTitle: string;
  filtersTitle: string;
  area: string;
  indication: string;
  phase: string;
  country: string;
  studyType: string;
  enrollment: string;
  timeWindow: string;
  sponsorPreference: string;
  densityLimit: string;
  all: string;
  interventional: string;
  observational: string;
  years3: string;
  years5: string;
  years8: string;
  noPreference: string;
  globalPharma: string;
  biotech: string;
  rankingTitle: string;
  detailTitle: string;
  noResult: string;
  exportCsv: string;
  exportJson: string;
  score: string;
  tier: string;
  why: string;
  components: {
    experience: string;
    speed: string;
    investigators: string;
    competitor: string;
    relevance: string;
    stability: string;
    sponsorFit: string;
  };
};

const copyByLocale: Record<Locale, Copy> = {
  en: {
    title: 'Site Feasibility Scoring',
    subtitle:
      'ClinicalTrials.gov-inspired scoring workflow for CTM shortlisting: input trial constraints, rank candidate sites, and inspect explainable score logic.',
    formulaTitle: 'Scoring Formula',
    filtersTitle: 'Input Constraints',
    area: 'Therapeutic Area',
    indication: 'Indication',
    phase: 'Phase',
    country: 'Country',
    studyType: 'Study Type',
    enrollment: 'Enrollment Range',
    timeWindow: 'Time Window',
    sponsorPreference: 'Sponsor Preference',
    densityLimit: 'Site Density Limit / Country',
    all: 'All',
    interventional: 'Interventional',
    observational: 'Observational',
    years3: 'Last 3 years',
    years5: 'Last 5 years',
    years8: 'Last 8 years',
    noPreference: 'No preference',
    globalPharma: 'Global pharma affinity',
    biotech: 'Biotech affinity',
    rankingTitle: 'Ranked Candidate Sites',
    detailTitle: 'Site Detail & Why This Site',
    noResult: 'No sites match current filters. Relax indication/phase/country constraints.',
    exportCsv: 'Export CSV',
    exportJson: 'Export JSON',
    score: 'Total Score',
    tier: 'Tier',
    why: 'Why ranked high',
    components: {
      experience: 'TA/Indication Experience',
      speed: 'Site Startup Speed',
      investigators: 'PI Capacity',
      competitor: 'Competitor Exposure',
      relevance: 'ClinicalTrials.gov Relevance',
      stability: 'Execution Stability',
      sponsorFit: 'Sponsor Fit'
    }
  },
  zh: {
    title: 'Site Feasibility 评分引擎',
    subtitle:
      '基于 ClinicalTrials.gov 公开历史构建可解释评分：先输入试验约束，再输出候选站点排序与 why-this-site 解释。',
    formulaTitle: '评分公式',
    filtersTitle: '输入条件',
    area: '治疗领域',
    indication: '适应症',
    phase: '试验分期',
    country: '国家',
    studyType: '研究类型',
    enrollment: '历史入组规模',
    timeWindow: '时间窗口',
    sponsorPreference: 'Sponsor 偏好',
    densityLimit: '站点密度限制（每国）',
    all: '全部',
    interventional: '干预性',
    observational: '观察性',
    years3: '近3年',
    years5: '近5年',
    years8: '近8年',
    noPreference: '不设偏好',
    globalPharma: '偏好大型药企合作史',
    biotech: '偏好 Biotech 合作史',
    rankingTitle: '候选站点排序',
    detailTitle: '站点详情与入选原因',
    noResult: '当前筛选无结果，请放宽适应症/分期/国家条件。',
    exportCsv: '导出 CSV',
    exportJson: '导出 JSON',
    score: '综合评分',
    tier: '分层',
    why: '为何排名靠前',
    components: {
      experience: '领域与适应症经验',
      speed: '站点启动速度',
      investigators: 'PI 资源能力',
      competitor: '竞品试验覆盖度',
      relevance: 'ClinicalTrials.gov 相关性',
      stability: '执行稳定性',
      sponsorFit: 'Sponsor 匹配度'
    }
  },
  de: {
    title: 'Site-Feasibility Scoring Engine',
    subtitle:
      'Erklaerbares Site-Ranking auf Basis oeffentlicher ClinicalTrials.gov-Historie mit klaren Input-Filtern und Why-this-site-Logik.',
    formulaTitle: 'Scoring-Formel',
    filtersTitle: 'Eingabekriterien',
    area: 'Therapiegebiet',
    indication: 'Indikation',
    phase: 'Phase',
    country: 'Land',
    studyType: 'Studientyp',
    enrollment: 'Historische Enrollment-Groesse',
    timeWindow: 'Zeitfenster',
    sponsorPreference: 'Sponsor-Praeferenz',
    densityLimit: 'Site-Dichte pro Land',
    all: 'Alle',
    interventional: 'Interventionell',
    observational: 'Beobachtend',
    years3: 'Letzte 3 Jahre',
    years5: 'Letzte 5 Jahre',
    years8: 'Letzte 8 Jahre',
    noPreference: 'Keine Praeferenz',
    globalPharma: 'Global-Pharma Fokus',
    biotech: 'Biotech Fokus',
    rankingTitle: 'Gerankte Kandidaten-Sites',
    detailTitle: 'Site-Detail & Begruendung',
    noResult: 'Keine Site passt zu den Filtern. Kriterien lockern.',
    exportCsv: 'CSV exportieren',
    exportJson: 'JSON exportieren',
    score: 'Gesamtscore',
    tier: 'Tier',
    why: 'Warum hoch gerankt',
    components: {
      experience: 'Erfahrung in TA/Indikation',
      speed: 'Startup-Geschwindigkeit',
      investigators: 'PI-Kapazitaet',
      competitor: 'Competitor-Abdeckung',
      relevance: 'ClinicalTrials.gov Relevanz',
      stability: 'Operative Stabilitaet',
      sponsorFit: 'Sponsor-Fit'
    }
  }
};

function norm(v: number, min: number, max: number, inverse = false) {
  if (max === min) return 50;
  const ratio = (v - min) / (max - min);
  const value = inverse ? 1 - ratio : ratio;
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function tierOf(score: number): 'Tier 1' | 'Tier 2' | 'Tier 3' {
  if (score >= 80) return 'Tier 1';
  if (score >= 65) return 'Tier 2';
  return 'Tier 3';
}

function buildExplanation(locale: Locale, siteName: string, tier: string, topKeys: string[]) {
  const text = topKeys.join(' / ');
  if (locale === 'zh') {
    return `${siteName} 在 ${text} 上表现领先，因此归为 ${tier}，建议优先纳入 feasibility 评估池。`;
  }
  if (locale === 'de') {
    return `${siteName} zeigt Staerken bei ${text}; daher Einstufung als ${tier} und Priorisierung fuer Feasibility.`;
  }
  return `${siteName} leads on ${text}, resulting in ${tier} prioritization for feasibility shortlisting.`;
}

function toCsv(rows: RankedSite[]) {
  const header = [
    'rank',
    'site',
    'country',
    'city',
    'score',
    'tier',
    'experience',
    'speed',
    'investigators',
    'competitor',
    'relevance',
    'stability',
    'sponsorFit'
  ];

  const lines = rows.map((row, idx) =>
    [
      idx + 1,
      row.site.name,
      row.site.country,
      row.site.city,
      row.score,
      row.tier,
      row.breakdown.experience,
      row.breakdown.speed,
      row.breakdown.investigators,
      row.breakdown.competitor,
      row.breakdown.relevance,
      row.breakdown.stability,
      row.breakdown.sponsorFit
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(',')
  );

  return [header.join(','), ...lines].join('\n');
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SiteFeasibilityPrototype({ locale, sites }: { locale: Locale; sites: SiteRecord[] }) {
  const copy = copyByLocale[locale];

  const allAreas = useMemo(
    () => Array.from(new Set(sites.flatMap((site) => site.conditionProfiles.map((x) => x.therapeuticArea)))).sort(),
    [sites]
  );

  const [area, setArea] = useState('Oncology');
  const allIndications = useMemo(
    () =>
      Array.from(
        new Set(
          sites
            .flatMap((site) => site.conditionProfiles)
            .filter((profile) => (area === copy.all ? true : profile.therapeuticArea === area))
            .map((profile) => profile.indication)
        )
      ).sort(),
    [sites, area, copy.all]
  );

  const [indication, setIndication] = useState('NSCLC');
  const [phase, setPhase] = useState('Phase 3');
  const [country, setCountry] = useState(copy.all);
  const [studyType, setStudyType] = useState(copy.interventional);
  const [enrollmentRange, setEnrollmentRange] = useState('all');
  const [timeWindow, setTimeWindow] = useState('5');
  const [sponsorPreference, setSponsorPreference] = useState('none');
  const [densityLimit, setDensityLimit] = useState(3);

  const countries = useMemo(() => Array.from(new Set(sites.map((x) => x.country))).sort(), [sites]);

  const ranked = useMemo(() => {
    const currentYear = 2026;
    const years = Number(timeWindow);

    const candidates = sites
      .map((site) => {
        const matched = site.conditionProfiles.filter((profile) => {
          const areaPass = area === copy.all || profile.therapeuticArea === area;
          const indicationPass = indication === copy.all || profile.indication === indication;
          const phasePass = phase === copy.all || profile.phase === phase;
          const countryPass = country === copy.all || site.country === country;
          const studyPass = studyType === copy.all || profile.studyType === studyType;
          const timePass = site.recentTrialYears.some((y) => y >= currentYear - years + 1);

          const enrollmentPass =
            enrollmentRange === 'all' ||
            (enrollmentRange === 'low' && profile.avgEnrollment < 300) ||
            (enrollmentRange === 'mid' && profile.avgEnrollment >= 300 && profile.avgEnrollment < 500) ||
            (enrollmentRange === 'high' && profile.avgEnrollment >= 500);

          return areaPass && indicationPass && phasePass && countryPass && studyPass && timePass && enrollmentPass;
        });

        return { site, matched };
      })
      .filter((entry) => entry.matched.length > 0);

    if (candidates.length === 0) return [];

    const stats = candidates.map((entry) => ({
      startup: entry.site.startupMedianDays,
      pi: entry.site.piCount,
      exp: entry.matched.reduce((sum, p) => sum + p.ctgovTrials, 0),
      comp: entry.matched.reduce((sum, p) => sum + p.competitorTrials, 0),
      rel: entry.matched.length * 20 + entry.matched.reduce((sum, p) => sum + p.ctgovTrials, 0),
      stability: entry.site.stabilityScore
    }));

    const minMax = <T extends keyof (typeof stats)[number]>(key: T) => ({
      min: Math.min(...stats.map((x) => x[key])),
      max: Math.max(...stats.map((x) => x[key]))
    });

    const startupRange = minMax('startup');
    const piRange = minMax('pi');
    const expRange = minMax('exp');
    const compRange = minMax('comp');
    const relRange = minMax('rel');
    const stabilityRange = minMax('stability');

    const weights = {
      experience: 0.24,
      speed: 0.18,
      investigators: 0.14,
      competitor: 0.16,
      relevance: 0.18,
      stability: 0.1
    };

    const scored: RankedSite[] = candidates.map((entry) => {
      const expRaw = entry.matched.reduce((sum, p) => sum + p.ctgovTrials, 0);
      const compRaw = entry.matched.reduce((sum, p) => sum + p.competitorTrials, 0);
      const relRaw = entry.matched.length * 20 + expRaw;

      const breakdown = {
        experience: norm(expRaw, expRange.min, expRange.max),
        speed: norm(entry.site.startupMedianDays, startupRange.min, startupRange.max, true),
        investigators: norm(entry.site.piCount, piRange.min, piRange.max),
        competitor: norm(compRaw, compRange.min, compRange.max),
        relevance: norm(relRaw, relRange.min, relRange.max),
        stability: norm(entry.site.stabilityScore, stabilityRange.min, stabilityRange.max),
        sponsorFit:
          sponsorPreference === 'globalPharma'
            ? Math.round(entry.site.sponsorAffinity.globalPharma * 100)
            : sponsorPreference === 'biotech'
              ? Math.round(entry.site.sponsorAffinity.biotech * 100)
              : 50
      };

      const weighted =
        breakdown.experience * weights.experience +
        breakdown.speed * weights.speed +
        breakdown.investigators * weights.investigators +
        breakdown.competitor * weights.competitor +
        breakdown.relevance * weights.relevance +
        breakdown.stability * weights.stability;

      const sponsorBonus = sponsorPreference === 'none' ? 0 : (breakdown.sponsorFit - 50) * 0.12;
      const score = Math.max(0, Math.min(100, Number((weighted + sponsorBonus).toFixed(1))));
      const tier = tierOf(score);

      const topKeys = Object.entries(breakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => copy.components[key as keyof Copy['components']]);

      return {
        site: entry.site,
        score,
        tier,
        breakdown,
        matchedProfiles: entry.matched,
        explanation: buildExplanation(locale, entry.site.name, tier, topKeys)
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const bucket = new Map<string, number>();
    const densityApplied: RankedSite[] = [];
    for (const row of scored) {
      const key = row.site.country;
      const current = bucket.get(key) ?? 0;
      if (current >= densityLimit) continue;
      bucket.set(key, current + 1);
      densityApplied.push(row);
    }

    return densityApplied;
  }, [sites, area, indication, phase, country, studyType, enrollmentRange, timeWindow, sponsorPreference, densityLimit, locale, copy]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = ranked.find((row) => row.site.id === selectedId) ?? ranked[0] ?? null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 01</p>
        <h1 className="text-4xl font-bold md:text-6xl">{copy.title}</h1>
        <p className="max-w-4xl text-ink/75">{copy.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4 md:p-5">
        <h2 className="mb-2 text-lg font-semibold">{copy.formulaTitle}</h2>
        <p className="font-mono text-xs leading-relaxed text-ink/75">
          Score = 0.24*Experience + 0.18*Speed + 0.14*PI Capacity + 0.16*Competitor Exposure + 0.18*CTGov Relevance +
          0.10*Stability + Sponsor Bonus
        </p>
        <p className="mt-2 text-xs text-ink/65">
          Sponsor Bonus = (SponsorFit - 50) * 0.12 when sponsor preference is enabled.
        </p>
      </section>

      <section className="noise-border rounded-lg p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal size={16} /> {copy.filtersTitle}
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <label className="text-sm">
            {copy.area}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value={copy.all}>{copy.all}</option>
              {allAreas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {copy.indication}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={indication} onChange={(e) => setIndication(e.target.value)}>
              <option value={copy.all}>{copy.all}</option>
              {allIndications.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {copy.phase}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={phase} onChange={(e) => setPhase(e.target.value)}>
              <option value={copy.all}>{copy.all}</option>
              <option>Phase 1</option>
              <option>Phase 2</option>
              <option>Phase 3</option>
              <option>Phase 4</option>
            </select>
          </label>
          <label className="text-sm">
            {copy.country}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value={copy.all}>{copy.all}</option>
              {countries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {copy.studyType}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={studyType} onChange={(e) => setStudyType(e.target.value)}>
              <option value={copy.all}>{copy.all}</option>
              <option value={copy.interventional}>{copy.interventional}</option>
              <option value={copy.observational}>{copy.observational}</option>
            </select>
          </label>
          <label className="text-sm">
            {copy.enrollment}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={enrollmentRange} onChange={(e) => setEnrollmentRange(e.target.value)}>
              <option value="all">{copy.all}</option>
              <option value="low">&lt; 300</option>
              <option value="mid">300 - 499</option>
              <option value="high">≥ 500</option>
            </select>
          </label>
          <label className="text-sm">
            {copy.timeWindow}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}>
              <option value="3">{copy.years3}</option>
              <option value="5">{copy.years5}</option>
              <option value="8">{copy.years8}</option>
            </select>
          </label>
          <label className="text-sm">
            {copy.sponsorPreference}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={sponsorPreference} onChange={(e) => setSponsorPreference(e.target.value)}>
              <option value="none">{copy.noPreference}</option>
              <option value="globalPharma">{copy.globalPharma}</option>
              <option value="biotech">{copy.biotech}</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2 xl:col-span-1">
            {copy.densityLimit}
            <input
              type="range"
              min={1}
              max={6}
              value={densityLimit}
              onChange={(e) => setDensityLimit(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <p className="text-xs text-ink/60">{densityLimit}</p>
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{copy.rankingTitle}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => download('site-feasibility-ranking.csv', toCsv(ranked), 'text/csv;charset=utf-8')}
                className="scanline inline-flex items-center gap-1 rounded border border-ink/20 px-3 py-1 text-xs"
              >
                <Download size={12} /> {copy.exportCsv}
              </button>
              <button
                type="button"
                onClick={() => download('site-feasibility-ranking.json', JSON.stringify(ranked, null, 2), 'application/json')}
                className="scanline inline-flex items-center gap-1 rounded border border-ink/20 px-3 py-1 text-xs"
              >
                <Download size={12} /> {copy.exportJson}
              </button>
            </div>
          </div>

          {ranked.length === 0 ? <p className="rounded border border-ink/20 p-4 text-sm text-ink/70">{copy.noResult}</p> : null}

          <div className="space-y-3">
            {ranked.map((row, idx) => (
              <button
                key={row.site.id}
                type="button"
                onClick={() => setSelectedId(row.site.id)}
                className={`noise-border w-full rounded-lg p-4 text-left transition ${selected?.site.id === row.site.id ? 'bg-accent2/18' : ''}`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">#{idx + 1} {row.site.name}</p>
                    <p className="text-xs text-ink/65">{row.site.city}, {row.site.country}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg">{row.score}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-ink/65">{row.tier}</p>
                  </div>
                </div>
                <p className="text-sm text-ink/80">{row.explanation}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="noise-border sticky top-24 space-y-4 rounded-lg p-4">
            <h2 className="text-xl font-semibold">{copy.detailTitle}</h2>
            {selected ? (
              <>
                <div>
                  <p className="text-lg font-semibold">{selected.site.name}</p>
                  <p className="text-sm text-ink/65">{selected.site.city}, {selected.site.country} · {copy.tier}: {selected.tier}</p>
                  <p className="mt-1 text-sm text-ink/80">{copy.score}: {selected.score}</p>
                </div>

                <div className="space-y-2">
                  {Object.entries(selected.breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span>{copy.components[key as keyof Copy['components']]}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-2 rounded bg-ink/10">
                        <div className="h-full rounded bg-accent1" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded border border-ink/15 bg-warm p-3 text-sm text-ink/85">
                  <p className="mb-1 font-medium">{copy.why}</p>
                  <p>{selected.explanation}</p>
                </div>

                <div className="text-xs text-ink/65">
                  <p>startup median: {selected.site.startupMedianDays} days</p>
                  <p>PI count: {selected.site.piCount}</p>
                  <p>matched profile count: {selected.matchedProfiles.length}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
