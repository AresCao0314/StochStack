'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Impact = 'Low' | 'Med' | 'High';

type PlanNode = {
  nodeKey: 'endpoint.primary' | 'eligibility.core' | 'assumptions.ledger' | 'soa.v0';
  optionId: string;
  optionLabel: string;
  rationale: string;
  citations: Array<{ snippet: string; quote: string }>;
  impacts: {
    recruitment: Impact;
    sampleSize: Impact;
    timeline: Impact;
    burden: Impact;
    regulatory: Impact;
  };
  content: Record<string, unknown>;
};

type Plan = {
  id: 'A' | 'B';
  label: string;
  score: number;
  hardPass: boolean;
  policyNotes: string[];
  conflicts: Array<{ severity: 'high' | 'medium' | 'low'; message: string }>;
  nodes: PlanNode[];
};

function buildPlans(brief: { objective: string; constraints: string }, evidence: string[]): Plan[] {
  const hasEvidence = evidence.length > 0;

  const baseA: Plan = {
    id: 'A',
    label: 'Plan A · Conservative',
    score: hasEvidence ? 84 : 71,
    hardPass: true,
    policyNotes: [
      'Medical: endpoint clinical meaning is explicit',
      'Stats: power assumption >= 0.8',
      hasEvidence ? 'Reg: precedent evidence linked' : 'Reg: missing external citation penalty'
    ],
    conflicts: [
      { severity: 'low', message: 'Visit burden is moderate; monitor site variability.' }
    ],
    nodes: [
      {
        nodeKey: 'endpoint.primary',
        optionId: 'A-endpoint',
        optionLabel: 'PFS at Week 48',
        rationale: 'Balances interpretability and regulator familiarity for phase II go/no-go.',
        citations: hasEvidence ? [{ snippet: evidence[0], quote: evidence[0].slice(0, 90) }] : [],
        impacts: { recruitment: 'Med', sampleSize: 'Low', timeline: 'Med', burden: 'Med', regulatory: 'Low' },
        content: { endpoint: 'PFS', timepointWeek: 48, estimand: 'treatment-policy' }
      },
      {
        nodeKey: 'eligibility.core',
        optionId: 'A-eligibility',
        optionLabel: 'Balanced Eligibility',
        rationale: 'Preserves internal validity while keeping recruitment feasible.',
        citations: [],
        impacts: { recruitment: 'Med', sampleSize: 'Low', timeline: 'Med', burden: 'Low', regulatory: 'Low' },
        content: { inclusion: ['ECOG 0-1', 'Histology confirmed'], exclusion: ['Active CNS disease'] }
      },
      {
        nodeKey: 'assumptions.ledger',
        optionId: 'A-assumptions',
        optionLabel: 'Conservative Stats',
        rationale: 'Uses cautious effect size and event-rate assumptions.',
        citations: [],
        impacts: { recruitment: 'Low', sampleSize: 'Med', timeline: 'Med', burden: 'Low', regulatory: 'Low' },
        content: { effectSize: 0.22, eventRate: 0.45, dropout: 0.12, power: 0.82 }
      },
      {
        nodeKey: 'soa.v0',
        optionId: 'A-soa',
        optionLabel: 'Standard SoA',
        rationale: 'Minimizes operational burden while covering endpoint windows.',
        citations: [],
        impacts: { recruitment: 'Low', sampleSize: 'Low', timeline: 'Med', burden: 'Med', regulatory: 'Low' },
        content: {
          visits: [
            { visit: 'Screening', week: -2, procedures: ['Consent', 'Labs'] },
            { visit: 'Week 12', week: 12, procedures: ['Tumor Imaging', 'Safety labs'] },
            { visit: 'Week 24', week: 24, procedures: ['Tumor Imaging', 'QoL'] },
            { visit: 'Week 48', week: 48, procedures: ['Primary endpoint assessment'] }
          ]
        }
      }
    ]
  };

  const baseB: Plan = {
    id: 'B',
    label: 'Plan B · Aggressive',
    score: hasEvidence ? 68 : 55,
    hardPass: false,
    policyNotes: [
      'Medical: surrogate endpoint needs stronger clinical interpretability',
      'Stats: optimistic assumptions increase risk',
      'ClinOps: visit burden high'
    ],
    conflicts: [
      { severity: 'high', message: 'Hard fail: surrogate endpoint lacks sufficient precedent.' },
      { severity: 'medium', message: 'SoA burden likely to reduce site compliance.' }
    ],
    nodes: [
      {
        nodeKey: 'endpoint.primary',
        optionId: 'B-endpoint',
        optionLabel: 'Biomarker Response at Week 16',
        rationale: 'Faster readout but lower regulatory certainty.',
        citations: hasEvidence ? [{ snippet: evidence[0], quote: evidence[0].slice(0, 70) }] : [],
        impacts: { recruitment: 'Low', sampleSize: 'Low', timeline: 'Low', burden: 'Med', regulatory: 'High' },
        content: { endpoint: 'Biomarker response', timepointWeek: 16, estimand: 'hypothetical' }
      },
      {
        nodeKey: 'eligibility.core',
        optionId: 'B-eligibility',
        optionLabel: 'Broad Eligibility',
        rationale: 'Boosts speed but may introduce heterogeneity.',
        citations: [],
        impacts: { recruitment: 'Low', sampleSize: 'High', timeline: 'Low', burden: 'Low', regulatory: 'Med' },
        content: { inclusion: ['ECOG 0-2'], exclusion: ['Organ failure only'] }
      },
      {
        nodeKey: 'assumptions.ledger',
        optionId: 'B-assumptions',
        optionLabel: 'Optimistic Stats',
        rationale: 'Higher effect-size assumptions to reduce sample size.',
        citations: [],
        impacts: { recruitment: 'Low', sampleSize: 'Low', timeline: 'Low', burden: 'Low', regulatory: 'Med' },
        content: { effectSize: 0.35, eventRate: 0.55, dropout: 0.18, power: 0.8 }
      },
      {
        nodeKey: 'soa.v0',
        optionId: 'B-soa',
        optionLabel: 'Dense SoA',
        rationale: 'More frequent assessments for early signal capture.',
        citations: [],
        impacts: { recruitment: 'High', sampleSize: 'Low', timeline: 'Low', burden: 'High', regulatory: 'Med' },
        content: {
          visits: [
            { visit: 'Screening', week: -1, procedures: ['Consent', 'Labs', 'Imaging'] },
            { visit: 'Week 4', week: 4, procedures: ['Labs', 'Biomarker panel'] },
            { visit: 'Week 8', week: 8, procedures: ['Imaging', 'QoL'] },
            { visit: 'Week 12', week: 12, procedures: ['Imaging', 'Safety panel'] },
            { visit: 'Week 16', week: 16, procedures: ['Primary endpoint assessment'] }
          ]
        }
      }
    ]
  };

  if (brief.constraints.toLowerCase().includes('low burden')) {
    baseA.score += 3;
    baseB.score -= 4;
    baseB.conflicts.push({ severity: 'medium', message: 'Constraint mismatch: requested low burden, plan is high burden.' });
  }

  return [baseA, baseB];
}

function makeHtml(selected: PlanNode[]) {
  const map = Object.fromEntries(selected.map((item) => [item.nodeKey, item]));
  return `<!doctype html><html><head><meta charset="utf-8"><title>Protocol OS Lite Draft</title></head><body>
<h1>Protocol OS Lite Draft</h1>
<h2>Primary Endpoint</h2><pre>${JSON.stringify(map['endpoint.primary']?.content ?? {}, null, 2)}</pre>
<h2>Eligibility</h2><pre>${JSON.stringify(map['eligibility.core']?.content ?? {}, null, 2)}</pre>
<h2>Assumptions</h2><pre>${JSON.stringify(map['assumptions.ledger']?.content ?? {}, null, 2)}</pre>
<h2>SoA</h2><pre>${JSON.stringify(map['soa.v0']?.content ?? {}, null, 2)}</pre>
</body></html>`;
}

function makeSoaCsv(selected: PlanNode[]) {
  const soa = selected.find((item) => item.nodeKey === 'soa.v0');
  const visits = ((soa?.content?.visits as Array<{ visit: string; week: number; procedures: string[] }>) ?? []);
  const rows = ['visit,week,procedures'];
  for (const item of visits) {
    rows.push(`${item.visit},${item.week},"${item.procedures.join('; ')}"`);
  }
  return rows.join('\n');
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ProtocolOsLitePage({ locale }: { locale: string }) {
  const [brief, setBrief] = useState({
    objective: 'Select a regulator-friendly endpoint with manageable operational burden.',
    constraints: 'Need fast recruitment; prefer low burden',
    success: 'Policy score >= 75 with no hard fail'
  });
  const [snippetInput, setSnippetInput] = useState('Guideline precedent: PFS at week 48 is acceptable in this indication.');
  const [evidence, setEvidence] = useState<string[]>([
    'Guideline precedent: PFS at week 48 is acceptable in this indication.'
  ]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<'A' | 'B' | null>(null);
  const [graphVersion, setGraphVersion] = useState(1);
  const [status, setStatus] = useState('Ready. This Lite version uses fully mocked data and fake orchestration.');

  const selectedPlan = useMemo(() => plans.find((item) => item.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  function generatePlans() {
    const generated = buildPlans(brief, evidence);
    setPlans(generated);
    setSelectedPlanId(null);
    setStatus('A/B plans generated via FakeLLM + mock policy evaluator.');
  }

  function acceptPlan(id: 'A' | 'B') {
    setSelectedPlanId(id);
    setGraphVersion((prev) => prev + 1);
    setStatus(`Plan ${id} accepted. Graph version bumped to v${graphVersion + 1}.`);
  }

  function exportAll() {
    if (!selectedPlan) {
      setStatus('Select and accept a plan before export.');
      return;
    }

    const traceability = {
      mode: 'protocol-os-lite-mock',
      locale,
      graphVersion,
      selectedPlan: selectedPlan.id,
      score: selectedPlan.score,
      hardPass: selectedPlan.hardPass,
      policyNotes: selectedPlan.policyNotes,
      conflicts: selectedPlan.conflicts,
      nodes: selectedPlan.nodes
    };

    download(makeHtml(selectedPlan.nodes), `protocol-os-lite-v${graphVersion}.html`, 'text/html;charset=utf-8');
    download(makeSoaCsv(selectedPlan.nodes), `protocol-os-lite-soa-v${graphVersion}.csv`, 'text/csv;charset=utf-8');
    download(JSON.stringify(traceability, null, 2), `protocol-os-lite-trace-v${graphVersion}.json`, 'application/json;charset=utf-8');
    setStatus('Export done: HTML + CSV + Traceability JSON downloaded.');
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle>Protocol OS Lite (One-Page Mock Flow)</CardTitle>
        <CardDescription>
          Fully frontend mock version for reliable demos. No backend database required.
        </CardDescription>
      </Card>

      <Card className="space-y-3">
        <CardTitle>1) Brief</CardTitle>
        <Textarea rows={3} value={brief.objective} onChange={(e) => setBrief((s) => ({ ...s, objective: e.target.value }))} />
        <Textarea rows={3} value={brief.constraints} onChange={(e) => setBrief((s) => ({ ...s, constraints: e.target.value }))} />
        <Input value={brief.success} onChange={(e) => setBrief((s) => ({ ...s, success: e.target.value }))} />
      </Card>

      <Card className="space-y-3">
        <CardTitle>2) Evidence Snippets</CardTitle>
        <div className="flex gap-2">
          <Input value={snippetInput} onChange={(e) => setSnippetInput(e.target.value)} placeholder="Paste evidence snippet" />
          <Button
            onClick={() => {
              if (!snippetInput.trim()) return;
              setEvidence((prev) => [snippetInput.trim(), ...prev]);
              setSnippetInput('');
            }}
          >
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {evidence.map((item, idx) => (
            <div key={`${item}-${idx}`} className="rounded border border-ink/15 bg-white/70 px-3 py-2 text-sm">
              {item}
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>3) Orchestrator → Plan A/B</CardTitle>
          <Button onClick={generatePlans}>Generate A/B</Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded border border-ink/15 bg-white/80 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{plan.label}</p>
                <Badge className={plan.hardPass ? 'border-emerald-500/40 bg-emerald-100 text-emerald-800' : 'border-red-500/40 bg-red-100 text-red-800'}>
                  {plan.hardPass ? 'valid' : 'hard fail'}
                </Badge>
              </div>
              <p className="mt-2 text-sm">Policy score: <strong>{plan.score}</strong></p>
              <ul className="mt-2 space-y-1 text-xs text-ink/70">
                {plan.policyNotes.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
              <div className="mt-2 space-y-1">
                {plan.conflicts.map((conflict, idx) => (
                  <p
                    key={`${conflict.message}-${idx}`}
                    className={`rounded px-2 py-1 text-xs ${
                      conflict.severity === 'high' ? 'bg-red-100 text-red-700' : conflict.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-ink/5 text-ink/70'
                    }`}
                  >
                    {conflict.message}
                  </p>
                ))}
              </div>
              <div className="mt-3">
                <Button variant={selectedPlanId === plan.id ? 'default' : 'outline'} onClick={() => acceptPlan(plan.id)}>
                  Accept {plan.id}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle>4) Traceability Snapshot</CardTitle>
        {selectedPlan ? (
          <div className="space-y-2">
            {selectedPlan.nodes.map((node) => (
              <div key={node.nodeKey} className="rounded border border-ink/15 bg-white/75 p-3">
                <p className="text-sm font-semibold">{node.nodeKey} · {node.optionLabel}</p>
                <p className="mt-1 text-xs text-ink/70">{node.rationale}</p>
                <p className="mt-1 text-xs">Impacts: R {node.impacts.recruitment} · S {node.impacts.sampleSize} · T {node.impacts.timeline} · B {node.impacts.burden} · Reg {node.impacts.regulatory}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/70">Accept Plan A or B to view decision trace.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>5) Export</CardTitle>
          <Button onClick={exportAll}>Export HTML + CSV + JSON</Button>
        </div>
        <p className="text-xs text-ink/60">Current graph version: v{graphVersion}</p>
      </Card>

      <Card>
        <p className="text-sm text-ink/75">{status}</p>
      </Card>
    </div>
  );
}
