import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type NotesCaptureItem = {
  id: string;
  createdAt: string;
  raw: string;
  bullets: string[];
  provider: 'qwen' | 'local-fallback';
  locale: 'en' | 'zh' | 'de';
};

const DEFAULT_FILE = '/data/notes-captures.json';

function getFilePath() {
  return process.env.NOTES_DATA_FILE || DEFAULT_FILE;
}

async function ensureDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function readCaptures(): Promise<NotesCaptureItem[]> {
  const filePath = getFilePath();
  try {
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as NotesCaptureItem[];
    if (!Array.isArray(data)) return [];
    return data.slice(0, 200);
  } catch {
    return [];
  }
}

export async function writeCaptures(items: NotesCaptureItem[]) {
  const filePath = getFilePath();
  await ensureDir(filePath);
  await writeFile(filePath, JSON.stringify(items.slice(0, 200), null, 2), 'utf-8');
}
