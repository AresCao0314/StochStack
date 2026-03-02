import { NextResponse } from 'next/server';
import { getStudyWithWorkflow } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { studyId: string } }) {
  try {
    const study = await getStudyWithWorkflow(params.studyId);
    if (!study) {
      return NextResponse.json({ ok: false, error: 'Study not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: study });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
