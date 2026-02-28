import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export type SopSkillChange = {
  version: string;
  date: string;
  author: string;
  summary: string;
};

export type SopSkillStatus = 'active' | 'draft' | 'deprecated';

export type SopSkillPack = {
  header: string;
  sopVersion: string;
  status: SopSkillStatus;
  effectiveDate: string;
  reviewer: string;
  approvedBy: string;
  approvalDate: string;
  owners: string[];
  intentKeywords: string[];
  description: string;
  sopSteps: string[];
  outputs: string[];
  changeLog: SopSkillChange[];
};

export type SopSkillRegistry = {
  registryId: string;
  registryVersion: string;
  updatedAt: string;
  sourceFormat: 'yaml' | 'json';
  skills: SopSkillPack[];
};

type RawRegistry = Partial<Omit<SopSkillRegistry, 'sourceFormat'>> & {
  skills?: Partial<SopSkillPack>[];
};

function normalizeSkill(raw: Partial<SopSkillPack>): SopSkillPack | null {
  if (!raw.header) return null;
  return {
    header: raw.header,
    sopVersion: raw.sopVersion ?? '0.1.0',
    status: raw.status ?? 'active',
    effectiveDate: raw.effectiveDate ?? '2026-01-01',
    reviewer: raw.reviewer ?? '',
    approvedBy: raw.approvedBy ?? '',
    approvalDate: raw.approvalDate ?? '',
    owners: Array.isArray(raw.owners) ? raw.owners : [],
    intentKeywords: Array.isArray(raw.intentKeywords) ? raw.intentKeywords : [],
    description: raw.description ?? '',
    sopSteps: Array.isArray(raw.sopSteps) ? raw.sopSteps : [],
    outputs: Array.isArray(raw.outputs) ? raw.outputs : [],
    changeLog: Array.isArray(raw.changeLog)
      ? raw.changeLog
          .filter((item): item is SopSkillChange => Boolean(item?.version && item?.date && item?.author && item?.summary))
          .map((item) => ({
            version: item.version,
            date: item.date,
            author: item.author,
            summary: item.summary
          }))
      : []
  };
}

function isEffectiveSkill(skill: SopSkillPack) {
  const hasApproval = Boolean(skill.reviewer && skill.approvedBy && skill.approvalDate);
  if (!hasApproval) return false;
  if (skill.status !== 'active') return false;
  const parsedApprovalDate = new Date(skill.approvalDate);
  if (Number.isNaN(parsedApprovalDate.getTime())) return false;
  return parsedApprovalDate.getTime() <= Date.now();
}

function normalizeRegistry(raw: RawRegistry, sourceFormat: 'yaml' | 'json'): SopSkillRegistry {
  const skills = (raw.skills ?? [])
    .map((item) => normalizeSkill(item))
    .filter((item): item is SopSkillPack => item !== null)
    .filter((item) => isEffectiveSkill(item));

  return {
    registryId: raw.registryId ?? 'ctm-sop-skill-registry',
    registryVersion: raw.registryVersion ?? '0.1.0',
    updatedAt: raw.updatedAt ?? '2026-03-01',
    sourceFormat,
    skills
  };
}

export function loadCtmSopRegistry(): SopSkillRegistry {
  const basePath = path.join(process.cwd(), 'src', 'content', 'ctm-dashboard');
  const yamlPath = path.join(basePath, 'skills.registry.yaml');
  const jsonPath = path.join(basePath, 'skills.registry.json');

  if (fs.existsSync(yamlPath)) {
    const data = fs.readFileSync(yamlPath, 'utf-8');
    return normalizeRegistry(YAML.parse(data) as RawRegistry, 'yaml');
  }

  if (fs.existsSync(jsonPath)) {
    const data = fs.readFileSync(jsonPath, 'utf-8');
    return normalizeRegistry(JSON.parse(data) as RawRegistry, 'json');
  }

  return {
    registryId: 'ctm-sop-skill-registry',
    registryVersion: '0.0.0',
    updatedAt: '1970-01-01',
    sourceFormat: 'json',
    skills: []
  };
}
