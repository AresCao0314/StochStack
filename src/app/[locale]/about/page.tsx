import type { Metadata } from 'next';
import { Timeline } from '@/components/timeline';
import { getDictionary, type Locale } from '@/lib/i18n';

const aboutTimeline = [
  {
    year: '1988',
    text: {
      en: 'Born in Shenyang, where winter light and industrial geometry first shaped my sense of structure.',
      zh: '出生于沈阳，在寒光与工业几何里形成了最早的结构感。',
      de: 'Geboren in Shenyang: Winterlicht und industrielle Geometrie praegten frueh mein Strukturdenken.'
    }
  },
  {
    year: '2006',
    text: {
      en: 'By the Pearl River in Guangzhou, I learned to read fast-changing signals across people, place, and momentum.',
      zh: '2006 年在广州珠江边，开始学会读取人与场景之间快速变化的信号。',
      de: '2006 am Perlfluss in Guangzhou: Signale zwischen Menschen, Raum und Dynamik lesen gelernt.'
    }
  },
  {
    year: '2011',
    text: {
      en: 'In Shanghai, studied computational neurobiology and neural conservation across species as a language of patterns.',
      zh: '2011 年在上海学习计算神经生物学，研究跨物种神经系统的保守性，把“模式”当作语言。',
      de: '2011 in Shanghai: Computational Neurobiology und konservierte neuronale Muster ueber Spezies hinweg untersucht.'
    }
  },
  {
    year: '2014',
    text: {
      en: 'Entered genomics, moving through technical leadership, product strategy, and general management.',
      zh: '2014 年进入基因组学，从技术负责人、产品经理到 General Manager，持续跨栈演进。',
      de: 'Seit 2014 in der Genomik: von technischer Leitung ueber Produktstrategie bis General Management.'
    }
  },
  {
    year: '2016',
    text: {
      en: 'Worked in Europe on market shaping and sales leadership, translating science into adoption.',
      zh: '2016 年赴欧洲，负责市场与销售团队，把科学语言翻译成真实采用。',
      de: '2016 in Europa: Marketing- und Vertriebsfuehrung, wissenschaftliche Inhalte in Adoption ueberfuehrt.'
    }
  },
  {
    year: '2017',
    text: {
      en: 'Returned to Shanghai to bridge proteomics, early-stage AI, and enterprise clinical platforms.',
      zh: '2017 年回到上海，连接蛋白组学、早研 AI 与临床系统落地（CTMS/EDC/PV/RIMS）。',
      de: '2017 zurueck in Shanghai: Bruecke zwischen Proteomik, frueher AI und klinischen Plattformen (CTMS/EDC/PV/RIMS).'
    }
  },
  {
    year: '2019',
    text: {
      en: 'Expanded into IRC imaging review and broader trial system implementation at operational depth.',
      zh: '2019 年进一步进入 IRC 独立影像阅片与临床试验系统实施，深入执行纵深。',
      de: '2019 Ausbau in IRC-Bildreview und tiefere Umsetzung klinischer Studiensysteme.'
    }
  },
  {
    year: '2021',
    text: {
      en: 'Shifted focus to AI applications across clinical development and clinical operations workflows.',
      zh: '2021 年起聚焦临床研发与临床运营全流程的 AI 应用。',
      de: 'Ab 2021 Fokus auf AI-Anwendungen entlang klinischer Entwicklung und Operations.'
    }
  },
  {
    year: '2023',
    text: {
      en: 'Started working with large language models, turning tacit operating logic into editable systems.',
      zh: '2023 年开始系统使用大语言模型，把隐性经验转写为可编辑、可协作的系统逻辑。',
      de: 'Seit 2023 mit Large Language Models: implizite Betriebslogik in editierbare Systeme ueberfuehrt.'
    }
  },
  {
    year: 'Now',
    text: {
      en: 'StochStack: a signal desk for turning uncertainty into prototypes, and prototypes into decisions.',
      zh: '现在，随机栈成为一个信号工作台：把不确定性转成原型，再把原型转成决策。',
      de: 'Heute ist StochStack ein Signal-Desk: Unsicherheit in Prototypen und Prototypen in Entscheidungen uebersetzen.'
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
