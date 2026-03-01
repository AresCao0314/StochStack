'use client';

import type { Country, Phase, ScenarioInput, TherapeuticArea } from '@/lib/opsTwin/types';

const taOptions: TherapeuticArea[] = ['Oncology', 'Cardio', 'Ophthalmology', 'Rare'];
const phaseOptions: Phase[] = ['I', 'II', 'III'];
const countryOptions: Country[] = ['Germany', 'France', 'China', 'US', 'UK'];

type Props = {
  value: ScenarioInput;
  onChange: (next: ScenarioInput) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
};

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-xs uppercase tracking-[0.12em] text-ink/70">
      <div className="mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-ink/80">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

export function OpsTwinScenarioForm({ value, onChange, onRun, onReset, running }: Props) {
  const setField = <K extends keyof ScenarioInput>(key: K, next: ScenarioInput[K]) =>
    onChange({ ...value, [key]: next });

  const setAssumption = (key: keyof ScenarioInput['assumptions'], next: number) =>
    onChange({
      ...value,
      assumptions: {
        ...value.assumptions,
        [key]: next
      }
    });

  return (
    <section className="noise-border rounded-lg p-4">
      <p className="section-title">Scenario Console</p>

      <div className="mt-3 grid gap-3">
        <label className="text-sm">
          Therapeutic Area
          <select
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            value={value.therapeuticArea}
            onChange={(e) => setField('therapeuticArea', e.target.value as TherapeuticArea)}
          >
            {taOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Phase
          <select
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            value={value.phase}
            onChange={(e) => setField('phase', e.target.value as Phase)}
          >
            {phaseOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-sm">Countries</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {countryOptions.map((country) => {
              const checked = value.countries.includes(country);
              return (
                <label key={country} className="flex items-center gap-2 rounded border border-ink/15 px-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setField('countries', Array.from(new Set([...value.countries, country])));
                      } else {
                        setField('countries', value.countries.filter((c) => c !== country));
                      }
                    }}
                  />
                  {country}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="text-sm">
          Target Sample Size
          <input
            type="number"
            min={50}
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            value={value.targetSampleSize}
            onChange={(e) => setField('targetSampleSize', Number(e.target.value))}
          />
        </label>

        <label className="text-sm">
          Recruitment Duration (months)
          <input
            type="number"
            min={3}
            className="mt-1 w-full rounded border border-ink/20 bg-transparent px-2 py-2"
            value={value.durationMonths}
            onChange={(e) => setField('durationMonths', Number(e.target.value))}
          />
        </label>

        <div className="space-y-2 border-t border-ink/15 pt-3">
          <SliderRow label="avg_startup_days" value={value.assumptions.avg_startup_days} min={35} max={140} step={1} onChange={(n) => setAssumption('avg_startup_days', n)} />
          <SliderRow label="screen_fail_rate" value={value.assumptions.screen_fail_rate} min={0.05} max={0.65} step={0.01} onChange={(n) => setAssumption('screen_fail_rate', n)} />
          <SliderRow label="dropout_rate" value={value.assumptions.dropout_rate} min={0.05} max={0.45} step={0.01} onChange={(n) => setAssumption('dropout_rate', n)} />
          <SliderRow label="competition_index" value={value.assumptions.competition_index} min={0} max={1} step={0.01} onChange={(n) => setAssumption('competition_index', n)} />
          <SliderRow label="patient_pool_index" value={value.assumptions.patient_pool_index} min={0} max={1} step={0.01} onChange={(n) => setAssumption('patient_pool_index', n)} />
        </div>

        <label className="flex items-center justify-between rounded border border-ink/15 px-2 py-2 text-sm">
          <span>Show agent messages in real-time</span>
          <input
            type="checkbox"
            checked={value.realtimeMessages}
            onChange={(e) => setField('realtimeMessages', e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between rounded border border-ink/15 px-2 py-2 text-sm">
          <span>Deterministic Seed</span>
          <input
            type="checkbox"
            checked={value.deterministicSeed}
            onChange={(e) => setField('deterministicSeed', e.target.checked)}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onRun}
            disabled={running || value.countries.length === 0}
            className="scanline rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50"
          >
            Run Simulation
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={running}
            className="rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
