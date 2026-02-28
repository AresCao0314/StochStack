import { NextResponse } from 'next/server';
import initiatives from '@/content/agent-orchestration/initiatives.json';
import { appendIntake, getIntakeDashboard, type IntakeEntry } from '@/lib/server/orchestration-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Locale = 'en' | 'zh' | 'de';

type RouteRequest = {
  query?: string;
  locale?: Locale;
  requester?: string;
};

type Initiative = (typeof initiatives)[number];

type SkillStep = {
  step: string;
  owner: string;
  action: string;
  output: string;
};

type RouteResult = {
  initiativeId: string | null;
  confidence: number;
  rationale: string;
  keySignals: string[];
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function keywordRoute(query: string): RouteResult {
  const q = normalize(query);
  const scores = initiatives.map((item) => {
    let score = 0;
    for (const k of item.keywords) {
      if (q.includes(k.toLowerCase())) score += 2;
    }
    for (const a of item.aliases) {
      const s = a.toLowerCase();
      if (q.includes(s)) score += 3;
      if (s.includes(q) && q.length >= 8) score += 1;
    }
    if (q.includes(item.name.toLowerCase())) score += 4;
    return { item, score };
  });

  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const second = sorted[1];
  if (!top || top.score <= 0) {
    return {
      initiativeId: null,
      confidence: 0.22,
      rationale: 'No initiative reached minimum lexical match threshold.',
      keySignals: []
    };
  }

  const gap = top.score - (second?.score ?? 0);
  const confidence = clamp(0.38 + top.score * 0.08 + gap * 0.06, 0.25, 0.93);
  return {
    initiativeId: top.item.id,
    confidence: Number(confidence.toFixed(2)),
    rationale: `Matched by initiative keywords and aliases with score ${top.score}.`,
    keySignals: top.item.keywords.filter((k) => q.includes(k.toLowerCase())).slice(0, 5)
  };
}

async function llmRoute(query: string): Promise<RouteResult | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  const model = process.env.QWEN_MODEL ?? 'qwen-plus';
  const optionList = initiatives.map((x) => `${x.id}: ${x.name} | aliases=${x.aliases.join(', ')}`).join('\n');
  const prompt = `You are a router for clinical development requests.
Return strict JSON with keys:
initiativeId (string or null),
confidence (0-1),
rationale (short),
keySignals (string array).

Allowed initiativeId values:
${initiatives.map((x) => x.id).join(', ')}

Definitions:
${optionList}

If query does not belong to any initiative, set initiativeId=null and confidence <= 0.45.

Query:
${query}`;

  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'You only return JSON and never include markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
  if (!text) return null;
  const parsed = JSON.parse(text) as Partial<RouteResult>;

  const id = parsed.initiativeId && initiatives.find((x) => x.id === parsed.initiativeId) ? parsed.initiativeId : null;
  const confidence = clamp(Number(parsed.confidence ?? 0.3), 0, 1);
  return {
    initiativeId: id,
    confidence: Number(confidence.toFixed(2)),
    rationale: String(parsed.rationale ?? 'Model-routed result.'),
    keySignals: Array.isArray(parsed.keySignals) ? parsed.keySignals.map((x) => String(x)).slice(0, 6) : []
  };
}

function buildSkillWorkflow(initiative: Initiative): SkillStep[] {
  return [
    {
      step: 'Trigger',
      owner: 'Router Agent',
      action: `Classify request into "${initiative.name}" skill pack and create execution ticket.`,
      output: 'Routed intent + confidence + tagged objective'
    },
    {
      step: 'Context Build',
      owner: 'Intake Agent',
      action: 'Collect minimal structured fields, data availability, and current decision deadline.',
      output: 'Structured context bundle'
    },
    {
      step: 'Plan',
      owner: 'Orchestrator Agent',
      action: 'Select reusable toolchain, assign sub-agents, and produce execution checkpoints.',
      output: 'Skill run plan with owners and ETA'
    },
    {
      step: 'Execute',
      owner: 'Specialist Agents',
      action: 'Run initiative-specific analysis or generation tasks with evidence trace.',
      output: 'Draft answer + evidence artifacts'
    },
    {
      step: 'Review & Learn',
      owner: 'Human reviewer + Learning Agent',
      action: 'Approve/adjust output, score usefulness, and update routing memory.',
      output: 'Final response + feedback record'
    }
  ];
}

function pickInitiative(id: string | null) {
  return id ? initiatives.find((x) => x.id === id) ?? null : null;
}

export async function GET() {
  const dashboard = await getIntakeDashboard();
  return NextResponse.json({ ok: true, ...dashboard });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RouteRequest;
    const query = String(body.query ?? '').trim();
    const locale = body.locale === 'zh' || body.locale === 'de' ? body.locale : 'en';
    const requester = body.requester?.trim() || undefined;

    if (query.length < 6) {
      return NextResponse.json({ ok: false, error: 'Query is too short.' }, { status: 400 });
    }

    const byKeyword = keywordRoute(query);
    let routed = byKeyword;

    try {
      const byLlm = await llmRoute(query);
      if (byLlm) {
        if (byLlm.initiativeId && byLlm.confidence >= byKeyword.confidence - 0.08) routed = byLlm;
        if (!byLlm.initiativeId && byLlm.confidence < 0.45 && byKeyword.confidence < 0.5) routed = byLlm;
      }
    } catch {
      // Keep keyword route if LLM route fails.
    }

    const initiative = pickInitiative(routed.initiativeId);
    const backlog = !initiative || routed.confidence < 0.46;
    const entry: IntakeEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      query,
      locale,
      requester,
      routedInitiativeId: initiative?.id,
      routedInitiativeName: initiative?.name,
      confidence: routed.confidence,
      backlog,
      rationale: routed.rationale,
      keySignals: routed.keySignals
    };
    await appendIntake(entry);
    const dashboard = await getIntakeDashboard();

    return NextResponse.json({
      ok: true,
      route: {
        initiative,
        confidence: routed.confidence,
        backlog,
        rationale: routed.rationale,
        keySignals: routed.keySignals,
        skillWorkflow: initiative ? buildSkillWorkflow(initiative) : []
      },
      dashboard
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Routing failed.' }, { status: 500 });
  }
}
