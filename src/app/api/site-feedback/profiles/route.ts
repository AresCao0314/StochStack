import { NextResponse } from 'next/server';
import { listProfiles } from '@/lib/server/site-feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const profiles = await listProfiles();
  return NextResponse.json({ ok: true, profiles });
}
