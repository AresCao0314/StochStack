import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenerateRequest = {
  protocolSynopsis?: string;
  bdsSummary?: string;
  tflOrRtf?: string;
  outputLanguage?: 'en' | 'de';
};

type CsrDraft = {
  dataIndependent: {
    titlePage: string;
    synopsis: string;
    studyDesign: string;
    objectivesEndpoints: string;
    methodsGeneral: string;
  };
  dataDependent: {
    dispositionAndBaseline: string;
    efficacyResults: string;
    safetyResults: string;
    benefitRisk: string;
    conclusion: string;
  };
};

function stripFence(raw: string) {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
}

function localDraft(input: { protocolSynopsis: string; bdsSummary: string; tflOrRtf: string }, outputLanguage: 'en' | 'de'): CsrDraft {
  const p = input.protocolSynopsis.trim();
  const b = input.bdsSummary.trim();
  const t = input.tflOrRtf.trim();

  if (outputLanguage === 'de') {
    return {
      dataIndependent: {
        titlePage: 'Clinical Study Report Entwurf - automatisch aus Protocol/BDS/TFL erstellt.',
        synopsis: `Studienuebersicht (entwurfsweise): ${p}`,
        studyDesign: `Studiendesign und Methodik (vorlaeufig): ${p}`,
        objectivesEndpoints: 'Primäre und sekundäre Endpunkte werden gemaess Protocol Synopsis beschrieben.',
        methodsGeneral: 'Allgemeine Analyseprinzipien und Datensets basieren auf dem dokumentierten Studienplan.'
      },
      dataDependent: {
        dispositionAndBaseline: `Studienpopulation und Baseline-Merkmale (aus BDS): ${b}`,
        efficacyResults: `Wirksamkeitsergebnisse (aus TFL/RTF): ${t}`,
        safetyResults: `Sicherheitsbewertung basiert auf AE-Tabellen und zusammengefassten Safety-Ausgaben: ${t}`,
        benefitRisk: 'Vorlaeufige Benefit-Risk-Bewertung aus Wirksamkeits- und Safety-Signalen.',
        conclusion: 'Vorlaeufiges Fazit: finale Aussagen erst nach medizinisch-statistischer Review und QC.'
      }
    };
  }

  return {
    dataIndependent: {
      titlePage: 'Clinical Study Report draft generated from protocol/BDS/TFL inputs.',
      synopsis: `Study synopsis (draft): ${p}`,
      studyDesign: `Study design and conduct (draft framing): ${p}`,
      objectivesEndpoints: 'Primary and secondary objectives/endpoints are drafted from protocol synopsis context.',
      methodsGeneral: 'General analysis methods are drafted according to planned datasets and reporting structure.'
    },
    dataDependent: {
      dispositionAndBaseline: `Subject disposition and baseline characteristics (from BDS): ${b}`,
      efficacyResults: `Efficacy results narrative (from TFL/RTF): ${t}`,
      safetyResults: `Safety narrative (from TFL/RTF adverse event outputs): ${t}`,
      benefitRisk: 'Preliminary benefit-risk interpretation integrating efficacy and safety signal direction.',
      conclusion: 'Draft conclusion pending medical review, statistical QC, and document governance approval.'
    }
  };
}

function normalizeDraft(obj: any): CsrDraft {
  return {
    dataIndependent: {
      titlePage: String(obj?.dataIndependent?.titlePage ?? ''),
      synopsis: String(obj?.dataIndependent?.synopsis ?? ''),
      studyDesign: String(obj?.dataIndependent?.studyDesign ?? ''),
      objectivesEndpoints: String(obj?.dataIndependent?.objectivesEndpoints ?? ''),
      methodsGeneral: String(obj?.dataIndependent?.methodsGeneral ?? '')
    },
    dataDependent: {
      dispositionAndBaseline: String(obj?.dataDependent?.dispositionAndBaseline ?? ''),
      efficacyResults: String(obj?.dataDependent?.efficacyResults ?? ''),
      safetyResults: String(obj?.dataDependent?.safetyResults ?? ''),
      benefitRisk: String(obj?.dataDependent?.benefitRisk ?? ''),
      conclusion: String(obj?.dataDependent?.conclusion ?? '')
    }
  };
}

async function generateWithQwen(input: { protocolSynopsis: string; bdsSummary: string; tflOrRtf: string }, outputLanguage: 'en' | 'de') {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;
  const model = process.env.QWEN_MODEL ?? 'qwen-plus';
  const languageRule =
    outputLanguage === 'de'
      ? 'Write concise German suitable for CSR draft authoring.'
      : 'Write concise English suitable for CSR draft authoring.';

  const prompt = `Create CSR draft blocks from protocol synopsis + BDS + TFL/RTF.
Return strict JSON with:
dataIndependent{titlePage,synopsis,studyDesign,objectivesEndpoints,methodsGeneral},
dataDependent{dispositionAndBaseline,efficacyResults,safetyResults,benefitRisk,conclusion}.
Clearly separate data-independent vs data-dependent language.
Do not invent numbers not present in BDS/TFL text.
${languageRule}

Protocol synopsis:
${input.protocolSynopsis}

BDS summary:
${input.bdsSummary}

TFL/RTF content:
${input.tflOrRtf}`;

  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      max_tokens: 2600,
      messages: [
        { role: 'system', content: 'You return valid JSON only.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = String(data?.choices?.[0]?.message?.content ?? '').trim();
  if (!content) return null;
  return normalizeDraft(JSON.parse(stripFence(content)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const protocolSynopsis = String(body.protocolSynopsis ?? '').trim();
    const bdsSummary = String(body.bdsSummary ?? '').trim();
    const tflOrRtf = String(body.tflOrRtf ?? '').trim();
    const outputLanguage: 'en' | 'de' = body.outputLanguage === 'de' ? 'de' : 'en';

    if (protocolSynopsis.length < 30 || bdsSummary.length < 20 || tflOrRtf.length < 20) {
      return NextResponse.json(
        { ok: false, error: 'Please provide protocol synopsis, BDS summary, and TFL/RTF content.' },
        { status: 400 }
      );
    }

    const qwen = await generateWithQwen({ protocolSynopsis, bdsSummary, tflOrRtf }, outputLanguage).catch(() => null);
    const draft = qwen ?? localDraft({ protocolSynopsis, bdsSummary, tflOrRtf }, outputLanguage);

    return NextResponse.json({
      ok: true,
      source: qwen ? 'qwen' : 'local-fallback',
      data: draft
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'CSR draft generation failed.' }, { status: 500 });
  }
}
