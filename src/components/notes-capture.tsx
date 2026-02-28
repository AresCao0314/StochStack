'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Wand2, Save, Trash2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

type CaptureEntry = {
  id: string;
  createdAt: string;
  raw: string;
  bullets: string[];
  provider: 'qwen' | 'local-fallback';
};

type CaptureDict = {
  title: string;
  subtitle: string;
  placeholder: string;
  summarize: string;
  save: string;
  clear: string;
  copy: string;
  history: string;
  empty: string;
  usingQwen: string;
  usingFallback: string;
  error: string;
  saved: string;
};

const STORAGE_KEY = 'stoch_notes_capture_v1';

export function NotesCapture({ locale, dict }: { locale: Locale; dict: CaptureDict }) {
  const [raw, setRaw] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [provider, setProvider] = useState<'qwen' | 'local-fallback' | null>(null);
  const [history, setHistory] = useState<CaptureEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [tip, setTip] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/notes/captures', { cache: 'no-store' });
        if (!res.ok) throw new Error('cloud fetch failed');
        const data = await res.json();
        const items = (data?.items ?? []) as CaptureEntry[];
        setHistory(items);
      } catch {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          setHistory(stored ? JSON.parse(stored) : []);
        } catch {
          setHistory([]);
        }
      } finally {
        setHistoryLoading(false);
      }
    };

    void load();
  }, []);

  function persist(next: CaptureEntry[]) {
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function summarize() {
    const text = raw.trim();
    if (text.length < 4) return;
    setLoading(true);
    setTip('');

    try {
      const res = await fetch('/api/notes/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, locale })
      });

      const data = await res.json();
      const items = (data?.bullets ?? []).filter((line: string) => line && line.trim().length > 0);
      setBullets(items);
      setProvider(data?.provider === 'qwen' ? 'qwen' : 'local-fallback');
      if (items.length === 0) {
        setTip(dict.error);
      }
    } catch {
      setTip(dict.error);
    } finally {
      setLoading(false);
    }
  }

  async function saveCapture() {
    if (!raw.trim() || bullets.length === 0 || !provider) return;
    const entry: CaptureEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      raw: raw.trim(),
      bullets,
      provider
    };

    try {
      const res = await fetch('/api/notes/captures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, locale })
      });

      if (!res.ok) throw new Error('cloud save failed');
      const next = [entry, ...history].slice(0, 20);
      setHistory(next);
      setTip(`${dict.saved} (cloud)`);
    } catch {
      const next = [entry, ...history].slice(0, 20);
      persist(next);
      setTip(`${dict.saved} (local fallback)`);
    }
  }

  async function copyBullets(items: string[]) {
    await navigator.clipboard.writeText(items.map((item) => `- ${item}`).join('\n'));
  }

  const providerLabel = useMemo(() => {
    if (provider === 'qwen') return dict.usingQwen;
    if (provider === 'local-fallback') return dict.usingFallback;
    return '';
  }, [provider, dict]);

  return (
    <section className="noise-border rounded-lg p-5 md:p-6">
      <div className="mb-4 space-y-2">
        <p className="section-title">capture mode</p>
        <h2 className="text-3xl font-bold md:text-4xl">{dict.title}</h2>
        <p className="text-ink/75">{dict.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <textarea
            aria-label={dict.title}
            className="min-h-48 w-full rounded-lg border border-ink/20 bg-transparent p-3 text-sm"
            placeholder={dict.placeholder}
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-label={dict.summarize}
              onClick={summarize}
              disabled={loading || raw.trim().length < 4}
              className="scanline inline-flex items-center gap-1 rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-60"
            >
              <Wand2 size={14} /> {loading ? '...' : dict.summarize}
            </button>
            <button
              type="button"
              aria-label={dict.save}
              onClick={saveCapture}
              disabled={bullets.length === 0}
              className="scanline inline-flex items-center gap-1 rounded border border-ink/20 px-3 py-2 text-sm disabled:opacity-60"
            >
              <Save size={14} /> {dict.save}
            </button>
            <button
              type="button"
              aria-label={dict.clear}
              onClick={() => {
                setRaw('');
                setBullets([]);
                setProvider(null);
                setTip('');
              }}
              className="scanline inline-flex items-center gap-1 rounded border border-ink/20 px-3 py-2 text-sm"
            >
              <Trash2 size={14} /> {dict.clear}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="noise-border rounded-lg p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Bullet Points</p>
              {bullets.length > 0 ? (
                <button
                  type="button"
                  aria-label={dict.copy}
                  onClick={() => copyBullets(bullets)}
                  className="glitch-link text-xs"
                >
                  <Copy size={12} className="mr-1 inline" /> {dict.copy}
                </button>
              ) : null}
            </div>

            <ul className="space-y-2 text-sm text-ink/88">
              {bullets.map((item) => (
                <li key={item} className="rounded border border-ink/10 p-2">
                  - {item}
                </li>
              ))}
            </ul>

            {providerLabel ? <p className="mt-3 text-xs uppercase tracking-[0.12em] text-accent1">{providerLabel}</p> : null}
            {tip ? <p className="mt-2 text-xs text-ink/70">{tip}</p> : null}
          </div>

          <div className="noise-border rounded-lg p-3">
            <p className="mb-3 text-sm font-medium">{dict.history}</p>
            {historyLoading ? <p className="text-sm text-ink/65">Loading...</p> : null}
            {!historyLoading && history.length === 0 ? <p className="text-sm text-ink/65">{dict.empty}</p> : null}
            <div className="space-y-3">
              {history.map((entry) => (
                <article key={entry.id} className="rounded border border-ink/10 p-2 text-xs">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  <p className="mb-2 max-h-10 overflow-hidden text-ink/75">{entry.raw}</p>
                  <button
                    type="button"
                    aria-label={dict.copy}
                    onClick={() => copyBullets(entry.bullets)}
                    className="glitch-link text-[11px]"
                  >
                    {dict.copy}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
