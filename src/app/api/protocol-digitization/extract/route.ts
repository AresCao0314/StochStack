import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Locale = 'en' | 'zh' | 'de';

type Criterion = { id: string; text: string; confidence: number };
type SoaRow = { visit: string; window: string; activities: string[]; confidence: number };

type DigitizedPayload = {
  metadata: {
    title: string;
    therapeuticArea: string;
    indication: string;
    phase: string;
  };
  inclusionCriteria: Criterion[];
  exclusionCriteria: Criterion[];
  soa: SoaRow[];
  validation: {
    valid: boolean;
    coverage: number;
    errors: string[];
    warnings: string[];
  };
  confidence: {
    overall: number;
    metadata: number;
    inclusion: number;
    exclusion: number;
    soa: number;
  };
  usdm: {
    study: { id: string; title: string };
    studyDesign: { therapeuticArea: string; indication: string; phase: string };
    eligibilityCriteria: Array<{ id: string; type: 'inclusion' | 'exclusion'; text: string; sourceId: string }>;
    scheduleOfActivities: Array<{ encounter: string; window: string; activities: string[] }>;
    dataFlow: Array<{ from: string; to: string; note: string }>;
  };
  source: 'qwen' | 'local-parser';
  rawStats: {
    chars: number;
    fileName?: string;
  };
};

function normalizeText(raw: string) {
  return raw.replace(/\r/g, '\n').replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ').trim();
}

function cleanLine(line: string) {
  return line.replace(/^\s*[-*•\d.)]+\s*/, '').trim();
}

function parseSoaLine(line: string): Omit<SoaRow, 'confidence'> | null {
  const parts = line.split('|').map((x) => x.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  return {
    visit: parts[0],
    window: parts[1],
    activities: parts[2].split(/[;,；]/).map((x) => x.trim()).filter(Boolean)
  };
}

function detectPhase(text: string) {
  const t = text.toLowerCase();
  if (t.includes('phase 1')) return 'Phase 1';
  if (t.includes('phase 2')) return 'Phase 2';
  if (t.includes('phase 3')) return 'Phase 3';
  if (t.includes('phase 4')) return 'Phase 4';
  return 'Unknown';
}

function detectTherapeuticArea(text: string) {
  const t = text.toLowerCase();
  if (t.includes('oncology') || t.includes('nsclc') || t.includes('tumor') || t.includes('肿瘤')) return 'Oncology';
  if (t.includes('immunology') || t.includes('rheumatoid') || t.includes('sle') || t.includes('免疫')) return 'Immunology';
  if (t.includes('cardio') || t.includes('heart') || t.includes('心血管')) return 'Cardiovascular';
  if (t.includes('cns') || t.includes('alzheimer') || t.includes('神经')) return 'CNS';
  return 'Unknown';
}

function detectIndication(text: string) {
  const t = text.toLowerCase();
  if (t.includes('nsclc')) return 'NSCLC';
  if (t.includes('rheumatoid')) return 'Rheumatoid Arthritis';
  if (t.includes('heart failure')) return 'Heart Failure';
  if (t.includes('alzheimer')) return "Alzheimer's Disease";
  return 'Unknown';
}

function localParse(rawText: string, titleHint?: string): DigitizedPayload {
  const text = normalizeText(rawText);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let section: 'none' | 'inclusion' | 'exclusion' | 'soa' = 'none';
  const inclusion: Criterion[] = [];
  const exclusion: Criterion[] = [];
  const soa: SoaRow[] = [];

  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes('inclusion criteria') || l.includes('纳入标准') || l.includes('einschluss')) {
      section = 'inclusion';
      continue;
    }
    if (l.includes('exclusion criteria') || l.includes('排除标准') || l.includes('ausschluss')) {
      section = 'exclusion';
      continue;
    }
    if (l.includes('schedule of activities') || l.startsWith('soa') || l.includes('访视')) {
      section = 'soa';
      continue;
    }
    if (section === 'inclusion') {
      const v = cleanLine(line);
      if (v) inclusion.push({ id: `I${inclusion.length + 1}`, text: v, confidence: 0.74 });
      continue;
    }
    if (section === 'exclusion') {
      const v = cleanLine(line);
      if (v) exclusion.push({ id: `E${exclusion.length + 1}`, text: v, confidence: 0.74 });
      continue;
    }
    if (section === 'soa') {
      const row = parseSoaLine(line);
      if (row) soa.push({ ...row, confidence: 0.7 });
    }
  }

  const metadata = {
    title: titleHint || lines[0] || 'Historical Protocol',
    therapeuticArea: detectTherapeuticArea(text),
    indication: detectIndication(text),
    phase: detectPhase(text)
  };

  const payload = buildPayload(metadata, inclusion, exclusion, soa, 'local-parser', text.length);
  return payload;
}

function buildPayload(
  metadata: DigitizedPayload['metadata'],
  inclusionCriteria: Criterion[],
  exclusionCriteria: Criterion[],
  soa: SoaRow[],
  source: DigitizedPayload['source'],
  chars: number,
  fileName?: string
): DigitizedPayload {
  const validation = validateSchema({ metadata, inclusionCriteria, exclusionCriteria, soa });
  const confidence = computeConfidence(metadata, inclusionCriteria, exclusionCriteria, soa, validation.valid);
  const usdm = toUsdm(metadata, inclusionCriteria, exclusionCriteria, soa);
  return {
    metadata,
    inclusionCriteria,
    exclusionCriteria,
    soa,
    validation,
    confidence,
    usdm,
    source,
    rawStats: { chars, fileName }
  };
}

function validateSchema(input: {
  metadata: DigitizedPayload['metadata'];
  inclusionCriteria: Criterion[];
  exclusionCriteria: Criterion[];
  soa: SoaRow[];
}) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input.metadata.title) errors.push('metadata.title is missing');
  if (input.inclusionCriteria.length === 0) errors.push('inclusionCriteria is empty');
  if (input.exclusionCriteria.length === 0) warnings.push('exclusionCriteria is empty');
  if (input.soa.length === 0) warnings.push('soa is empty');
  for (const row of input.soa) {
    if (!row.visit || !row.window || row.activities.length === 0) {
      errors.push(`invalid SoA row: ${JSON.stringify(row)}`);
    }
  }
  const presentBlocks =
    Number(input.inclusionCriteria.length > 0) +
    Number(input.exclusionCriteria.length > 0) +
    Number(input.soa.length > 0);
  return {
    valid: errors.length === 0,
    coverage: Math.round((presentBlocks / 3) * 100),
    errors,
    warnings
  };
}

function computeConfidence(
  metadata: DigitizedPayload['metadata'],
  inclusionCriteria: Criterion[],
  exclusionCriteria: Criterion[],
  soa: SoaRow[],
  valid: boolean
) {
  const metadataConfidence =
    Number(metadata.therapeuticArea !== 'Unknown') * 0.35 +
    Number(metadata.indication !== 'Unknown') * 0.35 +
    Number(metadata.phase !== 'Unknown') * 0.3;
  const inclusion = inclusionCriteria.length > 0 ? Math.min(0.92, 0.6 + inclusionCriteria.length * 0.04) : 0.25;
  const exclusion = exclusionCriteria.length > 0 ? Math.min(0.9, 0.55 + exclusionCriteria.length * 0.04) : 0.2;
  const soaConfidence = soa.length > 0 ? Math.min(0.9, 0.55 + soa.length * 0.05) : 0.2;
  const overall = (metadataConfidence + inclusion + exclusion + soaConfidence) / 4 - (valid ? 0 : 0.06);
  return {
    overall: Number(Math.max(0.1, Math.min(0.97, overall)).toFixed(2)),
    metadata: Number(metadataConfidence.toFixed(2)),
    inclusion: Number(inclusion.toFixed(2)),
    exclusion: Number(exclusion.toFixed(2)),
    soa: Number(soaConfidence.toFixed(2))
  };
}

function toUsdm(
  metadata: DigitizedPayload['metadata'],
  inclusionCriteria: Criterion[],
  exclusionCriteria: Criterion[],
  soa: SoaRow[]
): DigitizedPayload['usdm'] {
  const studyId = `USDM-${metadata.indication.replace(/\s+/g, '-').toUpperCase()}-${metadata.phase.replace(/\s+/g, '')}`;
  return {
    study: { id: studyId, title: metadata.title },
    studyDesign: {
      therapeuticArea: metadata.therapeuticArea,
      indication: metadata.indication,
      phase: metadata.phase
    },
    eligibilityCriteria: [
      ...inclusionCriteria.map((x) => ({ id: x.id, type: 'inclusion' as const, text: x.text, sourceId: x.id })),
      ...exclusionCriteria.map((x) => ({ id: x.id, type: 'exclusion' as const, text: x.text, sourceId: x.id }))
    ],
    scheduleOfActivities: soa.map((x) => ({
      encounter: x.visit,
      window: x.window,
      activities: x.activities
    })),
    dataFlow: [
      { from: 'Historical Protocol (PDF/Text)', to: 'Protocol Digitizer', note: 'extract I/E and SoA' },
      { from: 'Protocol Digitizer', to: 'JSON Schema Validation', note: 'check structural integrity' },
      { from: 'JSON Schema Validation', to: 'USDM Mapping', note: 'map to Study/Eligibility/SoA entities' },
      { from: 'USDM Mapping', to: 'Downstream Clinical Data Flow', note: 'feasibility, simulation, authoring reuse' }
    ]
  };
}

function stripFence(content: string) {
  return content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
}

async function parseWithQwen(text: string, locale: Locale): Promise<{
  metadata: DigitizedPayload['metadata'];
  inclusionCriteria: Criterion[];
  exclusionCriteria: Criterion[];
  soa: SoaRow[];
} | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;
  const model = process.env.QWEN_MODEL ?? 'qwen-plus';
  const localeHint =
    locale === 'zh'
      ? 'Prefer Chinese extraction labels if source text is Chinese.'
      : locale === 'de'
        ? 'German source may appear, keep extracted values concise.'
        : 'Return concise English values.';
  const prompt = `Extract structured protocol JSON from text.
Return strict JSON object with keys:
metadata{title,therapeuticArea,indication,phase},
inclusionCriteria[{id,text,confidence}],
exclusionCriteria[{id,text,confidence}],
soa[{visit,window,activities[],confidence}].
confidence must be 0-1.
${localeHint}

Text:
${text.slice(0, 35000)}`;

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
      max_tokens: 2600,
      messages: [
        {
          role: 'system',
          content: 'You only return valid JSON, no markdown.'
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
  const content = String(data?.choices?.[0]?.message?.content ?? '');
  if (!content.trim()) return null;
  const parsed = JSON.parse(stripFence(content));
  const metadata = {
    title: String(parsed?.metadata?.title ?? ''),
    therapeuticArea: String(parsed?.metadata?.therapeuticArea ?? 'Unknown'),
    indication: String(parsed?.metadata?.indication ?? 'Unknown'),
    phase: String(parsed?.metadata?.phase ?? 'Unknown')
  };
  const inclusionCriteria: Criterion[] = Array.isArray(parsed?.inclusionCriteria)
    ? parsed.inclusionCriteria.map((x: any, i: number) => ({
        id: String(x?.id ?? `I${i + 1}`),
        text: String(x?.text ?? '').trim(),
        confidence: Math.max(0, Math.min(1, Number(x?.confidence ?? 0.7)))
      }))
    : [];
  const exclusionCriteria: Criterion[] = Array.isArray(parsed?.exclusionCriteria)
    ? parsed.exclusionCriteria.map((x: any, i: number) => ({
        id: String(x?.id ?? `E${i + 1}`),
        text: String(x?.text ?? '').trim(),
        confidence: Math.max(0, Math.min(1, Number(x?.confidence ?? 0.7)))
      }))
    : [];
  const soa: SoaRow[] = Array.isArray(parsed?.soa)
    ? parsed.soa.map((x: any) => ({
        visit: String(x?.visit ?? ''),
        window: String(x?.window ?? ''),
        activities: Array.isArray(x?.activities) ? x.activities.map((a: any) => String(a).trim()).filter(Boolean) : [],
        confidence: Math.max(0, Math.min(1, Number(x?.confidence ?? 0.68)))
      }))
    : [];

  return { metadata, inclusionCriteria, exclusionCriteria, soa };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const localeRaw = String(form.get('locale') ?? 'en');
    const locale: Locale = localeRaw === 'zh' || localeRaw === 'de' ? localeRaw : 'en';
    const rawTextInput = String(form.get('text') ?? '').trim();
    const file = form.get('file');

    let text = rawTextInput;
    let fileName: string | undefined;
    if (file instanceof File) {
      const fn = file.name;
      fileName = fn;
      const isPdf = file.type.includes('pdf') || fn.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json({ ok: false, error: 'Only PDF is supported for file upload.' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      const fromPdf = String((parsed as any)?.text ?? '').trim();
      if (fromPdf) text = fromPdf;
    }

    if (!text || text.length < 30) {
      return NextResponse.json({ ok: false, error: 'Please provide PDF or non-structured text (>=30 chars).' }, { status: 400 });
    }

    let payload: DigitizedPayload | null = null;
    const qwenParsed = await parseWithQwen(text, locale).catch(() => null);
    if (qwenParsed) {
      payload = buildPayload(
        qwenParsed.metadata,
        qwenParsed.inclusionCriteria,
        qwenParsed.exclusionCriteria,
        qwenParsed.soa,
        'qwen',
        text.length,
        fileName
      );
    } else {
      payload = localParse(text, fileName);
      payload.rawStats.fileName = fileName;
    }

    return NextResponse.json({ ok: true, data: payload });
  } catch {
    return NextResponse.json({ ok: false, error: 'Digitization failed.' }, { status: 500 });
  }
}
