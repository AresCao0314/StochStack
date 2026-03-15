import { siteFeasibilityMock } from '@/lib/site-feasibility-platform/mock-data';
import type {
  RecommendationRecord,
  ScenarioRecord,
  SettingsRecord,
  SiteRecord,
  SfpDataset
} from '@/lib/site-feasibility-platform/types';

export function getSiteFeasibilityDataset(): SfpDataset {
  return siteFeasibilityMock;
}

export function computeSiteScore(site: SiteRecord, settings: SettingsRecord, scenario?: ScenarioRecord) {
  const weights = scenario
    ? {
        patientMatch: scenario.assumptions.enrollmentWeight * 100,
        startupSpeed: scenario.assumptions.startupWeight * 100,
        diversityFit: scenario.assumptions.diversityWeight * 100,
        competitionPenalty: scenario.assumptions.competitionPenalty * 100,
        dataQuality: 18
      }
    : settings.scoringWeights;

  const speedScore = Math.max(0, 100 - site.startupDays * 0.7);
  const competitionSafe = Math.max(0, 100 - site.competitionRisk);
  const score =
    (site.patientMatchScore * weights.patientMatch +
      speedScore * weights.startupSpeed +
      site.diversityFit * weights.diversityFit +
      competitionSafe * weights.competitionPenalty +
      site.dataQualityScore * weights.dataQuality) /
    (weights.patientMatch + weights.startupSpeed + weights.diversityFit + weights.competitionPenalty + weights.dataQuality);

  return Number(score.toFixed(1));
}

export function getRecommendations(dataset = siteFeasibilityMock, scenarioId = 'balanced'): RecommendationRecord[] {
  const scenario = dataset.scenarios.find((item) => item.id === scenarioId) ?? dataset.scenarios[0];
  const ranked = dataset.sites
    .map((site) => {
      const score = computeSiteScore(site, dataset.settings, scenario);
      const tier = score >= dataset.settings.thresholds.tier1Score ? 'Tier 1' : score >= 74 ? 'Tier 2' : 'Watch';

      return {
        siteId: site.id,
        rank: 0,
        score,
        tier,
        summary: `${site.country} / ${site.city} · ${site.preferredPopulation}`,
        explainability: [
          {
            label: 'Patient match',
            value: site.patientMatchScore,
            note: site.patientMatchScore > 85 ? 'Strong eligibility fit' : 'Moderate fit'
          },
          {
            label: 'Startup readiness',
            value: Math.max(0, 100 - site.startupDays * 0.7),
            note: site.startupDays <= 90 ? 'Fast enough for Phase II launch' : 'Requires startup intervention'
          },
          {
            label: 'Diversity fit',
            value: site.diversityFit,
            note: site.diversityFit > 75 ? 'Supports representation target' : 'Diversity contribution limited'
          },
          {
            label: 'Competition exposure',
            value: Math.max(0, 100 - site.competitionRisk),
            note: site.competitionRisk > 55 ? 'Competing trial pressure is visible' : 'Competitive pressure is manageable'
          }
        ],
        action:
          tier === 'Tier 1'
            ? 'Advance to focused site outreach and startup planning.'
            : tier === 'Tier 2'
              ? 'Keep in shortlist with conditional startup support.'
              : 'Monitor as reserve or scenario-dependent inclusion.'
      } satisfies RecommendationRecord;
    })
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return ranked;
}

export function getDashboardSeries(dataset = siteFeasibilityMock) {
  return dataset.countries.map((country) => ({
    country: country.name,
    startupRisk: country.startupRisk,
    enrollmentForecast: country.forecastEnrollment,
    readiness: country.regulatoryReadiness
  }));
}

export function getEnrollmentCurve(dataset = siteFeasibilityMock) {
  const monthly = [8, 17, 31, 48, 66, 86, 107, 128, 147, 164, 176, dataset.study.targetEnrollment];
  return monthly.map((value, index) => ({
    month: `M${index + 1}`,
    actualPlan: Math.min(dataset.study.targetEnrollment, (index + 1) * 15),
    forecast: value
  }));
}

export function getSiteExplorerRows(dataset = siteFeasibilityMock) {
  return dataset.sites.map((site) => ({
    ...site,
    score: computeSiteScore(site, dataset.settings)
  }));
}

