import type { Locale } from '@/lib/i18n';
import type { Note } from '@/lib/types';

type LayerBlock = {
  id: string;
  title: Record<Locale, string>;
  what: Record<Locale, string[]>;
  input: Record<Locale, string[]>;
  transform: Record<Locale, string[]>;
  pitfall: Record<Locale, string[]>;
};

const chain = {
  en: ['Extract (Traceable)', 'Clean (Usable)', 'Conform (Composable)', 'Canonical (Shared Semantics)', 'Productize (Reusable)', 'Operationalize (Workflow)'],
  zh: ['Extract（可追溯）', 'Clean（可用）', 'Conform（可拼接）', 'Canonical（同语义）', 'Productize（可复用）', 'Operationalize（进工作流）'],
  de: ['Extract (Nachvollziehbar)', 'Clean (Nutzbar)', 'Conform (Kombinierbar)', 'Canonical (Gemeinsame Semantik)', 'Productize (Wiederverwendbar)', 'Operationalize (Im Workflow)']
};

const crossCuts = {
  en: [
    { name: 'Identity Resolution', desc: 'Unify Study/Site/Subject/Investigator/Vendor identities across systems.' },
    { name: 'Lineage & Audit', desc: 'Every metric and conclusion should trace back to source versions and rules.' },
    { name: 'Governed Access', desc: 'Role-based views, PHI/PII controls, and regional sovereignty constraints.' }
  ],
  zh: [
    { name: 'Identity Resolution', desc: '统一 Study/Site/Subject/Investigator/Vendor 跨系统身份映射。' },
    { name: 'Lineage & Audit', desc: '任何指标和结论都能追溯到源系统版本与转换规则。' },
    { name: 'Governed Access', desc: '角色视图、PHI/PII 管控与国别数据主权约束。' }
  ],
  de: [
    { name: 'Identity Resolution', desc: 'Studien/Site/Subject/Investigator/Vendor-Identitaeten systemuebergreifend vereinheitlichen.' },
    { name: 'Lineage & Audit', desc: 'Jede Kennzahl und Schlussfolgerung muss auf Quellenversionen und Regeln rueckfuehrbar sein.' },
    { name: 'Governed Access', desc: 'Rollenbasierte Views, PHI/PII-Kontrollen und regionale Datensouveraenitaet.' }
  ]
};

const labels = {
  en: {
    subtitle: 'A layered architecture from source facts to auditable apps and agents.',
    what: 'What this layer looks like',
    input: 'Inputs from below',
    transform: 'Transform to next layer',
    pitfall: 'Common pitfall',
    chainTitle: 'Backbone Transformation Chain',
    crossTitle: 'Three Cross-Cutting Capabilities'
  },
  zh: {
    subtitle: '从事实源到可审计应用与 Agent 的临床研发数据底座分层架构。',
    what: '这一层长什么样',
    input: '输入来自哪一层',
    transform: '到下一层怎么转',
    pitfall: '最易踩的坑',
    chainTitle: '主干转换链路',
    crossTitle: '三条横切能力'
  },
  de: {
    subtitle: 'Geschichtete Architektur von Quellsystemen bis zu auditierbaren Apps und Agents.',
    what: 'Wie diese Ebene aussieht',
    input: 'Input aus der unteren Ebene',
    transform: 'Transformation zur naechsten Ebene',
    pitfall: 'Typischer Fallstrick',
    chainTitle: 'Backbone-Transformationskette',
    crossTitle: 'Drei Querschnittsfaehigkeiten'
  }
};

const layers: LayerBlock[] = [
  {
    id: 'L0',
    title: {
      en: 'Layer 0 — Source Systems',
      zh: 'Layer 0｜数据源层 Source Systems',
      de: 'Layer 0 — Source Systems'
    },
    what: {
      en: ['CTMS/eTMF/RTSM/PV/QMS, EDC/ePRO/Labs/Imaging, protocol/CSR documents, RWD/RWE and external registries.'],
      zh: ['CTMS/eTMF/RTSM/PV/QMS、EDC/ePRO/Labs/Imaging、Protocol/CSR 文档、RWD/RWE 与外部登记库。'],
      de: ['CTMS/eTMF/RTSM/PV/QMS, EDC/ePRO/Labs/Imaging, Protocol/CSR-Dokumente, RWD/RWE und externe Register.']
    },
    input: {
      en: ['No upstream. This is where facts originate.'],
      zh: ['无上游，这是事实发生地。'],
      de: ['Kein Upstream. Hier entstehen die Fakten.']
    },
    transform: {
      en: ['Connectors + extraction (API/SFTP/CDC/events/files) -> raw extract package + source lineage metadata.'],
      zh: ['连接器与抽取（API/SFTP/CDC/事件/文件）-> raw extract 包 + 源血缘元数据。'],
      de: ['Connectoren + Extraktion (API/SFTP/CDC/Events/Files) -> Raw-Extract + Source-Lineage-Metadaten.']
    },
    pitfall: {
      en: ['Collecting data without extraction evidence chain makes every downstream layer unverifiable.'],
      zh: ['只拿数据不拿提取证据链，会让下游层全部失去可验证性。'],
      de: ['Daten ohne Extraktions-Evidenzkette machen alle nachgelagerten Ebenen nicht verifizierbar.']
    }
  },
  {
    id: 'L1',
    title: {
      en: 'Layer 1 — Landing / Raw',
      zh: 'Layer 1｜落地层 Landing / Raw',
      de: 'Layer 1 — Landing / Raw'
    },
    what: {
      en: ['Immutable raw zone partitioned by source and time, with hashes, row checks, PHI tags, and jurisdiction labels.'],
      zh: ['按来源与时间分区的不可变 Raw 区，附带哈希、行数校验、PHI 标签与合规地域标签。'],
      de: ['Immutable Raw-Zone nach Quelle/Zeit partitioniert, mit Hashes, Row-Checks, PHI-Tags und Regionenlabels.']
    },
    input: {
      en: ['Raw extracts and extraction metadata from Layer 0.'],
      zh: ['来自 Layer 0 的原始抽取包与抽取元数据。'],
      de: ['Raw-Extracts und Extraktionsmetadaten aus Layer 0.']
    },
    transform: {
      en: ['Light normalization (decode, dedupe, type/timezone harmonization, key prep) -> cleaned raw / bronze.'],
      zh: ['轻量标准化（解码、去重、类型/时区统一、键预整理）-> cleaned raw / bronze。'],
      de: ['Leichte Normalisierung (Decode, Dedupe, Typ/Zeitzone, Keys) -> Cleaned Raw / Bronze.']
    },
    pitfall: {
      en: ['Over-cleaning in Raw rewrites facts and breaks audit explainability.'],
      zh: ['在 Raw 层过度清洗会改写事实，破坏审计可解释性。'],
      de: ['Zu viel Bereinigung in Raw ueberschreibt Fakten und bricht Audit-Erklaerbarkeit.']
    }
  },
  {
    id: 'L2',
    title: {
      en: 'Layer 2 — Conformed',
      zh: 'Layer 2｜规范化层 Conformed',
      de: 'Layer 2 — Conformed'
    },
    what: {
      en: ['Quality-controlled subject/visit/site/case/document objects with rule outcomes and anomaly markers.'],
      zh: ['质量可控的 subject/visit/site/case/document 对象，并行沉淀规则结果与异常标记。'],
      de: ['Qualitaetskontrollierte Subject/Visit/Site/Case/Document-Objekte mit Regel- und Anomalieergebnissen.']
    },
    input: {
      en: ['Cleaned raw objects from Layer 1.'],
      zh: ['来自 Layer 1 的 cleaned raw 对象。'],
      de: ['Cleaned-Raw-Objekte aus Layer 1.']
    },
    transform: {
      en: ['Terminology mapping + standards mapping + master ID alignment -> conformed datasets and entity links.'],
      zh: ['术语映射 + 标准映射 + 主数据 ID 对齐 -> conformed 数据集与实体链接。'],
      de: ['Terminologie/Standards-Mapping + Master-ID-Abgleich -> Conformed-Datasets und Entity-Links.']
    },
    pitfall: {
      en: ['Field-level harmonization without entity-level ID unification kills cross-system analytics.'],
      zh: ['只统一字段不统一实体 ID，会彻底阻断跨系统分析。'],
      de: ['Feld-Harmonisierung ohne Entity-ID-Vereinheitlichung blockiert systemuebergreifende Analytik.']
    }
  },
  {
    id: 'L3',
    title: {
      en: 'Layer 3 — Semantic / Canonical',
      zh: 'Layer 3｜语义标准层 Semantic / Canonical',
      de: 'Layer 3 — Semantic / Canonical'
    },
    what: {
      en: ['Canonical model for clinical, operations, safety, and document cores plus governed metric definitions.'],
      zh: ['覆盖 Clinical/Operations/Safety/Documents 的 Canonical 模型与受治理的指标口径定义。'],
      de: ['Canonical-Modell fuer Clinical/Operations/Safety/Documents plus governancefaehige Metrikdefinitionen.']
    },
    input: {
      en: ['Conformed datasets, mapped dictionaries, and entity links from Layer 2.'],
      zh: ['来自 Layer 2 的 conformed 数据、映射字典与实体链接。'],
      de: ['Conformed-Datasets, Mapping-Dictionaries und Entity-Links aus Layer 2.']
    },
    transform: {
      en: ['Dimensional modeling + feature engineering + document structuring -> semantic marts and feature artifacts.'],
      zh: ['维度建模 + 特征工程 + 文档结构化 -> semantic marts 与特征资产。'],
      de: ['Dimensionale Modellierung + Feature Engineering + Dokumentstrukturierung -> Semantic Marts und Feature-Artefakte.']
    },
    pitfall: {
      en: ['No metric-governance means each team computes “same KPI” differently.'],
      zh: ['没有指标口径治理，“同一 KPI”会被不同团队算成不同答案。'],
      de: ['Ohne Metrik-Governance berechnen Teams denselben KPI unterschiedlich.']
    }
  },
  {
    id: 'L4',
    title: {
      en: 'Layer 4 — Analytical / Data Products',
      zh: 'Layer 4｜分析与产品层 Analytical / Data Products',
      de: 'Layer 4 — Analytical / Data Products'
    },
    what: {
      en: ['Trial performance marts, patient journey marts, safety marts, authoring marts, feature/metric stores.'],
      zh: ['Trial performance/patient journey/safety/authoring marts，以及 feature store 与 metric store。'],
      de: ['Trial-Performance-, Patient-Journey-, Safety- und Authoring-Marts sowie Feature/Metric-Stores.']
    },
    input: {
      en: ['Canonical semantic assets from Layer 3.'],
      zh: ['来自 Layer 3 的语义标准资产。'],
      de: ['Kanonische Semantik-Assets aus Layer 3.']
    },
    transform: {
      en: ['Serving adaptation (indexes/cache/vector/graph) + role-based access + service APIs -> reusable products.'],
      zh: ['服务层适配（索引/缓存/向量/图）+ 角色权限裁剪 + 服务化 API -> 可复用产品。'],
      de: ['Serving-Anpassung (Index/Cache/Vektor/Graph) + rollenbasierter Zugriff + Service-APIs -> wiederverwendbare Produkte.']
    },
    pitfall: {
      en: ['Data exists but is not productized, so every app rebuilds its own data layer.'],
      zh: ['数据存在但未产品化，导致每个应用都在重复造自己的数据层。'],
      de: ['Daten sind da, aber nicht produktisiert; jede App baut ihre eigene Datenschicht neu.']
    }
  },
  {
    id: 'L5',
    title: {
      en: 'Layer 5 — Apps / Agents',
      zh: 'Layer 5｜应用与智能层 Apps / Agents',
      de: 'Layer 5 — Apps / Agents'
    },
    what: {
      en: ['Dashboards, decision apps, and agent workflows for authoring, ops, and quality intervention loops.'],
      zh: ['仪表盘、决策应用与 Agent 工作流，作用于撰写、运营与质量干预闭环。'],
      de: ['Dashboards, Entscheidungs-Apps und Agent-Workflows fuer Authoring, Operations und Quality-Loops.']
    },
    input: {
      en: ['Semantic consistency and reusable products from Layer 3/4.'],
      zh: ['依赖 Layer 3/4 的语义一致性与可复用产品。'],
      de: ['Abhaengig von semantischer Konsistenz und wiederverwendbaren Produkten aus Layer 3/4.']
    },
    transform: {
      en: ['Evidence-backed decisions + explainable outputs + optional governed write-back into operational systems.'],
      zh: ['生成有证据的决策与可解释输出，并在合规下回写业务系统。'],
      de: ['Evidenzbasierte Entscheidungen + erklaerbare Outputs + optionales governance-konformes Write-back.']
    },
    pitfall: {
      en: ['Without evidence traceability, LLM/agent outcomes cannot earn GxP trust.'],
      zh: ['没有证据链，LLM/Agent 结果很难获得 GxP 语境下的信任。'],
      de: ['Ohne Evidenz-Traceability gewinnen LLM/Agent-Ergebnisse kein GxP-Vertrauen.']
    }
  }
];

export function DataFoundationNote({ note, locale }: { note: Note; locale: Locale }) {
  const t = labels[locale];

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold leading-tight md:text-6xl">{note.title[locale]}</h1>
        <p className="text-sm uppercase tracking-[0.14em] text-ink/60">{note.date}</p>
        <p className="max-w-4xl text-lg text-ink/80">{t.subtitle}</p>
        <div className="noise-border rounded-lg bg-base p-4 text-lg font-medium leading-relaxed">{note.highlight[locale]}</div>
      </header>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 text-xl font-semibold">{t.chainTitle}</h2>
        <div className="grid gap-2 md:grid-cols-6">
          {chain[locale].map((item, idx) => (
            <div key={item} className="scanline rounded border border-ink/15 px-3 py-2 text-xs uppercase tracking-[0.12em]">
              <span className="font-mono text-ink/60">0{idx + 1}</span>
              <p className="mt-1 text-ink/80">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {layers.map((layer) => (
          <article key={layer.id} className="noise-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-ink/60">{layer.id}</p>
            <h3 className="mt-1 text-lg font-semibold">{layer.title[locale]}</h3>

            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.what}</p>
                {layer.what[locale].map((line) => (
                  <p key={line} className="mt-1 text-ink/80">{line}</p>
                ))}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.input}</p>
                {layer.input[locale].map((line) => (
                  <p key={line} className="mt-1 text-ink/80">{line}</p>
                ))}
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/60">{t.transform}</p>
                {layer.transform[locale].map((line) => (
                  <p key={line} className="mt-1 text-ink/80">{line}</p>
                ))}
              </div>

              <div className="rounded border border-red-200/60 bg-red-50/60 p-2 dark:border-red-500/25 dark:bg-red-900/10">
                <p className="text-xs uppercase tracking-[0.12em] text-red-700 dark:text-red-300">{t.pitfall}</p>
                {layer.pitfall[locale].map((line) => (
                  <p key={line} className="mt-1 text-sm text-red-800/90 dark:text-red-200/90">{line}</p>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="noise-border rounded-lg p-4">
        <h2 className="mb-3 text-xl font-semibold">{t.crossTitle}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {crossCuts[locale].map((item) => (
            <div key={item.name} className="rounded border border-ink/15 p-3">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-ink/75">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <blockquote className="border-l-2 border-accent1 pl-4 font-mono text-sm text-ink/80">“{note.quote[locale]}”</blockquote>

      <aside className="grid gap-3 md:grid-cols-2">
        {note.sidenotes[locale].map((entry, idx) => (
          <p key={entry} className="rounded border border-ink/12 p-3 text-sm text-ink/70">
            [{idx + 1}] {entry}
          </p>
        ))}
      </aside>
    </article>
  );
}
