import { db } from '@/lib/protocolWorkflow/db';
import type { DiffChange, ImpactItem } from '@/lib/protocolWorkflow/types';
import { REVIEW_STATE } from '@/lib/protocolWorkflow/extraction';

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toComparableValue(value: unknown) {
  return JSON.stringify(value);
}

function pathDomain(path: string): ImpactItem['domain'] {
  if (path.startsWith('eligibility.')) return 'Eligibility';
  if (path.startsWith('soa.')) return 'SoA';
  if (path.startsWith('endpoint.')) return 'Endpoint';
  if (path.startsWith('studyDesign.arms')) return 'Arms';
  if (path.startsWith('visits.') || path.includes('.visits[')) return 'Visits';
  if (path.includes('safety')) return 'Safety';
  return 'Other';
}

const downstreamMapping: Record<ImpactItem['domain'], string[]> = {
  Eligibility: ['Recruitment', 'EDC build', 'Screening workflow'],
  SoA: ['EDC build', 'RTSM', 'Site training'],
  Endpoint: ['Stat programming', 'Monitoring', 'Closeout'],
  Arms: ['RTSM', 'Drug supply', 'Site activation'],
  Visits: ['Monitoring', 'Site operations', 'Patient schedule'],
  Safety: ['PV workflow', 'Medical monitoring', 'Regulatory reporting'],
  Other: ['Clinical operations']
};

export function computeImpactList(changes: DiffChange[]): ImpactItem[] {
  return changes.map((change) => {
    const domain = pathDomain(change.path);
    return {
      domain,
      path: change.path,
      changeType: change.type,
      downstream: downstreamMapping[domain],
      rationale: `${domain} changed at ${change.path}, which can affect ${downstreamMapping[domain].join(', ')}.`
    };
  });
}

type ComparableField = {
  path: string;
  value: unknown;
  confidence: number;
  evidence?: Record<string, unknown>;
};

export function computeChangesFromFields(baseFields: ComparableField[], compareFields: ComparableField[]) {
  const baseMap = new Map(baseFields.map((field) => [field.path, field]));
  const compareMap = new Map(compareFields.map((field) => [field.path, field]));
  const allPaths = Array.from(new Set([...baseMap.keys(), ...compareMap.keys()])).sort();
  const changes: DiffChange[] = [];

  for (const path of allPaths) {
    const before = baseMap.get(path);
    const after = compareMap.get(path);

    if (!before && after) {
      changes.push({
        type: 'add',
        path,
        before: null,
        after: after.value,
        afterConfidence: after.confidence,
        evidence: {
          quote: after.evidence?.quote as string | undefined,
          page: (after.evidence?.page as number | undefined) ?? null,
          chunkId: after.evidence?.chunkId as string | undefined
        }
      });
      continue;
    }

    if (before && !after) {
      changes.push({
        type: 'remove',
        path,
        before: before.value,
        after: null,
        beforeConfidence: before.confidence,
        evidence: {
          quote: before.evidence?.quote as string | undefined,
          page: (before.evidence?.page as number | undefined) ?? null,
          chunkId: before.evidence?.chunkId as string | undefined
        }
      });
      continue;
    }

    if (before && after && toComparableValue(before.value) !== toComparableValue(after.value)) {
      changes.push({
        type: 'modify',
        path,
        before: before.value,
        after: after.value,
        beforeConfidence: before.confidence,
        afterConfidence: after.confidence,
        evidence: {
          quote: after.evidence?.quote as string | undefined,
          page: (after.evidence?.page as number | undefined) ?? null,
          chunkId: after.evidence?.chunkId as string | undefined
        }
      });
    }
  }

  return changes;
}

export async function generateChangeSet(baseRunId: string, compareRunId: string) {
  const [baseFields, compareFields] = await Promise.all([
    db.extractedField.findMany({
      where: { runId: baseRunId, reviewerState: { not: REVIEW_STATE.rejected } },
      orderBy: { path: 'asc' }
    }),
    db.extractedField.findMany({
      where: { runId: compareRunId, reviewerState: { not: REVIEW_STATE.rejected } },
      orderBy: { path: 'asc' }
    })
  ]);

  const changes = computeChangesFromFields(
    baseFields.map((field) => ({
      path: field.path,
      value:
        field.reviewerState === REVIEW_STATE.edited && field.reviewerEdits
          ? parseJson(field.reviewerEdits, field.reviewerEdits)
          : parseJson(field.value, field.value),
      confidence: field.confidence,
      evidence: parseJson(field.evidence, {})
    })),
    compareFields.map((field) => ({
      path: field.path,
      value:
        field.reviewerState === REVIEW_STATE.edited && field.reviewerEdits
          ? parseJson(field.reviewerEdits, field.reviewerEdits)
          : parseJson(field.value, field.value),
      confidence: field.confidence,
      evidence: parseJson(field.evidence, {})
    }))
  );

  const summary = `Detected ${changes.length} object-level changes between runs ${baseRunId} and ${compareRunId}.`;

  const existing = await db.changeSet.findFirst({
    where: { baseRunId, compareRunId },
    orderBy: { generatedAt: 'desc' }
  });

  if (existing) {
    return db.changeSet.update({
      where: { id: existing.id },
      data: { summary, changes: JSON.stringify(changes) }
    });
  }

  return db.changeSet.create({
    data: {
      baseRunId,
      compareRunId,
      summary,
      changes: JSON.stringify(changes)
    }
  });
}
