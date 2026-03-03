'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type Plan = {
  planId: 'A' | 'B';
  nodes: Record<string, any>;
  scoreBreakdown: { total: number; hardPass: boolean; byRole: Array<{ role: string; score: number; notes: string[] }> };
  conflicts: Array<{ severity: 'high' | 'medium' | 'low'; message: string }>;
  highlights: string[];
  invalid: boolean;
};

type ProjectPayload = {
  id: string;
  name: string;
  indication: string;
  phase: string;
  brief?: { fieldsJson: Record<string, unknown> } | null;
  graphs: Array<{ id: string; version: number; nodesJson: any; edgesJson: any; decisions: Array<{ key: string; selectedOptionId: string | null; contentJson: any }> }>;
  exports: Array<{ id: string; type: string; version: number; storageRef: string }>;
  logs: Array<{ id: string; action: string; actor: string; createdAt: string; payloadJson: any }>;
};

export function StudioClient({ locale, project, initialPlans }: { locale: string; project: ProjectPayload; initialPlans: Plan[] }) {
  const [tab, setTab] = useState('plans');
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [selectedPlan, setSelectedPlan] = useState<'A' | 'B'>('A');
  const [exports, setExports] = useState(project.exports ?? []);
  const [nodeDraft, setNodeDraft] = useState<Record<string, string>>(() => {
    const latest = project.graphs[0];
    const init: Record<string, string> = {};
    for (const decision of latest?.decisions ?? []) {
      init[decision.key] = JSON.stringify(decision.contentJson ?? {}, null, 2);
    }
    return init;
  });
  const [message, setMessage] = useState('');

  const activePlan = useMemo(() => plans.find((plan) => plan.planId === selectedPlan) ?? plans[0], [plans, selectedPlan]);

  async function runOrchestrator(mode: 'plan_generation' | 'update_after_edit' = 'plan_generation') {
    setMessage('Running orchestrator...');
    const res = await fetch(`/api/protocol-os/projects/${project.id}/orchestrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runMode: mode })
    });
    const payload = await res.json();
    if (!payload.ok) {
      setMessage(payload.error ?? 'Orchestration failed');
      return;
    }
    setPlans(payload.data.plans ?? []);
    setMessage('Plans refreshed.');
  }

  async function acceptPlan(planId: 'A' | 'B') {
    setMessage(`Accepting plan ${planId}...`);
    const res = await fetch(`/api/protocol-os/projects/${project.id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    const payload = await res.json();
    setMessage(payload.ok ? `Plan ${planId} accepted. New graph version created.` : payload.error ?? 'Accept failed');
  }

  async function exportAll() {
    setMessage('Compiling artifacts...');
    const res = await fetch(`/api/protocol-os/projects/${project.id}/compile`, { method: 'POST' });
    const payload = await res.json();
    if (!payload.ok) {
      setMessage(payload.error ?? 'Export failed');
      return;
    }
    const files = payload.data.files;
    setExports([
      { id: 'new-protocol', type: 'protocol_html', version: payload.data.graphVersion, storageRef: files.protocolHtml },
      { id: 'new-soa', type: 'soa_csv', version: payload.data.graphVersion, storageRef: files.soaCsv },
      { id: 'new-trace', type: 'traceability_json', version: payload.data.graphVersion, storageRef: files.traceabilityJson },
      ...exports
    ]);
    setMessage('Export completed.');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>{project.name} · Protocol Studio</CardTitle>
        <CardDescription>
          Decision-centric workflow: generate A/B designs, score with policies, accept a plan, then compile protocol artifacts.
        </CardDescription>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="trace">Trace</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runOrchestrator('plan_generation')}>Generate A/B Plans</Button>
            <Button variant="outline" onClick={() => runOrchestrator('update_after_edit')}>Re-run Impact</Button>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.planId} className={plan.planId === selectedPlan ? 'border-accent1/60' : ''}>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>Plan {plan.planId}</CardTitle>
                  <Badge className={plan.invalid ? 'border-red-400 bg-red-100 text-red-700' : 'border-emerald-400 bg-emerald-100 text-emerald-700'}>
                    {plan.invalid ? 'Hard Fail' : 'Eligible'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">Score: <strong>{plan.scoreBreakdown.total}</strong></p>
                <ul className="mt-2 space-y-1 text-xs text-ink/70">
                  {plan.scoreBreakdown.byRole.map((role) => (
                    <li key={role.role}>{role.role}: {role.score}</li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1">
                  {plan.conflicts.map((conflict, idx) => (
                    <p key={idx} className={`rounded px-2 py-1 text-xs ${conflict.severity === 'high' ? 'bg-red-100 text-red-700' : conflict.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-ink/5 text-ink/70'}`}>
                      {conflict.message}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedPlan(plan.planId)}>Compare</Button>
                  <Button onClick={() => acceptPlan(plan.planId)}>Accept Plan {plan.planId}</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-3">
          <Card>
            <CardTitle>Design Graph</CardTitle>
            <CardDescription>Single source of truth: versioned graph state, not chat transcript.</CardDescription>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {(project.graphs[0]?.decisions ?? []).map((node) => (
                <div key={node.key} className="rounded border border-ink/15 bg-white/70 p-3">
                  <p className="text-sm font-medium">{node.key}</p>
                  <p className="text-xs text-ink/60">selectedOptionId: {node.selectedOptionId ?? 'n/a'}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded border border-ink/15 bg-white/70 p-3 text-xs">
              <p className="font-medium">Dependencies</p>
              <p>endpoint.primary → soa.v0</p>
              <p>eligibility.core → assumptions.ledger</p>
              <p>eligibility.core → soa.v0</p>
              <p>assumptions.ledger → endpoint.primary</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="nodes" className="mt-3">
          <Card className="space-y-3">
            <CardTitle>Node Editor (Customize)</CardTitle>
            {['endpoint.primary', 'eligibility.core', 'assumptions.ledger', 'soa.v0'].map((key) => (
              <div key={key}>
                <p className="mb-1 text-xs uppercase tracking-[0.12em] text-ink/60">{key}</p>
                <Textarea rows={8} value={nodeDraft[key] ?? ''} onChange={(e) => setNodeDraft((s) => ({ ...s, [key]: e.target.value }))} />
              </div>
            ))}
            <Button variant="outline" onClick={() => runOrchestrator('update_after_edit')}>Re-run Impact</Button>
          </Card>
        </TabsContent>

        <TabsContent value="trace" className="mt-3">
          <Card>
            <CardTitle>Traceability</CardTitle>
            <CardDescription>Why this node was selected, which evidence was cited, and policy impact.</CardDescription>
            {activePlan ? (
              <div className="mt-3 space-y-3">
                {Object.values(activePlan.nodes).map((node: any) => (
                  <div key={node.nodeKey} className="rounded border border-ink/15 bg-white/70 p-3">
                    <p className="text-sm font-medium">{node.nodeKey} · {node.optionLabel}</p>
                    <p className="mt-1 text-xs text-ink/70">{node.rationale}</p>
                    <p className="mt-1 text-xs">Confidence: {node.confidence}</p>
                    <p className="mt-1 text-xs">Open questions: {node.openQuestions?.join(' | ') || 'none'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink/60">Run orchestrator to populate traceability.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-3 space-y-3">
          <Card>
            <CardTitle>Compiler</CardTitle>
            <CardDescription>Export Protocol HTML + SoA CSV + Traceability JSON from selected graph version.</CardDescription>
            <div className="mt-3"><Button onClick={exportAll}>Export All Artifacts</Button></div>
          </Card>

          <Card>
            <CardTitle>Export Artifacts</CardTitle>
            <div className="mt-3 space-y-2">
              {exports.map((artifact) => (
                <div key={`${artifact.id}-${artifact.storageRef}`} className="flex items-center justify-between rounded border border-ink/15 bg-white/70 p-2">
                  <p className="text-sm">{artifact.type} · v{artifact.version}</p>
                  <a href={artifact.storageRef} className="text-xs text-blue-700 underline" target="_blank" rel="noreferrer">Download</a>
                </div>
              ))}
              {!exports.length ? <p className="text-sm text-ink/60">No exports yet.</p> : null}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {message ? <p className="text-sm text-ink/70">{message}</p> : null}
    </div>
  );
}
