const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:./')) {
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '../prisma/dev.db')}`;
}

const prisma = new PrismaClient();

async function main() {
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
      modelName: 'qwen-plus',
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
        evidence: JSON.stringify({ docId: protocolDoc.id, page: 1, startChar: 0, endChar: 30, quote: 'ONC-DELTA-01 Protocol', chunkId: 'c1' }),
        reviewerState: 'accepted'
      },
      {
        runId: run.id,
        path: 'eligibility.inclusion[0]',
        value: JSON.stringify('Age 18-75 years'),
        confidence: 0.86,
        evidence: JSON.stringify({ docId: protocolDoc.id, page: 1, startChar: 32, endChar: 60, quote: 'Age 18-75 years', chunkId: 'c1' }),
        reviewerState: 'pending'
      },
      {
        runId: run.id,
        path: 'soa.visits[0].name',
        value: JSON.stringify('Screening'),
        confidence: 0.8,
        evidence: JSON.stringify({ docId: protocolDoc.id, page: 1, startChar: 180, endChar: 220, quote: 'Screening | Day -28 to -1 | consent; labs; CT', chunkId: 'c2' }),
        reviewerState: 'pending'
      }
    ]
  });

  await prisma.uSDMArtifact.create({
    data: {
      runId: run.id,
      schemaVersion: 'USDM-1.0.0',
      usdmJson: JSON.stringify({
        study: { id: 'USDM-NSCLC-P3', title: 'ONC-DELTA-01 Protocol' },
        studyDesign: { indication: 'NSCLC', phase: 'Phase 3' },
        eligibilityCriteria: [{ id: 'I1', text: 'Age 18-75 years' }],
        scheduleOfActivities: [{ encounter: 'Screening', window: 'Day -28 to -1', activities: ['consent', 'labs', 'CT'] }]
      })
    }
  });

  await prisma.dDFArtifact.create({
    data: {
      runId: run.id,
      ddfJson: JSON.stringify({
        nodes: [
          { id: 'protocol', label: 'Protocol Source' },
          { id: 'usdm', label: 'USDM Model' },
          { id: 'ops', label: 'Operational Systems' }
        ],
        links: [
          { from: 'protocol', to: 'usdm', note: 'extract + map' },
          { from: 'usdm', to: 'ops', note: 'build downstream artifacts' }
        ]
      })
    }
  });

  await prisma.feedbackAmendment.create({
    data: {
      studyId: study.id,
      amendmentDate: new Date('2025-11-20'),
      category: 'eligibility',
      description: 'Broaden ANC threshold for recruitment feasibility.',
      linkedUsdmPaths: JSON.stringify(['eligibility.inclusion[0]'])
    }
  });

  await prisma.auditLog.create({
    data: {
      actor: 'system.seed',
      action: 'seed.init',
      entityType: 'Study',
      entityId: study.id,
      payload: JSON.stringify({ note: 'Seeded protocol workflow demo data' })
    }
  });

  console.log(`Seed complete. StudyId=${study.id} RunId=${run.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
