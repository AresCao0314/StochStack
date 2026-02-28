'use client';

import { useEffect, useMemo, useState } from 'react';
import { ThumbsDown, ThumbsUp, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { baseWeights, type ScoreKey, type TeamFeedbackEvent, type TeamProfile, type Weights } from '@/lib/site-feedback';

type ConditionProfile = {
  therapeuticArea: string;
  indication: string;
  phase: string;
  studyType: string;
  ctgovTrials: number;
  competitorTrials: number;
};

type SiteRecord = {
  id: string;
  name: string;
  country: string;
  city: string;
  startupMedianDays: number;
  piCount: number;
  stabilityScore: number;
  sponsorAffinity: {
    globalPharma: number;
    biotech: number;
  };
  conditionProfiles: ConditionProfile[];
};

type RankedSite = {
  site: SiteRecord;
  score: number;
  breakdown: Record<ScoreKey, number>;
};

type ReasonDiagnostic = {
  distinctUsers: number;
  agreement: number;
  pos: number;
  neg: number;
  rawShift: number;
  appliedShift: number;
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Site Feasibility with Human Feedback',
    subtitle:
      'Team policy learns from multi-user feedback. Repeated single-user dislikes are capped; weight shifts require consensus.',
    filters: 'Base Filter Context',
    rankingBefore: 'Before (Team Baseline)',
    rankingAfter: 'After (Team Learned Policy)',
    compare: 'Rank Shift',
    profile: 'Team Feedback Console',
    weights: 'Effective Weights',
    log: 'Feedback Log (Audit)',
    team: 'Team Profile',
    user: 'Reviewer ID',
    consensus: 'Consensus Guardrails',
    like: 'Like',
    dislike: 'Dislike',
    apply: 'Submit Feedback',
    strength: 'Update Strength',
    sponsor: 'Sponsor Preference',
    noPref: 'No preference',
    globalPharma: 'Global pharma',
    biotech: 'Biotech',
    loading: 'Loading team policy...',
    empty: 'No feedback yet.',
    reasons: {
      experience: 'Experience',
      speed: 'Startup speed',
      investigators: 'PI capacity',
      competitor: 'Competitor coverage',
      relevance: 'CTGov relevance',
      stability: 'Execution stability',
      sponsorFit: 'Sponsor fit'
    }
  },
  zh: {
    title: 'Site Feasibility（团队反馈强化版）',
    subtitle: '团队策略从多人反馈学习。单人连续 dislike 会被封顶衰减，权重变化必须满足共识阈值。',
    filters: '基础筛选上下文',
    rankingBefore: '反馈前（团队基线）',
    rankingAfter: '反馈后（团队学习策略）',
    compare: '排名变化',
    profile: '团队反馈控制台',
    weights: '当前生效权重',
    log: '反馈日志（审计）',
    team: '团队策略档案',
    user: '评审人 ID',
    consensus: '共识防偏规则',
    like: '上调',
    dislike: '下调',
    apply: '提交反馈',
    strength: '反馈强度',
    sponsor: 'Sponsor 偏好',
    noPref: '不设偏好',
    globalPharma: '大型药企',
    biotech: 'Biotech',
    loading: '正在加载团队策略...',
    empty: '暂无反馈记录。',
    reasons: {
      experience: '经验',
      speed: '启动速度',
      investigators: 'PI 资源',
      competitor: '竞品覆盖',
      relevance: 'CTGov 相关性',
      stability: '执行稳定性',
      sponsorFit: 'Sponsor 匹配'
    }
  },
  de: {
    title: 'Site Feasibility mit Team-Feedback',
    subtitle:
      'Team-Policy lernt aus Multi-User-Feedback. Serielle Single-User-Dislikes werden gedeckelt; Gewichtsanpassungen brauchen Konsens.',
    filters: 'Basis-Filterkontext',
    rankingBefore: 'Vorher (Team-Basis)',
    rankingAfter: 'Nachher (gelernte Team-Policy)',
    compare: 'Rangverschiebung',
    profile: 'Team-Feedback-Konsole',
    weights: 'Aktive Gewichte',
    log: 'Feedback-Log (Audit)',
    team: 'Team-Profil',
    user: 'Reviewer-ID',
    consensus: 'Konsens-Schutzregeln',
    like: 'Aufwerten',
    dislike: 'Abwerten',
    apply: 'Feedback senden',
    strength: 'Update-Staerke',
    sponsor: 'Sponsor-Praeferenz',
    noPref: 'Keine Praeferenz',
    globalPharma: 'Global Pharma',
    biotech: 'Biotech',
    loading: 'Team-Policy wird geladen...',
    empty: 'Noch kein Feedback.',
    reasons: {
      experience: 'Erfahrung',
      speed: 'Startup-Geschwindigkeit',
      investigators: 'PI-Kapazitaet',
      competitor: 'Competitor-Abdeckung',
      relevance: 'CTGov-Relevanz',
      stability: 'Operative Stabilitaet',
      sponsorFit: 'Sponsor-Fit'
    }
  }
};

function normalize(v: number, min: number, max: number, inverse = false) {
  if (max === min) return 50;
  const base = (v - min) / (max - min);
  const x = inverse ? 1 - base : base;
  return Math.max(0, Math.min(100, Math.round(x * 100)));
}

function rankSites(sites: SiteRecord[], filters: any, weights: Weights): RankedSite[] {
  const rows = sites
    .map((site) => {
      const matched = site.conditionProfiles.filter((p) => {
        return (
          (filters.area === 'All' || p.therapeuticArea === filters.area) &&
          (filters.indication === 'All' || p.indication === filters.indication) &&
          (filters.phase === 'All' || p.phase === filters.phase) &&
          (filters.country === 'All' || site.country === filters.country)
        );
      });
      if (matched.length === 0) return null;
      return {
        site,
        matchedCount: matched.length,
        experienceRaw: matched.reduce((sum, p) => sum + p.ctgovTrials, 0),
        competitorRaw: matched.reduce((sum, p) => sum + p.competitorTrials, 0)
      };
    })
    .filter(Boolean) as Array<{ site: SiteRecord; matchedCount: number; experienceRaw: number; competitorRaw: number }>;

  if (rows.length === 0) return [];
  const minMax = (vals: number[]) => ({ min: Math.min(...vals), max: Math.max(...vals) });
  const expRange = minMax(rows.map((x) => x.experienceRaw));
  const compRange = minMax(rows.map((x) => x.competitorRaw));
  const piRange = minMax(rows.map((x) => x.site.piCount));
  const startupRange = minMax(rows.map((x) => x.site.startupMedianDays));
  const stabilityRange = minMax(rows.map((x) => x.site.stabilityScore));

  return rows
    .map((row) => {
      const sponsorFit =
        filters.sponsor === 'globalPharma'
          ? Math.round(row.site.sponsorAffinity.globalPharma * 100)
          : filters.sponsor === 'biotech'
            ? Math.round(row.site.sponsorAffinity.biotech * 100)
            : 50;
      const breakdown: Record<ScoreKey, number> = {
        experience: normalize(row.experienceRaw, expRange.min, expRange.max),
        speed: normalize(row.site.startupMedianDays, startupRange.min, startupRange.max, true),
        investigators: normalize(row.site.piCount, piRange.min, piRange.max),
        competitor: normalize(row.competitorRaw, compRange.min, compRange.max),
        relevance: Math.min(100, 30 + row.matchedCount * 20 + normalize(row.experienceRaw, expRange.min, expRange.max) / 2),
        stability: normalize(row.site.stabilityScore, stabilityRange.min, stabilityRange.max),
        sponsorFit
      };
      const score = (Object.keys(breakdown) as ScoreKey[]).reduce((sum, key) => sum + breakdown[key] * weights[key], 0);
      return { site: row.site, breakdown, score: Number(score.toFixed(1)) };
    })
    .sort((a, b) => b.score - a.score);
}

export function SiteFeasibilityFeedbackPrototype({ locale, sites }: { locale: Locale; sites: SiteRecord[] }) {
  const t = labels[locale];
  const [filters, setFilters] = useState({
    area: 'Oncology',
    indication: 'NSCLC',
    phase: 'Phase 3',
    country: 'All',
    sponsor: 'none'
  });
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [profileId, setProfileId] = useState('global-core');
  const [reviewerId, setReviewerId] = useState('ctm-cn-01');
  const [weights, setWeights] = useState<Weights>(baseWeights);
  const [baselineWeights, setBaselineWeights] = useState<Weights>(baseWeights);
  const [diagnostics, setDiagnostics] = useState<Record<ScoreKey, ReasonDiagnostic> | null>(null);
  const [feedbackSiteId, setFeedbackSiteId] = useState('');
  const [action, setAction] = useState<'like' | 'dislike'>('like');
  const [reasons, setReasons] = useState<ScoreKey[]>(['experience', 'speed']);
  const [strength, setStrength] = useState(3);
  const [log, setLog] = useState<TeamFeedbackEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cachedUser = window.localStorage.getItem('stoch.feedback.user');
    if (cachedUser) setReviewerId(cachedUser);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('stoch.feedback.user', reviewerId);
  }, [reviewerId]);

  useEffect(() => {
    let canceled = false;
    fetch('/api/site-feedback/profiles')
      .then((r) => r.json())
      .then((data) => {
        if (canceled) return;
        const next = Array.isArray(data?.profiles) ? (data.profiles as TeamProfile[]) : [];
        setProfiles(next);
        setProfileId((current) => (next.length && !next.find((x) => x.id === current) ? next[0].id : current));
      })
      .catch(() => {
        if (!canceled) setError('Failed to load team profiles.');
      });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    const qs = new URLSearchParams({
      profileId,
      area: filters.area,
      indication: filters.indication,
      phase: filters.phase,
      country: filters.country,
      sponsor: filters.sponsor
    }).toString();
    setBusy(true);
    fetch(`/api/site-feedback/state?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (canceled) return;
        if (!data?.ok) {
          setError(data?.error || 'Failed to load team policy state.');
          return;
        }
        setWeights(data.weights || baseWeights);
        setBaselineWeights(data.profile?.baseWeights || baseWeights);
        setDiagnostics(data.diagnostics || null);
        setLog(Array.isArray(data.events) ? data.events : []);
        setError('');
      })
      .catch(() => {
        if (!canceled) setError('Failed to load team policy state.');
      })
      .finally(() => {
        if (!canceled) setBusy(false);
      });
    return () => {
      canceled = true;
    };
  }, [profileId, filters.area, filters.indication, filters.phase, filters.country, filters.sponsor]);

  const therapeuticAreas = useMemo(
    () => ['All', ...Array.from(new Set(sites.flatMap((s) => s.conditionProfiles.map((p) => p.therapeuticArea))))],
    [sites]
  );
  const indications = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          sites.flatMap((s) =>
            s.conditionProfiles.filter((p) => filters.area === 'All' || p.therapeuticArea === filters.area).map((p) => p.indication)
          )
        )
      )
    ],
    [sites, filters.area]
  );
  const countries = useMemo(() => ['All', ...Array.from(new Set(sites.map((s) => s.country)))], [sites]);

  const before = useMemo(() => rankSites(sites, filters, baselineWeights), [sites, filters, baselineWeights]);
  const after = useMemo(() => rankSites(sites, filters, weights), [sites, filters, weights]);
  const afterRankMap = useMemo(() => new Map(after.map((x, idx) => [x.site.id, idx + 1])), [after]);
  const chosenSite = after.find((x) => x.site.id === feedbackSiteId) ?? after[0];
  const selectedProfile = profiles.find((x) => x.id === profileId) ?? null;

  async function applyFeedback() {
    if (!chosenSite || reasons.length === 0 || !reviewerId.trim()) return;
    setBusy(true);
    const payload = {
      profileId,
      userId: reviewerId.trim(),
      siteId: chosenSite.site.id,
      siteName: chosenSite.site.name,
      action,
      reasons,
      strength,
      area: filters.area,
      indication: filters.indication,
      phase: filters.phase,
      country: filters.country,
      sponsor: filters.sponsor
    };

    try {
      const res = await fetch('/api/site-feedback/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || 'Failed to submit feedback.');
        return;
      }
      setWeights(data.weights || baseWeights);
      setBaselineWeights(data.profile?.baseWeights || baseWeights);
      setDiagnostics(data.diagnostics || null);
      setLog(Array.isArray(data.events) ? data.events : []);
      setError('');
    } catch {
      setError('Failed to submit feedback.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 02</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={15} /> {t.filters}
        </p>
        <div className="grid gap-3 md:grid-cols-5">
          <label className="text-sm">
            Area
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })}>
              {therapeuticAreas.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Indication
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={filters.indication} onChange={(e) => setFilters({ ...filters, indication: e.target.value })}>
              {indications.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-sm">
            Phase
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={filters.phase} onChange={(e) => setFilters({ ...filters, phase: e.target.value })}>
              <option>All</option>
              <option>Phase 2</option>
              <option>Phase 3</option>
              <option>Phase 4</option>
            </select>
          </label>
          <label className="text-sm">
            Country
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}>
              {countries.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="text-sm">
            {t.sponsor}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={filters.sponsor} onChange={(e) => setFilters({ ...filters, sponsor: e.target.value })}>
              <option value="none">{t.noPref}</option>
              <option value="globalPharma">{t.globalPharma}</option>
              <option value="biotech">{t.biotech}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="noise-border rounded-lg p-4 xl:col-span-1">
          <h2 className="mb-2 text-lg font-semibold">{t.profile}</h2>
          <label className="text-sm">
            {t.team}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={profileId} onChange={(e) => setProfileId(e.target.value)} aria-label="Team profile selector">
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.region})
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-sm">
            {t.user}
            <input
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
              placeholder="ctm-cn-01"
              aria-label="Reviewer id"
            />
          </label>
          <label className="mt-3 block text-sm">
            Site
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={feedbackSiteId || chosenSite?.site.id || ''} onChange={(e) => setFeedbackSiteId(e.target.value)}>
              {after.map((x) => <option key={x.site.id} value={x.site.id}>{x.site.name}</option>)}
            </select>
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setAction('like')} className={`scanline rounded border px-3 py-2 text-sm ${action === 'like' ? 'border-accent1' : 'border-ink/20'}`}>
              <ThumbsUp size={14} className="mr-1 inline" />
              {t.like}
            </button>
            <button type="button" onClick={() => setAction('dislike')} className={`scanline rounded border px-3 py-2 text-sm ${action === 'dislike' ? 'border-red-500' : 'border-ink/20'}`}>
              <ThumbsDown size={14} className="mr-1 inline" />
              {t.dislike}
            </button>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.12em] text-ink/60">Reason tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(t.reasons) as ScoreKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setReasons((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]))}
                className={`rounded border px-2 py-1 text-xs ${reasons.includes(key) ? 'border-accent2 bg-accent2/20' : 'border-ink/20'}`}
              >
                {t.reasons[key]}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm">
            {t.strength}: {strength}
            <input type="range" min={1} max={5} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="mt-1 w-full" />
          </label>
          <button type="button" onClick={applyFeedback} disabled={busy || !reviewerId.trim()} className="scanline mt-3 rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50">
            {t.apply}
          </button>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">{t.weights}</p>
            {(Object.keys(weights) as ScoreKey[]).map((k) => (
              <div key={k} className="mb-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{t.reasons[k]}</span>
                  <span>{(weights[k] * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded bg-ink/10">
                  <div className="h-full rounded bg-accent1" style={{ width: `${weights[k] * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4 xl:col-span-1">
          <h2 className="mb-2 text-lg font-semibold">{t.rankingBefore}</h2>
          <div className="space-y-2 text-sm">
            {before.slice(0, 8).map((row, idx) => (
              <div key={row.site.id} className="rounded border border-ink/15 p-2">
                <p className="font-medium">
                  #{idx + 1} {row.site.name}
                </p>
                <p className="text-xs text-ink/65">{row.site.city}, {row.site.country}</p>
                <p className="text-xs">score: {row.score}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4 xl:col-span-1">
          <h2 className="mb-2 text-lg font-semibold">{t.rankingAfter}</h2>
          <div className="space-y-2 text-sm">
            {after.slice(0, 8).map((row, idx) => (
              <div key={row.site.id} className="rounded border border-ink/15 p-2">
                <p className="font-medium">
                  #{idx + 1} {row.site.name}
                </p>
                <p className="text-xs text-ink/65">{row.site.city}, {row.site.country}</p>
                <p className="text-xs">score: {row.score}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 text-lg font-semibold">{t.compare}</h2>
          <div className="space-y-2 text-sm">
            {before.slice(0, 10).map((row, idx) => {
              const afterRank = afterRankMap.get(row.site.id) ?? null;
              const delta = afterRank ? idx + 1 - afterRank : null;
              return (
                <div key={row.site.id} className="flex items-center justify-between rounded border border-ink/15 p-2">
                  <span>
                    #{idx + 1} {row.site.name}
                  </span>
                  <span className="font-mono text-xs">
                    {afterRank ? `after #${afterRank} (${delta === 0 ? '0' : delta! > 0 ? `+${delta}` : delta})` : 'dropped'}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={16} /> {t.consensus}
          </h2>
          {selectedProfile ? (
            <div className="space-y-3 text-sm">
              <p className="text-ink/75">{selectedProfile.description}</p>
              <div className="rounded border border-ink/15 p-3 text-xs">
                <p>min distinct users: {selectedProfile.policy.minDistinctUsers}</p>
                <p>consensus threshold: {selectedProfile.policy.consensusThreshold}</p>
                <p>single user daily cap: {(selectedProfile.policy.singleUserDailyCap * 100).toFixed(1)}%</p>
                <p>max weight shift / reason: {(selectedProfile.policy.maxWeightShift * 100).toFixed(1)}%</p>
              </div>
              {diagnostics ? (
                <div className="space-y-2">
                  {(Object.keys(diagnostics) as ScoreKey[]).map((k) => (
                    <div key={k} className="rounded border border-ink/15 p-2 text-xs">
                      <p className="font-medium">{t.reasons[k]}</p>
                      <p>
                        users: {diagnostics[k].distinctUsers} | agreement: {(diagnostics[k].agreement * 100).toFixed(0)}%
                      </p>
                      <p>
                        raw shift: {diagnostics[k].rawShift.toFixed(4)} | applied: {diagnostics[k].appliedShift.toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : busy ? (
            <p className="text-sm text-ink/60">{t.loading}</p>
          ) : null}
        </article>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 text-lg font-semibold">{t.log}</h2>
        {log.length === 0 ? <p className="text-sm text-ink/65">{t.empty}</p> : null}
        <ol className="space-y-3 border-l border-ink/20 pl-4">
          {log.map((entry, idx) => (
            <li key={`${entry.id}-${idx}`} className="relative text-sm">
              <span className="absolute -left-[1.15rem] top-1 h-2 w-2 rounded-full bg-accent3" />
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">{new Date(entry.createdAt).toLocaleString()}</p>
              <p className="mt-1">
                {entry.userId} · {entry.action.toUpperCase()} · {entry.siteName}
              </p>
              <p className="text-xs text-ink/65">
                {entry.reasons.map((r) => t.reasons[r]).join(', ')} · strength {entry.strength} · {entry.contextKey}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
