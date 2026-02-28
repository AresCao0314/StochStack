import { NextResponse } from 'next/server';
import { buildContextKey } from '@/lib/site-feedback';
import { getPolicyState } from '@/lib/server/site-feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId') || 'global-core';
  const contextKey = buildContextKey({
    area: searchParams.get('area') || 'All',
    indication: searchParams.get('indication') || 'All',
    phase: searchParams.get('phase') || 'All',
    country: searchParams.get('country') || 'All',
    sponsor: searchParams.get('sponsor') || 'none'
  });

  const state = await getPolicyState({ profileId, contextKey });
  return NextResponse.json({ ok: true, ...state, contextKey });
}
