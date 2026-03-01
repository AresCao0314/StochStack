'use client';

import { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

const copyByLocale: Record<
  Locale,
  {
    title: string;
    checking: string;
    online: string;
    offline: string;
    desc: string;
    copied: string;
    copy: string;
    tools: string;
    resources: string;
    prompts: string;
    availableTools: string;
    claudeConfig: string;
  }
> = {
  en: {
    title: 'MCP Server Status',
    checking: 'Checking...',
    online: 'Online',
    offline: 'Offline',
    desc: 'Connect Claude Desktop, Cursor, or other MCP clients to interact with this Ops Twin via API.',
    copied: 'Copied!',
    copy: 'Copy',
    tools: 'Tools',
    resources: 'Resources',
    prompts: 'Prompts',
    availableTools: 'Available Tools',
    claudeConfig: 'Claude Desktop Config'
  },
  zh: {
    title: 'MCP 服务器状态',
    checking: '检查中...',
    online: '在线',
    offline: '离线',
    desc: '可将 Claude Desktop、Cursor 或其他 MCP 客户端连接到该 Ops Twin API。',
    copied: '已复制',
    copy: '复制',
    tools: '工具',
    resources: '资源',
    prompts: 'Prompts',
    availableTools: '可用工具',
    claudeConfig: 'Claude Desktop 配置'
  },
  de: {
    title: 'MCP-Server-Status',
    checking: 'Prüfung...',
    online: 'Online',
    offline: 'Offline',
    desc: 'Verbinden Sie Claude Desktop, Cursor oder andere MCP-Clients mit diesem Ops-Twin-API-Endpunkt.',
    copied: 'Kopiert!',
    copy: 'Kopieren',
    tools: 'Tools',
    resources: 'Ressourcen',
    prompts: 'Prompts',
    availableTools: 'Verfügbare Tools',
    claudeConfig: 'Claude-Desktop-Konfiguration'
  }
};

export function McpStatusPanel({ locale }: { locale: Locale }) {
  const t = copyByLocale[locale];
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
          <p className="section-title">{t.title}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'checking' && (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
              <span className="text-xs text-ink/60">{t.checking}</span>
            </>
          )}
          {status === 'online' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">{t.online}</span>
            </>
          )}
          {status === 'offline' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">{t.offline}</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-xs text-ink/65">{t.desc}</p>

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
            {copied ? t.copied : t.copy}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="rounded bg-ink/5 p-2 text-center">
            <p className="text-lg font-semibold text-ink">8</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/60">{t.tools}</p>
          </div>
          <div className="rounded bg-ink/5 p-2 text-center">
            <p className="text-lg font-semibold text-ink">7</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/60">{t.resources}</p>
          </div>
          <div className="rounded bg-ink/5 p-2 text-center">
            <p className="text-lg font-semibold text-ink">4</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/60">{t.prompts}</p>
          </div>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-ink/70 hover:text-ink">
            {t.availableTools}
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
            {t.claudeConfig}
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
