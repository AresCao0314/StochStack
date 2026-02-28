import { NextResponse } from 'next/server';
import lexicons from '@/content/lay-synopsis/lexicons.json';
import meddraMap from '@/content/lay-synopsis/meddra-lay-map.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenerateRequest = {
  text?: string;
  locale?: 'en' | 'zh' | 'de';
  outputLanguage?: 'en' | 'de';
  therapeuticArea?: string;
  indication?: string;
  customLexicon?: Array<{ source: string; target: string }>;
  useMeddraMap?: boolean;
};

type LaySynopsis = {
  title: string;
  plainSummary: string;
  whyStudy: string;
  whoCanJoin: string;
  whatWillHappen: string[];
  possibleBenefits: string;
  possibleRisks: string[];
  participantRights: string[];
  dataPrivacy: string;
  contactAndNextSteps: string;
};

type TraceEntry = {
  section: keyof LaySynopsis;
  layText: string;
  sourceExcerpt: string;
  sourceIndex: number;
  matchScore: number;
};

type LexiconEntry = { source: string; target: string };
type AppliedMapping = { source: string; target: string; scope: 'ta-indication' | 'meddra' | 'custom'; hits: number };

function splitSentences(text: string) {
  return text
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .flatMap((line) => line.split(/[.!?。！？]/))
    .map((x) => x.trim())
    .filter(Boolean);
}

function extractByKeywords(lines: string[], keys: string[]) {
  const lowered = keys.map((k) => k.toLowerCase());
  return lines.find((line) => lowered.some((k) => line.toLowerCase().includes(k))) || '';
}

function localGenerate(text: string, outputLanguage: 'en' | 'de'): LaySynopsis {
  const lines = splitSentences(text);
  const title = extractByKeywords(lines, ['study title', 'title', 'trial']) || lines[0] || 'Lay Language Study Summary';
  const objective = extractByKeywords(lines, ['objective', 'primary', 'endpoint', 'purpose']);
  const population = extractByKeywords(lines, ['population', 'adults', 'participants', 'eligible']);
  const design = extractByKeywords(lines, ['random', 'phase', 'design', 'multicenter', 'participants']);
  const assessments = extractByKeywords(lines, ['assessment', 'scan', 'blood', 'visit', 'monitor']);
  const risks = lines.filter((x) => /(risk|side effect|infection|fatigue|rash|ae|adverse)/i.test(x)).slice(0, 4);
  const rights = lines.filter((x) => /(voluntary|withdraw|consent|rights)/i.test(x)).slice(0, 3);

  if (outputLanguage === 'de') {
    return {
      title,
      plainSummary: objective || 'Diese Studie untersucht Wirksamkeit und Sicherheit einer neuen Behandlung in einfacher Sprache.',
      whyStudy: 'Die Studie soll besser verstehen, ob die neue Behandlung im Vergleich zur Standardtherapie hilfreich ist.',
      whoCanJoin: population || 'Geeignet sind erwachsene Personen, die die Einschlusskriterien des Protokolls erfuellen.',
      whatWillHappen: [design || 'Teilnehmende werden per Zufall einer Behandlungsgruppe zugeordnet.', assessments || 'Regelmaessige Visiten, Laborwerte und Sicherheitskontrollen werden durchgefuehrt.'],
      possibleBenefits: 'Moeglicher Nutzen ist eine bessere Krankheitskontrolle; ein Nutzen kann jedoch nicht garantiert werden.',
      possibleRisks: risks.length ? risks : ['Moegliche Nebenwirkungen koennen auftreten und werden engmaschig ueberwacht.'],
      participantRights: rights.length ? rights : ['Die Teilnahme ist freiwillig.', 'Ein Ruecktritt ist jederzeit ohne Nachteile moeglich.'],
      dataPrivacy: 'Personenbezogene Daten werden gemaess geltenden Datenschutzvorgaben pseudonymisiert verarbeitet.',
      contactAndNextSteps: 'Bei Fragen wenden Sie sich an das Studienteam. Vor Teilnahme erfolgt eine Aufklaerung mit Einwilligung.'
    };
  }

  return {
    title,
    plainSummary: objective || 'This study explains the treatment question in plain language for participants and families.',
    whyStudy:
      'The study aims to understand whether the investigational treatment works and is safe compared with current standard care.',
    whoCanJoin: population || 'Adults who meet protocol eligibility criteria may be able to join.',
    whatWillHappen: [
      design || 'Participants are assigned by chance to treatment groups.',
      assessments || 'Regular visits, scans, blood tests, and safety checks are scheduled.'
    ],
    possibleBenefits:
      'Some participants may benefit, but benefit cannot be guaranteed. The information may help future patients.',
    possibleRisks: risks.length ? risks : ['Side effects may happen and will be monitored closely by the study team.'],
    participantRights: rights.length ? rights : ['Joining is voluntary.', 'Participants can stop at any time without losing routine care.'],
    dataPrivacy:
      'Personal data will be handled under applicable privacy rules and coded before analysis whenever possible.',
    contactAndNextSteps:
      'Please discuss questions with the study team. You will receive informed consent information before participation.'
  };
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, ' ')
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2);
}

function overlapScore(a: string, b: string) {
  const at = new Set(tokenize(a));
  const bt = new Set(tokenize(b));
  if (at.size === 0 || bt.size === 0) return 0;
  let inter = 0;
  at.forEach((x) => {
    if (bt.has(x)) inter += 1;
  });
  return inter / Math.max(at.size, 1);
}

function pickBestSource(layText: string, sourceSentences: string[]) {
  let bestScore = -1;
  let bestIdx = -1;
  for (let i = 0; i < sourceSentences.length; i++) {
    const s = overlapScore(layText, sourceSentences[i]);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  return {
    sourceIndex: bestIdx,
    sourceExcerpt: bestIdx >= 0 ? sourceSentences[bestIdx] : '',
    matchScore: Number(Math.max(0, bestScore).toFixed(2))
  };
}

function buildTraceability(lay: LaySynopsis, sourceText: string): TraceEntry[] {
  const sourceSentences = splitSentences(sourceText);
  const entries: TraceEntry[] = [];
  const pushEntry = (section: keyof LaySynopsis, value: string) => {
    const text = value.trim();
    if (!text) return;
    const best = pickBestSource(text, sourceSentences);
    entries.push({
      section,
      layText: text,
      sourceExcerpt: best.sourceExcerpt,
      sourceIndex: best.sourceIndex,
      matchScore: best.matchScore
    });
  };

  pushEntry('plainSummary', lay.plainSummary);
  pushEntry('whyStudy', lay.whyStudy);
  pushEntry('whoCanJoin', lay.whoCanJoin);
  lay.whatWillHappen.forEach((x) => pushEntry('whatWillHappen', x));
  pushEntry('possibleBenefits', lay.possibleBenefits);
  lay.possibleRisks.forEach((x) => pushEntry('possibleRisks', x));
  lay.participantRights.forEach((x) => pushEntry('participantRights', x));
  pushEntry('dataPrivacy', lay.dataPrivacy);
  pushEntry('contactAndNextSteps', lay.contactAndNextSteps);
  return entries;
}

function normalizeLay(obj: any): LaySynopsis {
  const arr = (v: any) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);
  return {
    title: String(obj?.title ?? ''),
    plainSummary: String(obj?.plainSummary ?? ''),
    whyStudy: String(obj?.whyStudy ?? ''),
    whoCanJoin: String(obj?.whoCanJoin ?? ''),
    whatWillHappen: arr(obj?.whatWillHappen),
    possibleBenefits: String(obj?.possibleBenefits ?? ''),
    possibleRisks: arr(obj?.possibleRisks),
    participantRights: arr(obj?.participantRights),
    dataPrivacy: String(obj?.dataPrivacy ?? ''),
    contactAndNextSteps: String(obj?.contactAndNextSteps ?? '')
  };
}

function stripFence(raw: string) {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
}

function replaceWholeInsensitive(text: string, source: string, target: string) {
  const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'gi');
  let hits = 0;
  const out = text.replace(re, () => {
    hits += 1;
    return target;
  });
  return { out, hits };
}

function applyMappingToLay(lay: LaySynopsis, mappings: Array<LexiconEntry & { scope: AppliedMapping['scope'] }>) {
  const clone: LaySynopsis = JSON.parse(JSON.stringify(lay));
  const applied: AppliedMapping[] = [];
  const fields: Array<keyof LaySynopsis> = [
    'title',
    'plainSummary',
    'whyStudy',
    'whoCanJoin',
    'possibleBenefits',
    'dataPrivacy',
    'contactAndNextSteps'
  ];
  for (const map of mappings) {
    let totalHits = 0;
    for (const f of fields) {
      const current = String(clone[f] ?? '');
      const { out, hits } = replaceWholeInsensitive(current, map.source, map.target);
      clone[f] = out as any;
      totalHits += hits;
    }
    clone.whatWillHappen = clone.whatWillHappen.map((x) => {
      const { out, hits } = replaceWholeInsensitive(x, map.source, map.target);
      totalHits += hits;
      return out;
    });
    clone.possibleRisks = clone.possibleRisks.map((x) => {
      const { out, hits } = replaceWholeInsensitive(x, map.source, map.target);
      totalHits += hits;
      return out;
    });
    clone.participantRights = clone.participantRights.map((x) => {
      const { out, hits } = replaceWholeInsensitive(x, map.source, map.target);
      totalHits += hits;
      return out;
    });
    if (totalHits > 0) {
      applied.push({ source: map.source, target: map.target, scope: map.scope, hits: totalHits });
    }
  }
  return { lay: clone, applied };
}

function selectTaLexicon(therapeuticArea: string, indication: string, outputLanguage: 'en' | 'de') {
  const candidates = (lexicons as Array<any>).filter((x) => x.language === outputLanguage);
  const ta = therapeuticArea.trim().toLowerCase();
  const ind = indication.trim().toLowerCase();
  const matched = candidates.find((x) => x.therapeuticArea.toLowerCase() === ta && x.indication.toLowerCase() === ind);
  if (!matched) return [] as LexiconEntry[];
  return Array.isArray(matched.entries)
    ? matched.entries.map((x: any) => ({ source: String(x.source), target: String(x.target) }))
    : [];
}

function selectMeddraMap(outputLanguage: 'en' | 'de') {
  return (meddraMap as Array<any>).map((x) => ({
    source: String(x.term),
    target: outputLanguage === 'de' ? String(x.lay_de) : String(x.lay_en)
  }));
}

async function generateWithQwen(text: string, outputLanguage: 'en' | 'de') {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;
  const model = process.env.QWEN_MODEL ?? 'qwen-plus';
  const languageRule =
    outputLanguage === 'de'
      ? 'Write in clear German for general public, short sentences, avoid jargon.'
      : 'Write in clear English for general public, short sentences, avoid jargon.';

  const prompt = `Convert protocol/protocol synopsis content into a lay language protocol synopsis for EU-style participant communication.
Return strict JSON with keys:
title, plainSummary, whyStudy, whoCanJoin, whatWillHappen[], possibleBenefits, possibleRisks[], participantRights[], dataPrivacy, contactAndNextSteps.
${languageRule}
Do not invent numeric claims not present in source text.

Source text:
${text.slice(0, 35000)}`;

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
      max_tokens: 2200,
      messages: [
        {
          role: 'system',
          content: 'You return valid JSON only.'
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
  const content = String(data?.choices?.[0]?.message?.content ?? '').trim();
  if (!content) return null;
  const parsed = JSON.parse(stripFence(content));
  return normalizeLay(parsed);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;
    const text = String(body.text ?? '').trim();
    const outputLanguage: 'en' | 'de' = body.outputLanguage === 'de' ? 'de' : 'en';
    const therapeuticArea = String(body.therapeuticArea ?? '');
    const indication = String(body.indication ?? '');
    const useMeddraMap = body.useMeddraMap !== false;
    const customLexicon = Array.isArray(body.customLexicon)
      ? body.customLexicon
          .map((x) => ({ source: String(x.source ?? '').trim(), target: String(x.target ?? '').trim() }))
          .filter((x) => x.source && x.target)
      : [];
    if (text.length < 40) {
      return NextResponse.json({ ok: false, error: 'Please provide at least 40 characters of protocol text.' }, { status: 400 });
    }

    const qwen = await generateWithQwen(text, outputLanguage).catch(() => null);
    const baseLay = qwen ?? localGenerate(text, outputLanguage);
    const taLexicon = selectTaLexicon(therapeuticArea, indication, outputLanguage).map((x: LexiconEntry) => ({
      ...x,
      scope: 'ta-indication' as const
    }));
    const meddraLexicon = useMeddraMap
      ? selectMeddraMap(outputLanguage).map((x: LexiconEntry) => ({ ...x, scope: 'meddra' as const }))
      : [];
    const custom = customLexicon.map((x: LexiconEntry) => ({ ...x, scope: 'custom' as const }));
    const injected = [...taLexicon, ...meddraLexicon, ...custom];
    const { lay, applied } = applyMappingToLay(baseLay, injected);
    const readability = {
      avgSentenceWords: Number(
        (
          lay.plainSummary
            .split(/[.!?]/)
            .map((x) => x.trim())
            .filter(Boolean)
            .map((s) => s.split(/\s+/).length)
            .reduce((a, b, _, arr) => a + b / Math.max(1, arr.length), 0)
        ).toFixed(1)
      ),
      jargonFlags: ['progression-free survival', 'pharmacokinetics', 'randomization', 'metastatic'].filter((w) =>
        JSON.stringify(lay).toLowerCase().includes(w)
      )
    };

    const euChecklist = [
      { item: 'Plain language summary provided', pass: Boolean(lay.plainSummary) },
      { item: 'Who can join clearly stated', pass: Boolean(lay.whoCanJoin) },
      { item: 'Risks and benefits both covered', pass: Boolean(lay.possibleBenefits) && lay.possibleRisks.length > 0 },
      { item: 'Participant rights clearly stated', pass: lay.participantRights.length > 0 },
      { item: 'Data privacy statement included', pass: Boolean(lay.dataPrivacy) }
    ];

    return NextResponse.json({
      ok: true,
      data: lay,
      source: qwen ? 'qwen' : 'local-fallback',
      readability,
      euChecklist,
      traceability: buildTraceability(lay, text),
      lexiconInjection: {
        requested: {
          therapeuticArea,
          indication,
          useMeddraMap,
          customCount: customLexicon.length
        },
        applied
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Lay synopsis generation failed.' }, { status: 500 });
  }
}
