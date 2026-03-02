import { db } from '@/lib/protocolWorkflow/db';

type ParsedField = {
  path: string;
  value: unknown;
  confidence: number;
  evidence: Record<string, unknown>;
};

export const RUN_STATUS = {
  queued: 'queued',
  running: 'running',
  review: 'review',
  validated: 'validated',
  published: 'published',
  failed: 'failed'
} as const;

export const REVIEW_STATE = {
  pending: 'pending',
  accepted: 'accepted',
  edited: 'edited',
  rejected: 'rejected'
} as const;

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeText(raw: string) {
  return raw.replace(/\r/g, '\n').replace(/\t/g, ' ').replace(/[ ]{2,}/g, ' ').trim();
}

function cleanLine(line: string) {
  return line.replace(/^\s*[-*•\d.)]+\s*/, '').trim();
}

function parseSoaLine(line: string): { visit: string; window: string; activities: string[] } | null {
  const parts = line
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;
  return {
    visit: parts[0],
    window: parts[1],
    activities: parts[2]
      .split(/[;,；]/)
      .map((x) => x.trim())
      .filter(Boolean)
  };
}

function extractSections(text: string) {
  const lines = text.split('\n').map((line) => line.trim());
  const sections: Record<string, string[]> = {
    metadata: [],
    inclusion: [],
    exclusion: [],
    soa: [],
    objectives: [],
    safety: []
  };

  let current: keyof typeof sections = 'metadata';

  for (const raw of lines) {
    if (!raw) continue;
    const line = raw.toLowerCase();

    if (line.includes('inclusion criteria') || line.includes('纳入标准')) {
      current = 'inclusion';
      continue;
    }
    if (line.includes('exclusion criteria') || line.includes('排除标准')) {
      current = 'exclusion';
      continue;
    }
    if (line.includes('schedule of activities') || line.startsWith('soa') || line.includes('访视')) {
      current = 'soa';
      continue;
    }
    if (line.includes('objective')) {
      current = 'objectives';
      continue;
    }
    if (line.includes('safety monitoring') || line.includes('safety')) {
      current = 'safety';
      continue;
    }

    sections[current].push(raw);
  }

  return sections;
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

function detectPhase(text: string) {
  const t = text.toLowerCase();
  if (t.includes('phase 1') || t.includes('phase i')) return 'Phase 1';
  if (t.includes('phase 2') || t.includes('phase ii')) return 'Phase 2';
  if (t.includes('phase 3') || t.includes('phase iii')) return 'Phase 3';
  if (t.includes('phase 4') || t.includes('phase iv')) return 'Phase 4';
  return 'Unknown';
}

function estimateConfidence(text: string, type: 'metadata' | 'inclusion' | 'exclusion' | 'soa' | 'default') {
  if (!text) return 0.2;
  const base =
    type === 'metadata' ? 0.82 : type === 'inclusion' ? 0.8 : type === 'exclusion' ? 0.78 : type === 'soa' ? 0.75 : 0.7;
  const lengthBoost = Math.min(0.12, text.length / 300);
  return Number(Math.min(0.96, base + lengthBoost).toFixed(2));
}

function buildFields(documentId: string, rawText: string): ParsedField[] {
  const text = normalizeText(rawText);
  const sections = extractSections(text);
  const fields: ParsedField[] = [];

  const title = sections.metadata[0] || 'Untitled Protocol';
  const meta = {
    title,
    therapeuticArea: detectTherapeuticArea(text),
    indication: detectIndication(text),
    phase: detectPhase(text)
  };

  fields.push({
    path: 'metadata.title',
    value: meta.title,
    confidence: estimateConfidence(meta.title, 'metadata'),
    evidence: { docId: documentId, page: 1, startChar: 0, endChar: Math.min(meta.title.length, 200), quote: meta.title, chunkId: 'metadata-0' }
  });

  fields.push({
    path: 'metadata.therapeuticArea',
    value: meta.therapeuticArea,
    confidence: estimateConfidence(meta.therapeuticArea, 'metadata'),
    evidence: { docId: documentId, page: 1, quote: meta.therapeuticArea, chunkId: 'metadata-ta' }
  });

  fields.push({
    path: 'metadata.indication',
    value: meta.indication,
    confidence: estimateConfidence(meta.indication, 'metadata'),
    evidence: { docId: documentId, page: 1, quote: meta.indication, chunkId: 'metadata-ind' }
  });

  fields.push({
    path: 'metadata.phase',
    value: meta.phase,
    confidence: estimateConfidence(meta.phase, 'metadata'),
    evidence: { docId: documentId, page: 1, quote: meta.phase, chunkId: 'metadata-phase' }
  });

  sections.inclusion.forEach((raw, idx) => {
    const textValue = cleanLine(raw);
    if (!textValue) return;
    fields.push({
      path: `eligibility.inclusion[${idx}]`,
      value: textValue,
      confidence: estimateConfidence(textValue, 'inclusion'),
      evidence: {
        docId: documentId,
        page: 1,
        quote: raw,
        chunkId: `inclusion-${idx}`
      }
    });
  });

  sections.exclusion.forEach((raw, idx) => {
    const textValue = cleanLine(raw);
    if (!textValue) return;
    fields.push({
      path: `eligibility.exclusion[${idx}]`,
      value: textValue,
      confidence: estimateConfidence(textValue, 'exclusion'),
      evidence: {
        docId: documentId,
        page: 1,
        quote: raw,
        chunkId: `exclusion-${idx}`
      }
    });
  });

  sections.soa.forEach((raw, idx) => {
    const row = parseSoaLine(raw);
    if (!row) return;

    fields.push({
      path: `soa.visits[${idx}].name`,
      value: row.visit,
      confidence: estimateConfidence(row.visit, 'soa'),
      evidence: { docId: documentId, page: 1, quote: raw, chunkId: `soa-${idx}` }
    });

    fields.push({
      path: `soa.visits[${idx}].window`,
      value: row.window,
      confidence: estimateConfidence(row.window, 'soa'),
      evidence: { docId: documentId, page: 1, quote: raw, chunkId: `soa-${idx}` }
    });

    fields.push({
      path: `soa.visits[${idx}].activities`,
      value: row.activities,
      confidence: estimateConfidence(row.activities.join('; '), 'soa'),
      evidence: { docId: documentId, page: 1, quote: raw, chunkId: `soa-${idx}` }
    });
  });

  if (sections.objectives.length > 0) {
    fields.push({
      path: 'study.objective.primary',
      value: cleanLine(sections.objectives[0]),
      confidence: estimateConfidence(sections.objectives[0], 'default'),
      evidence: { docId: documentId, page: 1, quote: sections.objectives[0], chunkId: 'objective-0' }
    });
  }

  if (sections.safety.length > 0) {
    fields.push({
      path: 'study.safetyMonitoring',
      value: cleanLine(sections.safety[0]),
      confidence: estimateConfidence(sections.safety[0], 'default'),
      evidence: { docId: documentId, page: 1, quote: sections.safety[0], chunkId: 'safety-0' }
    });
  }

  return fields;
}

function fieldsToUsdm(runId: string, fields: Array<{ path: string; value: unknown }>) {
  const lookup = new Map(fields.map((field) => [field.path, field.value]));
  const inclusion = fields
    .filter((field) => field.path.startsWith('eligibility.inclusion['))
    .map((field, idx) => ({ id: `I${idx + 1}`, text: String(field.value) }));
  const exclusion = fields
    .filter((field) => field.path.startsWith('eligibility.exclusion['))
    .map((field, idx) => ({ id: `E${idx + 1}`, text: String(field.value) }));

  const visitIndexes = Array.from(
    new Set(
      fields
        .filter((field) => field.path.startsWith('soa.visits['))
        .map((field) => Number(field.path.match(/soa\.visits\[(\d+)\]/)?.[1] ?? -1))
        .filter((x) => x >= 0)
    )
  ).sort((a, b) => a - b);

  const visits = visitIndexes.map((idx) => ({
    name: String(lookup.get(`soa.visits[${idx}].name`) ?? `Visit ${idx + 1}`),
    window: String(lookup.get(`soa.visits[${idx}].window`) ?? 'TBD'),
    activities: Array.isArray(lookup.get(`soa.visits[${idx}].activities`))
      ? (lookup.get(`soa.visits[${idx}].activities`) as string[])
      : []
  }));

  return {
    schemaVersion: 'USDM-1.0.0',
    runId,
    study: {
      id: `USDM-${runId}`,
      title: String(lookup.get('metadata.title') ?? 'Untitled Protocol')
    },
    studyDesign: {
      therapeuticArea: String(lookup.get('metadata.therapeuticArea') ?? 'Unknown'),
      indication: String(lookup.get('metadata.indication') ?? 'Unknown'),
      phase: String(lookup.get('metadata.phase') ?? 'Unknown')
    },
    eligibility: {
      inclusion,
      exclusion
    },
    scheduleOfActivities: visits,
    endpoints: fields
      .filter((field) => field.path.startsWith('endpoint.'))
      .map((field) => ({ path: field.path, value: field.value }))
  };
}

function usdmToDdf(usdm: ReturnType<typeof fieldsToUsdm>) {
  return {
    runId: usdm.runId,
    generatedAt: new Date().toISOString(),
    nodes: [
      { id: 'source.protocol', label: 'Protocol Source' },
      { id: 'extract.fields', label: 'Extracted Fields' },
      { id: 'artifact.usdm', label: 'USDM Artifact' },
      { id: 'ops.edc', label: 'EDC Build' },
      { id: 'ops.rtsm', label: 'RTSM Setup' },
      { id: 'ops.monitoring', label: 'Monitoring Plan' }
    ],
    links: [
      { from: 'source.protocol', to: 'extract.fields', note: 'chunk + evidence mapping' },
      { from: 'extract.fields', to: 'artifact.usdm', note: 'canonical mapping' },
      { from: 'artifact.usdm', to: 'ops.edc', note: 'forms and edit checks' },
      { from: 'artifact.usdm', to: 'ops.rtsm', note: 'visit windows and dosing flow' },
      { from: 'artifact.usdm', to: 'ops.monitoring', note: 'risk and oversight plan' }
    ]
  };
}

export async function createStudy(input: { name: string; indication: string; phase: string }) {
  return db.study.create({
    data: {
      name: input.name,
      indication: input.indication,
      phase: input.phase
    }
  });
}

export async function ingestDocument(input: {
  studyId: string;
  type: string;
  filename: string;
  mimeType: string;
  versionTag: string;
  textExtract: string;
}) {
  return db.document.create({
    data: input
  });
}

export async function runExtraction(input: {
  studyId: string;
  documentId: string;
  modelName?: string;
  promptVersion?: string;
}) {
  const document = await db.document.findUnique({
    where: { id: input.documentId }
  });

  if (!document || document.studyId !== input.studyId) {
    throw new Error('Document not found for study');
  }

  const run = await db.extractionRun.create({
    data: {
      studyId: input.studyId,
      documentId: input.documentId,
      status: RUN_STATUS.running,
      modelName: input.modelName ?? 'qwen-plus-fallback',
      promptVersion: input.promptVersion ?? 'workflow-v0.3.0',
      startedAt: new Date()
    }
  });

  await db.auditLog.create({
    data: {
      actor: 'system.extractor',
      action: 'run.started',
      entityType: 'ExtractionRun',
      entityId: run.id,
      payload: JSON.stringify({ documentId: document.id })
    }
  });

  const rawText = document.textExtract ?? '';
  const parsedFields = buildFields(document.id, rawText);

  for (const field of parsedFields) {
    await db.extractedField.create({
      data: {
        runId: run.id,
        path: field.path,
        value: JSON.stringify(field.value),
        confidence: field.confidence,
        evidence: JSON.stringify(field.evidence),
        reviewerState: REVIEW_STATE.pending
      }
    });
  }

  await db.extractionRun.update({
    where: { id: run.id },
    data: {
      status: RUN_STATUS.review,
      finishedAt: new Date()
    }
  });

  await db.auditLog.create({
    data: {
      actor: 'system.extractor',
      action: 'run.ready_for_review',
      entityType: 'ExtractionRun',
      entityId: run.id,
      payload: JSON.stringify({ extractedFields: parsedFields.length })
    }
  });

  return db.extractionRun.findUnique({
    where: { id: run.id },
    include: { fields: true, document: true, study: true }
  });
}

export async function buildArtifactsForRun(runId: string) {
  const fields = await db.extractedField.findMany({
    where: {
      runId,
      reviewerState: { not: REVIEW_STATE.rejected }
    },
    orderBy: { path: 'asc' }
  });

  const normalizedFields = fields.map((field) => ({
    path: field.path,
    value:
      field.reviewerState === REVIEW_STATE.edited && field.reviewerEdits
        ? parseJson(field.reviewerEdits, field.reviewerEdits)
        : parseJson(field.value, field.value)
  }));

  const usdm = fieldsToUsdm(runId, normalizedFields);
  const ddf = usdmToDdf(usdm);

  await db.uSDMArtifact.upsert({
    where: { runId },
    update: { usdmJson: JSON.stringify(usdm), schemaVersion: usdm.schemaVersion },
    create: {
      runId,
      usdmJson: JSON.stringify(usdm),
      schemaVersion: usdm.schemaVersion
    }
  });

  await db.dDFArtifact.upsert({
    where: { runId },
    update: { ddfJson: JSON.stringify(ddf) },
    create: {
      runId,
      ddfJson: JSON.stringify(ddf)
    }
  });

  await db.auditLog.create({
    data: {
      actor: 'system.publisher',
      action: 'artifact.generated',
      entityType: 'ExtractionRun',
      entityId: runId,
      payload: JSON.stringify({ usdmSchemaVersion: usdm.schemaVersion })
    }
  });

  return { usdm, ddf };
}

export async function listStudies() {
  return db.study.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      documents: { orderBy: { uploadedAt: 'desc' } },
      runs: { orderBy: { startedAt: 'desc' } },
      feedback: { orderBy: { amendmentDate: 'desc' } }
    }
  });
}

export async function getStudyWithWorkflow(studyId: string) {
  return db.study.findUnique({
    where: { id: studyId },
    include: {
      documents: { orderBy: { uploadedAt: 'desc' } },
      runs: {
        orderBy: { startedAt: 'desc' },
        include: { fields: true, usdmArtifact: true, ddfArtifact: true }
      },
      feedback: { orderBy: { amendmentDate: 'desc' } }
    }
  });
}

export async function getRun(runId: string) {
  return db.extractionRun.findUnique({
    where: { id: runId },
    include: {
      fields: { orderBy: { path: 'asc' } },
      document: true,
      study: true,
      usdmArtifact: true,
      ddfArtifact: true
    }
  });
}

export async function transitionRunStatus(runId: string, status: string, actor: string, action: string, payload: unknown) {
  const run = await db.extractionRun.update({
    where: { id: runId },
    data: {
      status,
      finishedAt: new Date()
    }
  });

  await db.auditLog.create({
    data: {
      actor,
      action,
      entityType: 'ExtractionRun',
      entityId: runId,
      payload: JSON.stringify(payload)
    }
  });

  return run;
}
