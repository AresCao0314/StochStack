'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const gridStroke = 'rgba(11, 15, 20, 0.08)';

export function CountryReadinessChart({ data }: { data: Array<{ country: string; startupRisk: number; enrollmentForecast: number; readiness: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="country" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="enrollmentForecast" fill="#00e47c" radius={[6, 6, 0, 0]} />
        <Line type="monotone" dataKey="startupRisk" stroke="#0b0f14" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="readiness" stroke="#6ad2e2" strokeWidth={2.5} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function EnrollmentForecastChart({ data }: { data: Array<{ month: string; actualPlan: number; forecast: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="actualPlan" stroke="#6ad2e2" fill="#6ad2e233" strokeWidth={2.5} />
        <Area type="monotone" dataKey="forecast" stroke="#00e47c" fill="#00e47c33" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ScenarioCompareChart({
  data
}: {
  data: Array<{ label: string; lpiWeeks: number; activatedSites: number; enrollmentAtMonth6: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid stroke={gridStroke} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="lpiWeeks" fill="#0b0f14" radius={[6, 6, 0, 0]} />
        <Bar dataKey="activatedSites" fill="#6ad2e2" radius={[6, 6, 0, 0]} />
        <Bar dataKey="enrollmentAtMonth6" fill="#00e47c" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ScoreDistributionChart({
  data
}: {
  data: Array<{ name: string; score: number; country: string }>;
}) {
  const colors = ['#00e47c', '#6ad2e2', '#0b0f14', '#7d7d7d'];
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid stroke={gridStroke} horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={150} fontSize={12} />
        <Tooltip />
        <Bar dataKey="score" radius={[0, 6, 6, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

