import { Prisma } from '@prisma/client';
import { protocolOsDb } from '@/core/protocol-os/db';
import { buildInitialGraphNodes, DESIGN_GRAPH_EDGES } from '@/core/protocol-os/graph';
import { DEFAULT_POLICY_PROFILES } from '@/core/protocol-os/policies/default-profiles';
import { evaluatePolicies } from '@/core/protocol-os/policies/evaluator';
import { runSkill } from '@/core/protocol-os/skills';
import { DesignNodeKey, OrchestrateInput, PlanId, PlanSet, ProposalContract, designNodeKeys } from '@/core/protocol-os/types';

function castJson<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value as T;
}

async function ensureGraph(projectId: string) {
  let graph = await protocolOsDb.designGraph.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
    include: { decisions: true }
  });

  if (!graph) {
    graph = await protocolOsDb.designGraph.create({
      data: {
        projectId,
        version: 1,
        nodesJson: buildInitialGraphNodes(),
        edgesJson: DESIGN_GRAPH_EDGES,
        decisions: {
          create: designNodeKeys.map((key) => ({ key, type: key, status: 'draft' }))
        }
      },
      include: { decisions: true }
    });
  }

  return graph;
}

async function ensurePolicies(projectId: string) {
  const count = await protocolOsDb.policyProfile.count({ where: { projectId } });
  if (count > 0) return;

  await protocolOsDb.policyProfile.createMany({
    data: DEFAULT_POLICY_PROFILES.map((profile) => ({
      projectId,
      role: profile.role,
      ownerName: profile.ownerName,
      weight: profile.weight,
      policyJson: profile.policyJson as Prisma.JsonObject
    }))
  });
}

export async function orchestrateProtocolOs(input: OrchestrateInput): Promise<PlanSet> {
  const project = await protocolOsDb.project.findUnique({ where: { id: input.projectId } });
  if (!project) throw new Error('Project not found');

  await ensurePolicies(project.id);
  const graph = await ensureGraph(project.id);

  const brief = await protocolOsDb.brief.findUnique({ where: { projectId: project.id } });
  const evidenceRows = await protocolOsDb.evidenceSnippet.findMany({ where: { projectId: project.id }, orderBy: { createdAt: 'asc' } });
  const policies = await protocolOsDb.policyProfile.findMany({ where: { projectId: project.id } });

  await protocolOsDb.proposal.deleteMany({ where: { graphId: graph.id } });

  const planIds: PlanId[] = ['A', 'B'];
  const plans: PlanSet['plans'] = [];

  for (const planId of planIds) {
    const contextBase = {
      projectId: project.id,
      planId,
      brief: castJson<Record<string, unknown>>(brief?.fieldsJson, {}),
      evidence: evidenceRows.map((row) => ({
        id: row.id,
        title: row.title,
        text: row.text,
        sourceType: row.sourceType,
        confidence: row.confidence
      }))
    };

    const endpoint = await runSkill('EndpointCandidateGenerator', { nodeKey: 'endpoint.primary', optionId: `${planId}-endpoint`, optionLabel: `Plan ${planId} endpoint` }, contextBase);
    const eligibility = await runSkill('EligibilityDraftGenerator', { nodeKey: 'eligibility.core', optionId: `${planId}-eligibility`, optionLabel: `Plan ${planId} eligibility` }, contextBase);
    const assumptions = await runSkill('AssumptionLedgerBuilder', { nodeKey: 'assumptions.ledger', optionId: `${planId}-assumptions`, optionLabel: `Plan ${planId} assumptions` }, contextBase);

    const upstreamBase = {
      'endpoint.primary': endpoint,
      'eligibility.core': eligibility,
      'assumptions.ledger': assumptions
    } as Partial<Record<DesignNodeKey, ProposalContract>>;

    const soa = await runSkill('SoABuilder', { nodeKey: 'soa.v0', optionId: `${planId}-soa`, optionLabel: `Plan ${planId} SoA` }, { ...contextBase, upstream: upstreamBase });

    const nodes = {
      'endpoint.primary': endpoint,
      'eligibility.core': eligibility,
      'assumptions.ledger': assumptions,
      'soa.v0': soa
    } satisfies Record<DesignNodeKey, ProposalContract>;

    const conflictOutput = await runSkill(
      'ConflictDetector',
      { nodeKey: 'assumptions.ledger', optionId: `${planId}-conflicts`, optionLabel: `Plan ${planId} conflicts` },
      { ...contextBase, upstream: nodes }
    );

    const traceOutput = await runSkill(
      'TraceabilityWriter',
      { nodeKey: 'assumptions.ledger', optionId: `${planId}-trace`, optionLabel: `Plan ${planId} trace` },
      { ...contextBase, upstream: nodes }
    );

    const policyResult = evaluatePolicies(
      policies.map((profile) => ({
        role: profile.role,
        weight: profile.weight,
        policyJson: castJson<{ rules: any[] }>(profile.policyJson, { rules: [] })
      })),
      nodes
    );

    const conflicts = [
      ...(castJson<Array<{ severity: 'high' | 'medium' | 'low'; message: string }>>(conflictOutput.content as Prisma.JsonValue, []) || []),
      ...policyResult.failures.map((message) => ({ severity: 'high' as const, message }))
    ];

    plans.push({
      planId,
      nodes,
      scoreBreakdown: {
        total: policyResult.total,
        hardPass: policyResult.hardPass,
        byRole: policyResult.byRole
      },
      conflicts,
      highlights: [
        `Endpoint: ${(endpoint.content as any).name}`,
        `Power: ${(assumptions.content as any).power}`,
        `Visit count: ${((soa.content as any).visits ?? []).length}`
      ],
      invalid: !policyResult.hardPass
    });

    const proposalRows = [endpoint, eligibility, assumptions, soa].map((proposal) => ({
      graphId: graph.id,
      nodeKey: proposal.nodeKey,
      skillName: proposal.nodeKey,
      planId,
      proposalJson: proposal as unknown as Prisma.JsonObject,
      scoreJson: {
        total: policyResult.total,
        hardPass: policyResult.hardPass
      } as Prisma.JsonObject,
      conflictsJson: conflicts as unknown as Prisma.JsonArray
    }));

    await protocolOsDb.proposal.createMany({ data: proposalRows });

    await protocolOsDb.changeLog.create({
      data: {
        projectId: project.id,
        graphVersion: graph.version,
        actor: 'system',
        action: `orchestrate_${planId.toLowerCase()}`,
        payloadJson: {
          runMode: input.runMode,
          conflicts,
          trace: traceOutput.content,
          score: policyResult
        } as Prisma.JsonObject
      }
    });
  }

  return { plans };
}

export async function acceptPlan(projectId: string, planId: PlanId, actor = 'local-user') {
  const latestGraph = await protocolOsDb.designGraph.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
    include: { decisions: true }
  });
  if (!latestGraph) throw new Error('Graph not found');

  const proposals = await protocolOsDb.proposal.findMany({
    where: { graphId: latestGraph.id, planId }
  });
  if (!proposals.length) throw new Error('No proposals for selected plan. Run orchestrator first.');

  const selectedByNode = new Map<string, any>();
  for (const row of proposals) {
    selectedByNode.set(row.nodeKey, castJson<any>(row.proposalJson, {}));
  }

  const nextVersion = latestGraph.version + 1;
  const graph = await protocolOsDb.designGraph.create({
    data: {
      projectId,
      version: nextVersion,
      nodesJson: latestGraph.nodesJson as Prisma.InputJsonValue,
      edgesJson: latestGraph.edgesJson as Prisma.InputJsonValue,
      decisions: {
        create: designNodeKeys.map((key) => {
          const proposal = selectedByNode.get(key) ?? null;
          return {
            key,
            type: key,
            status: proposal ? 'accepted' : 'draft',
            selectedOptionId: proposal?.optionId,
            contentJson: proposal ? proposal.content : null
          };
        })
      }
    }
  });

  await protocolOsDb.changeLog.create({
    data: {
      projectId,
      graphVersion: nextVersion,
      actor,
      action: 'accept_plan',
      payloadJson: {
        planId,
        sourceGraphVersion: latestGraph.version,
        newGraphId: graph.id
      }
    }
  });

  return graph;
}
