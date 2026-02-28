import type { Metadata } from 'next';
import { Timeline } from '@/components/timeline';
import { getDictionary, type Locale } from '@/lib/i18n';

const aboutTimeline = [
  {
    year: '2019',
    text: {
      en: 'Moved from pure execution to system-level design thinking.',
      zh: '从执行层转向系统层设计思维。',
      de: 'Vom reinen Delivery-Fokus hin zu systemischem Designdenken gewechselt.'
    }
  },
  {
    year: '2022',
    text: {
      en: 'Started combining clinical workflows with AI-native tooling.',
      zh: '开始把临床工作流与 AI-native 工具结合。',
      de: 'Klinische Workflows mit AI-nativen Tools verbunden.'
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
    en: 'Building prototype systems for AI-assisted clinical development and operator tooling.',
    zh: '正在构建面向 AI 辅助临床开发与操作流的原型系统。',
    de: 'Aktuell: Prototyp-Systeme für AI-gestützte klinische Entwicklung und Operator-Tools.'
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
