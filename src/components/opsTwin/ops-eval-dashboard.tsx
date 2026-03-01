'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import evalData from '@/content/ops-eval/agent-scorecards.json';

type AgentName =
  | 'Country_Feasibility_Agent'
  | 'Site_Scout_Agent'
  | 'StartUp_Workflow_Agent'
  | 'Recruitment_Dynamics_Agent'
  | 'Risk_Officer_Agent';

type Scorecard = {
  trialId: string;
  agent: AgentName;
  version: string;
  accuracy: number;
  bias: number;
  stability: number;
  adoption: number;
  samples: number;
  lastUpdated: string;
};

type FeedbackDecision = 'accept' | 'reject';

type FeedbackRecord = {
  suggestionId: string;
  trialId: string;
  agent: AgentName;
  version: string;
  decision: FeedbackDecision;
  reason: string;
  createdAt: string;
};

const FEEDBACK_KEY = 'opsTwinEvalFeedbackV1';

const copyByLocale: Record<Locale, Record<string, string>> = {
  en: {
    title: 'Agent Evaluation Dashboard',
    subtitle: 'Validate each agent as a measurable decision module, not a black box.',
    trial: 'Trial Filter',
    compareA: 'Version A',
    compareB: 'Version B',
    allTrials: 'All trials',
    scorecards: 'Agent Scorecards',
    accuracy: 'Accuracy',
    bias: 'Bias',
    stability: 'Stability',
    adoption: 'Adoption',
    samples: 'Samples',
    compare: 'Version Compare (vA vs vB)',
    delta: 'Delta',
    feedback: 'Human Feedback Loop',
    suggestion: 'Suggestion',
    rationale: 'Rationale',
    accept: 'Accept',
    reject: 'Reject',
    reason: 'Reason',
    save: 'Submit Feedback',
    empty: 'No suggestions for selected trial/version.',
    accepted: 'Accepted',
    rejected: 'Rejected',
    totalFeedback: 'Feedback records'
  },
  zh: {
    title: 'Agent 评估看板',
    subtitle: '把每个 agent 当作可量化的决策模块来验证，而不是黑盒。',
    trial: 'Trial 筛选',
    compareA: '版本 A',
    compareB: '版本 B',
    allTrials: '全部试验',
    scorecards: 'Agent 评分卡',
    accuracy: '准确度',
    bias: '偏差',
    stability: '稳定性',
    adoption: '采纳率',
    samples: '样本数',
    compare: '版本对比（vA vs vB）',
    delta: '差值',
    feedback: '人工反馈闭环',
    suggestion: '建议',
    rationale: '依据',
    accept: '采纳',
    reject: '拒绝',
    reason: '原因',
    save: '提交反馈',
    empty: '当前 trial/版本下暂无建议。',
    accepted: '已采纳',
    rejected: '已拒绝',
    totalFeedback: '反馈记录数'
  },
  de: {
    title: 'Agent-Evaluationsdashboard',
    subtitle: 'Jeden Agenten als messbares Entscheidungsmodul validieren, nicht als Black Box.',
    trial: 'Trial-Filter',
    compareA: 'Version A',
    compareB: 'Version B',
    allTrials: 'Alle Trials',
    scorecards: 'Agent-Scorecards',
    accuracy: 'Accuracy',
    bias: 'Bias',
    stability: 'Stabilität',
    adoption: 'Adoption',
    samples: 'Samples',
    compare: 'Versionsvergleich (vA vs vB)',
    delta: 'Delta',
    feedback: 'Human-Feedback-Loop',
    suggestion: 'Vorschlag',
    rationale: 'Begründung',
    accept: 'Akzeptieren',
    reject: 'Ablehnen',
    reason: 'Grund',
    save: 'Feedback speichern',
    empty: 'Keine Vorschläge für Trial/Version.',
    accepted: 'Akzeptiert',
    rejected: 'Abgelehnt',
    totalFeedback: 'Feedback-Einträge'
  }
};

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function loadFeedback() {
  if (typeof window === 'undefined') return [] as FeedbackRecord[];
  try {
    const raw = window.localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FeedbackRecord[];
  } catch {
    return [];
  }
}

function saveFeedback(items: FeedbackRecord[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
}

function agentShort(agent: AgentName) {
  return agent.replace('_Agent', '').replaceAll('_', ' ');
}

function metricClass(delta: number) {
  if (delta > 0) return 'text-emerald-700';
  if (delta < 0) return 'text-rose-700';
  return 'text-ink/65';
}

export function OpsEvalDashboard({ locale }: { locale: Locale }) {
  const t = copyByLocale[locale];

  const trials = evalData.trials;
  const versions = evalData.versions;
  const scorecards = evalData.scorecards as Scorecard[];
  const suggestions = evalData.suggestions;

  const [trialId, setTrialId] = useState<string>('all');
  const [versionA, setVersionA] = useState(versions[0]);
  const [versionB, setVersionB] = useState(versions[1]);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [draftDecision, setDraftDecision] = useState<Record<string, FeedbackDecision>>({});
  const [draftReason, setDraftReason] = useState<Record<string, string>>({});

  useEffect(() => {
    setFeedback(loadFeedback());
  }, []);

  const filtered = useMemo(
    () => scorecards.filter((s) => (trialId === 'all' ? true : s.trialId === trialId)),
    [scorecards, trialId]
  );

  const scorecardsCurrent = useMemo(
    () => filtered.filter((s) => s.version === versionB),
    [filtered, versionB]
  );

  const compareRows = useMemo(() => {
    const agents = Array.from(new Set(filtered.map((s) => s.agent))) as AgentName[];
    return agents
      .map((agent) => {
        const a = filtered.find((s) => s.agent === agent && s.version === versionA);
        const b = filtered.find((s) => s.agent === agent && s.version === versionB);
        if (!a || !b) return null;
        return {
          agent,
          a,
          b,
          deltaAccuracy: b.accuracy - a.accuracy,
          deltaBias: b.bias - a.bias,
          deltaStability: b.stability - a.stability,
          deltaAdoption: b.adoption - a.adoption
        };
      })
      .filter(Boolean) as Array<{
      agent: AgentName;
      a: Scorecard;
      b: Scorecard;
      deltaAccuracy: number;
      deltaBias: number;
      deltaStability: number;
      deltaAdoption: number;
    }>;
  }, [filtered, versionA, versionB]);

  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter((item) => (trialId === 'all' ? true : item.trialId === trialId) && item.version === versionB),
    [suggestions, trialId, versionB]
  );

  const feedbackStats = useMemo(() => {
    const scoped = feedback.filter((f) => (trialId === 'all' ? true : f.trialId === trialId));
    const accepted = scoped.filter((f) => f.decision === 'accept').length;
    const rejected = scoped.filter((f) => f.decision === 'reject').length;
    return {
      accepted,
      rejected,
      total: scoped.length
    };
  }, [feedback, trialId]);

  function submitFeedback(suggestionId: string, suggestion: (typeof suggestions)[number]) {
    const decision = draftDecision[suggestionId];
    if (!decision) return;

    const reason = (draftReason[suggestionId] || '').trim();
    const next: FeedbackRecord[] = [
      {
        suggestionId,
        trialId: suggestion.trialId,
        agent: suggestion.agent as AgentName,
        version: suggestion.version,
        decision,
        reason,
        createdAt: new Date().toISOString()
      },
      ...feedback
    ].slice(0, 300);

    setFeedback(next);
    saveFeedback(next);
    setDraftReason((prev) => ({ ...prev, [suggestionId]: '' }));
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="section-title">ops eval</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-3xl text-lg text-ink/70">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            {t.trial}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={trialId} onChange={(e) => setTrialId(e.target.value)}>
              <option value="all">{t.allTrials}</option>
              {trials.map((trial) => (
                <option key={trial.id} value={trial.id}>
                  {trial.name} ({trial.ta} {trial.phase})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.compareA}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={versionA} onChange={(e) => setVersionA(e.target.value)}>
              {versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.compareB}
            <select className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2" value={versionB} onChange={(e) => setVersionB(e.target.value)}>
              {versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <p className="section-title">{t.scorecards}</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scorecardsCurrent.map((card) => (
            <article key={`${card.trialId}-${card.agent}-${card.version}`} className="noise-border rounded-lg p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{agentShort(card.agent)} · {card.version}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-ink/60">{t.accuracy}</span><p className="font-semibold">{pct(card.accuracy)}</p></div>
                <div><span className="text-ink/60">{t.bias}</span><p className="font-semibold">{card.bias.toFixed(2)}</p></div>
                <div><span className="text-ink/60">{t.stability}</span><p className="font-semibold">{pct(card.stability)}</p></div>
                <div><span className="text-ink/60">{t.adoption}</span><p className="font-semibold">{pct(card.adoption)}</p></div>
              </div>
              <p className="mt-3 text-xs text-ink/65">{t.samples}: {card.samples} · {card.lastUpdated}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <p className="section-title">{t.compare}</p>
        <div className="mt-3 overflow-auto rounded border border-ink/15">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm/70 text-ink/70">
              <tr>
                <th className="px-2 py-2">Agent</th>
                <th className="px-2 py-2">{versionA}</th>
                <th className="px-2 py-2">{versionB}</th>
                <th className="px-2 py-2">{t.delta}</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.agent} className="border-t border-ink/10 align-top">
                  <td className="px-2 py-2 font-medium">{agentShort(row.agent)}</td>
                  <td className="px-2 py-2 text-ink/70">
                    acc {pct(row.a.accuracy)} · bias {row.a.bias.toFixed(2)} · stab {pct(row.a.stability)} · adopt {pct(row.a.adoption)}
                  </td>
                  <td className="px-2 py-2 text-ink/70">
                    acc {pct(row.b.accuracy)} · bias {row.b.bias.toFixed(2)} · stab {pct(row.b.stability)} · adopt {pct(row.b.adoption)}
                  </td>
                  <td className="px-2 py-2">
                    <div className={`font-mono ${metricClass(row.deltaAccuracy)}`}>acc {(row.deltaAccuracy * 100).toFixed(1)}%</div>
                    <div className={`font-mono ${metricClass(-Math.abs(row.deltaBias) + Math.abs(row.a.bias) - Math.abs(row.b.bias))}`}>
                      bias {row.deltaBias.toFixed(2)}
                    </div>
                    <div className={`font-mono ${metricClass(row.deltaStability)}`}>stab {(row.deltaStability * 100).toFixed(1)}%</div>
                    <div className={`font-mono ${metricClass(row.deltaAdoption)}`}>adopt {(row.deltaAdoption * 100).toFixed(1)}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="noise-border rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-title">{t.feedback}</p>
          <div className="flex items-center gap-3 text-xs">
            <span>{t.accepted}: <strong>{feedbackStats.accepted}</strong></span>
            <span>{t.rejected}: <strong>{feedbackStats.rejected}</strong></span>
            <span>{t.totalFeedback}: <strong>{feedbackStats.total}</strong></span>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {filteredSuggestions.length === 0 ? <p className="text-sm text-ink/65">{t.empty}</p> : null}

          {filteredSuggestions.map((item) => (
            <article key={item.id} className="rounded border border-ink/15 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{agentShort(item.agent as AgentName)} · {item.version}</p>
              <p className="mt-1 text-sm font-semibold">{t.suggestion}: {item.title}</p>
              <p className="mt-1 text-sm text-ink/75">{t.rationale}: {item.rationale}</p>

              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <label className="rounded border border-ink/15 px-2 py-2 text-xs">
                  <input
                    type="radio"
                    name={`decision-${item.id}`}
                    className="mr-1"
                    checked={draftDecision[item.id] === 'accept'}
                    onChange={() => setDraftDecision((prev) => ({ ...prev, [item.id]: 'accept' }))}
                  />
                  {t.accept}
                </label>
                <label className="rounded border border-ink/15 px-2 py-2 text-xs">
                  <input
                    type="radio"
                    name={`decision-${item.id}`}
                    className="mr-1"
                    checked={draftDecision[item.id] === 'reject'}
                    onChange={() => setDraftDecision((prev) => ({ ...prev, [item.id]: 'reject' }))}
                  />
                  {t.reject}
                </label>
                <input
                  type="text"
                  className="rounded border border-ink/20 px-2 py-2 text-xs md:col-span-1"
                  placeholder={t.reason}
                  value={draftReason[item.id] || ''}
                  onChange={(e) => setDraftReason((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
                <button
                  type="button"
                  className="scanline rounded border border-ink/20 px-3 py-2 text-xs"
                  onClick={() => submitFeedback(item.id, item)}
                  disabled={!draftDecision[item.id]}
                >
                  {t.save}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
