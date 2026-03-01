'use client';

import type { ContextRoot, RecruitmentPoint, StartupDistributionPoint } from '@/lib/opsTwin/types';

type Props = {
  context: ContextRoot | null;
};

function toPolyline(points: RecruitmentPoint[], width: number, height: number, key: 'cumulativeEnrollment' | 'plannedEnrollment') {
  if (points.length === 0) return '';
  const maxX = Math.max(...points.map((p) => p.month));
  const maxY = Math.max(...points.map((p) => Math.max(p.cumulativeEnrollment, p.plannedEnrollment)), 1);
  return points
    .map((p) => {
      const x = (p.month / maxX) * width;
      const y = height - (p[key] / maxY) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

function StartupBars({ data }: { data: StartupDistributionPoint[] }) {
  const width = 420;
  const height = 180;
  const max = Math.max(1, ...data.map((d) => d.p75StartupDays));
  const barWidth = Math.max(24, Math.floor(width / Math.max(data.length * 2, 1)) - 8);

  return (
    <svg viewBox={`0 0 ${width} ${height + 26}`} className="h-[220px] w-full" role="img" aria-label="Site startup distribution by country">
      {data.map((d, idx) => {
        const groupX = 20 + idx * ((width - 40) / Math.max(data.length, 1));
        const avgH = (d.avgStartupDays / max) * height;
        const p75H = (d.p75StartupDays / max) * height;
        return (
          <g key={d.country}>
            <rect x={groupX} y={height - avgH} width={barWidth} height={avgH} fill="rgba(106,210,226,0.7)" />
            <rect x={groupX + barWidth + 4} y={height - p75H} width={barWidth} height={p75H} fill="rgba(146,139,222,0.7)" />
            <text x={groupX + barWidth} y={height + 16} textAnchor="middle" fontSize="10" fill="currentColor">
              {d.country}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-ink/15 bg-base/70 p-3">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink/65">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

export function OpsTwinSimulationPanel({ context }: Props) {
  const width = 480;
  const height = 190;
  const curve = context?.simResults.recruitmentCurve ?? [];
  const predictedPath = toPolyline(curve, width, height, 'cumulativeEnrollment');
  const plannedPath = toPolyline(curve, width, height, 'plannedEnrollment');

  return (
    <section className="noise-border rounded-lg p-4">
      <p className="section-title">Simulation Output</p>

      {!context ? (
        <p className="mt-3 text-sm text-ink/70">Run a scenario to generate recruitment and startup simulation outputs.</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Predicted FPI" value={context.simResults.kpis.predictedFPI} />
            <KpiCard label="Predicted LPI" value={context.simResults.kpis.predictedLPI} />
            <KpiCard label="Sites needed" value={context.simResults.kpis.sitesNeeded} />
            <KpiCard label="Total startup cost" value={`$${context.simResults.kpis.totalStartupCost.toLocaleString()}`} />
            <KpiCard label="Overall risk score" value={context.simResults.kpis.overallRiskScore} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded border border-ink/15 p-3">
              <p className="mb-2 text-sm font-semibold">Recruitment Curve (Actual vs Planned)</p>
              <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" role="img" aria-label="Recruitment curve">
                <line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" strokeOpacity="0.25" />
                <line x1="0" y1="0" x2="0" y2={height} stroke="currentColor" strokeOpacity="0.25" />
                <polyline points={plannedPath} fill="none" stroke="rgba(146,139,222,0.85)" strokeWidth="2" strokeDasharray="5 4" />
                <polyline points={predictedPath} fill="none" stroke="rgba(0,228,124,0.9)" strokeWidth="2.5" />
              </svg>
              <div className="mt-1 flex items-center gap-4 text-xs text-ink/65">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-4 rounded bg-[rgba(0,228,124,0.9)]" /> Predicted
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-4 rounded bg-[rgba(146,139,222,0.85)]" /> Planned
                </span>
              </div>
            </article>

            <article className="rounded border border-ink/15 p-3">
              <p className="mb-2 text-sm font-semibold">Startup Distribution by Country (avg/p75)</p>
              <StartupBars data={context.simResults.startupDistribution} />
            </article>
          </div>
        </div>
      )}
    </section>
  );
}
