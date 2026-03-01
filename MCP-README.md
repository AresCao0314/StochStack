# StochStack Ops Twin - MCP Server

Model Context Protocol (MCP) integration for the Clinical Operations Digital Twin.

## Overview

This MCP Server exposes the Site Start-up + Recruitment Simulation capabilities to external MCP clients like Claude Desktop, Cursor, or any other MCP-compatible tool.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MCP Clients                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Claude Desktop│  │    Cursor    │  │   Other MCP Tools    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          └─────────────────┼─────────────────────┘
                            │ SSE + JSON-RPC
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js App                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  GET /api/mcp        →  SSE Connection                  │    │
│  │  POST /api/mcp/messages →  JSON-RPC Message Handler    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MCP Server (src/mcp/server.ts)             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │    │
│  │  │  Resources  │  │    Tools    │  │     Prompts     │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Ops Twin Core (src/lib/opsTwin)            │    │
│  │  - Agent Runtime    - Context Store    - Simulation     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The MCP server will be available at `http://localhost:3000/api/mcp`

### 3. Configure Claude Desktop

**macOS:**
```bash
# Edit the Claude Desktop config
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```powershell
# Edit the Claude Desktop config
notepad $env:AppData\Claude\claude_desktop_config.json
```

Add the MCP server:

```json
{
  "mcpServers": {
    "stochstack-ops-twin": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

**Restart Claude Desktop** to load the new MCP server.

### 4. Configure Cursor

Go to Cursor Settings → MCP Servers → Add Server:

- **Name:** `stochstack-ops-twin`
- **Type:** `SSE`
- **URL:** `http://localhost:3000/api/mcp`

## Available Resources

Resources provide read-only access to simulation data:

| Resource URI | Description |
|--------------|-------------|
| `context://schema` | JSON Schema for context structure |
| `context://current?sessionId=xxx` | Current simulation context |
| `context://history?sessionId=xxx` | Session run history |
| `simulation://kpis?sessionId=xxx` | Latest KPIs |
| `simulation://recruitment-curve?sessionId=xxx` | Enrollment curve data |
| `simulation://risk-register?sessionId=xxx` | Risk register |
| `agents://registry` | Available agents |

## Available Tools

Tools allow you to run simulations and interact with the Digital Twin:

### `create_session`
Create a new simulation session.

**Input:** None

**Output:**
```json
{
  "sessionId": "session-1234567890-abc123",
  "createdAt": "2026-03-01T10:00:00.000Z",
  "message": "Session created successfully..."
}
```

### `run_simulation`
Execute a full 6-agent simulation workflow.

**Input:**
```json
{
  "sessionId": "session-1234567890-abc123",
  "therapeuticArea": "Oncology",
  "phase": "II",
  "countries": ["Germany", "France", "US"],
  "targetSampleSize": 240,
  "durationMonths": 16,
  "assumptions": {
    "avg_startup_days": 75,
    "screen_fail_rate": 0.35,
    "dropout_rate": 0.18,
    "competition_index": 0.5,
    "patient_pool_index": 0.6
  },
  "deterministicSeed": true
}
```

**Output:**
```json
{
  "runId": "run-1234567890",
  "sessionId": "session-1234567890-abc123",
  "summary": { ... },
  "kpis": {
    "predictedFPI": "Day 45",
    "predictedLPI": "Month 14",
    "sitesNeeded": 8,
    "totalStartupCost": 425000,
    "overallRiskScore": 42
  },
  "agentMessages": 6,
  "topSites": [...],
  "topRisks": [...]
}
```

### `get_context`
Retrieve simulation context.

**Input:**
```json
{
  "sessionId": "session-1234567890-abc123",
  "path": "simResults.kpis"
}
```

### `calibrate_with_actuals`
Calibrate the model with real observed data.

**Input:**
```json
{
  "sessionId": "session-1234567890-abc123",
  "month": 6,
  "actualCumulativeEnrollment": 89,
  "startupAvgDaysObserved": 82
}
```

**Output:**
```json
{
  "calibrated": true,
  "confidenceScore": 0.78,
  "mape": 0.12,
  "parameterShift": { ... },
  "message": "Calibration complete. Confidence score: 78%"
}
```

### `analyze_scenario`
Get AI-powered analysis.

**Input:**
```json
{
  "sessionId": "session-1234567890-abc123",
  "focus": "risk"
}
```

**Focus options:** `risk`, `timeline`, `recruitment`, `cost`, `overall`

### `export_simulation`
Export simulation data.

**Input:**
```json
{
  "sessionId": "session-1234567890-abc123",
  "format": "json"
}
```

### `list_sessions`
List all active sessions.

### `replay_simulation`
Replay simulation from event log to verify integrity.

## Available Prompts

Prompts provide specialized AI personas for different use cases:

### `ops_twin_analyst`
General Clinical Operations Analyst persona.

**Arguments:**
- `scenario` (optional): Brief study scenario description

### `risk_assessor`
Risk management specialist.

**Arguments:**
- `risk_tolerance` (optional): `low`, `medium`, or `high`

### `site_selection_advisor`
Site selection strategist.

### `forecast_calibrator`
Forecast calibration specialist.

## Example Claude Conversations

### Run a Simulation

```
User: Run a simulation for an Oncology Phase II study in Germany and France 
with 200 patients over 18 months.

Claude: I'll run that simulation for you. First, let me create a session...
[Uses create_session]

Now running the simulation...
[Uses run_simulation]

Results:
- Predicted FPI: Day 42
- Predicted LPI: Month 16
- Sites Needed: 6
- Overall Risk Score: 38/100

The simulation identified 12 candidate sites across your target countries.
Top sites include Charité Berlin (score: 87) and Gustave Roussy (score: 84).

Key risks identified:
1. Competition for patients in Germany (likelihood: 0.6, impact: 0.7)
2. Regulatory delays in France (likelihood: 0.4, impact: 0.6)
```

### Analyze Risk

```
User: What's the risk profile of the current simulation?

Claude: Let me analyze the risk profile...
[Uses analyze_scenario with focus="risk"]

The current simulation has 8 identified risks with an overall risk score of 42/100.

High Priority Risks:
1. Competition for Oncology patients in Germany (L: 0.75, I: 0.72)
   - Mitigation: Expand to additional sites, consider basket trials
   - Owner: Risk_Officer_Agent

2. PI availability constraint (L: 0.68, I: 0.70)
   - Mitigation: Pre-commitment agreements, backup PI identification
   - Owner: Site_Scout_Agent

Recommendation: Consider activating 2 additional sites in France to reduce concentration risk.
```

### Calibrate with Actuals

```
User: We just finished month 6 and have 89 patients enrolled. The average 
startup time was 82 days. Please calibrate the model.

Claude: I'll calibrate the model with those actuals...
[Uses calibrate_with_actuals]

Calibration complete!

- Confidence score improved to 78%
- MAPE: 12% (good accuracy)
- Signed bias: +5% (slight overestimation)

Parameter adjustments made:
- patient_pool_index: 0.60 → 0.65 (+8%)
- dropout_rate: 0.18 → 0.16 (-11%)

The model is now better aligned with observed performance.
```

## API Testing

### Using curl

```bash
# Create a session
curl -X POST http://localhost:3000/api/mcp/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_session",
      "arguments": {}
    }
  }'

# Run simulation
curl -X POST http://localhost:3000/api/mcp/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "run_simulation",
      "arguments": {
        "sessionId": "session-xxx",
        "therapeuticArea": "Oncology",
        "phase": "II",
        "countries": ["Germany", "France"],
        "targetSampleSize": 200,
        "durationMonths": 18
      }
    }
  }'

# List tools
curl -X POST http://localhost:3000/api/mcp/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/list"
  }'
```

## Production Deployment

### Environment Variables

```bash
# Optional: Configure session persistence
MCP_SESSION_STORE=redis  # or 'memory' (default)
REDIS_URL=redis://localhost:6379

# Optional: Session timeout
MCP_SESSION_TIMEOUT_MS=3600000  # 1 hour
```

### Docker

The MCP server is included in the standard Docker deployment:

```bash
docker compose up -d
```

MCP endpoint will be available at:
- Local: `http://localhost:3000/api/mcp`
- Production: `https://your-domain.com/api/mcp`

### Scaling Considerations

- **Session Store:** Currently uses in-memory Map. For production multi-instance deployments, migrate to Redis.
- **SSE Connections:** Each client maintains a persistent connection. Ensure your load balancer supports SSE.
- **Timeouts:** Long-running simulations may exceed default timeouts. Adjust accordingly.

## Troubleshooting

### Claude Desktop doesn't show the tools

1. Check the server is running: `curl http://localhost:3000/api/mcp`
2. Verify the config file syntax is valid JSON
3. Restart Claude Desktop completely
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

### SSE connection drops

1. Check for proxy/firewall blocking SSE
2. Ensure `Cache-Control: no-cache` header is present
3. Check server keepalive interval

### Session not found errors

Sessions are stored in memory and will be lost on server restart. For persistence, implement Redis session store.

## Contributing

To add new tools or resources:

1. Edit `src/mcp/server.ts`
2. Add tool/resource definition to `TOOLS` or `RESOURCES` array
3. Implement handler function
4. Update this README

## Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [StochStack Ops Twin Documentation](./README.md)
