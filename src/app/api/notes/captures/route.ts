import { NextResponse } from 'next/server';
import { readCaptures, writeCaptures, type NotesCaptureItem } from '@/lib/server/notes-store';

export const runtime = 'nodejs';

export async function GET() {
  const items = await readCaptures();
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<NotesCaptureItem>;

    if (!body.raw || !body.bullets || body.bullets.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid payload.' }, { status: 400 });
    }

    const item: NotesCaptureItem = {
      id: body.id ?? crypto.randomUUID(),
      createdAt: body.createdAt ?? new Date().toISOString(),
      raw: body.raw.trim(),
      bullets: body.bullets.map((line) => line.trim()).filter(Boolean).slice(0, 8),
      provider: body.provider === 'qwen' ? 'qwen' : 'local-fallback',
      locale: body.locale === 'zh' || body.locale === 'de' ? body.locale : 'en'
    };

    const existing = await readCaptures();
    const next = [item, ...existing.filter((entry) => entry.id !== item.id)].slice(0, 200);
    await writeCaptures(next);

    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to save capture.' }, { status: 500 });
  }
}
