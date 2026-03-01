'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Terminal, 
  Copy, 
  Check, 
  Server, 
  Activity,
  ChevronRight,
  BookOpen,
  Code,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'success' | 'error';
  response?: unknown;
  duration?: number;
};

type LogEntry = {
  id: string;
  type: 'request' | 'response' | 'error' | 'info';
  message: string;
  timestamp: string;
  data?: unknown;
};

// ============================================================================
// Tool Definitions
// ============================================================================

const AVAILABLE_TOOLS = [
  {
    name: 'create_session',
    description: 'Create a new simulation session',
    params: {},
    example: {},
  },
  {
    name: 'run_simulation',
    description: 'Execute full 6-agent simulation workflow',
    params: {
      sessionId: 'string (required)',
      therapeuticArea: 'Oncology | Cardio | Ophthalmology | Rare',
      phase: 'I | II | III',
      countries: 'string[] (e.g., ["Germany", "France"])',
      targetSampleSize: 'number (e.g., 200)',
      durationMonths: 'number (e.g., 16)',
    },
    example: {
      sessionId: '{{sessionId}}',
      therapeuticArea: 'Oncology',
      phase: 'II',
      countries: ['Germany', 'France'],
      targetSampleSize: 200,
      durationMonths: 16,
    },
  },
  {
    name: 'get_context',
    description: 'Retrieve simulation context data',
    params: {
      sessionId: 'string (required)',
      path: 'string (optional, e.g., "simResults.kpis")',
    },
    example: {
      sessionId: '{{sessionId}}',
      path: 'simResults.kpis',
    },
  },
  {
    name: 'analyze_scenario',
    description: 'Get AI-powered analysis of current simulation',
    params: {
      sessionId: 'string (required)',
      focus: 'risk | timeline | recruitment | cost | overall',
    },
    example: {
      sessionId: '{{sessionId}}',
      focus: 'risk',
    },
  },
  {
    name: 'calibrate_with_actuals',
    description: 'Calibrate model with actual observed data',
    params: {
      sessionId: 'string (required)',
      month: 'number',
      actualCumulativeEnrollment: 'number',
      startupAvgDaysObserved: 'number (optional)',
    },
    example: {
      sessionId: '{{sessionId}}',
      month: 6,
      actualCumulativeEnrollment: 89,
      startupAvgDaysObserved: 82,
    },
  },
  {
    name: 'list_sessions',
    description: 'List all active sessions',
    params: {},
    example: {},
  },
  {
    name: 'export_simulation',
    description: 'Export simulation data as JSON or CSV',
    params: {
      sessionId: 'string (required)',
      format: 'json | csv (default: json)',
    },
    example: {
      sessionId: '{{sessionId}}',
      format: 'json',
    },
  },
  {
    name: 'replay_simulation',
    description: 'Replay simulation from event log',
    params: {
      sessionId: 'string (required)',
    },
    example: {
      sessionId: '{{sessionId}}',
    },
  },
];

// ============================================================================
// Components
// ============================================================================

function JsonEditor({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-48 font-mono text-sm bg-ink/5 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-ink/20"
      spellCheck={false}
    />
  );
}

function LogViewer({ logs }: { logs: LogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="h-64 overflow-y-auto font-mono text-xs bg-ink/5 rounded-lg p-3 space-y-1"
    >
      {logs.length === 0 && (
        <p className="text-ink/40 italic">No logs yet. Run a tool to see activity...</p>
      )}
      {logs.map((log) => (
        <div 
          key={log.id}
          className={`flex gap-2 ${
            log.type === 'error' ? 'text-red-600' :
            log.type === 'response' ? 'text-green-600' :
            log.type === 'request' ? 'text-blue-600' :
            'text-ink/60'
          }`}
        >
          <span className="text-ink/30 shrink-0">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span className="uppercase shrink-0 w-16">[{log.type}]</span>
          <span className="break-all">{log.message}</span>
        </div>
      ))}
    </div>
  );
}

function ToolCard({ 
  tool, 
  isSelected, 
  onClick 
}: { 
  tool: typeof AVAILABLE_TOOLS[0]; 
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected 
          ? 'border-ink bg-ink/5' 
          : 'border-ink/10 hover:border-ink/30 hover:bg-ink/5'
      }`}
    >
      <div className="flex items-center justify-between">
        <code className="text-sm font-semibold text-ink">{tool.name}</code>
        {isSelected && <ChevronRight className="h-4 w-4 text-ink" />}
      </div>
      <p className="text-xs text-ink/60 mt-1">{tool.description}</p>
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function McpDemoPage() {
  const [selectedTool, setSelectedTool] = useState(AVAILABLE_TOOLS[0]);
  const [paramsInput, setParamsInput] = useState('{}');
  const [sessionId, setSessionId] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'playground' | 'docs' | 'curl'>('playground');

  const addLog = (type: LogEntry['type'], message: string, data?: unknown) => {
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      data,
    }]);
  };

  const handleToolSelect = (tool: typeof AVAILABLE_TOOLS[0]) => {
    setSelectedTool(tool);
    let example = JSON.stringify(tool.example, null, 2);
    if (sessionId) {
      example = example.replace(/\{\{sessionId\}\}/g, sessionId);
    }
    setParamsInput(example);
  };

  const handleRunTool = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      let params: Record<string, unknown> = {};
      try {
        params = JSON.parse(paramsInput);
      } catch {
        addLog('error', 'Invalid JSON in parameters');
        setIsLoading(false);
        return;
      }

      addLog('request', `${selectedTool.name}(${JSON.stringify(params)})`);

      const response = await fetch('/api/mcp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: selectedTool.name,
            arguments: params,
          },
        }),
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.error) {
        addLog('error', `${selectedTool.name} failed: ${data.error.message}`);
      } else {
        addLog('response', `${selectedTool.name} completed in ${duration}ms`, data.result);
        
        // Auto-extract sessionId from create_session response
        if (selectedTool.name === 'create_session' && data.result?.content?.[0]?.text) {
          try {
            const result = JSON.parse(data.result.content[0].text);
            if (result.sessionId) {
              setSessionId(result.sessionId);
              addLog('info', `Session ID auto-captured: ${result.sessionId}`);
            }
          } catch {
            // Ignore parse error
          }
        }
      }
    } catch (error) {
      addLog('error', `Network error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCurl = () => {
    const curl = `curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: selectedTool.name,
      arguments: JSON.parse(paramsInput || '{}'),
    },
  }, null, 2)}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQuickStartCurl = () => {
    return `# 1. Create a session
curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_session",
      "arguments": {}
    }
  }'

# 2. Run simulation (use sessionId from step 1)
curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "run_simulation",
      "arguments": {
        "sessionId": "YOUR_SESSION_ID",
        "therapeuticArea": "Oncology",
        "phase": "II",
        "countries": ["Germany", "France"],
        "targetSampleSize": 200,
        "durationMonths": 16
      }
    }
  }'

# 3. Analyze results
curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "analyze_scenario",
      "arguments": {
        "sessionId": "YOUR_SESSION_ID",
        "focus": "risk"
      }
    }
  }'`;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-ink/10 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MCP Server Playground</h1>
              <p className="text-ink/60">Test and explore the Ops Twin MCP API</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-ink/10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-6">
            {[
              { id: 'playground', label: 'Playground', icon: Play },
              { id: 'docs', label: 'API Docs', icon: BookOpen },
              { id: 'curl', label: 'cURL Examples', icon: Code },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-ink text-ink'
                    : 'border-transparent text-ink/50 hover:text-ink'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Playground Tab */}
          {activeTab === 'playground' && (
            <motion.div
              key="playground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6 lg:grid-cols-3"
            >
              {/* Left: Tool Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Available Tools</h2>
                  {sessionId && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Session Active
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <ToolCard
                      key={tool.name}
                      tool={tool}
                      isSelected={selectedTool.name === tool.name}
                      onClick={() => handleToolSelect(tool)}
                    />
                  ))}
                </div>

                {sessionId && (
                  <div className="p-3 bg-ink/5 rounded-lg">
                    <p className="text-xs text-ink/60 mb-1">Current Session</p>
                    <code className="text-xs font-mono break-all">{sessionId}</code>
                    <button
                      onClick={() => setSessionId('')}
                      className="text-xs text-red-600 hover:underline mt-2"
                    >
                      Clear Session
                    </button>
                  </div>
                )}
              </div>

              {/* Center: Parameter Editor */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Parameters</h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">Tool</label>
                    <code className="text-sm font-semibold text-ink bg-ink/5 px-2 py-1 rounded">
                      {selectedTool.name}
                    </code>
                  </div>

                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">Description</label>
                    <p className="text-sm text-ink/80">{selectedTool.description}</p>
                  </div>

                  {Object.keys(selectedTool.params).length > 0 && (
                    <div>
                      <label className="text-xs text-ink/60 mb-1 block">Parameters Schema</label>
                      <div className="text-xs font-mono bg-ink/5 p-2 rounded space-y-1">
                        {Object.entries(selectedTool.params).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-blue-600">{key}</span>
                            <span className="text-ink/50">: {value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-ink/60 mb-1 block">JSON Parameters</label>
                    <JsonEditor
                      value={paramsInput}
                      onChange={setParamsInput}
                      placeholder="{}"
                    />
                  </div>

                  <button
                    onClick={handleRunTool}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-ink text-cream py-2.5 rounded-lg hover:bg-ink/90 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {isLoading ? 'Running...' : 'Run Tool'}
                  </button>
                </div>
              </div>

              {/* Right: Logs & Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">Activity Log</h2>
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs text-ink/50 hover:text-ink"
                  >
                    Clear
                  </button>
                </div>

                <LogViewer logs={logs} />

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Quick Start</p>
                      <p className="text-xs text-blue-700 mt-1">
                        1. Click &quot;create_session&quot; and Run Tool<br/>
                        2. Select &quot;run_simulation&quot; with your session ID<br/>
                        3. Use other tools to analyze results
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Docs Tab */}
          {activeTab === 'docs' && (
            <motion.div
              key="docs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Overview */}
              <section>
                <h2 className="text-xl font-bold mb-4">MCP Server Overview</h2>
                <p className="text-ink/70 leading-relaxed">
                  The StochStack Ops Twin implements the Model Context Protocol (MCP), 
                  allowing external tools like Claude Desktop and Cursor to interact with 
                  the Clinical Operations Digital Twin programmatically.
                </p>
              </section>

              {/* Endpoint */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Endpoint</h3>
                <div className="bg-ink/5 p-4 rounded-lg">
                  <code className="text-sm font-mono">POST /api/mcp/messages</code>
                  <p className="text-xs text-ink/60 mt-2">
                    All MCP requests are sent as JSON-RPC 2.0 messages to this endpoint.
                  </p>
                </div>
              </section>

              {/* Tools */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Available Tools ({AVAILABLE_TOOLS.length})</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <div key={tool.name} className="border border-ink/10 rounded-lg p-4">
                      <code className="text-sm font-semibold text-ink">{tool.name}</code>
                      <p className="text-sm text-ink/60 mt-1">{tool.description}</p>
                      {Object.keys(tool.params).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-ink/40 uppercase tracking-wider mb-1">Parameters</p>
                          <div className="text-xs font-mono space-y-0.5">
                            {Object.entries(tool.params).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-blue-600">{key}</span>
                                <span className="text-ink/50">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Resources */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Available Resources (7)</h3>
                <div className="space-y-2">
                  {[
                    { uri: 'context://schema', desc: 'JSON Schema for context structure' },
                    { uri: 'context://current?sessionId=xxx', desc: 'Current simulation context' },
                    { uri: 'context://history?sessionId=xxx', desc: 'Session run history' },
                    { uri: 'simulation://kpis?sessionId=xxx', desc: 'Latest KPIs' },
                    { uri: 'simulation://recruitment-curve?sessionId=xxx', desc: 'Enrollment curve data' },
                    { uri: 'simulation://risk-register?sessionId=xxx', desc: 'Risk register' },
                    { uri: 'agents://registry', desc: 'Available agents' },
                  ].map((resource) => (
                    <div key={resource.uri} className="flex items-center gap-4 p-3 bg-ink/5 rounded">
                      <code className="text-sm font-mono text-ink shrink-0">{resource.uri}</code>
                      <span className="text-sm text-ink/60">{resource.desc}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Prompts */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Available Prompts (4)</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { name: 'ops_twin_analyst', desc: 'General Clinical Operations Analyst' },
                    { name: 'risk_assessor', desc: 'Risk management specialist' },
                    { name: 'site_selection_advisor', desc: 'Site selection strategist' },
                    { name: 'forecast_calibrator', desc: 'Forecast calibration specialist' },
                  ].map((prompt) => (
                    <div key={prompt.name} className="border border-ink/10 rounded-lg p-4">
                      <code className="text-sm font-semibold">{prompt.name}</code>
                      <p className="text-sm text-ink/60 mt-1">{prompt.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Claude Desktop Setup */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Claude Desktop Setup</h3>
                <div className="bg-ink/5 p-4 rounded-lg">
                  <p className="text-sm text-ink/70 mb-3">
                    Add this to your Claude Desktop configuration file:
                  </p>
                  <pre className="text-xs font-mono bg-ink/10 p-3 rounded overflow-x-auto">
{`{
  "mcpServers": {
    "stochstack-ops-twin": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}`}
                  </pre>
                  <p className="text-xs text-ink/50 mt-3">
                    macOS: ~/Library/Application Support/Claude/claude_desktop_config.json<br/>
                    Windows: %APPDATA%\Claude\claude_desktop_config.json
                  </p>
                </div>
              </section>
            </motion.div>
          )}

          {/* cURL Tab */}
          {activeTab === 'curl' && (
            <motion.div
              key="curl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">cURL Examples</h2>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateQuickStartCurl());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy All'}
                </button>
              </div>

              <div className="bg-ink/5 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-ink/10 border-b border-ink/10">
                  <span className="text-xs font-medium text-ink/60">Quick Start Workflow</span>
                  <span className="text-xs text-ink/40">3 steps</span>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto">
                  {generateQuickStartCurl()}
                </pre>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Step 1: Create Session</h3>
                  <div className="bg-ink/5 rounded-lg p-4">
                    <pre className="text-xs font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_session",
      "arguments": {}
    }
  }'`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Step 2: Run Simulation</h3>
                  <div className="bg-ink/5 rounded-lg p-4">
                    <pre className="text-xs font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "run_simulation",
      "arguments": {
        "sessionId": "YOUR_SESSION_ID",
        "therapeuticArea": "Oncology",
        "phase": "II",
        "countries": ["Germany", "France"],
        "targetSampleSize": 200,
        "durationMonths": 16
      }
    }
  }'`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Step 3: Get Context</h3>
                  <div className="bg-ink/5 rounded-lg p-4">
                    <pre className="text-xs font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_context",
      "arguments": {
        "sessionId": "YOUR_SESSION_ID",
        "path": "simResults.kpis"
      }
    }
  }'`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Step 4: Analyze</h3>
                  <div className="bg-ink/5 rounded-lg p-4">
                    <pre className="text-xs font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/mcp/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "analyze_scenario",
      "arguments": {
        "sessionId": "YOUR_SESSION_ID",
        "focus": "risk"
      }
    }
  }'`}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
