import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import {
  baseWeights,
  normalizeWeights,
  type FeedbackAction,
  type ScoreKey,
  type TeamFeedbackEvent,
  type TeamProfile,
  type Weights
} from '@/lib/site-feedback';

type FeedbackStore = {
  profiles: TeamProfile[];
  events: TeamFeedbackEvent[];
};

type ReasonStats = {
  distinctUsers: number;
  agreement: number;
  pos: number;
  neg: number;
  rawShift: number;
  appliedShift: number;
};

const DEFAULT_FILE = '/data/site-feedback-store.json';
const MAX_EVENTS = 5000;

function getFilePath() {
  if (process.env.SITE_FEEDBACK_DATA_FILE) return process.env.SITE_FEEDBACK_DATA_FILE;
  if (process.env.NODE_ENV === 'production') return DEFAULT_FILE;
  return path.join(process.cwd(), 'data', 'site-feedback-store.json');
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function startOfDay(iso: string) {
  return iso.slice(0, 10);
}

function defaultProfiles(): TeamProfile[] {
  return [
    {
      id: 'global-core',
      name: 'Global Core Team',
      region: 'Global',
      description: 'Balanced global policy with conservative drift.',
      baseWeights,
      policy: {
        consensusThreshold: 0.5,
        minDistinctUsers: 2,
        singleUserDailyCap: 0.02,
        maxWeightShift: 0.06
      }
    },
    {
      id: 'cn-oncology',
      name: 'China Oncology Team',
      region: 'China',
      description: 'Regional bias toward startup speed and execution stability.',
      baseWeights: normalizeWeights({
        ...baseWeights,
        speed: baseWeights.speed + 0.02,
        stability: baseWeights.stability + 0.02,
        sponsorFit: baseWeights.sponsorFit - 0.02,
        competitor: baseWeights.competitor - 0.02
      }),
      policy: {
        consensusThreshold: 0.55,
        minDistinctUsers: 3,
        singleUserDailyCap: 0.015,
        maxWeightShift: 0.05
      }
    }
  ];
}

async function ensureDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function writeStore(store: FeedbackStore) {
  const filePath = getFilePath();
  await ensureDir(filePath);
  const compact: FeedbackStore = {
    profiles: store.profiles,
    events: store.events.slice(-MAX_EVENTS)
  };
  await writeFile(filePath, JSON.stringify(compact, null, 2), 'utf-8');
}

export async function readStore(): Promise<FeedbackStore> {
  const filePath = getFilePath();
  try {
    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as Partial<FeedbackStore>;
    const profiles = Array.isArray(data?.profiles) && data.profiles.length > 0 ? data.profiles : defaultProfiles();
    const events = Array.isArray(data?.events) ? data.events : [];
    return { profiles, events };
  } catch {
    const seeded: FeedbackStore = { profiles: defaultProfiles(), events: [] };
    await writeStore(seeded);
    return seeded;
  }
}

export async function listProfiles() {
  const store = await readStore();
  return store.profiles;
}

export async function appendFeedbackEvent(event: TeamFeedbackEvent) {
  const store = await readStore();
  const next: FeedbackStore = { profiles: store.profiles, events: [...store.events, event].slice(-MAX_EVENTS) };
  await writeStore(next);
}

function signed(action: FeedbackAction) {
  return action === 'like' ? 1 : -1;
}

export function computeEffectiveWeights(input: {
  profile: TeamProfile;
  events: TeamFeedbackEvent[];
  contextKey: string;
}) {
  const { profile, contextKey } = input;
  const events = input.events
    .filter((e) => e.profileId === profile.id)
    .filter((e) => e.contextKey === contextKey || e.contextKey.startsWith(`${contextKey.split('|')[0]}|`))
    .slice(-300);

  const rawShift: Record<ScoreKey, number> = {
    experience: 0,
    speed: 0,
    investigators: 0,
    competitor: 0,
    relevance: 0,
    stability: 0,
    sponsorFit: 0
  };

  const reasonUsers = new Map<ScoreKey, Set<string>>();
  const reasonPos = new Map<ScoreKey, number>();
  const reasonNeg = new Map<ScoreKey, number>();
  const userDaySpent = new Map<string, number>();
  const streakMap = new Map<string, number>();

  for (const key of Object.keys(rawShift) as ScoreKey[]) {
    reasonUsers.set(key, new Set());
    reasonPos.set(key, 0);
    reasonNeg.set(key, 0);
  }

  const ordered = [...events].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  for (const event of ordered) {
    const userDayKey = `${event.userId}|${startOfDay(event.createdAt)}`;
    const spent = userDaySpent.get(userDayKey) ?? 0;
    const sign = signed(event.action);

    for (const reason of event.reasons) {
      const baseDelta = 0.006 * clamp(event.strength, 1, 5);
      const streakKey = `${event.userId}|${event.siteId}|${reason}|${event.action}`;
      const streakCount = streakMap.get(streakKey) ?? 0;
      const decay = 1 / (1 + streakCount * 0.75);

      const remaining = Math.max(0, profile.policy.singleUserDailyCap - spent);
      if (remaining <= 0) continue;

      const absDelta = Math.min(baseDelta * decay, remaining);
      if (absDelta <= 0) continue;

      rawShift[reason] += sign * absDelta;
      userDaySpent.set(userDayKey, spent + absDelta);
      streakMap.set(streakKey, streakCount + 1);
      reasonUsers.get(reason)?.add(event.userId);
      if (sign > 0) reasonPos.set(reason, (reasonPos.get(reason) ?? 0) + absDelta);
      if (sign < 0) reasonNeg.set(reason, (reasonNeg.get(reason) ?? 0) + absDelta);
    }
  }

  const appliedShift: Record<ScoreKey, number> = {
    experience: 0,
    speed: 0,
    investigators: 0,
    competitor: 0,
    relevance: 0,
    stability: 0,
    sponsorFit: 0
  };

  const diagnostics: Record<ScoreKey, ReasonStats> = {} as Record<ScoreKey, ReasonStats>;
  const nextWeights = { ...profile.baseWeights };

  for (const reason of Object.keys(nextWeights) as ScoreKey[]) {
    const pos = reasonPos.get(reason) ?? 0;
    const neg = reasonNeg.get(reason) ?? 0;
    const total = pos + neg;
    const agreement = total === 0 ? 0 : Math.abs(pos - neg) / total;
    const distinctUsers = reasonUsers.get(reason)?.size ?? 0;
    const userFactor = clamp(distinctUsers / profile.policy.minDistinctUsers, 0, 1);
    const consensusFactor = clamp(agreement / profile.policy.consensusThreshold, 0, 1);
    const scale = userFactor * consensusFactor;
    const shift = clamp(rawShift[reason] * scale, -profile.policy.maxWeightShift, profile.policy.maxWeightShift);
    appliedShift[reason] = shift;
    nextWeights[reason] = Math.max(0.05, nextWeights[reason] + shift);
    diagnostics[reason] = {
      distinctUsers,
      agreement: Number(agreement.toFixed(3)),
      pos: Number(pos.toFixed(4)),
      neg: Number(neg.toFixed(4)),
      rawShift: Number(rawShift[reason].toFixed(4)),
      appliedShift: Number(shift.toFixed(4))
    };
  }

  return {
    weights: normalizeWeights(nextWeights as Weights),
    diagnostics,
    sampleSize: events.length
  };
}

export async function getPolicyState(input: { profileId: string; contextKey: string }) {
  const store = await readStore();
  const profile = store.profiles.find((x) => x.id === input.profileId) ?? store.profiles[0];
  const computed = computeEffectiveWeights({ profile, events: store.events, contextKey: input.contextKey });
  const events = store.events
    .filter((e) => e.profileId === profile.id)
    .filter((e) => e.contextKey === input.contextKey || e.contextKey.startsWith(`${input.contextKey.split('|')[0]}|`))
    .slice(-40)
    .reverse();

  return {
    profile,
    ...computed,
    events
  };
}
