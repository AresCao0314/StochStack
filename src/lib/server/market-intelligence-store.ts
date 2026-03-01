import { readFile } from 'fs/promises';
import path from 'path';

const DEFAULT_DIR = '/runtime-data/market-intelligence';
const FALLBACK_DIR = path.join(process.cwd(), 'src/content/market-intelligence');

function getDir() {
  return process.env.MARKET_INTEL_DATA_DIR || DEFAULT_DIR;
}

async function safeReadJson(filePath: string) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function readMarketIntelligenceData() {
  const runtimeDir = getDir();

  const runtimeProjects = await safeReadJson(path.join(runtimeDir, 'projects.json'));
  const runtimeSignals = await safeReadJson(path.join(runtimeDir, 'signals.json'));
  const runtimeDigest = await safeReadJson(path.join(runtimeDir, 'digest.json'));

  if (Array.isArray(runtimeProjects) && Array.isArray(runtimeSignals) && runtimeDigest) {
    return {
      projects: runtimeProjects,
      signals: runtimeSignals,
      digest: runtimeDigest
    };
  }

  const fallbackProjects = await safeReadJson(path.join(FALLBACK_DIR, 'projects.json'));
  const fallbackSignals = await safeReadJson(path.join(FALLBACK_DIR, 'signals.json'));
  const fallbackDigest = await safeReadJson(path.join(FALLBACK_DIR, 'digest.json'));

  return {
    projects: Array.isArray(fallbackProjects) ? fallbackProjects : [],
    signals: Array.isArray(fallbackSignals) ? fallbackSignals : [],
    digest: fallbackDigest || {
      updated_at: new Date().toISOString(),
      today: new Date().toISOString().slice(0, 10),
      total_signals: 0,
      new_since_last_run: 0,
      new_published_today: 0,
      watchlist: { total_hits: 0, highlights: [] },
      new_items: []
    }
  };
}
