import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';

type ProtocolJson = {
  id: string;
  trialId: string;
  title: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  summary: string;
  inclusionCriteria: Array<{ id: string; text: string }>;
  exclusionCriteria: Array<{ id: string; text: string }>;
  eligibilityRules: {
    age: { min: number; max: number; evidence: string };
    ecog: { max: number; evidence: string };
    ancMin: { value: number; evidence: string };
    plateletsMin: { value: number; evidence: string };
    altUlnMax: { value: number; evidence: string };
    creatinineClearanceMin: { value: number; evidence: string };
  };
  medicationRestrictions: Array<{
    name: string;
    aliases: string[];
    level: 'prohibited' | 'caution' | 'allowed';
    reason: string;
    evidence: string;
    washoutDays: number;
  }>;
  soa: Array<{ visit: string; window: string; activities: string[] }>;
  labManual: {
    specimens: Array<{
      name: string;
      storage: string;
      stability: string;
      handling: string;
      evidence: string;
    }>;
    reagents: Array<{
      name: string;
      storage: string;
      afterOpen: string;
      evidence: string;
    }>;
  };
  graph: {
    nodes: Array<{ id: string; label: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
};

function stripCodeFence(raw: string) {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function ensureProtocol(obj: any): ProtocolJson {
  const title = String(obj?.title ?? 'Untitled Protocol');
  const trialId = String(obj?.trialId ?? `NCT-AUTO-${Math.floor(Date.now() / 1000)}`);
  const id = obj?.id ? String(obj.id) : slugify(`${trialId}-${title}`);

  const normalizeCriterion = (x: any, idx: number, prefix: string) => ({
    id: String(x?.id ?? `${prefix}${idx + 1}`),
    text: String(x?.text ?? '').trim()
  });

  const meds = Array.isArray(obj?.medicationRestrictions)
    ? obj.medicationRestrictions.map((x: any) => ({
        name: String(x?.name ?? 'Unknown medication'),
        aliases: Array.isArray(x?.aliases) ? x.aliases.map((a: any) => String(a)) : [],
        level: x?.level === 'prohibited' || x?.level === 'caution' || x?.level === 'allowed' ? x.level : 'caution',
        reason: String(x?.reason ?? ''),
        evidence: String(x?.evidence ?? ''),
        washoutDays: Number.isFinite(Number(x?.washoutDays)) ? Number(x.washoutDays) : 0
      }))
    : [];

  const protocol: ProtocolJson = {
    id,
    trialId,
    title,
    therapeuticArea: String(obj?.therapeuticArea ?? 'Unknown'),
    indication: String(obj?.indication ?? 'Unknown'),
    phase: String(obj?.phase ?? 'Unknown'),
    summary: String(obj?.summary ?? ''),
    inclusionCriteria: Array.isArray(obj?.inclusionCriteria)
      ? obj.inclusionCriteria.map((x: any, idx: number) => normalizeCriterion(x, idx, 'I'))
      : [],
    exclusionCriteria: Array.isArray(obj?.exclusionCriteria)
      ? obj.exclusionCriteria.map((x: any, idx: number) => normalizeCriterion(x, idx, 'E'))
      : [],
    eligibilityRules: {
      age: {
        min: Number(obj?.eligibilityRules?.age?.min ?? 18),
        max: Number(obj?.eligibilityRules?.age?.max ?? 80),
        evidence: String(obj?.eligibilityRules?.age?.evidence ?? 'I1')
      },
      ecog: {
        max: Number(obj?.eligibilityRules?.ecog?.max ?? 1),
        evidence: String(obj?.eligibilityRules?.ecog?.evidence ?? 'I2')
      },
      ancMin: {
        value: Number(obj?.eligibilityRules?.ancMin?.value ?? 1.5),
        evidence: String(obj?.eligibilityRules?.ancMin?.evidence ?? 'I3')
      },
      plateletsMin: {
        value: Number(obj?.eligibilityRules?.plateletsMin?.value ?? 100),
        evidence: String(obj?.eligibilityRules?.plateletsMin?.evidence ?? 'I3')
      },
      altUlnMax: {
        value: Number(obj?.eligibilityRules?.altUlnMax?.value ?? 2.5),
        evidence: String(obj?.eligibilityRules?.altUlnMax?.evidence ?? 'I4')
      },
      creatinineClearanceMin: {
        value: Number(obj?.eligibilityRules?.creatinineClearanceMin?.value ?? 50),
        evidence: String(obj?.eligibilityRules?.creatinineClearanceMin?.evidence ?? 'I5')
      }
    },
    medicationRestrictions: meds,
    soa: Array.isArray(obj?.soa)
      ? obj.soa.map((x: any) => ({
          visit: String(x?.visit ?? ''),
          window: String(x?.window ?? ''),
          activities: Array.isArray(x?.activities) ? x.activities.map((a: any) => String(a)) : []
        }))
      : [],
    labManual: {
      specimens: Array.isArray(obj?.labManual?.specimens)
        ? obj.labManual.specimens.map((x: any) => ({
            name: String(x?.name ?? ''),
            storage: String(x?.storage ?? ''),
            stability: String(x?.stability ?? ''),
            handling: String(x?.handling ?? ''),
            evidence: String(x?.evidence ?? '')
          }))
        : [],
      reagents: Array.isArray(obj?.labManual?.reagents)
        ? obj.labManual.reagents.map((x: any) => ({
            name: String(x?.name ?? ''),
            storage: String(x?.storage ?? ''),
            afterOpen: String(x?.afterOpen ?? ''),
            evidence: String(x?.evidence ?? '')
          }))
        : []
    },
    graph: {
      nodes: Array.isArray(obj?.graph?.nodes)
        ? obj.graph.nodes.map((x: any) => ({ id: String(x?.id ?? ''), label: String(x?.label ?? '') }))
        : [
            { id: 'patient', label: 'Patient Profile' },
            { id: 'ie', label: 'I/E Criteria' },
            { id: 'med', label: 'Medication Rules' },
            { id: 'soa', label: 'Schedule of Activities' },
            { id: 'lab', label: 'Lab Manual' }
          ],
      edges: Array.isArray(obj?.graph?.edges)
        ? obj.graph.edges.map((x: any) => ({
            from: String(x?.from ?? ''),
            to: String(x?.to ?? ''),
            label: String(x?.label ?? '')
          }))
        : [
            { from: 'patient', to: 'ie', label: 'eligibility check' },
            { from: 'patient', to: 'med', label: 'restriction check' },
            { from: 'ie', to: 'soa', label: 'study workflow' },
            { from: 'soa', to: 'lab', label: 'sample and reagent handling' }
          ]
    }
  };

  return protocol;
}

async function extractWithQwen(text: string, model: string, apiKey: string) {
  const schemaHint = `Return strict JSON with keys: id, trialId, title, therapeuticArea, indication, phase, summary, inclusionCriteria[], exclusionCriteria[], eligibilityRules{age,ecog,ancMin,plateletsMin,altUlnMax,creatinineClearanceMin}, medicationRestrictions[], soa[], labManual{specimens[],reagents[]}, graph{nodes[],edges[]}.`;

  const prompt = `${schemaHint}\n\nRules:\n1) medicationRestrictions.level must be one of prohibited|caution|allowed.\n2) criteria must include evidence ids like I1, E1 where possible.\n3) keep output concise but complete.\n\nProtocol text:\n${text}`;

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content:
            'You are a clinical protocol structuring assistant. Extract only what is grounded in the provided protocol text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Qwen request failed (${response.status})`);
  }

  const data = await response.json();
  const content = String(data?.choices?.[0]?.message?.content ?? '').trim();
  if (!content) {
    throw new Error('Qwen returned empty content');
  }

  return JSON.parse(stripCodeFence(content));
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: 'DASHSCOPE_API_KEY is not configured on server.' },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const isPdf = file.type.includes('pdf') || filename.endsWith('.pdf');
    if (!isPdf) {
      return NextResponse.json({ ok: false, error: 'Please upload a PDF file.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    const rawText = String((parsed as any)?.text ?? '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!rawText) {
      return NextResponse.json({ ok: false, error: 'Unable to extract text from PDF.' }, { status: 400 });
    }

    const limitedText = rawText.slice(0, 45000);
    const model = process.env.QWEN_MODEL ?? 'qwen-plus';

    const extracted = await extractWithQwen(limitedText, model, apiKey);
    const protocol = ensureProtocol(extracted);

    return NextResponse.json({
      ok: true,
      provider: 'qwen',
      protocol,
      stats: {
        filename: file.name,
        charsExtracted: rawText.length,
        charsSent: limitedText.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to extract protocol JSON from PDF.'
      },
      { status: 500 }
    );
  }
}
