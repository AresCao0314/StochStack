import { NextResponse } from 'next/server';
import { buildContextKey, type FeedbackAction, type ScoreKey, type TeamFeedbackEvent } from '@/lib/site-feedback';
import { appendFeedbackEvent, getPolicyState } from '@/lib/server/site-feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EventPayload = {
  profileId?: string;
  userId?: string;
  siteId?: string;
  siteName?: string;
  action?: FeedbackAction;
  reasons?: ScoreKey[];
  strength?: number;
  area?: string;
  indication?: string;
  phase?: string;
  country?: string;
  sponsor?: string;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EventPayload;
    if (!body.profileId || !body.userId || !body.siteId || !body.siteName || !body.action || !body.reasons?.length) {
      return NextResponse.json({ ok: false, error: 'Invalid payload.' }, { status: 400 });
    }

    const contextKey = buildContextKey({
      area: body.area || 'All',
      indication: body.indication || 'All',
      phase: body.phase || 'All',
      country: body.country || 'All',
      sponsor: body.sponsor || 'none'
    });

    const event: TeamFeedbackEvent = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      profileId: body.profileId,
      userId: body.userId.trim(),
      siteId: body.siteId,
      siteName: body.siteName,
      action: body.action,
      reasons: body.reasons.slice(0, 5),
      strength: Math.min(5, Math.max(1, Number(body.strength ?? 3))),
      contextKey,
      note: body.note?.trim().slice(0, 300)
    };

    await appendFeedbackEvent(event);
    const state = await getPolicyState({ profileId: body.profileId, contextKey });

    return NextResponse.json({ ok: true, event, ...state, contextKey });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to save feedback.' }, { status: 500 });
  }
}
