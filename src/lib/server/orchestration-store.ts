import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type IntakeEntry = {
  id: string;
  createdAt: string;
  query: string;
  locale: 'en' | 'zh' | 'de';
  requester?: string;
  routedInitiativeId?: string;
  routedInitiativeName?: string;
  confidence: number;
  backlog: boolean;
  rationale: string;
  keySignals: string[];
};

type OrchestrationStore = {
  backlog: IntakeEntry[];
  routed: IntakeEntry[];
};

const MAX_ITEMS = 1000;
const DEFAULT_FILE = '/data/orchestration-intake.json';

function getFilePath() {
  if (process.env.ORCHESTRATION_DATA_FILE) return process.env.ORCHESTRATION_DATA_FILE;
  if (process.env.NODE_ENV === 'production') return DEFAULT_FILE;
  return path.join(process.cwd(), 'data', 'orchestration-intake.json');
}

async function ensureDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function writeStore(store: OrchestrationStore) {
  const filePath = getFilePath();
  await ensureDir(filePath);
  await writeFile(
    filePath,
    JSON.stringify(
      {
        backlog: store.backlog.slice(0, MAX_ITEMS),
        routed: store.routed.slice(0, MAX_ITEMS)
      },
      null,
      2
    ),
    'utf-8'
  );
}

export async function readStore(): Promise<OrchestrationStore> {
  const filePath = getFilePath();
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<OrchestrationStore>;
    return {
      backlog: Array.isArray(parsed?.backlog) ? parsed.backlog : [],
      routed: Array.isArray(parsed?.routed) ? parsed.routed : []
    };
  } catch {
    const empty = { backlog: [], routed: [] };
    await writeStore(empty);
    return empty;
  }
}

export async function appendIntake(entry: IntakeEntry) {
  const store = await readStore();
  const next: OrchestrationStore = {
    backlog: entry.backlog ? [entry, ...store.backlog] : store.backlog,
    routed: entry.backlog ? store.routed : [entry, ...store.routed]
  };
  await writeStore(next);
}

export async function getIntakeDashboard() {
  const store = await readStore();
  return {
    backlogCount: store.backlog.length,
    routedCount: store.routed.length,
    recentBacklog: store.backlog.slice(0, 12),
    recentRouted: store.routed.slice(0, 12)
  };
}
