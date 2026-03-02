import { db } from '@/lib/protocolWorkflow/db';
import type { CsvFeedbackRow } from '@/lib/protocolWorkflow/types';

function normalizeCategory(raw: string): string {
  const val = raw.trim().toLowerCase();
  if (val === 'eligibility') return 'eligibility';
  if (val === 'soa') return 'soa';
  if (val === 'endpoint') return 'endpoint';
  if (val === 'safety') return 'safety';
  return 'other';
}

export function parseFeedbackCsv(csvText: string): CsvFeedbackRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    const [date, category, ...rest] = line.split(',');
    return {
      date: (date ?? '').trim(),
      category: normalizeCategory((category ?? '').trim()),
      description: rest.join(',').trim()
    } as CsvFeedbackRow;
  });
}

export function suggestUsdmPaths(description: string) {
  const lower = description.toLowerCase();
  const suggestions: string[] = [];

  if (lower.includes('inclusion') || lower.includes('exclusion') || lower.includes('eligibility')) {
    suggestions.push('eligibility.inclusion[0]', 'eligibility.exclusion[0]', 'metadata.indication');
  }
  if (lower.includes('visit') || lower.includes('schedule') || lower.includes('window') || lower.includes('soa')) {
    suggestions.push('soa.visits[0].window', 'soa.visits[0].activities', 'soa.visits[1].name');
  }
  if (lower.includes('endpoint') || lower.includes('assessment')) {
    suggestions.push('endpoint.primary', 'endpoint.secondary', 'soa.visits[1].activities');
  }
  if (lower.includes('safety') || lower.includes('ae')) {
    suggestions.push('study.safetyMonitoring', 'endpoint.safety', 'soa.visits[0].activities');
  }

  if (suggestions.length === 0) {
    suggestions.push('metadata.title', 'eligibility.inclusion[0]', 'soa.visits[0].window');
  }

  return Array.from(new Set(suggestions)).slice(0, 3);
}

export async function importFeedbackRows(studyId: string, rows: CsvFeedbackRow[], actor = 'workflow.user') {
  const created = [];

  for (const row of rows) {
    const createdRow = await db.feedbackAmendment.create({
      data: {
        studyId,
        amendmentDate: new Date(row.date),
        category: row.category,
        description: row.description,
        linkedUsdmPaths: JSON.stringify(suggestUsdmPaths(row.description))
      }
    });

    created.push(createdRow);

    await db.auditLog.create({
      data: {
        actor,
        action: 'feedback.imported',
        entityType: 'FeedbackAmendment',
        entityId: createdRow.id,
        payload: JSON.stringify({
          studyId,
          category: row.category,
          suggestedPaths: suggestUsdmPaths(row.description)
        })
      }
    });
  }

  return created;
}

export async function linkFeedbackPaths(feedbackId: string, linkedUsdmPaths: string[], actor = 'workflow.user') {
  const updated = await db.feedbackAmendment.update({
    where: { id: feedbackId },
    data: { linkedUsdmPaths: JSON.stringify(linkedUsdmPaths) }
  });

  await db.auditLog.create({
    data: {
      actor,
      action: 'feedback.linked_paths',
      entityType: 'FeedbackAmendment',
      entityId: feedbackId,
      payload: JSON.stringify({ linkedUsdmPaths })
    }
  });

  return updated;
}
