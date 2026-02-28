'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Network, Route, ShieldAlert } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Initiative = {
  id: string;
  name: string;
  summary: string;
  aliases: string[];
  keywords: string[];
};

type SkillStep = {
  step: string;
  owner: string;
  action: string;
  output: string;
};

type RoutePayload = {
  initiative: Initiative | null;
  skillPack: {
    initiativeId: string;
    inputSchema: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
      example?: unknown;
    }>;
    tools: Array<{ name: string; purpose: string; mode: string }>;
    approvalGates: Array<{ gate: string; owner: string; criteria: string }>;
    outputTemplates: {
      email: { subject: string; bodyOutline: string[] };
      report: { sections: string[] };
      jira: { summaryTemplate: string; descriptionChecklist: string[] };
    };
  } | null;
  confidence: number;
  backlog: boolean;
  rationale: string;
  keySignals: string[];
  skillWorkflow: SkillStep[];
};

type IntakeEntry = {
  id: string;
  createdAt: string;
  query: string;
  routedInitiativeName?: string;
  confidence: number;
  backlog: boolean;
};

const labels: Record<Locale, any> = {
  en: {
    title: 'Agent Orchestration Router',
    subtitle:
      'Natural language intake routes into one of 10 HighScore initiatives. Unmatched requests go to backlog for future initiative design.',
    input: 'Ask a request in natural language',
    requester: 'Requester',
    submit: 'Route Request',
    initiatives: 'Initiative Skill Packs',
    workflow: 'Skill Workflow',
    schema: 'Input Schema',
    tools: 'Tool List',
    gates: 'Approval Gates',
    templates: 'Output Templates',
    backlog: 'Backlog Intake',
    matched: 'Matched initiative',
    unmatched: 'No strong match, sent to backlog',
    confidence: 'Confidence',
    rationale: 'Routing rationale',
    signals: 'Key signals'
  },
  zh: {
    title: 'Agent Orchestration 路由台',
    subtitle: '自然语言请求会路由到 10 个 HighScore initiatives 之一；无法命中则进入 backlog，作为未来 intake 依据。',
    input: '用自然语言描述你的问题',
    requester: '提问人',
    submit: '开始路由',
    initiatives: 'Initiative Skill 包',
    workflow: 'Skill 工作流',
    schema: '输入 Schema',
    tools: '工具列表',
    gates: '审批 Gate',
    templates: '输出模板',
    backlog: 'Backlog 收集',
    matched: '已命中 initiative',
    unmatched: '未稳定命中，已进入 backlog',
    confidence: '置信度',
    rationale: '路由原因',
    signals: '关键触发词'
  },
  de: {
    title: 'Agent-Orchestration Router',
    subtitle:
      'Natuerliche Sprache wird auf eines von 10 HighScore-Initiativen geroutet. Nicht zuordenbare Anfragen landen im Backlog.',
    input: 'Anfrage in natuerlicher Sprache',
    requester: 'Anfragender',
    submit: 'Routing starten',
    initiatives: 'Initiative-Skill-Packs',
    workflow: 'Skill-Workflow',
    schema: 'Input-Schema',
    tools: 'Tool-Liste',
    gates: 'Freigabe-Gates',
    templates: 'Output-Templates',
    backlog: 'Backlog Intake',
    matched: 'Initiative erkannt',
    unmatched: 'Keine klare Zuordnung, im Backlog gespeichert',
    confidence: 'Konfidenz',
    rationale: 'Routing-Begruendung',
    signals: 'Signalwoerter'
  }
};

export function AgentOrchestrationPrototype({
  locale,
  initiatives
}: {
  locale: Locale;
  initiatives: Initiative[];
}) {
  const t = labels[locale];
  const [requester, setRequester] = useState('clinical.user');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [route, setRoute] = useState<RoutePayload | null>(null);
  const [backlogCount, setBacklogCount] = useState(0);
  const [routedCount, setRoutedCount] = useState(0);
  const [recentBacklog, setRecentBacklog] = useState<IntakeEntry[]>([]);

  const placeholder = useMemo(
    () =>
      locale === 'zh'
        ? '例如：我们Q3有3个肿瘤研究同时推进，想要统一 milestone 与预算跟踪，并提前识别延迟风险。'
        : locale === 'de'
          ? 'Beispiel: Wir haben drei parallele Onkologie-Studien und brauchen ein einheitliches Milestone- und Budget-Tracking.'
          : 'Example: We need one control tower for milestone slippage and budget pressure across three oncology studies.',
    [locale]
  );

  async function loadDashboard() {
    const res = await fetch('/api/orchestration');
    const data = await res.json();
    if (!data?.ok) return;
    setBacklogCount(data.backlogCount ?? 0);
    setRoutedCount(data.routedCount ?? 0);
    setRecentBacklog(Array.isArray(data.recentBacklog) ? data.recentBacklog : []);
  }

  useEffect(() => {
    loadDashboard().catch(() => undefined);
  }, []);

  async function onSubmit() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/orchestration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, locale, requester })
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error ?? 'Routing failed.');
        return;
      }
      setRoute(data.route as RoutePayload);
      setBacklogCount(data.dashboard?.backlogCount ?? backlogCount);
      setRoutedCount(data.dashboard?.routedCount ?? routedCount);
      setRecentBacklog(Array.isArray(data.dashboard?.recentBacklog) ? data.dashboard.recentBacklog : recentBacklog);
    } catch {
      setError('Routing failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 08</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Route size={15} /> {t.input}
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm md:col-span-1">
            {t.requester}
            <input
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
              aria-label="requester"
            />
          </label>
          <label className="text-sm md:col-span-3">
            Query
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 h-24 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
              placeholder={placeholder}
              aria-label="natural language query"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || query.trim().length < 6}
          className="scanline mt-3 rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50"
        >
          {t.submit}
        </button>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="noise-border rounded-lg p-4 xl:col-span-2">
          <h2 className="mb-2 text-lg font-semibold">{t.workflow}</h2>
          {!route ? <p className="text-sm text-ink/65">Submit one request to generate orchestration workflow.</p> : null}
          {route ? (
            <div className="space-y-3">
              <div className={`rounded border p-3 text-sm ${route.backlog ? 'border-red-300 bg-red-50/60' : 'border-accent1/50 bg-accent1/10'}`}>
                <p className="font-medium">{route.backlog ? t.unmatched : t.matched}</p>
                <p className="mt-1">{route.initiative?.name ?? 'Backlog intake'}</p>
                <p className="mt-1 text-xs">
                  {t.confidence}: {(route.confidence * 100).toFixed(0)}%
                </p>
                <p className="mt-1 text-xs">
                  {t.rationale}: {route.rationale}
                </p>
                {route.keySignals.length ? (
                  <p className="mt-1 text-xs">
                    {t.signals}: {route.keySignals.join(', ')}
                  </p>
                ) : null}
              </div>

              {route.skillWorkflow.length > 0 ? (
                <ol className="space-y-3 border-l border-ink/20 pl-4">
                  {route.skillWorkflow.map((item) => (
                    <li key={item.step} className="relative rounded border border-ink/15 p-3">
                      <span className="absolute -left-[1.15rem] top-4 h-2 w-2 rounded-full bg-accent2" />
                      <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{item.step}</p>
                      <p className="mt-1 text-sm font-medium">{item.owner}</p>
                      <p className="mt-1 text-sm text-ink/80">{item.action}</p>
                      <p className="mt-1 text-xs text-ink/60">
                        <ArrowRight size={12} className="mr-1 inline" />
                        {item.output}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="noise-border rounded-lg p-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <ShieldAlert size={16} /> {t.backlog}
          </h2>
          <p className="text-sm text-ink/75">Routed: {routedCount}</p>
          <p className="mb-3 text-sm text-ink/75">Backlog: {backlogCount}</p>
          <div className="space-y-2 text-xs">
            {recentBacklog.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded border border-ink/15 p-2">
                <p className="line-clamp-2">{entry.query}</p>
                <p className="mt-1 text-ink/60">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {recentBacklog.length === 0 ? <p className="text-ink/60">No backlog entries yet.</p> : null}
          </div>
        </article>
      </section>

      {route?.initiative && route.skillPack ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <article className="noise-border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.schema}</h2>
            <div className="space-y-2 text-sm">
              {route.skillPack.inputSchema.map((field) => (
                <div key={field.name} className="rounded border border-ink/15 p-2">
                  <p className="font-medium">
                    {field.name} <span className="font-mono text-xs text-ink/60">({field.type})</span>
                  </p>
                  <p className="text-xs text-ink/70">{field.description}</p>
                  <p className="text-xs text-ink/60">required: {field.required ? 'yes' : 'no'}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="noise-border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.tools}</h2>
            <div className="space-y-2 text-sm">
              {route.skillPack.tools.map((tool) => (
                <div key={tool.name} className="rounded border border-ink/15 p-2">
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-xs text-ink/70">{tool.purpose}</p>
                  <p className="text-xs text-ink/60">mode: {tool.mode}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="noise-border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.gates}</h2>
            <div className="space-y-2 text-sm">
              {route.skillPack.approvalGates.map((gate) => (
                <div key={gate.gate} className="rounded border border-ink/15 p-2">
                  <p className="font-medium">{gate.gate}</p>
                  <p className="text-xs text-ink/70">owner: {gate.owner}</p>
                  <p className="text-xs text-ink/60">{gate.criteria}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="noise-border rounded-lg p-4">
            <h2 className="mb-2 text-lg font-semibold">{t.templates}</h2>
            <div className="space-y-3 text-sm">
              <div className="rounded border border-ink/15 p-2">
                <p className="font-medium">Email</p>
                <p className="text-xs text-ink/70">{route.skillPack.outputTemplates.email.subject}</p>
              </div>
              <div className="rounded border border-ink/15 p-2">
                <p className="font-medium">Report</p>
                <p className="text-xs text-ink/70">{route.skillPack.outputTemplates.report.sections.join(' · ')}</p>
              </div>
              <div className="rounded border border-ink/15 p-2">
                <p className="font-medium">Jira</p>
                <p className="text-xs text-ink/70">{route.skillPack.outputTemplates.jira.summaryTemplate}</p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Network size={16} /> {t.initiatives}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {initiatives.map((item) => (
            <article key={item.id} className="rounded border border-ink/15 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{item.id}</p>
              <h3 className="mt-1 font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-ink/75">{item.summary}</p>
              <p className="mt-2 text-xs text-ink/60">aliases: {item.aliases.join(' · ')}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
