const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedLegacyWorkflow() {
  await prisma.auditLog.deleteMany();
  await prisma.changeSet.deleteMany();
  await prisma.feedbackAmendment.deleteMany();
  await prisma.dDFArtifact.deleteMany();
  await prisma.uSDMArtifact.deleteMany();
  await prisma.extractedField.deleteMany();
  await prisma.extractionRun.deleteMany();
  await prisma.document.deleteMany();
  await prisma.study.deleteMany();

  const study = await prisma.study.create({
    data: {
      name: 'ONC-DELTA-01',
      indication: 'NSCLC',
      phase: 'Phase 3'
    }
  });

  const protocolText = `Inclusion Criteria:\n1) Age 18-75 years\n2) Histologically confirmed NSCLC\n3) ECOG 0-1\n\nExclusion Criteria:\n1) Active CNS metastases\n2) Severe uncontrolled infection\n\nSchedule of Activities:\nScreening | Day -28 to -1 | consent; labs; CT\nCycle 1 Day 1 | Day 1 | randomization; dosing\nCycle 2 Day 1 | Day 22 +/-2 | safety labs; AE review`;

  const protocolDoc = await prisma.document.create({
    data: {
      studyId: study.id,
      type: 'protocol',
      filename: 'protocol_v1.txt',
      mimeType: 'text/plain',
      versionTag: 'v1.0',
      textExtract: protocolText
    }
  });

  const run = await prisma.extractionRun.create({
    data: {
      studyId: study.id,
      documentId: protocolDoc.id,
      status: 'review',
      modelName: 'fake-llm',
      promptVersion: 'digitizer-v0.2.0',
      startedAt: new Date(),
      finishedAt: new Date()
    }
  });

  await prisma.extractedField.createMany({
    data: [
      {
        runId: run.id,
        path: 'metadata.title',
        value: JSON.stringify('ONC-DELTA-01 Protocol'),
        confidence: 0.88,
        evidence: JSON.stringify({ docId: protocolDoc.id, page: 1, quote: 'ONC-DELTA-01 Protocol', chunkId: 'c1' }),
        reviewerState: 'accepted'
      },
      {
        runId: run.id,
        path: 'eligibility.inclusion[0]',
        value: JSON.stringify('Age 18-75 years'),
        confidence: 0.86,
        evidence: JSON.stringify({ docId: protocolDoc.id, page: 1, quote: 'Age 18-75 years', chunkId: 'c1' }),
        reviewerState: 'pending'
      }
    ]
  });

  await prisma.uSDMArtifact.create({
    data: {
      runId: run.id,
      schemaVersion: 'USDM-1.0.0',
      usdmJson: JSON.stringify({
        study: { id: 'USDM-NSCLC-P3', title: 'ONC-DELTA-01 Protocol' }
      })
    }
  });

  await prisma.dDFArtifact.create({
    data: {
      runId: run.id,
      ddfJson: JSON.stringify({
        nodes: [{ id: 'protocol' }, { id: 'usdm' }, { id: 'ops' }],
        links: [{ from: 'protocol', to: 'usdm' }, { from: 'usdm', to: 'ops' }]
      })
    }
  });

  return { studyId: study.id, runId: run.id };
}

async function seedProtocolOs() {
  await prisma.exportArtifact.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.decisionNode.deleteMany();
  await prisma.designGraph.deleteMany();
  await prisma.policyProfile.deleteMany();
  await prisma.evidenceSnippet.deleteMany();
  await prisma.brief.deleteMany();
  await prisma.projectMembership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: 'Demo CTM',
      email: 'demo.ctm@local',
      globalRole: 'clinical_lead'
    }
  });

  const project = await prisma.project.create({
    data: {
      name: 'Oncology Decision Demo',
      indication: 'Metastatic NSCLC',
      phase: 'Phase II',
      status: 'active'
    }
  });

  await prisma.projectMembership.create({
    data: {
      projectId: project.id,
      userId: user.id,
      role: 'project_owner'
    }
  });

  await prisma.brief.create({
    data: {
      projectId: project.id,
      fieldsJson: {
        objective: 'Select an explainable, regulator-friendly primary endpoint and feasible SoA.',
        constraints: 'Keep site burden manageable while preserving statistical credibility.',
        successCriteria: 'Hard policy pass with total score >= 75',
        comparator: 'SoC',
        geography: 'EU + China'
      }
    }
  });

  const evidenceData = [
    {
      title: 'Guideline excerpt: endpoint precedent',
      text: 'PFS at 12 months remains an accepted endpoint for this setting when supported by imaging schedule and adjudication.',
      sourceType: 'guideline',
      sourceRef: 'Guideline-2025-Section-4',
      confidence: 0.93
    },
    {
      title: 'Registry benchmark event rate',
      text: 'Observed event rate in matched population was approximately 0.45 over one year follow-up.',
      sourceType: 'registry',
      sourceRef: 'Registry-NSCLC-2024',
      confidence: 0.88
    },
    {
      title: 'Internal ops note on visit burden',
      text: 'Site teams reported dropout risk increase when on-treatment visits exceed six intensive contacts in first 24 weeks.',
      sourceType: 'internal',
      sourceRef: 'OpsMemo-Q4',
      confidence: 0.8
    },
    {
      title: 'Regulatory meeting minutes',
      text: 'Authorities requested explicit clinical meaning wording and discourages unexplained surrogate primary endpoints.',
      sourceType: 'regulatory',
      sourceRef: 'HA-Advice-2025-11',
      confidence: 0.9
    },
    {
      title: 'Recruitment feasibility signal',
      text: 'Broader ECOG criteria improve recruitment velocity but may elevate heterogeneity and monitoring demand.',
      sourceType: 'feasibility',
      sourceRef: 'Feasibility-scan-2025',
      confidence: 0.75
    }
  ];

  await prisma.evidenceSnippet.createMany({
    data: evidenceData.map((item) => ({
      projectId: project.id,
      ...item,
      tagsJson: ['mvp']
    }))
  });

  const policyProfiles = [
    {
      role: 'Medical Policy',
      ownerName: 'Medical Lead',
      weight: 1,
      policyJson: {
        rules: [
          { id: 'med-hard-clinical-meaning', type: 'hard', targetNodeType: 'endpoint.primary', condition: { field: 'content.clinicalMeaning', op: 'truthy' }, message: 'Primary endpoint must explain clinical meaning.', weight: 1 },
          { id: 'med-soft-citation', type: 'soft', targetNodeType: 'endpoint.primary', condition: { field: 'citations.length', op: 'gte', value: 1 }, message: 'Guideline or precedent citation is recommended.', weight: 20 }
        ]
      }
    },
    {
      role: 'Stats Policy',
      ownerName: 'Biostat Lead',
      weight: 1,
      policyJson: {
        rules: [
          { id: 'stats-hard-power', type: 'hard', targetNodeType: 'assumptions.ledger', condition: { field: 'content.power', op: 'gte', value: 0.8 }, message: 'Power must be >= 0.8.', weight: 1 }
        ]
      }
    },
    {
      role: 'ClinOps Policy',
      ownerName: 'ClinOps Lead',
      weight: 1,
      policyJson: {
        rules: [
          { id: 'ops-soft-burden', type: 'soft', targetNodeType: 'soa.v0', condition: { field: 'impacts.burden', op: 'neq', value: 'High' }, message: 'High burden SoA requires mitigation.', weight: 20 }
        ]
      }
    },
    {
      role: 'Reg Policy',
      ownerName: 'Regulatory Lead',
      weight: 1,
      policyJson: {
        rules: [
          { id: 'reg-hard-endpoint-reference', type: 'hard', targetNodeType: 'endpoint.primary', condition: { field: 'citations.length', op: 'gte', value: 1 }, message: 'Primary endpoint requires citation.', weight: 1 }
        ]
      }
    }
  ];

  await prisma.policyProfile.createMany({
    data: policyProfiles.map((profile) => ({
      projectId: project.id,
      role: profile.role,
      ownerName: profile.ownerName,
      weight: profile.weight,
      policyJson: profile.policyJson
    }))
  });

  const graph = await prisma.designGraph.create({
    data: {
      projectId: project.id,
      version: 1,
      nodesJson: [
        { key: 'endpoint.primary', type: 'endpoint.primary', status: 'draft' },
        { key: 'eligibility.core', type: 'eligibility.core', status: 'draft' },
        { key: 'assumptions.ledger', type: 'assumptions.ledger', status: 'draft' },
        { key: 'soa.v0', type: 'soa.v0', status: 'draft' }
      ],
      edgesJson: [
        { from: 'endpoint.primary', to: 'soa.v0' },
        { from: 'eligibility.core', to: 'assumptions.ledger' },
        { from: 'eligibility.core', to: 'soa.v0' },
        { from: 'assumptions.ledger', to: 'endpoint.primary' }
      ],
      decisions: {
        create: [
          { key: 'endpoint.primary', type: 'endpoint.primary', status: 'draft' },
          { key: 'eligibility.core', type: 'eligibility.core', status: 'draft' },
          { key: 'assumptions.ledger', type: 'assumptions.ledger', status: 'draft' },
          { key: 'soa.v0', type: 'soa.v0', status: 'draft' }
        ]
      }
    }
  });

  await prisma.changeLog.create({
    data: {
      projectId: project.id,
      graphVersion: graph.version,
      actor: 'system.seed',
      action: 'seed_protocol_os',
      payloadJson: {
        note: 'Seeded Protocol OS decision-centric demo data',
        projectId: project.id
      }
    }
  });

  return { projectId: project.id, graphVersion: graph.version };
}

async function main() {
  const legacy = await seedLegacyWorkflow();
  const protocolOs = await seedProtocolOs();
  console.log(`Seed complete. LegacyStudy=${legacy.studyId} LegacyRun=${legacy.runId} ProtocolOSProject=${protocolOs.projectId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
