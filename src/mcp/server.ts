import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type Tool,
  type TextContent,
  type Prompt,
  type Resource,
} from '@modelcontextprotocol/sdk/types.js';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ContextRoot, ScenarioInput, RunHistoryItem } from '@/lib/opsTwin/types';
import { createInitialContext, applyPatch, replayFromEventLog } from '@/lib/opsTwin/contextStore';
import { runtimeSteps } from '@/lib/opsTwin/agentRuntime';
import { createRng, hashToSeed } from '@/lib/opsTwin/sim/seeded';
import { buildCalibrationPatches } from '@/lib/opsTwin/sim/calibration';
import { z } from 'zod';

// ============================================================================
// MCP Server Configuration
// ============================================================================

const SERVER_NAME = 'stochstack-ops-twin';
const SERVER_VERSION = '1.0.0';

// ============================================================================
// In-Memory Session Store (Production: use Redis/Database)
// ============================================================================

type Session = {
  id: string;
  context: ContextRoot | null;
  history: RunHistoryItem[];
  createdAt: string;
  updatedAt: string;
};

const sessions = new Map<string, Session>();

function createSession(): Session {
  const session: Session = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    context: null,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

function updateSession(sessionId: string, updates: Partial<Session>): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const updated = { ...session, ...updates, updatedAt: new Date().toISOString() };
  sessions.set(sessionId, updated);
  return updated;
}

// ============================================================================
// MCP Resources Definition
// ============================================================================

const RESOURCES: Resource[] = [
  {
    uri: 'context://current',
    name: 'Current Simulation Context',
    mimeType: 'application/json',
    description: 'The current Digital Twin context including study profile, assumptions, candidate sites, risks, and simulation results',
  },
  {
    uri: 'context://history',
    name: 'Session Run History',
    mimeType: 'application/json',
    description: 'History of all simulation runs in this session',
  },
  {
    uri: 'context://schema',
    name: 'Context Schema Definition',
    mimeType: 'application/json',
    description: 'JSON Schema for the Ops Twin context structure',
  },
  {
    uri: 'simulation://kpis',
    name: 'Latest Simulation KPIs',
    mimeType: 'application/json',
    description: 'Key performance indicators from the latest simulation run',
  },
  {
    uri: 'simulation://recruitment-curve',
    name: 'Recruitment Curve Data',
    mimeType: 'application/json',
    description: 'Monthly cumulative enrollment projection',
  },
  {
    uri: 'simulation://risk-register',
    name: 'Risk Register',
    mimeType: 'application/json',
    description: 'Identified risks with likelihood, impact, and mitigation',
  },
  {
    uri: 'agents://registry',
    name: 'Available Agents Registry',
    mimeType: 'application/json',
    description: 'List of available agents in the Ops Twin runtime',
  },
];

// ============================================================================
// MCP Tools Definition
// ============================================================================

const TOOLS: Tool[] = [
  {
    name: 'create_session',
    description: 'Create a new Ops Twin session. Returns session ID for subsequent operations.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'run_simulation',
    description: 'Execute a full Site Start-up + Recruitment simulation with 6-agent workflow',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID from create_session' },
        therapeuticArea: { 
          type: 'string', 
          enum: ['Oncology', 'Cardio', 'Ophthalmology', 'Rare'],
          description: 'Therapeutic area for the study' 
        },
        phase: { 
          type: 'string', 
          enum: ['I', 'II', 'III'],
          description: 'Study phase' 
        },
        countries: { 
          type: 'array', 
          items: { type: 'string', enum: ['Germany', 'France', 'China', 'US', 'UK'] },
          description: 'Target countries for site selection' 
        },
        targetSampleSize: { 
          type: 'number', 
          minimum: 10,
          description: 'Target number of patients to enroll' 
        },
        durationMonths: { 
          type: 'number', 
          minimum: 1,
          description: 'Planned study duration in months' 
        },
        assumptions: {
          type: 'object',
          properties: {
            avg_startup_days: { type: 'number', default: 75 },
            screen_fail_rate: { type: 'number', default: 0.35, minimum: 0, maximum: 1 },
            dropout_rate: { type: 'number', default: 0.18, minimum: 0, maximum: 1 },
            competition_index: { type: 'number', default: 0.5, minimum: 0, maximum: 1 },
            patient_pool_index: { type: 'number', default: 0.6, minimum: 0, maximum: 1 },
          },
        },
        deterministicSeed: { 
          type: 'boolean', 
          default: true,
          description: 'Use deterministic seed for reproducible results' 
        },
      },
      required: ['sessionId', 'therapeuticArea', 'phase', 'countries', 'targetSampleSize', 'durationMonths'],
    },
  },
  {
    name: 'get_context',
    description: 'Retrieve the current simulation context for a session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        path: { 
          type: 'string', 
          description: 'Optional JSON path to retrieve specific field (e.g., "simResults.kpis")',
        },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'calibrate_with_actuals',
    description: 'Calibrate the model with actual observed data to improve forecast accuracy',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        month: { type: 'number', description: 'Month number for the observation' },
        actualCumulativeEnrollment: { type: 'number', description: 'Actual cumulative enrollment observed' },
        startupAvgDaysObserved: { type: 'number', optional: true, description: 'Observed average startup days' },
      },
      required: ['sessionId', 'month', 'actualCumulativeEnrollment'],
    },
  },
  {
    name: 'export_simulation',
    description: 'Export the full simulation context as JSON',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        format: { 
          type: 'string', 
          enum: ['json', 'csv'],
          default: 'json',
          description: 'Export format' 
        },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'list_sessions',
    description: 'List all active sessions',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'replay_simulation',
    description: 'Replay the simulation from event log to verify context integrity',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'analyze_scenario',
    description: 'Get AI-powered analysis of the current simulation scenario',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        focus: { 
          type: 'string', 
          enum: ['risk', 'timeline', 'recruitment', 'cost', 'overall'],
          default: 'overall',
          description: 'Analysis focus area' 
        },
      },
      required: ['sessionId'],
    },
  },
];

// ============================================================================
// MCP Prompts Definition
// ============================================================================

const PROMPTS: Prompt[] = [
  {
    name: 'ops_twin_analyst',
    description: 'Act as a Clinical Operations Analyst using the Digital Twin',
    arguments: [
      { name: 'scenario', description: 'Brief description of the study scenario', required: false },
    ],
  },
  {
    name: 'risk_assessor',
    description: 'Focus on risk assessment and mitigation strategies',
    arguments: [
      { name: 'risk_tolerance', description: 'Risk tolerance level (low/medium/high)', required: false },
    ],
  },
  {
    name: 'site_selection_advisor',
    description: 'Provide site selection and country strategy recommendations',
    arguments: [],
  },
  {
    name: 'forecast_calibrator',
    description: 'Guide through forecast calibration with actual observations',
    arguments: [],
  },
];

// ============================================================================
// Tool Implementation
// ============================================================================

async function handleCreateSession(): Promise<TextContent[]> {
  const session = createSession();
  return [{
    type: 'text',
    text: JSON.stringify({
      sessionId: session.id,
      createdAt: session.createdAt,
      message: 'Session created successfully. Use this sessionId for subsequent operations.',
    }, null, 2),
  }];
}

async function handleRunSimulation(args: unknown): Promise<TextContent[]> {
  const schema = z.object({
    sessionId: z.string(),
    therapeuticArea: z.enum(['Oncology', 'Cardio', 'Ophthalmology', 'Rare']),
    phase: z.enum(['I', 'II', 'III']),
    countries: z.array(z.enum(['Germany', 'France', 'China', 'US', 'UK'])),
    targetSampleSize: z.number().min(10),
    durationMonths: z.number().min(1),
    assumptions: z.object({
      avg_startup_days: z.number().default(75),
      screen_fail_rate: z.number().default(0.35),
      dropout_rate: z.number().default(0.18),
      competition_index: z.number().default(0.5),
      patient_pool_index: z.number().default(0.6),
    }).default({}),
    deterministicSeed: z.boolean().default(true),
  });

  const params = schema.parse(args);
  const session = getSession(params.sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${params.sessionId}`);
  }

  const input: ScenarioInput = {
    therapeuticArea: params.therapeuticArea,
    phase: params.phase,
    countries: params.countries,
    targetSampleSize: params.targetSampleSize,
    durationMonths: params.durationMonths,
    assumptions: params.assumptions,
    deterministicSeed: params.deterministicSeed,
    realtimeMessages: false,
  };

  const runId = `run-${Date.now()}`;
  const seedSource = JSON.stringify({
    therapeuticArea: input.therapeuticArea,
    phase: input.phase,
    countries: input.countries,
    targetSampleSize: input.targetSampleSize,
    durationMonths: input.durationMonths,
    assumptions: input.assumptions,
  });
  const seed = input.deterministicSeed ? hashToSeed(seedSource) : Math.floor(Math.random() * 1_000_000_000);
  const rng = createRng(seed);

  let context = createInitialContext(input, runId, seed);
  const messages: { agent: string; role: string; text: string }[] = [];

  // Run all agent steps
  for (const step of runtimeSteps) {
    const result = step.run(context, rng);
    
    for (const patch of result.patches) {
      context = applyPatch(context, patch);
    }
    
    for (const msg of result.messages) {
      messages.push({
        agent: msg.agent,
        role: msg.role,
        text: msg.text,
      });
    }
  }

  // Update session
  const historyItem: RunHistoryItem = {
    id: runId,
    createdAt: new Date().toISOString(),
    input,
    context,
    messages: messages.map((m, i) => ({
      ...m,
      id: `msg-${runId}-${i}`,
      timestamp: new Date().toISOString(),
      eventIds: [],
    })),
  };

  updateSession(params.sessionId, {
    context,
    history: [historyItem, ...session.history].slice(0, 10),
  });

  return [{
    type: 'text',
    text: JSON.stringify({
      runId,
      sessionId: params.sessionId,
      summary: {
        therapeuticArea: input.therapeuticArea,
        phase: input.phase,
        countries: input.countries,
        targetSampleSize: input.targetSampleSize,
      },
      kpis: context.simResults.kpis,
      agentMessages: messages.length,
      topSites: context.candidateSites.slice(0, 3).map(s => ({
        name: s.site_name,
        country: s.country,
        score: s.score,
      })),
      topRisks: context.risks.slice(0, 3).map(r => ({
        title: r.title,
        likelihood: r.likelihood,
        impact: r.impact,
      })),
    }, null, 2),
  }];
}

async function handleGetContext(args: unknown): Promise<TextContent[]> {
  const schema = z.object({
    sessionId: z.string(),
    path: z.string().optional(),
  });

  const params = schema.parse(args);
  const session = getSession(params.sessionId);

  if (!session) {
    throw new Error(`Session not found: ${params.sessionId}`);
  }

  if (!session.context) {
    throw new Error('No simulation context found. Run a simulation first.');
  }

  let data: unknown = session.context;

  if (params.path) {
    const keys = params.path.split('.');
    for (const key of keys) {
      if (data && typeof data === 'object' && key in data) {
        data = (data as Record<string, unknown>)[key];
      } else {
        throw new Error(`Path not found: ${params.path}`);
      }
    }
  }

  return [{
    type: 'text',
    text: JSON.stringify(data, null, 2),
  }];
}

async function handleCalibrateWithActuals(args: unknown): Promise<TextContent[]> {
  const schema = z.object({
    sessionId: z.string(),
    month: z.number(),
    actualCumulativeEnrollment: z.number(),
    startupAvgDaysObserved: z.number().optional(),
  });

  const params = schema.parse(args);
  const session = getSession(params.sessionId);

  if (!session) {
    throw new Error(`Session not found: ${params.sessionId}`);
  }

  if (!session.context) {
    throw new Error('No simulation context found. Run a simulation first.');
  }

  const { patches, diagnostics } = buildCalibrationPatches({
    context: session.context,
    month: params.month,
    actualCumulativeEnrollment: params.actualCumulativeEnrollment,
    startupAvgDaysObserved: params.startupAvgDaysObserved,
  });

  let context = session.context;
  for (const patch of patches) {
    context = applyPatch(context, patch);
  }

  updateSession(params.sessionId, { context });

  return [{
    type: 'text',
    text: JSON.stringify({
      calibrated: true,
      month: params.month,
      actualCumulativeEnrollment: params.actualCumulativeEnrollment,
      confidenceScore: diagnostics.confidenceScore,
      mape: diagnostics.mape,
      signedBias: diagnostics.signedBias,
      parameterShift: diagnostics.parameterShift,
      notes: diagnostics.notes,
      message: `Calibration complete. Confidence score: ${Math.round(diagnostics.confidenceScore * 100)}%`,
    }, null, 2),
  }];
}

async function handleExportSimulation(args: unknown): Promise<TextContent[]> {
  const schema = z.object({
    sessionId: z.string(),
    format: z.enum(['json', 'csv']).default('json'),
  });

  const params = schema.parse(args);
  const session = getSession(params.sessionId);

  if (!session) {
    throw new Error(`Session not found: ${params.sessionId}`);
  }

  if (!session.context) {
    throw new Error('No simulation context found. Run a simulation first.');
  }

  if (params.format === 'csv') {
    // Simple CSV export for recruitment curve
    const curve = session.context.simResults.recruitmentCurve;
    const headers = 'Month,CumulativeEnrollment,PlannedEnrollment\n';
    const rows = curve.map(p => `${p.month},${p.cumulativeEnrollment},${p.plannedEnrollment}`).join('\n');
    
    return [{
      type: 'text',
      text: headers + rows,
    }];
  }

  return [{
    type: 'text',
    text: JSON.stringify(session.context, null, 2),
  }];
}

async function handleListSessions(): Promise<TextContent[]> {
  const sessionList = Array.from(sessions.values()).map(s => ({
    sessionId: s.id,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    hasContext: s.context !== null,
    runCount: s.history.length,
  }));

  return [{
    type: 'text',
    text: JSON.stringify(sessionList, null, 2),
  }];
}

async function handleReplaySimulation(args: unknown): Promise<TextContent[]> {
  const schema = z.object({
    sessionId: z.string(),
  });

  const params = schema.parse(args);
  const session = getSession(params.sessionId);

  if (!session) {
    throw new Error(`Session not found: ${params.sessionId}`);
  }

  if (!session.context) {
    throw new Error('No simulation context found. Run a simulation first.');
  }

  const replayed = replayFromEventLog(session.context);
  
  const integrityCheck = JSON.stringify(replayed) === JSON.stringify(session.context);

  return [{
    type: 'text',
    text: JSON.stringify({
      replayed: true,
      integrityCheck,
      eventCount: session.context.eventLog.length,
      version: replayed.meta.version,
      message: integrityCheck 
        ? 'Replay successful. Context integrity verified.' 
        : 'Replay completed but context differs from original.',
    }, null, 2),
  }];
}

async function handleAnalyzeScenario(args: unknown): Promise<TextContent[]> {
  const schema = z.object({
    sessionId: z.string(),
    focus: z.enum(['risk', 'timeline', 'recruitment', 'cost', 'overall']).default('overall'),
  });

  const params = schema.parse(args);
  const session = getSession(params.sessionId);

  if (!session) {
    throw new Error(`Session not found: ${params.sessionId}`);
  }

  if (!session.context) {
    throw new Error('No simulation context found. Run a simulation first.');
  }

  const ctx = session.context;
  const kpis = ctx.simResults.kpis;

  let analysis = '';

  switch (params.focus) {
    case 'risk':
      analysis = generateRiskAnalysis(ctx);
      break;
    case 'timeline':
      analysis = generateTimelineAnalysis(ctx);
      break;
    case 'recruitment':
      analysis = generateRecruitmentAnalysis(ctx);
      break;
    case 'cost':
      analysis = generateCostAnalysis(ctx);
      break;
    default:
      analysis = generateOverallAnalysis(ctx);
  }

  return [{
    type: 'text',
    text: analysis,
  }];
}

// ============================================================================
// Analysis Generators
// ============================================================================

function generateRiskAnalysis(ctx: ContextRoot): string {
  const highRisks = ctx.risks.filter(r => r.likelihood > 0.7 && r.impact > 0.7);
  const mediumRisks = ctx.risks.filter(r => (r.likelihood > 0.4 || r.impact > 0.4) && !(r.likelihood > 0.7 && r.impact > 0.7));

  return JSON.stringify({
    focus: 'risk',
    overallRiskScore: ctx.simResults.kpis.overallRiskScore,
    riskCount: ctx.risks.length,
    highPriorityRisks: highRisks,
    mediumPriorityRisks: mediumRisks,
    recommendations: [
      highRisks.length > 0 ? 'Immediate attention required for high-priority risks' : 'Risk profile is acceptable',
      `Monitor ${ctx.risks.filter(r => r.owner_agent === 'Risk_Officer_Agent').length} risks assigned to Risk Officer`,
    ],
  }, null, 2);
}

function generateTimelineAnalysis(ctx: ContextRoot): string {
  return JSON.stringify({
    focus: 'timeline',
    predictedFPI: ctx.simResults.kpis.predictedFPI,
    predictedLPI: ctx.simResults.kpis.predictedLPI,
    sitesNeeded: ctx.simResults.kpis.sitesNeeded,
    startupDistribution: ctx.simResults.startupDistribution.map(d => ({
      country: d.country,
      avgStartupDays: d.avgStartupDays,
    })),
    recommendations: [
      ctx.simResults.startupDistribution.some(d => d.avgStartupDays > 90) 
        ? 'Consider alternative countries with faster startup timelines' 
        : 'Startup timeline is within acceptable range',
    ],
  }, null, 2);
}

function generateRecruitmentAnalysis(ctx: ContextRoot): string {
  const curve = ctx.simResults.recruitmentCurve;
  const finalPoint = curve[curve.length - 1];
  const target = ctx.studyProfile.targetSampleSize;
  const achieved = finalPoint ? finalPoint.cumulativeEnrollment : 0;
  const gap = target - achieved;

  return JSON.stringify({
    focus: 'recruitment',
    targetSampleSize: target,
    projectedEnrollment: achieved,
    gap: gap > 0 ? gap : 0,
    gapPercentage: gap > 0 ? (gap / target) * 100 : 0,
    monthsToLPI: curve.length,
    enrollmentRate: curve.length > 0 ? achieved / curve.length : 0,
    recommendations: [
      gap > 0 
        ? `Risk: Projected enrollment is ${((gap/target)*100).toFixed(1)}% below target` 
        : 'Enrollment projection meets target',
      ctx.simResults.kpis.sitesNeeded > ctx.candidateSites.length 
        ? 'Consider activating additional sites' 
        : 'Site count is adequate for enrollment target',
    ],
  }, null, 2);
}

function generateCostAnalysis(ctx: ContextRoot): string {
  return JSON.stringify({
    focus: 'cost',
    totalStartupCost: ctx.simResults.kpis.totalStartupCost,
    sitesActivated: ctx.candidateSites.length,
    costPerSite: ctx.candidateSites.length > 0 
      ? ctx.simResults.kpis.totalStartupCost / ctx.candidateSites.length 
      : 0,
    countryBreakdown: ctx.simResults.startupDistribution.map(d => ({
      country: d.country,
      avgCost: d.avgStartupDays * 1000, // Simplified cost model
    })),
  }, null, 2);
}

function generateOverallAnalysis(ctx: ContextRoot): string {
  return JSON.stringify({
    focus: 'overall',
    studyProfile: ctx.studyProfile,
    kpis: ctx.simResults.kpis,
    forecastConfidence: ctx.simResults.forecastDiagnostics.confidenceScore,
    siteCount: ctx.candidateSites.length,
    riskCount: ctx.risks.length,
    eventCount: ctx.eventLog.length,
    summary: `Ops Twin simulation for ${ctx.studyProfile.therapeuticArea} Phase ${ctx.studyProfile.phase} study across ${ctx.studyProfile.countries.join(', ')}. ` +
             `Predicted FPI: ${ctx.simResults.kpis.predictedFPI}, LPI: ${ctx.simResults.kpis.predictedLPI}. ` +
             `Overall risk score: ${ctx.simResults.kpis.overallRiskScore}/100.`,
  }, null, 2);
}

// ============================================================================
// Prompt Implementation
// ============================================================================

function getOpsTwinAnalystPrompt(scenario?: string): string {
  return `You are a Clinical Operations Analyst working with the StochStack Ops Twin Digital Twin system.

${scenario ? `SCENARIO: ${scenario}\n\n` : ''}CAPABILITIES:
- Run Site Start-up + Recruitment simulations
- Analyze country feasibility and site selection
- Assess operational risks and mitigation strategies
- Calibrate forecasts with actual observations
- Generate KPI reports and timeline projections

WORKFLOW:
1. First, create a session with 'create_session'
2. Run simulation with 'run_simulation' providing study parameters
3. Use 'get_context' to explore results
4. Use 'analyze_scenario' for AI-powered insights
5. Use 'calibrate_with_actuals' to improve accuracy with real data

AGENTS IN THE SYSTEM:
- CTM_Orchestrator: Coordinates the entire workflow
- Country_Feasibility_Agent: Evaluates country-level feasibility
- Site_Scout_Agent: Identifies and scores candidate sites
- StartUp_Workflow_Agent: Estimates startup timelines
- Recruitment_Dynamics_Agent: Projects enrollment curves
- Risk_Officer_Agent: Identifies and assesses risks

Always explain your reasoning and provide actionable recommendations.`;
}

function getRiskAssessorPrompt(riskTolerance?: string): string {
  return `You are a Risk Management Specialist focused on clinical trial operational risks.

${riskTolerance ? `RISK TOLERANCE: ${riskTolerance.toUpperCase()}\n\n` : ''}YOUR ROLE:
- Identify critical path risks that could delay FPI (First Patient In)
- Assess likelihood and impact of site startup failures
- Evaluate country-level regulatory and operational risks
- Recommend risk mitigation strategies and contingency plans

RISK CATEGORIES TO CONSIDER:
1. Timeline Risks: Delays in site activation, regulatory approval
2. Enrollment Risks: Screen failure, dropout, competition for patients
3. Operational Risks: PI availability, staff turnover, equipment issues
4. External Risks: Regulatory changes, pandemic, geopolitical issues

USE THESE TOOLS:
- 'run_simulation' to assess risk scenarios
- 'analyze_scenario' with focus='risk' for detailed risk analysis
- 'get_context' with path='risks' to see the risk register

Provide specific, quantified risk assessments with mitigation owners.`;
}

function getSiteSelectionAdvisorPrompt(): string {
  return `You are a Site Selection Strategist specializing in clinical trial feasibility.

YOUR EXPERTISE:
- Country-level feasibility assessment
- Site scoring and ranking methodologies
- Patient population analysis
- Competition assessment
- Startup timeline optimization

KEY FACTORS TO ANALYZE:
1. Country attractiveness: regulatory environment, patient access, competition
2. Site capabilities: experience, patient pool, equipment, staff
3. Startup efficiency: historical performance, regulatory timelines
4. Recruitment potential: indication prevalence, referral networks

TOOLS TO USE:
- 'run_simulation' with different country combinations
- 'get_context' with path='candidateSites' for site details
- 'get_context' with path='simResults.startupDistribution' for timeline data

Provide data-driven site selection recommendations with rationale.`;
}

function getForecastCalibratorPrompt(): string {
  return `You are a Forecast Calibration Specialist focused on improving enrollment predictions.

YOUR ROLE:
- Compare predicted vs actual enrollment trajectories
- Identify systematic biases in forecasting models
- Recommend parameter adjustments based on observed data
- Track forecast accuracy over time (MAPE, bias metrics)

CALIBRATION PROCESS:
1. Review current simulation context
2. Input actual observations using 'calibrate_with_actuals'
3. Analyze parameter shifts suggested by the system
4. Monitor confidence score improvements
5. Document learnings for future studies

KEY METRICS:
- MAPE (Mean Absolute Percentage Error): Target < 15%
- Signed Bias: Should approach 0 with calibration
- Confidence Score: Should increase with more data points

Use 'calibrate_with_actuals' regularly to maintain forecast accuracy.`;
}

// ============================================================================
// MCP Server Factory
// ============================================================================

export function createMcpServer() {
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { resources: {}, tools: {}, prompts: {} } }
  );

  // Resource Handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    // Extract session ID from query params if present
    const url = new URL(uri, 'http://localhost');
    const sessionId = url.searchParams.get('sessionId');

    switch (true) {
      case uri === 'context://schema':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              type: 'object',
              properties: {
                meta: { type: 'object', properties: { runId: { type: 'string' }, version: { type: 'number' } } },
                studyProfile: { type: 'object' },
                assumptions: { type: 'object' },
                candidateSites: { type: 'array' },
                risks: { type: 'array' },
                decisions: { type: 'array' },
                simResults: { type: 'object' },
                eventLog: { type: 'array' },
              },
            }, null, 2),
          }],
        };

      case uri === 'context://current':
        if (!sessionId) throw new Error('sessionId required. Use context://current?sessionId=xxx');
        const session = getSession(sessionId);
        if (!session) throw new Error('Session not found');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(session.context, null, 2),
          }],
        };

      case uri === 'context://history':
        if (!sessionId) throw new Error('sessionId required. Use context://history?sessionId=xxx');
        const histSession = getSession(sessionId);
        if (!histSession) throw new Error('Session not found');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(histSession.history, null, 2),
          }],
        };

      case uri === 'simulation://kpis':
        if (!sessionId) throw new Error('sessionId required');
        const kpiSession = getSession(sessionId);
        if (!kpiSession?.context) throw new Error('No simulation found');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(kpiSession.context.simResults.kpis, null, 2),
          }],
        };

      case uri === 'simulation://recruitment-curve':
        if (!sessionId) throw new Error('sessionId required');
        const curveSession = getSession(sessionId);
        if (!curveSession?.context) throw new Error('No simulation found');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(curveSession.context.simResults.recruitmentCurve, null, 2),
          }],
        };

      case uri === 'simulation://risk-register':
        if (!sessionId) throw new Error('sessionId required');
        const riskSession = getSession(sessionId);
        if (!riskSession?.context) throw new Error('No simulation found');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(riskSession.context.risks, null, 2),
          }],
        };

      case uri === 'agents://registry':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(runtimeSteps.map(s => ({
              name: s.target,
              step: s.id,
              request: s.request,
            })), null, 2),
          }],
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // Tool Handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: TextContent[];

      switch (name) {
        case 'create_session':
          result = await handleCreateSession();
          break;
        case 'run_simulation':
          result = await handleRunSimulation(args);
          break;
        case 'get_context':
          result = await handleGetContext(args);
          break;
        case 'calibrate_with_actuals':
          result = await handleCalibrateWithActuals(args);
          break;
        case 'export_simulation':
          result = await handleExportSimulation(args);
          break;
        case 'list_sessions':
          result = await handleListSessions();
          break;
        case 'replay_simulation':
          result = await handleReplaySimulation(args);
          break;
        case 'analyze_scenario':
          result = await handleAnalyzeScenario(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return { content: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  // Prompt Handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS,
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    let prompt = '';

    switch (name) {
      case 'ops_twin_analyst':
        prompt = getOpsTwinAnalystPrompt(args?.scenario);
        break;
      case 'risk_assessor':
        prompt = getRiskAssessorPrompt(args?.risk_tolerance);
        break;
      case 'site_selection_advisor':
        prompt = getSiteSelectionAdvisorPrompt();
        break;
      case 'forecast_calibrator':
        prompt = getForecastCalibratorPrompt();
        break;
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }

    return {
      description: PROMPTS.find(p => p.name === name)?.description || '',
      messages: [{
        role: 'user',
        content: { type: 'text', text: prompt },
      }],
    };
  });

  return server;
}

// ============================================================================
// SSE Transport Handler (for Next.js API Route)
// ============================================================================

export async function handleMcpSseRequest(req: IncomingMessage, res: ServerResponse) {
  const transport = new SSEServerTransport('/api/mcp/messages', res);
  const server = createMcpServer();
  
  await server.connect(transport);
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
}
