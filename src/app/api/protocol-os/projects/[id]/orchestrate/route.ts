import { NextResponse } from 'next/server';
import { orchestrateProtocolOs, orchestrateInputSchema } from '@/core/protocol-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = orchestrateInputSchema.parse({
      projectId: params.id,
      graphVersion: body.graphVersion,
      runMode: body.runMode ?? 'plan_generation'
    });

    const data = await orchestrateProtocolOs(parsed);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
