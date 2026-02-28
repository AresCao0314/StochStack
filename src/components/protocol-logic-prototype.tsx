'use client';

import { useMemo, useState } from 'react';
import { Search, Stethoscope, Pill, FlaskConical, MessageSquare, FileUp } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type Criterion = { id: string; text: string };
type MedicationRule = {
  name: string;
  aliases: string[];
  level: 'prohibited' | 'caution' | 'allowed';
  reason: string;
  evidence: string;
  washoutDays: number;
};
type SoaVisit = { visit: string; window: string; activities: string[] };
type LabSpecimen = {
  name: string;
  storage: string;
  stability: string;
  handling: string;
  evidence: string;
};
type LabReagent = { name: string; storage: string; afterOpen: string; evidence: string };
export type ProtocolRecord = {
  id: string;
  trialId: string;
  title: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  summary: string;
  inclusionCriteria: Criterion[];
  exclusionCriteria: Criterion[];
  eligibilityRules: {
    age: { min: number; max: number; evidence: string };
    ecog: { max: number; evidence: string };
    ancMin: { value: number; evidence: string };
    plateletsMin: { value: number; evidence: string };
    altUlnMax: { value: number; evidence: string };
    creatinineClearanceMin: { value: number; evidence: string };
  };
  medicationRestrictions: MedicationRule[];
  soa: SoaVisit[];
  labManual: {
    specimens: LabSpecimen[];
    reagents: LabReagent[];
  };
  graph: {
    nodes: Array<{ id: string; label: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  };
};

type PatientInput = {
  age: number;
  ecog: number;
  anc: number;
  platelets: number;
  altUln: number;
  creatinineClearance: number;
  hasUntreatedCns: boolean;
  activeInfection: boolean;
  pregnant: boolean;
  histologyConfirmed: boolean;
};

const copy: Record<Locale, any> = {
  en: {
    title: 'Protocol Q&A & Logic Engine',
    subtitle:
      'Select a protocol by therapeutic area, ask structured questions, and run patient eligibility / medication restriction / lab manual checks with evidence trace.',
    protocolSelect: 'Select Protocol',
    recommended: 'Recommended Questions',
    askPlaceholder: 'Ask anything about I/E, SoA, prohibited meds, or lab reagent storage...',
    ask: 'Ask',
    answer: 'Answer',
    references: 'Evidence References',
    graph: 'Knowledge Graph Structure',
    inclusion: 'Inclusion Criteria',
    exclusion: 'Exclusion Criteria',
    eligibility: 'Eligibility Check',
    medCheck: 'Medication Restriction Check',
    labCheck: 'Lab Manual Storage Check',
    evaluate: 'Evaluate',
    check: 'Check',
    pass: 'Pass',
    fail: 'Fail',
    caution: 'Caution',
    prohibited: 'Prohibited',
    allowed: 'Allowed',
    medsPlaceholder: 'Enter meds, comma-separated (e.g., ketoconazole, prednisone)',
    reagentPlaceholder: 'Enter reagent/specimen name (e.g., ELISA Substrate A)',
    noMatch: 'No specific match found; showing protocol-level guidance.',
    recQuestions: [
      'What are the inclusion and exclusion criteria?',
      'What is the schedule of activities?',
      'Which medications are prohibited or require caution?',
      'How should ELISA Substrate A be stored?'
    ],
    uploadTitle: 'Upload Protocol PDF -> Auto Structured JSON',
    uploadHint:
      'Upload a protocol PDF. The engine uses Qwen to extract structured schema and inject it into the current protocol selector.',
    upload: 'Upload & Extract',
    uploading: 'Extracting...',
    extracted: 'Extracted protocol added to selector.',
    extractError: 'Extraction failed.'
  },
  zh: {
    title: 'Protocol 问答与逻辑引擎',
    subtitle:
      '先按治疗领域选择 protocol，再进行结构化问答、患者入排判断、用药限制校验与 lab manual 存储条件查询，并给出条款依据。',
    protocolSelect: '选择 Protocol',
    recommended: '推荐问题',
    askPlaceholder: '输入问题：比如入排标准、SoA、禁用药、某试剂存储条件...',
    ask: '提问',
    answer: '回答',
    references: '依据条款',
    graph: '知识图谱结构',
    inclusion: '入组标准',
    exclusion: '排除标准',
    eligibility: '患者入排判断',
    medCheck: '用药禁忌判断',
    labCheck: 'Lab Manual 存储查询',
    evaluate: '开始判断',
    check: '开始检查',
    pass: '可入组',
    fail: '不可入组',
    caution: '慎用',
    prohibited: '禁用',
    allowed: '允许',
    medsPlaceholder: '输入患者用药，逗号分隔（例如 ketoconazole, prednisone）',
    reagentPlaceholder: '输入试剂/样本名称（例如 ELISA Substrate A）',
    noMatch: '未找到精确匹配，已返回 protocol 层面的建议。',
    recQuestions: [
      '这个 protocol 的入组和排除标准是什么？',
      'SoA 访视安排是怎样的？',
      '哪些药是禁用或慎用？',
      'ELISA Substrate A 的存储条件是什么？'
    ],
    uploadTitle: '上传 Protocol PDF -> 自动结构化 JSON',
    uploadHint: '上传 protocol PDF 后，会调用通义千问抽取结构化字段，并自动加入当前协议选择列表。',
    upload: '上传并抽取',
    uploading: '抽取中...',
    extracted: '抽取成功，已加入协议列表。',
    extractError: '抽取失败。'
  },
  de: {
    title: 'Protocol Q&A und Logic Engine',
    subtitle:
      'Protocol nach Therapiegebiet waehlen und strukturierte Q&A-, Eligibility-, Medikations- sowie Lab-Checks mit Evidenzreferenz ausfuehren.',
    protocolSelect: 'Protocol auswaehlen',
    recommended: 'Empfohlene Fragen',
    askPlaceholder: 'Frage zu I/E, SoA, verbotenen Medikamenten oder Reagenz-Storage stellen...',
    ask: 'Fragen',
    answer: 'Antwort',
    references: 'Evidenz',
    graph: 'Knowledge-Graph Struktur',
    inclusion: 'Inclusion Kriterien',
    exclusion: 'Exclusion Kriterien',
    eligibility: 'Eligibility Check',
    medCheck: 'Medication Restriction Check',
    labCheck: 'Lab Manual Storage Check',
    evaluate: 'Auswerten',
    check: 'Pruefen',
    pass: 'Pass',
    fail: 'Fail',
    caution: 'Vorsicht',
    prohibited: 'Verboten',
    allowed: 'Erlaubt',
    medsPlaceholder: 'Medikamente kommagetrennt eingeben (z.B. ketoconazole, prednisone)',
    reagentPlaceholder: 'Reagenz-/Specimen-Name eingeben (z.B. ELISA Substrate A)',
    noMatch: 'Keine exakte Uebereinstimmung, zeige protocol-weite Hinweise.',
    recQuestions: [
      'Was sind die Inclusion/Exclusion Kriterien?',
      'Wie sieht die SoA aus?',
      'Welche Medikamente sind verboten oder nur mit Vorsicht erlaubt?',
      'Wie wird ELISA Substrate A gelagert?'
    ],
    uploadTitle: 'Protocol PDF hochladen -> Strukturierte JSON-Extraktion',
    uploadHint:
      'PDF hochladen, per Qwen strukturieren und direkt in den Protocol-Selector uebernehmen.',
    upload: 'Hochladen & Extrahieren',
    uploading: 'Extrahiere...',
    extracted: 'Extraktion erfolgreich, Protocol wurde hinzugefuegt.',
    extractError: 'Extraktion fehlgeschlagen.'
  }
};

function askProtocol(protocol: ProtocolRecord, question: string, locale: Locale) {
  const q = question.toLowerCase();
  const refs: string[] = [];

  if (q.includes('inclusion') || q.includes('exclusion') || q.includes('入排') || q.includes('标准') || q.includes('kriterien')) {
    refs.push(...protocol.inclusionCriteria.map((x) => x.id), ...protocol.exclusionCriteria.map((x) => x.id));
    const body =
      locale === 'zh'
        ? `入组标准：\n${protocol.inclusionCriteria.map((x) => `- ${x.id}: ${x.text}`).join('\n')}\n\n排除标准：\n${protocol.exclusionCriteria.map((x) => `- ${x.id}: ${x.text}`).join('\n')}`
        : `Inclusion:\n${protocol.inclusionCriteria.map((x) => `- ${x.id}: ${x.text}`).join('\n')}\n\nExclusion:\n${protocol.exclusionCriteria.map((x) => `- ${x.id}: ${x.text}`).join('\n')}`;
    return { body, refs };
  }

  if (q.includes('soa') || q.includes('schedule') || q.includes('visit') || q.includes('访视')) {
    refs.push('Schedule of Activities');
    return {
      body: protocol.soa
        .map((v) => `- ${v.visit} (${v.window}): ${v.activities.join(', ')}`)
        .join('\n'),
      refs
    };
  }

  if (q.includes('med') || q.includes('drug') || q.includes('药') || q.includes('禁用') || q.includes('medik')) {
    refs.push(...protocol.medicationRestrictions.map((x) => x.evidence));
    return {
      body: protocol.medicationRestrictions
        .map((r) => `- ${r.name}: ${r.level.toUpperCase()} | ${r.reason} | washout ${r.washoutDays}d`)
        .join('\n'),
      refs
    };
  }

  if (q.includes('lab') || q.includes('storage') || q.includes('试剂') || q.includes('保存') || q.includes('reagen')) {
    refs.push(...protocol.labManual.reagents.map((x) => x.evidence));
    return {
      body: protocol.labManual.reagents
        .map((r) => `- ${r.name}: ${r.storage}; after open: ${r.afterOpen}`)
        .join('\n'),
      refs
    };
  }

  refs.push('Protocol Summary');
  return { body: protocol.summary, refs };
}

function evaluateEligibility(protocol: ProtocolRecord, p: PatientInput) {
  const reasons: string[] = [];
  const refs: string[] = [];

  const r = protocol.eligibilityRules;

  if (p.age < r.age.min || p.age > r.age.max) {
    reasons.push(`Age out of range (${r.age.min}-${r.age.max}).`);
    refs.push(r.age.evidence);
  }
  if (p.ecog > r.ecog.max) {
    reasons.push(`ECOG above ${r.ecog.max}.`);
    refs.push(r.ecog.evidence);
  }
  if (p.anc < r.ancMin.value) {
    reasons.push(`ANC below ${r.ancMin.value}.`);
    refs.push(r.ancMin.evidence);
  }
  if (p.platelets < r.plateletsMin.value) {
    reasons.push(`Platelets below ${r.plateletsMin.value}.`);
    refs.push(r.plateletsMin.evidence);
  }
  if (p.altUln > r.altUlnMax.value) {
    reasons.push(`ALT/AST above ${r.altUlnMax.value} x ULN.`);
    refs.push(r.altUlnMax.evidence);
  }
  if (p.creatinineClearance < r.creatinineClearanceMin.value) {
    reasons.push(`Creatinine clearance below ${r.creatinineClearanceMin.value} mL/min.`);
    refs.push(r.creatinineClearanceMin.evidence);
  }
  if (p.hasUntreatedCns) {
    reasons.push('Untreated/symptomatic CNS involvement detected.');
    refs.push('E1');
  }
  if (p.activeInfection) {
    reasons.push('Active uncontrolled infection detected.');
    refs.push('E2');
  }
  if (p.pregnant) {
    reasons.push('Pregnancy/Breastfeeding not allowed.');
    refs.push('E3');
  }
  if (!p.histologyConfirmed) {
    reasons.push('Required diagnosis/histology confirmation missing.');
    refs.push('I2');
  }

  return {
    pass: reasons.length === 0,
    reasons,
    refs: Array.from(new Set(refs))
  };
}

function checkMedications(protocol: ProtocolRecord, medsInput: string) {
  const meds = medsInput
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const hits = meds.map((med) => {
    for (const rule of protocol.medicationRestrictions) {
      const all = [rule.name.toLowerCase(), ...rule.aliases.map((x) => x.toLowerCase())];
      if (all.some((token) => med.includes(token) || token.includes(med))) {
        return {
          medication: med,
          level: rule.level,
          reason: rule.reason,
          washoutDays: rule.washoutDays,
          evidence: rule.evidence
        };
      }
    }

    return {
      medication: med,
      level: 'allowed' as const,
      reason: 'No explicit restriction found in protocol rule table.',
      washoutDays: 0,
      evidence: 'N/A'
    };
  });

  return hits;
}

function findLabStorage(protocol: ProtocolRecord, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const specimen = protocol.labManual.specimens.find((x) => x.name.toLowerCase().includes(q));
  if (specimen) {
    return {
      name: specimen.name,
      storage: specimen.storage,
      extra: `${specimen.stability}; ${specimen.handling}`,
      evidence: specimen.evidence
    };
  }

  const reagent = protocol.labManual.reagents.find((x) => x.name.toLowerCase().includes(q));
  if (reagent) {
    return {
      name: reagent.name,
      storage: reagent.storage,
      extra: `After open: ${reagent.afterOpen}`,
      evidence: reagent.evidence
    };
  }

  return null;
}

export function ProtocolLogicPrototype({ locale, protocols }: { locale: Locale; protocols: ProtocolRecord[] }) {
  const t = copy[locale];
  const [protocolList, setProtocolList] = useState(protocols);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTip, setUploadTip] = useState('');
  const [extractedJson, setExtractedJson] = useState<string>('');

  const [therapeuticArea, setTherapeuticArea] = useState('All');
  const [selectedId, setSelectedId] = useState(protocols[0]?.id ?? '');

  const areaOptions = useMemo(
    () => ['All', ...Array.from(new Set(protocolList.map((p) => p.therapeuticArea)))],
    [protocolList]
  );

  const filteredProtocols = useMemo(
    () => protocolList.filter((p) => therapeuticArea === 'All' || p.therapeuticArea === therapeuticArea),
    [protocolList, therapeuticArea]
  );

  const selectedProtocol = filteredProtocols.find((p) => p.id === selectedId) ?? filteredProtocols[0] ?? protocolList[0];

  const [question, setQuestion] = useState(t.recQuestions[0]);
  const [answer, setAnswer] = useState<{ body: string; refs: string[] } | null>(null);

  const [patient, setPatient] = useState<PatientInput>({
    age: 58,
    ecog: 1,
    anc: 2.1,
    platelets: 160,
    altUln: 1.4,
    creatinineClearance: 72,
    hasUntreatedCns: false,
    activeInfection: false,
    pregnant: false,
    histologyConfirmed: true
  });

  const [eligibilityResult, setEligibilityResult] = useState<ReturnType<typeof evaluateEligibility> | null>(null);

  const [medsInput, setMedsInput] = useState('');
  const [medResult, setMedResult] = useState<ReturnType<typeof checkMedications>>([]);

  const [labQuery, setLabQuery] = useState('');
  const [labResult, setLabResult] = useState<ReturnType<typeof findLabStorage> | null>(null);

  async function onExtractProtocol() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadTip('');

    try {
      const form = new FormData();
      form.append('file', uploadFile);

      const res = await fetch('/api/protocol/extract', {
        method: 'POST',
        body: form
      });

      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.protocol) {
        setUploadTip(data?.error || t.extractError);
        return;
      }

      const nextProtocol = data.protocol as ProtocolRecord;
      const nextList = [nextProtocol, ...protocolList.filter((p) => p.id !== nextProtocol.id)];
      setProtocolList(nextList);
      setSelectedId(nextProtocol.id);
      setTherapeuticArea(nextProtocol.therapeuticArea || 'All');
      setExtractedJson(JSON.stringify(nextProtocol, null, 2));
      setUploadTip(t.extracted);
      setUploadFile(null);
    } catch {
      setUploadTip(t.extractError);
    } finally {
      setUploading(false);
    }
  }

  if (!selectedProtocol) return null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="section-title">prototype 04</p>
        <h1 className="text-4xl font-bold md:text-6xl">{t.title}</h1>
        <p className="max-w-4xl text-ink/75">{t.subtitle}</p>
      </header>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
          <FileUp size={16} /> {t.uploadTitle}
        </h2>
        <p className="mb-3 text-sm text-ink/75">{t.uploadHint}</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            className="max-w-sm text-sm"
          />
          <button
            type="button"
            onClick={onExtractProtocol}
            disabled={!uploadFile || uploading}
            className="scanline rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-60"
          >
            {uploading ? t.uploading : t.upload}
          </button>
        </div>
        {uploadTip ? <p className="mt-2 text-xs text-ink/70">{uploadTip}</p> : null}
        {extractedJson ? (
          <details className="mt-3 rounded border border-ink/15 p-2">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.12em]">Extracted JSON Preview</summary>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs">{extractedJson}</pre>
          </details>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="noise-border rounded-lg p-4 lg:col-span-1">
          <p className="mb-2 text-sm font-semibold">{t.protocolSelect}</p>
          <label className="mb-2 block text-xs text-ink/65">Therapeutic Area</label>
          <select
            className="mb-3 w-full rounded border border-ink/20 bg-transparent px-2 py-2 text-sm"
            value={therapeuticArea}
            onChange={(e) => {
              setTherapeuticArea(e.target.value);
              setSelectedId('');
            }}
          >
            {areaOptions.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-xs text-ink/65">Protocol</label>
          <select
            className="w-full rounded border border-ink/20 bg-transparent px-2 py-2 text-sm"
            value={selectedProtocol.id}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {filteredProtocols.map((p) => (
              <option key={p.id} value={p.id}>
                {p.trialId} · {p.indication} · {p.phase}
              </option>
            ))}
          </select>

          <div className="mt-3 rounded border border-ink/15 bg-warm p-3 text-xs text-ink/80">
            <p className="font-medium">{selectedProtocol.title}</p>
            <p className="mt-1">{selectedProtocol.summary}</p>
          </div>
        </article>

        <article className="noise-border rounded-lg p-4 lg:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MessageSquare size={15} /> {t.recommended}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {t.recQuestions.map((q: string) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuestion(q)}
                className="scanline rounded border border-ink/20 px-2 py-1 text-xs"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t.askPlaceholder}
              className="w-full rounded border border-ink/20 bg-transparent px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => setAnswer(askProtocol(selectedProtocol, question, locale))}
              className="scanline rounded border border-ink/20 px-3 py-2 text-sm"
            >
              <Search size={14} className="mr-1 inline" /> {t.ask}
            </button>
          </div>

          {answer ? (
            <div className="mt-3 rounded border border-ink/15 p-3 text-sm">
              <p className="mb-2 font-semibold">{t.answer}</p>
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink/88">{answer.body}</pre>
              <p className="mt-2 text-xs text-ink/65">
                {t.references}: {Array.from(new Set(answer.refs)).join(', ')}
              </p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="noise-border rounded-lg p-4 xl:col-span-1">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Stethoscope size={15} /> {t.eligibility}
          </p>
          <div className="grid gap-2 text-sm">
            <label>Age<input type="number" value={patient.age} onChange={(e) => setPatient({ ...patient, age: Number(e.target.value) })} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-1" /></label>
            <label>ECOG<input type="number" value={patient.ecog} onChange={(e) => setPatient({ ...patient, ecog: Number(e.target.value) })} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-1" /></label>
            <label>ANC<input type="number" step="0.1" value={patient.anc} onChange={(e) => setPatient({ ...patient, anc: Number(e.target.value) })} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-1" /></label>
            <label>Platelets<input type="number" value={patient.platelets} onChange={(e) => setPatient({ ...patient, platelets: Number(e.target.value) })} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-1" /></label>
            <label>ALT/AST x ULN<input type="number" step="0.1" value={patient.altUln} onChange={(e) => setPatient({ ...patient, altUln: Number(e.target.value) })} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-1" /></label>
            <label>CrCl<input type="number" value={patient.creatinineClearance} onChange={(e) => setPatient({ ...patient, creatinineClearance: Number(e.target.value) })} className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-1" /></label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={patient.hasUntreatedCns} onChange={(e) => setPatient({ ...patient, hasUntreatedCns: e.target.checked })} /> untreated CNS</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={patient.activeInfection} onChange={(e) => setPatient({ ...patient, activeInfection: e.target.checked })} /> active infection</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={patient.pregnant} onChange={(e) => setPatient({ ...patient, pregnant: e.target.checked })} /> pregnancy</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={patient.histologyConfirmed} onChange={(e) => setPatient({ ...patient, histologyConfirmed: e.target.checked })} /> diagnosis confirmed</label>
          </div>
          <button
            type="button"
            onClick={() => setEligibilityResult(evaluateEligibility(selectedProtocol, patient))}
            className="scanline mt-3 rounded border border-ink/20 px-3 py-2 text-sm"
          >
            {t.evaluate}
          </button>

          {eligibilityResult ? (
            <div className="mt-3 rounded border border-ink/15 p-3 text-xs">
              <p className={`font-semibold ${eligibilityResult.pass ? 'text-accent1' : 'text-red-600'}`}>
                {eligibilityResult.pass ? t.pass : t.fail}
              </p>
              {eligibilityResult.reasons.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {eligibilityResult.reasons.map((r) => (
                    <li key={r}>- {r}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">All rule checks passed.</p>
              )}
              <p className="mt-2 text-ink/65">{t.references}: {eligibilityResult.refs.join(', ') || 'N/A'}</p>
            </div>
          ) : null}
        </article>

        <article className="noise-border rounded-lg p-4 xl:col-span-1">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Pill size={15} /> {t.medCheck}
          </p>
          <textarea
            value={medsInput}
            onChange={(e) => setMedsInput(e.target.value)}
            placeholder={t.medsPlaceholder}
            className="min-h-28 w-full rounded border border-ink/20 bg-transparent p-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setMedResult(checkMedications(selectedProtocol, medsInput))}
            className="scanline mt-3 rounded border border-ink/20 px-3 py-2 text-sm"
          >
            {t.check}
          </button>

          {medResult.length > 0 ? (
            <div className="mt-3 space-y-2 text-xs">
              {medResult.map((r, idx) => (
                <div key={`${r.medication}-${idx}`} className="rounded border border-ink/15 p-2">
                  <p className="font-medium">{r.medication}</p>
                  <p className="mt-1">
                    {r.level === 'prohibited' ? t.prohibited : r.level === 'caution' ? t.caution : t.allowed}
                  </p>
                  <p className="text-ink/70">{r.reason}</p>
                  <p className="text-ink/60">washout: {r.washoutDays}d · {r.evidence}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className="noise-border rounded-lg p-4 xl:col-span-1">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FlaskConical size={15} /> {t.labCheck}
          </p>
          <input
            value={labQuery}
            onChange={(e) => setLabQuery(e.target.value)}
            placeholder={t.reagentPlaceholder}
            className="w-full rounded border border-ink/20 bg-transparent px-2 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setLabResult(findLabStorage(selectedProtocol, labQuery))}
            className="scanline mt-3 rounded border border-ink/20 px-3 py-2 text-sm"
          >
            {t.check}
          </button>

          {labResult ? (
            <div className="mt-3 rounded border border-ink/15 p-3 text-xs">
              <p className="font-semibold">{labResult.name}</p>
              <p className="mt-1">storage: {labResult.storage}</p>
              <p className="text-ink/70">{labResult.extra}</p>
              <p className="text-ink/60">{labResult.evidence}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-ink/60">{t.noMatch}</p>
          )}
        </article>
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 text-xl font-semibold">{t.graph}</h2>
        <div className="grid gap-3 md:grid-cols-5">
          {selectedProtocol.graph.nodes.map((node) => (
            <div key={node.id} className="rounded border border-ink/15 p-2 text-center text-xs">
              {node.label}
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {selectedProtocol.graph.edges.map((edge) => (
            <div key={`${edge.from}-${edge.to}-${edge.label}`} className="rounded border border-ink/10 p-2 text-xs text-ink/75">
              {edge.from} {'->'} {edge.to}: {edge.label}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="noise-border rounded-lg p-4">
          <h3 className="mb-2 text-lg font-semibold">{t.inclusion}</h3>
          <ul className="space-y-1 text-sm text-ink/85">
            {selectedProtocol.inclusionCriteria.map((x) => (
              <li key={x.id}>- {x.id}: {x.text}</li>
            ))}
          </ul>
        </article>
        <article className="noise-border rounded-lg p-4">
          <h3 className="mb-2 text-lg font-semibold">{t.exclusion}</h3>
          <ul className="space-y-1 text-sm text-ink/85">
            {selectedProtocol.exclusionCriteria.map((x) => (
              <li key={x.id}>- {x.id}: {x.text}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
