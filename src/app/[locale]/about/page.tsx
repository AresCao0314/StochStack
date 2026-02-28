import type { Metadata } from 'next';
import { Timeline } from '@/components/timeline';
import { getDictionary, type Locale } from '@/lib/i18n';

const aboutTimeline = [
  {
    year: '2006',
    text: {
      en: 'Moved from consuming narratives to training argument, rhythm, and point-of-view under pressure.',
      zh: '从接收叙事，转向训练论证、节奏与高压下的观点组织。',
      de: 'Vom Aufnehmen von Erzaehlungen hin zum Training von Argument, Rhythmus und Haltung unter Druck.'
    }
  },
  {
    year: '2008',
    text: {
      en: 'Shifted from intuition-first thinking to explicit structure: systems, feedback, and composable abstractions.',
      zh: '从直觉先行，转向显式结构：系统、反馈与可组合的抽象。',
      de: 'Vom intuitiven Denken zu expliziter Struktur: Systeme, Rueckkopplung und kombinierbare Abstraktion.'
    }
  },
  {
    year: '2011',
    text: {
      en: 'Started operating in cross-disciplinary space, treating biology and computation as one design language.',
      zh: '进入交叉学科视角，把生命系统与计算系统视作同一种设计语言。',
      de: 'Einstieg in interdisziplinaeres Denken: Biologie und Berechnung als eine gemeinsame Designsprache.'
    }
  },
  {
    year: '2014',
    text: {
      en: 'Moved from specialist depth to multi-role synthesis, linking technical truth with product and operating logic.',
      zh: '从单点专业深挖，转向多角色综合：把技术真相与产品、运营逻辑接起来。',
      de: 'Vom Spezialistentiefgang zur Rollen-Synthese: technische Wahrheit mit Produkt- und Operating-Logik verbinden.'
    }
  },
  {
    year: '2016',
    text: {
      en: 'Learned to align strategy, communication, and execution loops across heterogeneous stakeholders.',
      zh: '学会在异质协作中对齐战略、沟通与执行闭环。',
      de: 'Gelernt, Strategie, Kommunikation und Execution-Loops ueber heterogene Stakeholder hinweg auszurichten.'
    }
  },
  {
    year: '2019',
    text: {
      en: 'Moved from pure execution to system-level design thinking.',
      zh: '从执行导向，转向系统级设计思维。',
      de: 'Vom reinen Umsetzen hin zu systemischem Designdenken.'
    }
  },
  {
    year: '2021',
    text: {
      en: 'Reframed operations as an adaptive control problem: detect drift early, intervene with minimal friction.',
      zh: '把运营重构为自适应控制问题：提前识别偏移，以最小摩擦完成干预。',
      de: 'Operations als adaptives Steuerungsproblem neu gerahmt: Drift frueh erkennen, mit minimaler Reibung eingreifen.'
    }
  },
  {
    year: '2023',
    text: {
      en: 'Started externalizing tacit reasoning into reusable language interfaces and operational memory.',
      zh: '开始把隐性推理外化为可复用的语言接口与组织记忆。',
      de: 'Implizites Reasoning in wiederverwendbare Sprachschnittstellen und operative Erinnerung ueberfuehrt.'
    }
  },
  {
    year: '2025',
    text: {
      en: 'Launched StochStack as a signal-driven prototype and editorial lab.',
      zh: '启动随机栈，作为信号驱动的原型与编辑实验场。',
      de: 'StochStack als signalgetriebenes Prototyp- und Editorial-Lab gestartet.'
    }
  }
];

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = getDictionary(params.locale);
  return {
    title: dict.nav.about,
    description: 'Manifesto, now, and stack of principles behind StochStack.',
    openGraph: {
      title: `${dict.nav.about} | StochStack`,
      description: 'Manifesto, now, and stack of principles behind StochStack.'
    }
  };
}

export default function AboutPage({ params }: { params: { locale: Locale } }) {
  const dict = getDictionary(params.locale);

  const manifesto = {
    en: [
      'Design for uncertainty, not only for certainty.',
      'Treat workflow as first-class product surface.',
      'Keep prototypes reversible and measurable.',
      'Expose confidence levels as interface primitives.'
    ],
    zh: ['为不确定性设计，而不只为确定性设计。', '把工作流当作一等产品界面。', '原型必须可回滚、可测量。', '把置信度暴露为界面原语。'],
    de: [
      'Für Unsicherheit designen, nicht nur für Eindeutigkeit.',
      'Workflow als primäre Produktoberfläche behandeln.',
      'Prototypen reversibel und messbar halten.',
      'Konfidenz als UI-Primitiv sichtbar machen.'
    ]
  };

  const now = {
    en: 'Designing operator-facing AI systems where clinical logic, execution rhythm, and decision transparency stay in one frame.',
    zh: '正在构建面向操作者的 AI 系统，让临床逻辑、执行节奏与决策透明度留在同一画面里。',
    de: 'Aktuell baue ich operator-orientierte AI-Systeme, in denen klinische Logik, Ausfuehrungsrhythmus und Entscheidungstransparenz zusammenbleiben.'
  };

  const stack = ['Next.js', 'TypeScript', 'PromptOps', 'Design Systems', 'Clinical Workflow Modeling'];

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="section-title">about</p>
        <h1 className="text-5xl font-bold md:text-7xl">{dict.about.title}</h1>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="noise-border rounded-lg p-5 md:col-span-1">
          <h2 className="mb-3 text-2xl font-semibold">{dict.about.manifesto}</h2>
          <ul className="space-y-2 text-sm">
            {manifesto[params.locale].map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </article>

        <article className="noise-border rounded-lg p-5 md:col-span-1">
          <h2 className="mb-3 text-2xl font-semibold">{dict.about.now}</h2>
          <p className="text-sm text-ink/80">{now[params.locale]}</p>
        </article>

        <article className="noise-border rounded-lg p-5 md:col-span-1">
          <h2 className="mb-3 text-2xl font-semibold">{dict.about.stack}</h2>
          <div className="flex flex-wrap gap-2">
            {stack.map((item) => (
              <span key={item} className="rounded border border-ink/20 px-2 py-1 text-xs uppercase tracking-[0.12em]">
                {item}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Stochastic Timeline</h2>
        <Timeline items={aboutTimeline} locale={params.locale} />
      </section>
    </div>
  );
}
