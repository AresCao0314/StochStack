import type { Country, Rng, Site, TherapeuticArea } from '@/lib/opsTwin/types';

const countryStartupFactor: Record<Country, number> = {
  Germany: 1.05,
  France: 1.08,
  China: 0.95,
  US: 1,
  UK: 1.03
};

const taRecruitFactor: Record<TherapeuticArea, number> = {
  Oncology: 0.82,
  Cardio: 1.12,
  Ophthalmology: 0.96,
  Rare: 0.62
};

export function generateCandidateSites(params: {
  countries: Country[];
  avgStartupDays: number;
  competitionIndex: number;
  patientPoolIndex: number;
  therapeuticArea: TherapeuticArea;
  rng: Rng;
}): Site[] {
  const { countries, avgStartupDays, competitionIndex, patientPoolIndex, therapeuticArea, rng } = params;
  const sites: Site[] = [];

  countries.forEach((country) => {
    const count = rng.int(6, 10);
    for (let i = 0; i < count; i += 1) {
      const startupNoise = rng.int(-14, 22);
      const startup_days_p50 = Math.max(
        35,
        Math.round(avgStartupDays * countryStartupFactor[country] + startupNoise + competitionIndex * 18)
      );

      const baseRate = 8 + rng.next() * 7;
      const expected_recruitment_rate = Number(
        (baseRate * taRecruitFactor[therapeuticArea] * (0.65 + patientPoolIndex) * (1.2 - competitionIndex)).toFixed(2)
      );
      const startup_risk = Number(
        Math.min(0.95, Math.max(0.08, 0.28 + competitionIndex * 0.35 + (startup_days_p50 - avgStartupDays) / 220 + rng.next() * 0.12)).toFixed(2)
      );

      const speed = Math.max(0, 1 - startup_days_p50 / 180);
      const recruit = Math.min(1, expected_recruitment_rate / 14);
      const risk = 1 - startup_risk;
      const score = Number((speed * 0.38 + recruit * 0.42 + risk * 0.2).toFixed(3));

      sites.push({
        id: `${country.toLowerCase()}-site-${i + 1}`,
        site_name: `${country} Site ${i + 1}`,
        country,
        startup_days_p50,
        startup_risk,
        expected_recruitment_rate,
        score,
        startup_completion_day: startup_days_p50 + rng.int(-8, 18)
      });
    }
  });

  return sites.sort((a, b) => b.score - a.score);
}

export function startupDistributionByCountry(sites: Site[]) {
  const grouped = new Map<Country, number[]>();
  sites.forEach((site) => {
    const arr = grouped.get(site.country) || [];
    arr.push(site.startup_completion_day);
    grouped.set(site.country, arr);
  });

  return Array.from(grouped.entries()).map(([country, days]) => {
    const sorted = [...days].sort((a, b) => a - b);
    const avg = sorted.reduce((sum, d) => sum + d, 0) / sorted.length;
    const p75Idx = Math.max(0, Math.ceil(sorted.length * 0.75) - 1);
    return {
      country,
      avgStartupDays: Number(avg.toFixed(1)),
      p75StartupDays: Number(sorted[p75Idx].toFixed(1))
    };
  });
}
