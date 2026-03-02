import { NextResponse } from 'next/server';
import { linkFeedbackPaths } from '@/lib/protocolWorkflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { feedbackId: string } }) {
  try {
    const body = await request.json();
    const linkedUsdmPaths = Array.isArray(body.linkedUsdmPaths)
      ? body.linkedUsdmPaths.map((x: unknown) => String(x).trim()).filter(Boolean)
      : [];
    const actor = String(body.actor ?? 'workflow.user');

    if (linkedUsdmPaths.length === 0) {
      return NextResponse.json({ ok: false, error: 'linkedUsdmPaths is required.' }, { status: 400 });
    }

    const updated = await linkFeedbackPaths(params.feedbackId, linkedUsdmPaths, actor);

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
