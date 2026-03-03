import { promises as fs } from 'node:fs';
import path from 'node:path';
import { protocolOsDb } from '@/core/protocol-os/db';

function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((h) => JSON.stringify(String(row[h] ?? ''))).join(',')).join('\n');
  return `${headers.join(',')}\n${body}`;
}

export async function compileProjectArtifacts(projectId: string, actor = 'local-user') {
  const project = await protocolOsDb.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  const graph = await protocolOsDb.designGraph.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
    include: { decisions: true }
  });
  if (!graph) throw new Error('No graph version found');

  let proposals = await protocolOsDb.proposal.findMany({
    where: { graphId: graph.id },
    orderBy: { createdAt: 'asc' }
  });
  if (!proposals.length) {
    const previousGraph = await protocolOsDb.designGraph.findFirst({
      where: { projectId, version: { lt: graph.version } },
      orderBy: { version: 'desc' }
    });
    if (previousGraph) {
      proposals = await protocolOsDb.proposal.findMany({
        where: { graphId: previousGraph.id },
        orderBy: { createdAt: 'asc' }
      });
    }
  }

  const logs = await protocolOsDb.changeLog.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' }
  });

  const decisions = Object.fromEntries(graph.decisions.map((decision) => [decision.key, decision]));

  const endpoint = (decisions['endpoint.primary']?.contentJson ?? {}) as Record<string, unknown>;
  const eligibility = (decisions['eligibility.core']?.contentJson ?? {}) as Record<string, unknown>;
  const assumptions = (decisions['assumptions.ledger']?.contentJson ?? {}) as Record<string, unknown>;
  const soa = (decisions['soa.v0']?.contentJson ?? {}) as Record<string, unknown>;

  const protocolHtml = `<!doctype html>
<html><head><meta charset="utf-8"/><title>${project.name} Protocol Draft</title></head>
<body>
  <h1>${project.name} Protocol Draft</h1>
  <h2>Primary Endpoint</h2><pre>${JSON.stringify(endpoint, null, 2)}</pre>
  <h2>Eligibility</h2><pre>${JSON.stringify(eligibility, null, 2)}</pre>
  <h2>Statistical Assumptions</h2><pre>${JSON.stringify(assumptions, null, 2)}</pre>
  <h2>Schedule of Activities</h2><pre>${JSON.stringify(soa, null, 2)}</pre>
</body></html>`;

  const visits = Array.isArray(soa.visits) ? (soa.visits as Array<Record<string, unknown>>) : [];
  const soaCsv = toCsv(
    visits.map((visit) => ({
      visit: String(visit.visit ?? ''),
      week: String(visit.week ?? ''),
      procedures: Array.isArray(visit.procedures) ? (visit.procedures as string[]).join('; ') : ''
    }))
  );

  const traceabilityJson = {
    projectId,
    graphVersion: graph.version,
    decisions: graph.decisions.map((decision) => {
      const nodeProposals = proposals
        .filter((proposal) => proposal.nodeKey === decision.key)
        .map((proposal) => ({
          planId: proposal.planId,
          proposal: proposal.proposalJson,
          score: proposal.scoreJson,
          conflicts: proposal.conflictsJson
        }));
      return {
        nodeKey: decision.key,
        selectedOptionId: decision.selectedOptionId,
        adoptedContent: decision.contentJson,
        proposals: nodeProposals
      };
    }),
    changelog: logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      graphVersion: log.graphVersion,
      payload: log.payloadJson,
      createdAt: log.createdAt
    }))
  };

  const root = path.join(process.cwd(), 'public', 'exports', 'protocol-os', projectId, `v${graph.version}`);
  await fs.mkdir(root, { recursive: true });

  const protocolPath = path.join(root, 'protocol.html');
  const soaPath = path.join(root, 'soa.csv');
  const tracePath = path.join(root, 'traceability.json');

  await fs.writeFile(protocolPath, protocolHtml, 'utf8');
  await fs.writeFile(soaPath, soaCsv, 'utf8');
  await fs.writeFile(tracePath, JSON.stringify(traceabilityJson, null, 2), 'utf8');

  await protocolOsDb.exportArtifact.createMany({
    data: [
      { projectId, type: 'protocol_html', version: graph.version, storageRef: `/exports/protocol-os/${projectId}/v${graph.version}/protocol.html` },
      { projectId, type: 'soa_csv', version: graph.version, storageRef: `/exports/protocol-os/${projectId}/v${graph.version}/soa.csv` },
      { projectId, type: 'traceability_json', version: graph.version, storageRef: `/exports/protocol-os/${projectId}/v${graph.version}/traceability.json` }
    ]
  });

  await protocolOsDb.changeLog.create({
    data: {
      projectId,
      graphVersion: graph.version,
      actor,
      action: 'compile_export',
      payloadJson: {
        outputs: ['protocol_html', 'soa_csv', 'traceability_json']
      }
    }
  });

  return {
    graphVersion: graph.version,
    files: {
      protocolHtml: `/exports/protocol-os/${projectId}/v${graph.version}/protocol.html`,
      soaCsv: `/exports/protocol-os/${projectId}/v${graph.version}/soa.csv`,
      traceabilityJson: `/exports/protocol-os/${projectId}/v${graph.version}/traceability.json`
    }
  };
}
