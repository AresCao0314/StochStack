'use client';

import { useMemo, useState } from 'react';
import { Terminal, Copy, RefreshCw, Minimize2, Maximize2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type StochConsoleProps = {
  locale: Locale;
  title: string;
  nextLabel: string;
  copyLabel: string;
  quotes: Record<Locale, string>[];
};

export function StochConsole({ locale, title, nextLabel, copyLabel, quotes }: StochConsoleProps) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * quotes.length));
  const [collapsed, setCollapsed] = useState(false);

  const line = useMemo(() => quotes[index]?.[locale] ?? '', [index, locale, quotes]);

  async function onCopy() {
    await navigator.clipboard.writeText(line);
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="noise-border rounded-lg bg-base shadow-card">
        <button
          aria-label="toggle console"
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-between border-b border-ink/10 px-3 py-2 text-xs uppercase tracking-[0.14em]"
        >
          <span className="flex items-center gap-2">
            <Terminal size={14} /> {title}
          </span>
          {collapsed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
        </button>

        {!collapsed ? (
          <div className="space-y-3 p-3">
            <p className="font-mono text-xs leading-relaxed text-ink/90">{line}</p>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="next quote"
                onClick={() => setIndex((prev) => (prev + 1) % quotes.length)}
                className="scanline inline-flex items-center gap-1 rounded border border-ink/20 px-2 py-1 text-xs"
              >
                <RefreshCw size={12} /> {nextLabel}
              </button>
              <button
                type="button"
                aria-label="copy quote"
                onClick={onCopy}
                className="scanline inline-flex items-center gap-1 rounded border border-ink/20 px-2 py-1 text-xs"
              >
                <Copy size={12} /> {copyLabel}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
