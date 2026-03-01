'use client';

export function OpsGuidePanel() {
  const steps = [
    'Configure scenario inputs (TA/Phase/Countries/target size) and keep Deterministic Seed on for demo reproducibility.',
    'Enable A2A remote mode and click Run Simulation. Watch orchestrator handoff each step to dedicated agents.',
    'Open View context diff on any agent reply to inspect exact patches written into shared context.',
    'Record an actual enrollment point in the calibration form and run auto-calibration.',
    'Run simulation again and compare confidence, bias, and updated trajectories.'
  ];

  const expected = [
    'A2A thread shows request -> response sequencing with local/remote transport labels and latency.',
    'Shared context version increments after each patch, with assumptions/sites/risks/decisions updated in tabs.',
    'Confidence panel shows MAPE, signed bias, tracked points, and parameter deltas after calibration.',
    'Decision log captures rationale and tradeoff statements for review and audit.'
  ];

  const interpretation = [
    'Confidence above 75% with low bias indicates planning trajectories are stable enough for operational decisions.',
    'Persistent negative signed bias means actual enrollment lags prediction; prioritize site conversion and screening optimization.',
    'Frequent large parameter shifts indicate model drift or inconsistent operational execution; collect more actuals before scaling decisions.'
  ];

  return (
    <section className="noise-border rounded-lg p-4">
      <p className="section-title">Operator Guide</p>
      <div className="mt-3 grid gap-4 xl:grid-cols-3">
        <article>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/75">How To Operate</h3>
          <ol className="mt-2 space-y-2 text-sm text-ink/80">
            {steps.map((item, idx) => (
              <li key={item}>
                <span className="mr-2 font-mono text-xs text-ink/55">{idx + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </article>

        <article>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/75">Expected Results</h3>
          <ul className="mt-2 space-y-2 text-sm text-ink/80">
            {expected.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>

        <article>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/75">How To Read Results</h3>
          <ul className="mt-2 space-y-2 text-sm text-ink/80">
            {interpretation.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
