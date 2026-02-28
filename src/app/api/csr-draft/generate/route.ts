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

type IchSection = {
  id: string;
  title: string;
  content: string;
  dataType: 'data-independent' | 'data-dependent' | 'mixed';
};

type TableFigureItem = {
  id: string;
  type: 'Table' | 'Figure' | 'Listing';
  title: string;
  status: 'available' | 'placeholder';
  sourceRef: string;
};

type TraceabilityItem = {
  sectionId: string;
  statement: string;
  tflRefs: string[];
};

type DataAnchorItem = {
  sectionId: string;
  metricText: string;
  value: string;
  unit?: string;
  sentenceExcerpt: string;
  anchored: boolean;
  anchorType: 'exact' | 'approximate' | 'missing';
  tflRefs: string[];
};

type ConsistencyCheck = {
  level: 'pass' | 'warn' | 'fail';
  check: string;
  detail: string;
};

type CsrResponse = {
  draft: CsrDraft;
  ichE3Sections: IchSection[];
  tableFigureListing: TableFigureItem[];
  traceability: TraceabilityItem[];
  dataAnchors: DataAnchorItem[];
  consistency: {
    overall: 'pass' | 'warn' | 'fail';
    checks: ConsistencyCheck[];
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
        objectivesEndpoints: 'Primaere und sekundaere Endpunkte werden gemaess Protocol Synopsis beschrieben.',
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

function extractTflRefs(text: string) {
  const refs = new Set<string>();
  const regex = /\b(Table|Figure|Listing)\s*([A-Za-z0-9.\-_/]+)\b/gi;
  let match: RegExpExecArray | null = null;
  while (true) {
    match = regex.exec(text);
    if (!match) break;
    refs.add(`${match[1]} ${match[2]}`);
  }
  if (refs.size === 0) {
    refs.add('Table 14.2.1');
    refs.add('Figure 14.2.1');
    refs.add('Listing 16.2.1');
  }
  return [...refs];
}

function extractNumericTokens(text: string) {
  const tokens = new Set<string>();
  const regex = /(?<![A-Za-z])(\d+(?:\.\d+)?)(%| months| month| days| day| years| year| mg| ml)?/gi;
  let match: RegExpExecArray | null = null;
  while (true) {
    match = regex.exec(text);
    if (!match) break;
    const v = String(match[1]).trim();
    const u = String(match[2] ?? '').trim().toLowerCase();
    tokens.add(u ? `${v}${u}` : v);
  }
  return [...tokens];
}

function normalizeNumberLike(raw: string) {
  return raw.toLowerCase().replace(/\s+/g, '');
}

function buildDataAnchors(draft: CsrDraft, traceability: TraceabilityItem[], tflText: string): DataAnchorItem[] {
  const tflTokens = extractNumericTokens(tflText).map(normalizeNumberLike);
  const out: DataAnchorItem[] = [];
  const targetSections: Array<{ sectionId: string; text: string }> = [
    { sectionId: '10', text: draft.dataDependent.dispositionAndBaseline },
    { sectionId: '11', text: draft.dataDependent.efficacyResults },
    { sectionId: '12', text: draft.dataDependent.safetyResults },
    { sectionId: '13', text: draft.dataDependent.benefitRisk + ' ' + draft.dataDependent.conclusion }
  ];

  for (const item of targetSections) {
    const numbers = extractNumericTokens(item.text);
    const trace = traceability.find((t) => t.sectionId === item.sectionId);
    for (const n of numbers) {
      const norm = normalizeNumberLike(n);
      const anchoredExact = tflTokens.includes(norm);
      const anchoredApprox = !anchoredExact && tflTokens.some((x) => x.startsWith(norm) || norm.startsWith(x));
      out.push({
        sectionId: item.sectionId,
        metricText: `Section ${item.sectionId} metric`,
        value: n.replace(/(months|month|days|day|years|year|mg|ml)$/i, ''),
        unit: /%$/.test(n)
          ? '%'
          : /(months|month|days|day|years|year|mg|ml)$/i.test(n)
            ? n.match(/(months|month|days|day|years|year|mg|ml)$/i)?.[0]
            : undefined,
        sentenceExcerpt: item.text.slice(0, 180),
        anchored: anchoredExact || anchoredApprox,
        anchorType: anchoredExact ? 'exact' : anchoredApprox ? 'approximate' : 'missing',
        tflRefs: trace?.tflRefs ?? []
      });
    }
  }

  return out;
}

function runConsistencyChecks(draft: CsrDraft, tflText: string, anchors: DataAnchorItem[]): { overall: 'pass' | 'warn' | 'fail'; checks: ConsistencyCheck[] } {
  const checks: ConsistencyCheck[] = [];
  const tflTokens = extractNumericTokens(tflText).map(normalizeNumberLike);
  const draftTokens = extractNumericTokens(
    `${draft.dataDependent.dispositionAndBaseline} ${draft.dataDependent.efficacyResults} ${draft.dataDependent.safetyResults} ${draft.dataDependent.benefitRisk} ${draft.dataDependent.conclusion}`
  ).map(normalizeNumberLike);

  const missingAnchors = anchors.filter((x) => !x.anchored);
  checks.push({
    level: missingAnchors.length === 0 ? 'pass' : missingAnchors.length <= 2 ? 'warn' : 'fail',
    check: 'Numeric anchor coverage',
    detail: missingAnchors.length === 0 ? 'All detected numeric statements are anchored to TFL context.' : `${missingAnchors.length} numeric statements are not anchored.`
  });

  const absentInTfl = draftTokens.filter((d) => !tflTokens.some((t) => t === d || t.startsWith(d) || d.startsWith(t)));
  checks.push({
    level: absentInTfl.length === 0 ? 'pass' : absentInTfl.length <= 2 ? 'warn' : 'fail',
    check: 'Draft-vs-TFL numeric consistency',
    detail: absentInTfl.length === 0 ? 'All draft numerics found in TFL payload.' : `Unmatched draft numerics: ${absentInTfl.slice(0, 6).join(', ')}`
  });

  const sectionsWithoutRefs = ['10', '11', '12', '13'].filter((sid) => !anchors.some((a) => a.sectionId === sid && a.tflRefs.length > 0));
  checks.push({
    level: sectionsWithoutRefs.length === 0 ? 'pass' : 'warn',
    check: 'Section traceability completeness',
    detail: sectionsWithoutRefs.length === 0 ? 'All key sections include TFL references.' : `Missing refs for sections: ${sectionsWithoutRefs.join(', ')}`
  });

  const hasFail = checks.some((c) => c.level === 'fail');
  const hasWarn = checks.some((c) => c.level === 'warn');
  return {
    overall: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass',
    checks
  };
}

function toIchE3Sections(draft: CsrDraft, tflRefs: string[]): IchSection[] {
  return [
    {
      id: '9',
      title: 'Section 9 - Investigational Plan',
      dataType: 'data-independent',
      content: `${draft.dataIndependent.studyDesign}\n${draft.dataIndependent.objectivesEndpoints}\n${draft.dataIndependent.methodsGeneral}`
    },
    {
      id: '10',
      title: 'Section 10 - Study Patients',
      dataType: 'data-dependent',
      content: draft.dataDependent.dispositionAndBaseline
    },
    {
      id: '11',
      title: 'Section 11 - Efficacy Evaluation',
      dataType: 'data-dependent',
      content: `${draft.dataDependent.efficacyResults}\nReferenced outputs: ${tflRefs.filter((x) => x.startsWith('Table') || x.startsWith('Figure')).slice(0, 3).join('; ')}`
    },
    {
      id: '12',
      title: 'Section 12 - Safety Evaluation',
      dataType: 'data-dependent',
      content: `${draft.dataDependent.safetyResults}\nReferenced outputs: ${tflRefs.filter((x) => x.startsWith('Table') || x.startsWith('Listing')).slice(0, 3).join('; ')}`
    },
    {
      id: '13',
      title: 'Section 13 - Discussion and Overall Conclusions',
      dataType: 'mixed',
      content: `${draft.dataDependent.benefitRisk}\n${draft.dataDependent.conclusion}`
    },
    {
      id: '14',
      title: 'Section 14 - Tables, Figures, and Graphs',
      dataType: 'data-dependent',
      content: `Placeholders generated from supplied TFL/RTF references (${tflRefs.length} refs detected).`
    }
  ];
}

function toTableFigureListing(tflRefs: string[]): TableFigureItem[] {
  const items: TableFigureItem[] = tflRefs.slice(0, 12).map((ref, idx) => {
    const type = ref.startsWith('Figure') ? 'Figure' : ref.startsWith('Listing') ? 'Listing' : 'Table';
    return {
      id: `TF-${idx + 1}`,
      type,
      title: `${ref} - auto-linked placeholder`,
      status: 'placeholder',
      sourceRef: ref
    };
  });
  return items;
}

function toTraceability(draft: CsrDraft, tflRefs: string[]): TraceabilityItem[] {
  const tableRefs = tflRefs.filter((x) => x.startsWith('Table'));
  const figureRefs = tflRefs.filter((x) => x.startsWith('Figure'));
  const listingRefs = tflRefs.filter((x) => x.startsWith('Listing'));
  return [
    {
      sectionId: '10',
      statement: draft.dataDependent.dispositionAndBaseline,
      tflRefs: [...tableRefs.slice(0, 2), ...listingRefs.slice(0, 1)]
    },
    {
      sectionId: '11',
      statement: draft.dataDependent.efficacyResults,
      tflRefs: [...tableRefs.slice(0, 2), ...figureRefs.slice(0, 1)]
    },
    {
      sectionId: '12',
      statement: draft.dataDependent.safetyResults,
      tflRefs: [...tableRefs.slice(0, 2), ...listingRefs.slice(0, 1)]
    },
    {
      sectionId: '13',
      statement: `${draft.dataDependent.benefitRisk} ${draft.dataDependent.conclusion}`,
      tflRefs: [...tableRefs.slice(0, 1), ...figureRefs.slice(0, 1)]
    }
  ];
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
    const tflRefs = extractTflRefs(tflOrRtf);

    const response: CsrResponse = {
      draft,
      ichE3Sections: toIchE3Sections(draft, tflRefs),
      tableFigureListing: toTableFigureListing(tflRefs),
      traceability: toTraceability(draft, tflRefs),
      dataAnchors: [],
      consistency: { overall: 'pass', checks: [] }
    };

    const anchors = buildDataAnchors(draft, response.traceability, tflOrRtf);
    response.dataAnchors = anchors;
    response.consistency = runConsistencyChecks(draft, tflOrRtf, anchors);

    return NextResponse.json({
      ok: true,
      source: qwen ? 'qwen' : 'local-fallback',
      data: response
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'CSR draft generation failed.' }, { status: 500 });
  }
}
