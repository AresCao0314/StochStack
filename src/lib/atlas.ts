export type AtlasLayer = {
  id: string;
  label: string;
  defaultVisible: boolean;
};

export type AtlasNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: string;
  tone?: 'ink' | 'accent1' | 'accent2';
};

export type AtlasEdge = {
  id: string;
  from: string;
  to: string;
  layer: string;
};

export type AtlasDiagram = {
  slug: string;
  title: string;
  summary: string;
  width: number;
  height: number;
  layers: AtlasLayer[];
  nodes: AtlasNode[];
  edges: AtlasEdge[];
};

const diagrams: AtlasDiagram[] = [
  {
    slug: 'clinical-data-foundation-stack',
    title: 'Layered Clinical Data Stack',
    summary: 'From source systems to canonical semantics, products, and agent-facing applications.',
    width: 1100,
    height: 700,
    layers: [
      { id: 'source', label: 'Source Systems', defaultVisible: true },
      { id: 'semantic', label: 'Semantic Core', defaultVisible: true },
      { id: 'apps', label: 'Apps & Agents', defaultVisible: true }
    ],
    nodes: [
      { id: 'ctms', label: 'CTMS / eTMF / RTSM', x: 80, y: 520, w: 220, h: 64, layer: 'source', tone: 'ink' },
      { id: 'edc', label: 'EDC / ePRO / Labs', x: 330, y: 520, w: 220, h: 64, layer: 'source', tone: 'ink' },
      { id: 'ext', label: 'RWD / Registry / Docs', x: 580, y: 520, w: 220, h: 64, layer: 'source', tone: 'ink' },
      { id: 'raw', label: 'Landing / Raw', x: 210, y: 390, w: 220, h: 64, layer: 'semantic', tone: 'accent1' },
      { id: 'conform', label: 'Conformed Silver', x: 460, y: 390, w: 220, h: 64, layer: 'semantic', tone: 'accent1' },
      { id: 'canonical', label: 'Canonical Semantic Model', x: 335, y: 260, w: 280, h: 72, layer: 'semantic', tone: 'accent1' },
      { id: 'product', label: 'Data Products / Feature Store', x: 335, y: 140, w: 280, h: 72, layer: 'apps', tone: 'accent2' },
      { id: 'apps', label: 'Dashboards / Copilots / Agents', x: 335, y: 40, w: 280, h: 72, layer: 'apps', tone: 'accent2' }
    ],
    edges: [
      { id: 'e1', from: 'ctms', to: 'raw', layer: 'source' },
      { id: 'e2', from: 'edc', to: 'raw', layer: 'source' },
      { id: 'e3', from: 'ext', to: 'conform', layer: 'source' },
      { id: 'e4', from: 'raw', to: 'conform', layer: 'semantic' },
      { id: 'e5', from: 'conform', to: 'canonical', layer: 'semantic' },
      { id: 'e6', from: 'canonical', to: 'product', layer: 'apps' },
      { id: 'e7', from: 'product', to: 'apps', layer: 'apps' }
    ]
  },
  {
    slug: 'protocol-os-decision-loop',
    title: 'Decision-Centric Protocol Loop',
    summary: 'Synopsis-first protocol authoring loop with policy checks, feedback, and traceable exports.',
    width: 1100,
    height: 700,
    layers: [
      { id: 'design', label: 'Design', defaultVisible: true },
      { id: 'governance', label: 'Governance', defaultVisible: true },
      { id: 'outputs', label: 'Outputs', defaultVisible: true }
    ],
    nodes: [
      { id: 'brief', label: 'Brief', x: 70, y: 80, w: 180, h: 60, layer: 'design', tone: 'accent1' },
      { id: 'evidence', label: 'Evidence', x: 70, y: 190, w: 180, h: 60, layer: 'design', tone: 'accent1' },
      { id: 'plan', label: 'A/B Plan Generator', x: 320, y: 130, w: 220, h: 72, layer: 'design', tone: 'accent1' },
      { id: 'synopsis', label: 'Synopsis Draft', x: 620, y: 130, w: 200, h: 72, layer: 'design', tone: 'accent2' },
      { id: 'policy', label: 'Policy + Gate Review', x: 320, y: 300, w: 220, h: 72, layer: 'governance', tone: 'ink' },
      { id: 'feedback', label: 'Human Feedback', x: 620, y: 300, w: 200, h: 72, layer: 'governance', tone: 'ink' },
      { id: 'full', label: 'Full Protocol', x: 320, y: 490, w: 220, h: 72, layer: 'outputs', tone: 'accent2' },
      { id: 'soa', label: 'SoA CSV', x: 580, y: 490, w: 160, h: 60, layer: 'outputs', tone: 'accent2' },
      { id: 'trace', label: 'Traceability JSON', x: 760, y: 490, w: 200, h: 60, layer: 'outputs', tone: 'accent2' }
    ],
    edges: [
      { id: 'p1', from: 'brief', to: 'plan', layer: 'design' },
      { id: 'p2', from: 'evidence', to: 'plan', layer: 'design' },
      { id: 'p3', from: 'plan', to: 'synopsis', layer: 'design' },
      { id: 'p4', from: 'synopsis', to: 'policy', layer: 'governance' },
      { id: 'p5', from: 'policy', to: 'feedback', layer: 'governance' },
      { id: 'p6', from: 'feedback', to: 'plan', layer: 'governance' },
      { id: 'p7', from: 'synopsis', to: 'full', layer: 'outputs' },
      { id: 'p8', from: 'full', to: 'soa', layer: 'outputs' },
      { id: 'p9', from: 'full', to: 'trace', layer: 'outputs' }
    ]
  },
  {
    slug: 'multi-agent-governance-mesh',
    title: 'A2A + Human Review Governance Mesh',
    summary: 'Functional and role agents connected through orchestrator, controls, and audit surfaces.',
    width: 1100,
    height: 700,
    layers: [
      { id: 'runtime', label: 'Runtime Mesh', defaultVisible: true },
      { id: 'control', label: 'Control Plane', defaultVisible: true },
      { id: 'audit', label: 'Audit & Replay', defaultVisible: true }
    ],
    nodes: [
      { id: 'orch', label: 'Orchestrator', x: 450, y: 70, w: 220, h: 70, layer: 'runtime', tone: 'accent1' },
      { id: 'a1', label: 'Endpoint Agent', x: 120, y: 220, w: 180, h: 60, layer: 'runtime', tone: 'ink' },
      { id: 'a2', label: 'Eligibility Agent', x: 320, y: 220, w: 180, h: 60, layer: 'runtime', tone: 'ink' },
      { id: 'a3', label: 'SoA Agent', x: 520, y: 220, w: 180, h: 60, layer: 'runtime', tone: 'ink' },
      { id: 'a4', label: 'Risk Agent', x: 720, y: 220, w: 180, h: 60, layer: 'runtime', tone: 'ink' },
      { id: 'r1', label: 'Medical Reviewer', x: 140, y: 360, w: 180, h: 60, layer: 'control', tone: 'accent2' },
      { id: 'r2', label: 'Stats Reviewer', x: 360, y: 360, w: 180, h: 60, layer: 'control', tone: 'accent2' },
      { id: 'r3', label: 'ClinOps Reviewer', x: 580, y: 360, w: 180, h: 60, layer: 'control', tone: 'accent2' },
      { id: 'r4', label: 'Reg Reviewer', x: 800, y: 360, w: 160, h: 60, layer: 'control', tone: 'accent2' },
      { id: 'hmac', label: 'HMAC / Idempotency', x: 250, y: 520, w: 230, h: 64, layer: 'audit', tone: 'ink' },
      { id: 'log', label: 'Audit Log / Replay', x: 520, y: 520, w: 230, h: 64, layer: 'audit', tone: 'ink' }
    ],
    edges: [
      { id: 'm1', from: 'orch', to: 'a1', layer: 'runtime' },
      { id: 'm2', from: 'orch', to: 'a2', layer: 'runtime' },
      { id: 'm3', from: 'orch', to: 'a3', layer: 'runtime' },
      { id: 'm4', from: 'orch', to: 'a4', layer: 'runtime' },
      { id: 'm5', from: 'a1', to: 'r1', layer: 'control' },
      { id: 'm6', from: 'a2', to: 'r2', layer: 'control' },
      { id: 'm7', from: 'a3', to: 'r3', layer: 'control' },
      { id: 'm8', from: 'a4', to: 'r4', layer: 'control' },
      { id: 'm9', from: 'r2', to: 'hmac', layer: 'audit' },
      { id: 'm10', from: 'hmac', to: 'log', layer: 'audit' },
      { id: 'm11', from: 'log', to: 'orch', layer: 'audit' }
    ]
  }
];

export function getAtlasDiagrams() {
  return diagrams;
}

export function getAtlasDiagram(slug: string) {
  return diagrams.find((item) => item.slug === slug);
}
