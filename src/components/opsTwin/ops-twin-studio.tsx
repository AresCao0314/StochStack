'use client';

import { useEffect, useMemo, useState } from 'react';
import { AgentTimeline } from '@/components/opsTwin/agent-timeline';
import { OpsTwinScenarioForm } from '@/components/opsTwin/scenario-form';
import { OpsTwinDiffDrawer } from '@/components/opsTwin/diff-drawer';
import { OpsTwinContextPanel } from '@/components/opsTwin/context-panel';
import { OpsTwinSimulationPanel } from '@/components/opsTwin/simulation-panel';
import { McpStatusPanel } from '@/components/opsTwin/mcp-status-panel';
import { OpsGuidePanel } from '@/components/opsTwin/ops-guide-panel';
import { OpsTopologyPanel } from '@/components/opsTwin/ops-topology-panel';
import { Server, ExternalLink } from 'lucide-react';
import { runtimeSteps } from '@/lib/opsTwin/agentRuntime';
import { applyPatch, createInitialContext, exportContext, replayFromEventLog } from '@/lib/opsTwin/contextStore';
import { buildCalibrationPatches } from '@/lib/opsTwin/sim/calibration';
import { createRng, hashToSeed } from '@/lib/opsTwin/sim/seeded';
import { findAgentRecord } from '@/lib/a2a/registry';
import { routeAgentExecution } from '@/lib/a2a/router';
import type { Locale } from '@/lib/i18n';
import type { AgentMessage, ContextRoot, RunHistoryItem, ScenarioInput } from '@/lib/opsTwin/types';

const HISTORY_KEY = 'opsTwinRunsV1';

const defaultInput: ScenarioInput = {
  therapeuticArea: 'Oncology',
  phase: 'II',
  countries: ['Germany', 'France', 'US'],
  targetSampleSize: 240,
  durationMonths: 16,
  assumptions: {
    avg_startup_days: 75,
    screen_fail_rate: 0.35,
    dropout_rate: 0.18,
    competition_index: 0.5,
    patient_pool_index: 0.6
  },
  realtimeMessages: true,
  deterministicSeed: true
};

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function mapMessage(
  message: Omit<AgentMessage, 'id' | 'timestamp' | 'eventIds'>,
  eventIds: string[],
  index: number
): AgentMessage {
  return {
    ...message,
    id: `msg-${Date.now()}-${index}`,
    timestamp: new Date().toISOString(),
    eventIds
  };
}

function loadHistory(): RunHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RunHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: RunHistoryItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 5)));
}

const studioCopy: Record<
  Locale,
  {
    tag: string;
    title: string;
    subtitle: string;
    mcpPlayground: string;
    a2aRuntime: string;
    remoteExecution: string;
    llmReasoning: string;
    remoteHint: string;
    llmHint: string;
    runHistory: string;
    restorePlaceholder: string;
    historyHint: string;
  }
> = {
  en: {
    tag: 'ops digital twin',
    title: 'Site Start-up + Recruitment Simulation Ops Twin',
    subtitle: 'A2A x MCP in Clinical Ops Digital Twin',
    mcpPlayground: 'MCP Server Playground',
    a2aRuntime: 'A2A Runtime',
    remoteExecution: 'Remote agent execution',
    llmReasoning: 'LLM-native reasoning',
    remoteHint:
      'When enabled, non-orchestrator agents are routed through `/api/a2a/inbox` and shown as remote transport in thread logs.',
    llmHint: 'When enabled, remote agents append model-based rationale (Qwen if configured; otherwise deterministic fallback).',
    runHistory: 'Run History',
    restorePlaceholder: 'Restore previous run',
    historyHint: 'Stored locally (max 5 runs). Each run keeps full context + event log.'
  },
  zh: {
    tag: 'ops 数字孪生',
    title: 'Site 启动 + 招募仿真 Ops Twin',
    subtitle: '临床运营数字孪生中的 A2A x MCP',
    mcpPlayground: 'MCP 服务器演示台',
    a2aRuntime: 'A2A 运行层',
    remoteExecution: '远程 Agent 执行',
    llmReasoning: 'LLM-native 推理',
    remoteHint: '开启后，非 orchestrator 的 agent 会通过 `/api/a2a/inbox` 远程路由，并在线程中显示 remote 传输信息。',
    llmHint: '开启后，远程 agent 会追加模型推理说明（已配置通义千问时调用，否则使用确定性兜底）。',
    runHistory: '运行历史',
    restorePlaceholder: '恢复历史运行',
    historyHint: '本地最多保留 5 条历史，每条都包含完整 context 与 event log。'
  },
  de: {
    tag: 'ops digital twin',
    title: 'Site Start-up + Recruitment Simulation Ops Twin',
    subtitle: 'A2A x MCP im Clinical Ops Digital Twin',
    mcpPlayground: 'MCP Server Playground',
    a2aRuntime: 'A2A Runtime',
    remoteExecution: 'Remote-Agent-Ausführung',
    llmReasoning: 'LLM-native Reasoning',
    remoteHint:
      'Wenn aktiviert, werden Nicht-Orchestrator-Agenten über `/api/a2a/inbox` geroutet und im Thread als Remote-Transport markiert.',
    llmHint: 'Wenn aktiviert, ergänzen Remote-Agenten modellbasierte Begründungen (Qwen bei Konfiguration, sonst deterministischer Fallback).',
    runHistory: 'Run-Historie',
    restorePlaceholder: 'Früheren Lauf laden',
    historyHint: 'Lokal gespeichert (max. 5 Läufe). Jeder Lauf enthält vollständigen Context und Event-Log.'
  }
};

export function OpsTwinStudio({ locale }: { locale: Locale }) {
  const copy = studioCopy[locale];
  const [input, setInput] = useState<ScenarioInput>(defaultInput);
  const [running, setRunning] = useState(false);
  const [context, setContext] = useState<ContextRoot | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AgentMessage | null>(null);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [a2aRemoteMode, setA2aRemoteMode] = useState(true);
  const [llmReasoningMode, setLlmReasoningMode] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const historyOptions = useMemo(
    () => history.map((item) => ({ id: item.id, label: `${new Date(item.createdAt).toLocaleString()} · ${item.input.therapeuticArea} ${item.input.phase}` })),
    [history]
  );

  function upsertRunHistory(runId: string, snapshotContext: ContextRoot, snapshotMessages: AgentMessage[], snapshotInput: ScenarioInput) {
    setHistory((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === runId);
      const nextItem: RunHistoryItem = {
        id: runId,
        createdAt: targetIndex >= 0 ? prev[targetIndex].createdAt : new Date().toISOString(),
        input: snapshotInput,
        context: snapshotContext,
        messages: snapshotMessages
      };

      const nextHistory =
        targetIndex >= 0
          ? prev.map((item, idx) => (idx === targetIndex ? nextItem : item))
          : [nextItem, ...prev];

      const trimmed = nextHistory.slice(0, 5);
      saveHistory(trimmed);
      return trimmed;
    });
  }

  async function runSimulation() {
    setRunning(true);
    setSelectedMessage(null);

    const runId = `run-${Date.now()}`;
    const seedSource = JSON.stringify({
      therapeuticArea: input.therapeuticArea,
      phase: input.phase,
      countries: input.countries,
      targetSampleSize: input.targetSampleSize,
      durationMonths: input.durationMonths,
      assumptions: input.assumptions
    });
    const seed = input.deterministicSeed ? hashToSeed(seedSource) : Math.floor(Math.random() * 1_000_000_000);
    const rng = createRng(seed);

    let nextContext = createInitialContext(input, runId, seed);
    let nextMessages: AgentMessage[] = [];

    if (input.realtimeMessages) {
      setContext(nextContext);
      setMessages([]);
    }

    for (let i = 0; i < runtimeSteps.length; i += 1) {
      const step = runtimeSteps[i];
      const stepRecord = findAgentRecord(step.target);
      const stepRemote = Boolean(
        a2aRemoteMode && stepRecord && stepRecord.active && stepRecord.mode === 'remote'
      );

      const requestMsg = mapMessage(
        {
          agent: 'CTM_Orchestrator',
          role: 'Ops Twin Orchestrator',
          text: `Step ${step.id}: ${step.request}`,
          handoffTo: step.target,
          transport: stepRemote ? 'remote' : 'local',
          remoteEndpoint: stepRemote ? stepRecord?.baseUrl : undefined,
          deliveryStatus: 'ok'
        },
        [],
        i * 10
      );
      nextMessages = [...nextMessages, requestMsg];
      if (input.realtimeMessages) {
        setMessages([...nextMessages]);
        await wait(rng.int(300, 600));
      }

      const routed = await routeAgentExecution({
        target: step.target,
        context: nextContext,
        baseSeed: seed,
        stepId: step.id,
        runRemote: a2aRemoteMode,
        llmReasoning: llmReasoningMode
      });

      const runResult = routed.result;
      const eventIds: string[] = [];

      runResult.patches.forEach((patch) => {
        nextContext = applyPatch(nextContext, patch);
        const event = nextContext.eventLog[nextContext.eventLog.length - 1];
        if (event) eventIds.push(event.id);
      });

      runResult.messages.forEach((rawMessage, msgIdx) => {
        nextMessages = [
          ...nextMessages,
          mapMessage(
            {
              ...rawMessage,
              transport: routed.transport,
              latencyMs: routed.latencyMs,
              remoteEndpoint: routed.endpoint,
              deliveryStatus: routed.deliveryStatus,
              retryCount: routed.retryCount
            },
            eventIds,
            i * 10 + msgIdx + 1
          )
        ];
      });

      if (routed.deliveryStatus !== 'ok') {
        nextMessages = [
          ...nextMessages,
          mapMessage(
            {
              agent: 'CTM_Orchestrator',
              role: 'Transport Supervisor',
              text: `A2A remote delivery degraded for ${step.target}. Fallback to local execution applied.`,
              transport: 'local',
              deliveryStatus: routed.deliveryStatus
            },
            [],
            i * 10 + 9
          )
        ];
      }

      if (input.realtimeMessages) {
        setContext(nextContext);
        setMessages([...nextMessages]);
        await wait(rng.int(300, 600));
      }
    }

    if (!input.realtimeMessages) {
      setContext(nextContext);
      setMessages(nextMessages);
    }

    upsertRunHistory(runId, nextContext, nextMessages, input);
    setRunning(false);
  }

  function resetSimulation() {
    setInput(defaultInput);
    setRunning(false);
    setMessages([]);
    setContext(null);
    setSelectedMessage(null);
  }

  function restoreRun(runId: string) {
    const target = history.find((item) => item.id === runId);
    if (!target) return;
    setInput(target.input);
    setContext(target.context);
    setMessages(target.messages);
    setSelectedMessage(null);
  }

  function handleReplay() {
    if (!context) return;
    setContext(replayFromEventLog(context));
  }

  function handleTrackActual(inputData: {
    month: number;
    actualCumulativeEnrollment: number;
    startupAvgDaysObserved?: number;
  }) {
    if (!context || running) return;

    const { patches, diagnostics } = buildCalibrationPatches({
      context,
      month: inputData.month,
      actualCumulativeEnrollment: inputData.actualCumulativeEnrollment,
      startupAvgDaysObserved: inputData.startupAvgDaysObserved
    });

    let nextContext = context;
    const eventIds: string[] = [];

    patches.forEach((patch) => {
      nextContext = applyPatch(nextContext, patch);
      const event = nextContext.eventLog[nextContext.eventLog.length - 1];
      if (event) eventIds.push(event.id);
    });

    const calibrationMessage = mapMessage(
      {
        agent: 'CTM_Orchestrator',
        role: 'Calibration Controller',
        text: `Calibration updated with month ${inputData.month} actuals. Confidence now ${Math.round(
          diagnostics.confidenceScore * 100
        )}%; assumptions auto-tuned.`,
        attachments: [
          {
            type: 'Assumption',
            data: diagnostics.parameterShift
          }
        ]
      },
      eventIds,
      messages.length + 1
    );

    const nextMessages = [...messages, calibrationMessage];
    setContext(nextContext);
    setMessages(nextMessages);
    upsertRunHistory(nextContext.meta.runId, nextContext, nextMessages, input);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="section-title">{copy.tag}</p>
          <span className="text-ink/30">|</span>
          <a 
            href={`/${locale}/ops-twin/mcp-demo`} 
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            <Server className="h-3.5 w-3.5" />
            {copy.mcpPlayground}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">{copy.title}</h1>
        <p className="max-w-3xl text-lg text-ink/70">{copy.subtitle}</p>
      </header>

      <OpsGuidePanel locale={locale} />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-3">
          <OpsTwinScenarioForm value={input} onChange={setInput} onRun={runSimulation} onReset={resetSimulation} running={running} />

          <section className="noise-border rounded-lg p-4">
            <p className="section-title">{copy.a2aRuntime}</p>
            <label className="mt-2 flex items-center justify-between rounded border border-ink/15 px-2 py-2 text-sm">
              <span>{copy.remoteExecution}</span>
              <input
                type="checkbox"
                checked={a2aRemoteMode}
                onChange={(e) => setA2aRemoteMode(e.target.checked)}
                aria-label="Toggle remote A2A execution mode"
              />
            </label>
            <p className="mt-2 text-xs text-ink/65">{copy.remoteHint}</p>
            <label className="mt-3 flex items-center justify-between rounded border border-ink/15 px-2 py-2 text-sm">
              <span>{copy.llmReasoning}</span>
              <input
                type="checkbox"
                checked={llmReasoningMode}
                onChange={(e) => setLlmReasoningMode(e.target.checked)}
                aria-label="Toggle LLM-native reasoning mode"
              />
            </label>
            <p className="mt-2 text-xs text-ink/65">{copy.llmHint}</p>
          </section>

          <section className="noise-border rounded-lg p-4">
            <p className="section-title">{copy.runHistory}</p>
            <div className="mt-2 space-y-2">
              <select
                className="w-full rounded border border-ink/20 bg-transparent px-2 py-2 text-sm"
                onChange={(e) => restoreRun(e.target.value)}
                value=""
                aria-label="Restore a previous run"
              >
                <option value="" disabled>
                  {copy.restorePlaceholder}
                </option>
                {historyOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink/65">{copy.historyHint}</p>
            </div>
          </section>

          <McpStatusPanel locale={locale} />
        </div>

        <div className="space-y-4 xl:col-span-5">
          <AgentTimeline messages={messages} onViewDiff={setSelectedMessage} />
        </div>

        <div className="space-y-4 xl:col-span-4">
          <OpsTopologyPanel locale={locale} messages={messages} />
          <OpsTwinContextPanel
            context={context}
            onExport={() => {
              if (context) exportContext(context);
            }}
            onReplay={handleReplay}
          />
        </div>
      </div>

      <OpsTwinSimulationPanel context={context} onTrackActual={handleTrackActual} />

      <OpsTwinDiffDrawer
        open={Boolean(selectedMessage)}
        message={selectedMessage}
        context={context}
        onClose={() => setSelectedMessage(null)}
      />
    </div>
  );
}
