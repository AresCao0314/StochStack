'use client';

import { useMemo, useState } from 'react';
import type { ContextRoot, RecruitmentPoint, StartupDistributionPoint } from '@/lib/opsTwin/types';

type TrackActualInput = {
  month: number;
  actualCumulativeEnrollment: number;
  startupAvgDaysObserved?: number;
};

type Props = {
  context: ContextRoot | null;
  onTrackActual: (input: TrackActualInput) => void;
};

function toPolyline(
  points: RecruitmentPoint[],
  width: number,
  height: number,
  key: 'cumulativeEnrollment' | 'plannedEnrollment'
) {
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

function toActualPolyline(
  points: Array<{ month: number; actualCumulativeEnrollment: number }>,
  width: number,
  height: number,
  maxMonth: number,
  maxEnrollment: number
) {
  if (points.length === 0) return '';
  return [...points]
    .sort((a, b) => a.month - b.month)
    .map((p) => {
      const x = (p.month / Math.max(1, maxMonth)) * width;
      const y = height - (p.actualCumulativeEnrollment / Math.max(1, maxEnrollment)) * height;
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

function ConfidenceCard({ context }: { context: ContextRoot }) {
  const diagnostics = context.simResults.forecastDiagnostics;
  const confidencePct = `${Math.round(diagnostics.confidenceScore * 100)}%`;

  return (
    <article className="noise-border rounded-lg p-3">
      <p className="section-title">confidence panel</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Confidence" value={confidencePct} />
        <KpiCard label="MAPE" value={`${(diagnostics.mape * 100).toFixed(1)}%`} />
        <KpiCard label="Signed Bias" value={`${(diagnostics.signedBias * 100).toFixed(1)}%`} />
        <KpiCard label="Tracked Points" value={diagnostics.points} />
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded border border-ink/10 p-2 text-xs">
          <p className="font-semibold">Parameter Auto-Tuning (latest delta)</p>
          <div className="mt-2 space-y-1 font-mono text-[11px]">
            {Object.entries(diagnostics.parameterShift).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2">
                <span className="text-ink/70">{key}</span>
                <span className={value >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {value >= 0 ? '+' : ''}
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-ink/10 p-2 text-xs">
          <p className="font-semibold">Latest Notes</p>
          <ul className="mt-2 space-y-1 text-ink/75">
            {diagnostics.notes.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function OpsTwinSimulationPanel({ context, onTrackActual }: Props) {
  const width = 480;
  const height = 190;
  const curve = useMemo(
    () => context?.simResults.recruitmentCurve ?? [],
    [context?.simResults.recruitmentCurve]
  );
  const predictedPath = toPolyline(curve, width, height, 'cumulativeEnrollment');
  const plannedPath = toPolyline(curve, width, height, 'plannedEnrollment');

  const defaultMonth = context?.studyProfile.durationMonths ? Math.min(3, context.studyProfile.durationMonths) : 3;
  const [month, setMonth] = useState(defaultMonth);
  const [actualEnrollment, setActualEnrollment] = useState(0);
  const [startupObserved, setStartupObserved] = useState('');

  const actualPath = useMemo(() => {
    if (!context) return '';
    const maxMonth = Math.max(...curve.map((p) => p.month), 1);
    const maxEnroll = Math.max(...curve.map((p) => p.cumulativeEnrollment), 1);
    return toActualPolyline(context.simResults.actuals, width, height, maxMonth, maxEnroll);
  }, [context, curve]);

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

          <ConfidenceCard context={context} />

          <article className="rounded border border-ink/15 p-3">
            <p className="text-sm font-semibold">Prediction Error Tracking + Auto-Calibrate</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <label className="text-xs">
                Month
                <input
                  type="number"
                  min={1}
                  max={context.studyProfile.durationMonths}
                  className="mt-1 w-full rounded border border-ink/20 px-2 py-1"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                />
              </label>
              <label className="text-xs">
                Actual cumulative enrollment
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded border border-ink/20 px-2 py-1"
                  value={actualEnrollment}
                  onChange={(e) => setActualEnrollment(Number(e.target.value))}
                />
              </label>
              <label className="text-xs">
                Observed startup avg days (optional)
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border border-ink/20 px-2 py-1"
                  value={startupObserved}
                  onChange={(e) => setStartupObserved(e.target.value)}
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    onTrackActual({
                      month,
                      actualCumulativeEnrollment: actualEnrollment,
                      startupAvgDaysObserved: startupObserved ? Number(startupObserved) : undefined
                    });
                  }}
                  className="scanline w-full rounded border border-ink/20 px-3 py-2 text-xs"
                  aria-label="Track actuals and auto-calibrate assumptions"
                >
                  Track Actual & Auto-Calibrate
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-ink/65">
              After calibration, assumptions are auto-adjusted and confidence is updated. Re-run simulation to refresh projected curves.
            </p>
          </article>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded border border-ink/15 p-3">
              <p className="mb-2 text-sm font-semibold">Recruitment Curve (Predicted vs Planned vs Actual)</p>
              <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full" role="img" aria-label="Recruitment curve">
                <line x1="0" y1={height} x2={width} y2={height} stroke="currentColor" strokeOpacity="0.25" />
                <line x1="0" y1="0" x2="0" y2={height} stroke="currentColor" strokeOpacity="0.25" />
                <polyline points={plannedPath} fill="none" stroke="rgba(146,139,222,0.85)" strokeWidth="2" strokeDasharray="5 4" />
                <polyline points={predictedPath} fill="none" stroke="rgba(0,228,124,0.9)" strokeWidth="2.5" />
                <polyline points={actualPath} fill="none" stroke="rgba(11,15,20,0.9)" strokeWidth="2.5" strokeDasharray="2 2" />
              </svg>
              <div className="mt-1 flex items-center gap-4 text-xs text-ink/65">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-4 rounded bg-[rgba(0,228,124,0.9)]" /> Predicted
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-4 rounded bg-[rgba(146,139,222,0.85)]" /> Planned
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-4 rounded bg-[rgba(11,15,20,0.9)]" /> Actual
                </span>
              </div>
            </article>

            <article className="rounded border border-ink/15 p-3">
              <p className="mb-2 text-sm font-semibold">Startup Distribution by Country (avg/p75)</p>
              <StartupBars data={context.simResults.startupDistribution} />
            </article>
          </div>

          <article className="rounded border border-ink/15 p-3">
            <p className="text-sm font-semibold">Recent Error Log</p>
            <div className="mt-2 max-h-44 overflow-auto rounded border border-ink/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-warm/70 text-ink/75">
                  <tr>
                    <th className="px-2 py-1">month</th>
                    <th className="px-2 py-1">predicted</th>
                    <th className="px-2 py-1">actual</th>
                    <th className="px-2 py-1">abs % err</th>
                    <th className="px-2 py-1">signed % err</th>
                  </tr>
                </thead>
                <tbody>
                  {context.simResults.forecastDiagnostics.history.map((item) => (
                    <tr key={`${item.month}-${item.recordedAt}`} className="border-t border-ink/10">
                      <td className="px-2 py-1">{item.month}</td>
                      <td className="px-2 py-1">{item.predictedCumulativeEnrollment}</td>
                      <td className="px-2 py-1">{item.actualCumulativeEnrollment}</td>
                      <td className="px-2 py-1">{(item.absPctError * 100).toFixed(1)}%</td>
                      <td className={`px-2 py-1 ${item.signedPctError > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {(item.signedPctError * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
