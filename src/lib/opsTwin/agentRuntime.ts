import { runCountryFeasibility } from '@/lib/opsTwin/agents/countryFeasibility';
import { runSiteScout } from '@/lib/opsTwin/agents/siteScout';
import { runStartupWorkflow } from '@/lib/opsTwin/agents/startupWorkflow';
import { runRecruitmentDynamics } from '@/lib/opsTwin/agents/recruitmentDynamics';
import { runRiskOfficer } from '@/lib/opsTwin/agents/riskOfficer';
import { runOrchestratorFinalize } from '@/lib/opsTwin/agents/ctmOrchestrator';
import type { AgentName, AgentRunResult, ContextRoot, Rng } from '@/lib/opsTwin/types';
import type { A2AIntent } from '@/lib/a2a/types';

export type RuntimeStep = {
  id: number;
  target: AgentName;
  request: string;
  run: (context: ContextRoot, rng: Rng) => AgentRunResult;
};

export const runtimeSteps: RuntimeStep[] = [
  {
    id: 1,
    target: 'Country_Feasibility_Agent',
    request: 'Provide country-level feasibility prior and baseline assumptions.',
    run: (context) => runCountryFeasibility(context)
  },
  {
    id: 2,
    target: 'Site_Scout_Agent',
    request: 'Generate candidate site list with startup and recruitment priors.',
    run: (context, rng) => runSiteScout(context, rng)
  },
  {
    id: 3,
    target: 'StartUp_Workflow_Agent',
    request: 'Estimate startup timeline, key path risk, and country distribution.',
    run: (context) => runStartupWorkflow(context)
  },
  {
    id: 4,
    target: 'Recruitment_Dynamics_Agent',
    request: 'Project recruitment dynamics and monthly cumulative curve.',
    run: (context) => runRecruitmentDynamics(context)
  },
  {
    id: 5,
    target: 'Risk_Officer_Agent',
    request: 'Build risk register with mitigation and ownership.',
    run: (context) => runRiskOfficer(context)
  },
  {
    id: 6,
    target: 'CTM_Orchestrator',
    request: 'Resolve conflicts and finalize decision and KPI package.',
    run: (context) => runOrchestratorFinalize(context)
  }
];

export function getRuntimeStepByTarget(target: AgentName) {
  return runtimeSteps.find((step) => step.target === target);
}

export function getIntentByAgent(target: AgentName): A2AIntent {
  switch (target) {
    case 'Country_Feasibility_Agent':
      return 'country.prior';
    case 'Site_Scout_Agent':
      return 'site.scout';
    case 'StartUp_Workflow_Agent':
      return 'startup.workflow';
    case 'Recruitment_Dynamics_Agent':
      return 'recruitment.dynamics';
    case 'Risk_Officer_Agent':
      return 'risk.register';
    case 'CTM_Orchestrator':
      return 'orchestrator.finalize';
    default:
      return 'orchestrator.finalize';
  }
}
