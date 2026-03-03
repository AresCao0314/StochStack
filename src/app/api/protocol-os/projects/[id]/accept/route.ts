import { NextResponse } from 'next/server';
import { acceptPlan } from '@/core/protocol-os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const planId = body.planId === 'B' ? 'B' : 'A';
    const data = await acceptPlan(params.id, planId, 'local-user');
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
