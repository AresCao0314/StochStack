import { mkdir, readFile } from 'fs/promises';
import path from 'path';

const DEFAULT_FILE = '/runtime-data/vendor-intelligence/signals.json';
const FALLBACK_FILE = path.join(process.cwd(), 'src/content/vendor-intelligence/signals.json');

function getFilePath() {
  return process.env.VENDOR_INTEL_SIGNALS_FILE || DEFAULT_FILE;
}

async function safeReadJson(filePath: string) {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function ensureVendorSignalsDir() {
  const filePath = getFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function readVendorSignals() {
  const primary = await safeReadJson(getFilePath());
  if (primary && Array.isArray(primary.items)) {
    return primary;
  }

  const fallback = await safeReadJson(FALLBACK_FILE);
  if (fallback && Array.isArray(fallback.items)) {
    return fallback;
  }

  return {
    updatedAt: new Date().toISOString(),
    items: []
  };
}
