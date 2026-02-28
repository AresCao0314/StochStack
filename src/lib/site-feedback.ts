export type ScoreKey =
  | 'experience'
  | 'speed'
  | 'investigators'
  | 'competitor'
  | 'relevance'
  | 'stability'
  | 'sponsorFit';

export type Weights = Record<ScoreKey, number>;

export type FeedbackAction = 'like' | 'dislike';

export type TeamPolicy = {
  consensusThreshold: number;
  minDistinctUsers: number;
  singleUserDailyCap: number;
  maxWeightShift: number;
};

export type TeamProfile = {
  id: string;
  name: string;
  region: string;
  description: string;
  baseWeights: Weights;
  policy: TeamPolicy;
};

export type TeamFeedbackEvent = {
  id: string;
  createdAt: string;
  profileId: string;
  userId: string;
  siteId: string;
  siteName: string;
  action: FeedbackAction;
  reasons: ScoreKey[];
  strength: number;
  contextKey: string;
  note?: string;
};

export const baseWeights: Weights = {
  experience: 0.24,
  speed: 0.18,
  investigators: 0.14,
  competitor: 0.14,
  relevance: 0.16,
  stability: 0.1,
  sponsorFit: 0.04
};

export function normalizeWeights(weights: Weights): Weights {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const out = { ...weights } as Weights;
  (Object.keys(out) as ScoreKey[]).forEach((k) => {
    out[k] = out[k] / sum;
  });
  return out;
}

export function buildContextKey(input: {
  area: string;
  indication: string;
  phase: string;
  country: string;
  sponsor: string;
}) {
  return [input.area, input.indication, input.phase, input.country, input.sponsor].map((x) => x || 'All').join('|');
}
