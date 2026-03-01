'use client';

import type { Locale } from '@/lib/i18n';

const guideCopy: Record<
  Locale,
  {
    title: string;
    how: string;
    expectedTitle: string;
    readTitle: string;
    steps: string[];
    expected: string[];
    interpretation: string[];
  }
> = {
  en: {
    title: 'Operator Guide',
    how: 'How To Operate',
    expectedTitle: 'Expected Results',
    readTitle: 'How To Read Results',
    steps: [
      'Configure scenario inputs (TA/Phase/Countries/target size) and keep Deterministic Seed on for demo reproducibility.',
      'Enable A2A remote mode and click Run Simulation. Watch orchestrator handoff each step to dedicated agents.',
      'Open View context diff on any agent reply to inspect exact patches written into shared context.',
      'Record an actual enrollment point in the calibration form and run auto-calibration.',
      'Run simulation again and compare confidence, bias, and updated trajectories.'
    ],
    expected: [
      'A2A thread shows request -> response sequencing with local/remote transport labels and latency.',
      'Shared context version increments after each patch, with assumptions/sites/risks/decisions updated in tabs.',
      'Confidence panel shows MAPE, signed bias, tracked points, and parameter deltas after calibration.',
      'Decision log captures rationale and tradeoff statements for review and audit.'
    ],
    interpretation: [
      'Confidence above 75% with low bias indicates planning trajectories are stable enough for operational decisions.',
      'Persistent negative signed bias means actual enrollment lags prediction; prioritize site conversion and screening optimization.',
      'Frequent large parameter shifts indicate model drift or inconsistent operational execution; collect more actuals before scaling decisions.'
    ]
  },
  zh: {
    title: '操作指引',
    how: '如何操作',
    expectedTitle: '预期结果',
    readTitle: '如何解读结果',
    steps: [
      '先配置场景输入（治疗领域/分期/国家/目标样本量），建议开启 Deterministic Seed 保证演示可复现。',
      '开启 A2A 远程模式后点击 Run Simulation，观察 orchestrator 按步骤把任务 handoff 给不同 agent。',
      '点击任意 agent 回复的 View context diff，查看它对共享上下文写入了哪些 patch。',
      '在校准区域录入一个实际入组点（actual），执行自动校准。',
      '再次运行模拟，对比置信度、偏差和更新后的预测轨迹。'
    ],
    expected: [
      'A2A 线程会展示 request -> response 顺序，并标注 local/remote 传输模式与延迟。',
      '每次 patch 写入后，共享上下文 version 会递增，Assumptions/Sites/Risks/Decisions 会同步更新。',
      '置信度面板会显示 MAPE、signed bias、追踪点数量与参数回调幅度。',
      'Decision Log 会记录每次关键结论、理由和 tradeoff，便于审阅与审计。'
    ],
    interpretation: [
      '当 confidence 高于 75% 且 bias 较低时，说明当前预测可用于运营层面的执行决策。',
      '若 signed bias 长期为负，表示实际入组持续落后于预测，应优先优化筛选转化和站点执行。',
      '若参数回调波动持续过大，通常代表模型漂移或执行不稳定，应先补充实际数据再放大决策。'
    ]
  },
  de: {
    title: 'Bedienleitfaden',
    how: 'So wird gearbeitet',
    expectedTitle: 'Erwartete Ergebnisse',
    readTitle: 'Ergebnisinterpretation',
    steps: [
      'Szenarioeingaben (TA/Phase/Länder/Zielgröße) festlegen und Deterministic Seed für reproduzierbare Demos aktiv lassen.',
      'A2A-Remote-Modus aktivieren und Run Simulation starten. Beobachten, wie der Orchestrator die Schritte an Agenten übergibt.',
      'Bei einer Agentenantwort View context diff öffnen, um die geschriebenen Patches im Shared Context zu prüfen.',
      'Einen Ist-Wert für Enrollment im Kalibrierungsbereich erfassen und Auto-Kalibrierung ausführen.',
      'Simulation erneut starten und Confidence, Bias sowie aktualisierte Kurven vergleichen.'
    ],
    expected: [
      'Der A2A-Thread zeigt die Sequenz Request -> Response inklusive Transportmodus (local/remote) und Latenz.',
      'Mit jedem Patch steigt die Context-Version; Assumptions/Sites/Risks/Decisions werden konsistent aktualisiert.',
      'Das Confidence-Panel zeigt MAPE, Signed Bias, Anzahl der Tracking-Punkte und Parameter-Shift.',
      'Im Decision Log werden Begründungen und Trade-offs nachvollziehbar dokumentiert.'
    ],
    interpretation: [
      'Confidence > 75% bei niedrigem Bias deutet auf eine ausreichend stabile Planungsprognose hin.',
      'Ein dauerhaft negativer Signed Bias bedeutet: Ist-Enrolment liegt unter Prognose; Site-Konversion und Screening priorisieren.',
      'Häufig große Parameter-Shift-Werte weisen auf Drift oder instabile Ausführung hin; zuerst mehr Ist-Daten sammeln.'
    ]
  }
};

export function OpsGuidePanel({ locale }: { locale: Locale }) {
  const copy = guideCopy[locale];

  return (
    <section className="noise-border rounded-lg p-4">
      <p className="section-title">{copy.title}</p>
      <div className="mt-3 grid gap-4 xl:grid-cols-3">
        <article>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/75">{copy.how}</h3>
          <ol className="mt-2 space-y-2 text-sm text-ink/80">
            {copy.steps.map((item, idx) => (
              <li key={item}>
                <span className="mr-2 font-mono text-xs text-ink/55">{idx + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </article>

        <article>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/75">{copy.expectedTitle}</h3>
          <ul className="mt-2 space-y-2 text-sm text-ink/80">
            {copy.expected.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>

        <article>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink/75">{copy.readTitle}</h3>
          <ul className="mt-2 space-y-2 text-sm text-ink/80">
            {copy.interpretation.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
