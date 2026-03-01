import { readFile } from 'fs/promises';
import path from 'path';

export type RepoChangelogEntry = {
  date: string;
  title: string;
  items: string[];
};

export type RefreshRun = {
  startedAt: string;
  status: 'success' | 'failed' | 'running';
  warnings: number;
  errors: number;
  lines: string[];
};

const CHANGELOG_PATH = path.join(process.cwd(), 'CHANGELOG.md');
const DEFAULT_REFRESH_LOG = '/runtime-data/logs/market-refresh.log';

function getRefreshLogPath() {
  return process.env.MARKET_REFRESH_LOG_FILE || DEFAULT_REFRESH_LOG;
}

async function safeRead(filePath: string) {
  try {
    return await readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export async function readRepoChangelog(limit = 8): Promise<RepoChangelogEntry[]> {
  const content = await safeRead(CHANGELOG_PATH);
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  const entries: RepoChangelogEntry[] = [];

  let currentDate = '';
  let currentTitle = '';
  let bullets: string[] = [];

  function pushCurrent() {
    if (currentDate && currentTitle) {
      entries.push({ date: currentDate, title: currentTitle, items: bullets.slice() });
    }
    bullets = [];
  }

  for (const line of lines) {
    if (line.startsWith('## ')) {
      pushCurrent();
      currentDate = line.replace('## ', '').trim();
      currentTitle = 'Overview';
      continue;
    }

    if (line.startsWith('### ')) {
      pushCurrent();
      currentTitle = line.replace('### ', '').trim();
      continue;
    }

    if (line.startsWith('- ')) {
      bullets.push(line.replace('- ', '').trim());
    }
  }

  pushCurrent();

  return entries.slice(0, limit);
}

export async function readRecentRefreshRuns(limit = 10): Promise<RefreshRun[]> {
  const content = await safeRead(getRefreshLogPath());
  if (!content) return [];

  const lines = content.split(/\r?\n/).filter(Boolean);
  const runs: RefreshRun[] = [];
  let current: RefreshRun | null = null;

  for (const line of lines) {
    const startMatch = line.match(/^\[(.+?)\]\s+start refresh$/);
    if (startMatch) {
      if (current) runs.push(current);
      current = {
        startedAt: startMatch[1],
        status: 'running',
        warnings: 0,
        errors: 0,
        lines: []
      };
      continue;
    }

    if (!current) continue;

    current.lines.push(line);
    if (line.includes('[WARN]')) current.warnings += 1;
    if (line.includes('[ERROR]')) current.errors += 1;
    if (line.includes('[OK] refresh completed')) current.status = 'success';
  }

  if (current) {
    if (current.status === 'running' && current.errors > 0) {
      current.status = 'failed';
    }
    runs.push(current);
  }

  for (const run of runs) {
    if (run.status === 'running' && run.errors > 0) {
      run.status = 'failed';
    }
  }

  return runs.reverse().slice(0, limit).map((run) => ({
    ...run,
    lines: run.lines.slice(-8)
  }));
}
