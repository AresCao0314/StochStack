import type { Kpis, RecruitmentPoint, Site } from '@/lib/opsTwin/types';

export function generateRecruitmentCurve(params: {
  durationMonths: number;
  targetSampleSize: number;
  sites: Site[];
  screenFailRate: number;
  dropoutRate: number;
  competitionIndex: number;
}): RecruitmentPoint[] {
  const { durationMonths, targetSampleSize, sites, screenFailRate, dropoutRate, competitionIndex } = params;

  const monthlyCapacity = sites.reduce((sum, s) => sum + s.expected_recruitment_rate, 0);
  const effectiveRate = monthlyCapacity * (1 - screenFailRate) * (1 - dropoutRate) * (1 - competitionIndex * 0.35);
  const k = Math.max(0.08, Math.min(0.45, 0.14 + effectiveRate / 480));
  const midpoint = Math.max(2, durationMonths * 0.45);

  const curve: RecruitmentPoint[] = [];
  for (let month = 1; month <= durationMonths; month += 1) {
    const logistic = targetSampleSize / (1 + Math.exp(-k * (month - midpoint)));
    const planned = (targetSampleSize / durationMonths) * month;
    curve.push({
      month,
      cumulativeEnrollment: Number(Math.min(targetSampleSize, logistic).toFixed(0)),
      plannedEnrollment: Number(planned.toFixed(0))
    });
  }

  return curve;
}

export function deriveKpis(params: {
  recruitmentCurve: RecruitmentPoint[];
  startupDays: number[];
  targetSampleSize: number;
  sites: Site[];
  risks: Array<{ likelihood: number; impact: number }>;
}): Kpis {
  const { recruitmentCurve, startupDays, targetSampleSize, sites, risks } = params;
  const fpiDay = Math.round(Math.min(...startupDays) + 12);
  const lpiPoint = recruitmentCurve.find((p) => p.cumulativeEnrollment >= targetSampleSize) ?? recruitmentCurve[recruitmentCurve.length - 1];
  const avgRate = Math.max(1, sites.reduce((sum, s) => sum + s.expected_recruitment_rate, 0) / Math.max(1, sites.length));
  const sitesNeeded = Math.ceil((targetSampleSize / Math.max(lpiPoint.month, 1)) / avgRate);
  const totalStartupCost = Math.round(sites.length * 14500 + startupDays.reduce((s, d) => s + d, 0) * 42);
  const overallRiskScore = Number(
    Math.min(
      100,
      Math.round(
        (risks.reduce((sum, r) => sum + r.likelihood * r.impact, 0) / Math.max(1, risks.length)) * 100
      )
    ).toFixed(0)
  );

  return {
    predictedFPI: `Day ${fpiDay}`,
    predictedLPI: `Month ${lpiPoint.month}`,
    sitesNeeded,
    totalStartupCost,
    overallRiskScore
  };
}
