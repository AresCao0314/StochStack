import { NextResponse } from 'next/server';
import datasets from '@/content/data-agent/datasets.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Locale = 'en' | 'zh' | 'de';

type QueryRequest = {
  query?: string;
  locale?: Locale;
};

type Dataset = (typeof datasets)[number];

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function containsAny(text: string, keys: string[]) {
  return keys.some((k) => text.includes(k));
}

function detectIntent(query: string) {
  const q = normalize(query);
  const needsClaims = containsAny(q, ['claim', 'claims', '索赔', '理赔']);
  const needsRwe = containsAny(q, ['rwe', 'real world', '真实世界', 'ehr']);
  const needsSite = containsAny(q, ['site', 'startup', 'activation', '站点']);
  const needsPatient = containsAny(q, ['patient', 'enrollment', '患者', '入组']);
  const needsSafety = containsAny(q, ['safety', 'ae', 'pv', '药物警戒', '安全']);
  const needsOncology = containsAny(q, ['oncology', 'nsclc', 'tumor', '肿瘤']);
  const needsImmunology = containsAny(q, ['immunology', 'ra', 'sle', '免疫']);
  const needsCardio = containsAny(q, ['cardio', 'heart', '心血管']);
  const needsCns = containsAny(q, ['cns', 'alzheimer', '神经', '中枢']);
  return {
    needsClaims,
    needsRwe,
    needsSite,
    needsPatient,
    needsSafety,
    needsOncology,
    needsImmunology,
    needsCardio,
    needsCns
  };
}

function scoreDataset(ds: Dataset, query: string) {
  const q = normalize(query);
  let score = 0;
  if (q.includes(ds.name.toLowerCase())) score += 8;
  if (q.includes(ds.domain.toLowerCase())) score += 4;
  if (q.includes(ds.sourceType.toLowerCase())) score += 2;
  for (const tag of ds.tags) {
    if (q.includes(tag.toLowerCase())) score += 2;
  }
  for (const area of ds.therapeuticAreas) {
    if (q.includes(area.toLowerCase())) score += 3;
  }
  for (const f of ds.schema) {
    if (q.includes(f.field.toLowerCase())) score += 1;
  }

  const intent = detectIntent(query);
  if (intent.needsClaims && ds.domain === 'Claims') score += 6;
  if (intent.needsRwe && (ds.domain === 'RWE' || ds.tags.includes('rwe'))) score += 6;
  if (intent.needsSite && ds.tags.includes('site')) score += 5;
  if (intent.needsPatient && (ds.domain === 'Patient' || ds.tags.includes('patient'))) score += 5;
  if (intent.needsSafety && ds.domain === 'Safety') score += 6;
  if (intent.needsOncology && ds.therapeuticAreas.includes('Oncology')) score += 4;
  if (intent.needsImmunology && ds.therapeuticAreas.includes('Immunology')) score += 4;
  if (intent.needsCardio && ds.therapeuticAreas.includes('Cardiovascular')) score += 4;
  if (intent.needsCns && ds.therapeuticAreas.includes('CNS')) score += 4;
  return score;
}

function buildOverview() {
  const domains = Array.from(new Set(datasets.map((d) => d.domain)));
  const bySource = datasets.reduce(
    (acc, d) => {
      const source = d.sourceType;
      if (source === 'internal' || source === 'external' || source === 'hybrid') {
        acc[source] += 1;
      }
      return acc;
    },
    { internal: 0, external: 0, hybrid: 0 } as Record<'internal' | 'external' | 'hybrid', number>
  );
  const restricted = datasets.filter((d) => d.accessLevel === 'restricted').length;
  const controlled = datasets.filter((d) => d.accessLevel === 'controlled').length;
  return {
    totalDatasets: datasets.length,
    domains: domains.length,
    bySource,
    restricted,
    controlled
  };
}

function buildAccessHint(found: Dataset[]) {
  if (found.length === 0) {
    return {
      action: 'intake',
      message:
        'No confident dataset match. Recommend creating an intake ticket with therapeutic area, data type, and decision timeline.'
    };
  }
  const first = found[0];
  return {
    action: 'request-access',
    message: `Primary owner: ${first.accessOwner}. Access level: ${first.accessLevel}. Include purpose, region scope, and retention period in request.`
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    overview: buildOverview(),
    featured: datasets.slice(0, 6)
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QueryRequest;
    const query = String(body.query ?? '').trim();
    const locale = body.locale === 'zh' || body.locale === 'de' ? body.locale : 'en';
    if (query.length < 4) {
      return NextResponse.json({ ok: false, error: 'Query too short.' }, { status: 400 });
    }

    const scored = datasets
      .map((d) => ({ dataset: d, score: scoreDataset(d, query) }))
      .sort((a, b) => b.score - a.score);
    const top = scored.filter((x) => x.score > 0).slice(0, 8);
    const confidence = top.length ? Math.min(0.95, 0.35 + top[0].score * 0.035) : 0.22;

    return NextResponse.json({
      ok: true,
      locale,
      overview: buildOverview(),
      intent: detectIntent(query),
      confidence: Number(confidence.toFixed(2)),
      matches: top.map((x) => x.dataset),
      accessHint: buildAccessHint(top.map((x) => x.dataset))
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Data agent query failed.' }, { status: 500 });
  }
}
