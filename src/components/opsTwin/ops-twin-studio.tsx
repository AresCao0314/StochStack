'use client';

import { useEffect, useMemo, useState } from 'react';
import { AgentTimeline } from '@/components/opsTwin/agent-timeline';
import { OpsTwinScenarioForm } from '@/components/opsTwin/scenario-form';
import { OpsTwinDiffDrawer } from '@/components/opsTwin/diff-drawer';
import { OpsTwinContextPanel } from '@/components/opsTwin/context-panel';
import { OpsTwinSimulationPanel } from '@/components/opsTwin/simulation-panel';
import { runtimeSteps } from '@/lib/opsTwin/agentRuntime';
import { applyPatch, createInitialContext, exportContext, replayFromEventLog } from '@/lib/opsTwin/contextStore';
import { createRng, hashToSeed } from '@/lib/opsTwin/sim/seeded';
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

export function OpsTwinStudio() {
  const [input, setInput] = useState<ScenarioInput>(defaultInput);
  const [running, setRunning] = useState(false);
  const [context, setContext] = useState<ContextRoot | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AgentMessage | null>(null);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const historyOptions = useMemo(
    () => history.map((item) => ({ id: item.id, label: `${new Date(item.createdAt).toLocaleString()} · ${item.input.therapeuticArea} ${item.input.phase}` })),
    [history]
  );

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

      const requestMsg = mapMessage(
        {
          agent: 'CTM_Orchestrator',
          role: 'Ops Twin Orchestrator',
          text: `Step ${step.id}: ${step.request}`,
          handoffTo: step.target
        },
        [],
        i * 10
      );
      nextMessages = [...nextMessages, requestMsg];
      if (input.realtimeMessages) {
        setMessages([...nextMessages]);
        await wait(rng.int(300, 600));
      }

      const runResult = step.run(nextContext, rng);
      const eventIds: string[] = [];

      runResult.patches.forEach((patch) => {
        nextContext = applyPatch(nextContext, patch);
        const event = nextContext.eventLog[nextContext.eventLog.length - 1];
        if (event) eventIds.push(event.id);
      });

      runResult.messages.forEach((rawMessage, msgIdx) => {
        nextMessages = [...nextMessages, mapMessage(rawMessage, eventIds, i * 10 + msgIdx + 1)];
      });

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

    const historyItem: RunHistoryItem = {
      id: runId,
      createdAt: new Date().toISOString(),
      input,
      context: nextContext,
      messages: nextMessages
    };

    const nextHistory = [historyItem, ...history].slice(0, 5);
    setHistory(nextHistory);
    saveHistory(nextHistory);
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

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="section-title">ops digital twin</p>
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">Site Start-up + Recruitment Simulation Ops Twin</h1>
        <p className="max-w-3xl text-lg text-ink/70">A2A x MCP in Clinical Ops Digital Twin</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-3">
          <OpsTwinScenarioForm value={input} onChange={setInput} onRun={runSimulation} onReset={resetSimulation} running={running} />

          <section className="noise-border rounded-lg p-4">
            <p className="section-title">Run History</p>
            <div className="mt-2 space-y-2">
              <select
                className="w-full rounded border border-ink/20 bg-transparent px-2 py-2 text-sm"
                onChange={(e) => restoreRun(e.target.value)}
                value=""
                aria-label="Restore a previous run"
              >
                <option value="" disabled>
                  Restore previous run
                </option>
                {historyOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ink/65">Stored locally (max 5 runs). Each run keeps full context + event log.</p>
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <AgentTimeline messages={messages} onViewDiff={setSelectedMessage} />
        </div>

        <div className="space-y-4 xl:col-span-4">
          <OpsTwinContextPanel
            context={context}
            onExport={() => {
              if (context) exportContext(context);
            }}
            onReplay={handleReplay}
          />
        </div>
      </div>

      <OpsTwinSimulationPanel context={context} />

      <OpsTwinDiffDrawer
        open={Boolean(selectedMessage)}
        message={selectedMessage}
        context={context}
        onClose={() => setSelectedMessage(null)}
      />
    </div>
  );
}
