import { NextResponse } from 'next/server';
import { importFeedbackRows, parseFeedbackCsv } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { studyId: string } }) {
  try {
    const form = await request.formData();
    let csvText = String(form.get('csv') ?? '');
    const actor = String(form.get('actor') ?? 'workflow.user');

    const file = form.get('file');
    if (file instanceof File) {
      const bytes = await file.arrayBuffer();
      csvText = Buffer.from(bytes).toString('utf8');
    }

    if (!csvText.trim()) {
      return NextResponse.json({ ok: false, error: 'CSV content is required.' }, { status: 400 });
    }

    const rows = parseFeedbackCsv(csvText);
    const created = await importFeedbackRows(params.studyId, rows, actor);

    return NextResponse.json({ ok: true, data: { imported: created.length, rows: created } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
