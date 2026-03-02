import { NextResponse } from 'next/server';
import { db } from '@/lib/protocolWorkflow/db';
import { ingestDocument, runExtraction } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseDocumentType(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === 'protocol') return 'protocol';
  if (value === 'amendment') return 'amendment';
  if (value === 'sap') return 'sap';
  if (value === 'soa') return 'soa';
  return 'other';
}

export async function GET(_: Request, { params }: { params: { studyId: string } }) {
  try {
    const documents = await db.document.findMany({
      where: { studyId: params.studyId },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json({ ok: true, data: documents });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { studyId: string } }) {
  try {
    const form = await request.formData();
    const type = parseDocumentType(String(form.get('type') ?? 'protocol'));
    const versionTag = String(form.get('versionTag') ?? 'v1.0');
    const runImmediately = String(form.get('runImmediately') ?? 'true') !== 'false';

    let textExtract = String(form.get('text') ?? '');
    let filename = String(form.get('filename') ?? 'protocol.txt');
    let mimeType = String(form.get('mimeType') ?? 'text/plain');

    const file = form.get('file');
    if (file instanceof File) {
      const bytes = await file.arrayBuffer();
      textExtract = Buffer.from(bytes).toString('utf8');
      filename = file.name;
      mimeType = file.type || 'text/plain';
    }

    if (!textExtract.trim()) {
      return NextResponse.json({ ok: false, error: 'Document text is required.' }, { status: 400 });
    }

    const document = await ingestDocument({
      studyId: params.studyId,
      type,
      filename,
      mimeType,
      versionTag,
      textExtract
    });

    if (!runImmediately) {
      return NextResponse.json({ ok: true, data: { document } });
    }

    const run = await runExtraction({
      studyId: params.studyId,
      documentId: document.id
    });

    return NextResponse.json({ ok: true, data: { document, run } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
