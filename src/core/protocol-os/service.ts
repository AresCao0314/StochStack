import { Prisma } from '@prisma/client';
import { protocolOsDb } from '@/core/protocol-os/db';
import { buildInitialGraphNodes, DESIGN_GRAPH_EDGES } from '@/core/protocol-os/graph';
import { DEFAULT_POLICY_PROFILES } from '@/core/protocol-os/policies/default-profiles';

export async function listProjects() {
  return protocolOsDb.project.findMany({ orderBy: { updatedAt: 'desc' } });
}

export async function createProject(input: { name: string; indication: string; phase: string }) {
  const user = await protocolOsDb.user.upsert({
    where: { email: 'demo.ctm@local' },
    update: { name: 'Demo CTM' },
    create: { name: 'Demo CTM', email: 'demo.ctm@local', globalRole: 'clinical_lead' }
  });

  const project = await protocolOsDb.project.create({
    data: {
      name: input.name,
      indication: input.indication,
      phase: input.phase,
      status: 'draft'
    }
  });

  await protocolOsDb.projectMembership.create({
    data: {
      projectId: project.id,
      userId: user.id,
      role: 'project_owner'
    }
  });

  await protocolOsDb.designGraph.create({
    data: {
      projectId: project.id,
      version: 1,
      nodesJson: buildInitialGraphNodes(),
      edgesJson: DESIGN_GRAPH_EDGES,
      decisions: {
        create: buildInitialGraphNodes().map((node) => ({ key: node.key, type: node.type, status: 'draft' }))
      }
    }
  });

  await protocolOsDb.policyProfile.createMany({
    data: DEFAULT_POLICY_PROFILES.map((profile) => ({
      projectId: project.id,
      role: profile.role,
      ownerName: profile.ownerName,
      weight: profile.weight,
      policyJson: profile.policyJson as Prisma.JsonObject
    }))
  });

  await protocolOsDb.changeLog.create({
    data: {
      projectId: project.id,
      actor: 'demo.ctm@local',
      action: 'project_created',
      payloadJson: {
        rbac: { ownerUserEmail: user.email, role: 'project_owner' }
      }
    }
  });

  return project;
}

export async function getProjectDetail(projectId: string) {
  const project = await protocolOsDb.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      evidence: { orderBy: { createdAt: 'desc' } },
      policies: true,
      graphs: { orderBy: { version: 'desc' }, include: { decisions: true, proposals: { orderBy: { createdAt: 'desc' } } } },
      logs: { orderBy: { createdAt: 'desc' }, take: 80 },
      exports: { orderBy: { createdAt: 'desc' }, take: 20 },
      memberships: { include: { user: true } }
    }
  });

  return project;
}

export async function upsertBrief(projectId: string, fieldsJson: Prisma.JsonObject) {
  return protocolOsDb.brief.upsert({
    where: { projectId },
    update: { fieldsJson },
    create: { projectId, fieldsJson }
  });
}
