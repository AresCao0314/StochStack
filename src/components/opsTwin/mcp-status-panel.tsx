'use client';

import { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertCircle, Copy } from 'lucide-react';

export function McpStatusPanel() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [copied, setCopied] = useState(false);

  const mcpEndpoint = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/mcp`
    : '/api/mcp';

  useEffect(() => {
    // Check if MCP endpoint is accessible
    fetch('/api/mcp', { method: 'HEAD' })
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(mcpEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="noise-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-ink/70" />
          <p className="section-title">MCP Server Status</p>
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'checking' && (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
              <span className="text-xs text-ink/60">Checking...</span>
            </>
          )}
          {status === 'online' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">Online</span>
            </>
          )}
          {status === 'offline' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">Offline</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-xs text-ink/65">
          Connect Claude Desktop, Cursor, or other MCP clients to interact with this Ops Twin via API.
        </p>

        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-ink/5 px-2 py-1.5 text-xs font-mono text-ink/80 truncate">
            {mcpEndpoint}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-ink/10 px-2 py-1.5 text-xs hover:bg-ink/20 transition-colors"
            title="Copy endpoint URL"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="rounded bg-ink/5 p-2 text-center">
            <p className="text-lg font-semibold text-ink">8</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/60">Tools</p>
          </div>
          <div className="rounded bg-ink/5 p-2 text-center">
            <p className="text-lg font-semibold text-ink">7</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/60">Resources</p>
          </div>
          <div className="rounded bg-ink/5 p-2 text-center">
            <p className="text-lg font-semibold text-ink">4</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/60">Prompts</p>
          </div>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-ink/70 hover:text-ink">
            Available Tools
          </summary>
          <ul className="mt-2 space-y-1 pl-4 text-ink/60">
            <li>• create_session - Create new simulation session</li>
            <li>• run_simulation - Execute full 6-agent workflow</li>
            <li>• get_context - Retrieve simulation context</li>
            <li>• calibrate_with_actuals - Calibrate with real data</li>
            <li>• analyze_scenario - AI-powered analysis</li>
            <li>• export_simulation - Export data (JSON/CSV)</li>
            <li>• list_sessions - List active sessions</li>
            <li>• replay_simulation - Replay from event log</li>
          </ul>
        </details>

        <details className="text-xs">
          <summary className="cursor-pointer text-ink/70 hover:text-ink">
            Claude Desktop Config
          </summary>
          <div className="mt-2 rounded bg-ink/5 p-2">
            <pre className="text-[10px] text-ink/70 overflow-x-auto">
{`{
  "mcpServers": {
    "stochstack-ops-twin": {
      "url": "${mcpEndpoint}"
    }
  }
}`}
            </pre>
          </div>
        </details>
      </div>
    </section>
  );
}
