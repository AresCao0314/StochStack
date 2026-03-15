'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, FlaskConical, Gauge, Globe2, Home, type LucideIcon, Lightbulb, Settings2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SfpSection } from '@/lib/site-feasibility-platform/types';

const navItems: Array<{ key: SfpSection; label: string; icon: LucideIcon }> = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'study-workspace', label: 'Study Workspace', icon: Gauge },
  { key: 'site-explorer', label: 'Site Explorer', icon: Globe2 },
  { key: 'scenario-lab', label: 'Scenario Lab', icon: FlaskConical },
  { key: 'recommendation-center', label: 'Recommendation Center', icon: Lightbulb },
  { key: 'data-catalog', label: 'Data Catalog', icon: Database },
  { key: 'settings', label: 'Settings', icon: Settings2 }
];

export function SiteFeasibilityShell({
  locale,
  children
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = `/${locale}/ventures/next-gen-site-feasibility`;

  return (
    <div className="min-h-[calc(100vh-9rem)] rounded-[28px] border border-ink/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.72))] shadow-[0_28px_80px_rgba(11,15,20,0.08)]">
      <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-ink/10 bg-[radial-gradient(circle_at_top_left,rgba(0,228,124,0.09),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,245,243,0.82))] p-5 lg:border-b-0 lg:border-r">
          <div className="space-y-4">
            <div>
              <Badge className="border-accent1/35 bg-accent1/10 text-ink">Ventures / Feasibility OS</Badge>
              <h2 className="mt-3 text-xl font-bold">Next-Gen Site Feasibility Platform</h2>
              <p className="mt-1 text-sm text-ink/64">RESP-204 · Phase II · ILD · target 180</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const href = `${base}/${item.key}`;
                const active = pathname === href || (item.key === 'dashboard' && pathname === base);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition',
                      active
                        ? 'bg-ink text-white shadow-[0_10px_30px_rgba(11,15,20,0.18)]'
                        : 'text-ink/74 hover:bg-ink/5'
                    )}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles size={15} />
                Executive demo mode
              </div>
              <p className="mt-2 text-sm text-ink/66">
                Mock data only. Components and selectors are already separated so the data layer can be replaced with live APIs later.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex flex-col gap-4 border-b border-ink/10 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="section-title">site feasibility / clinical ops / venture prototype</p>
              <p className="mt-1 text-sm text-ink/62">Leadership-style internal SaaS demo for country/site prioritization, scenario simulation, and explainable recommendations.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="border-ink/10 bg-white/75">Mock Study</Badge>
              <Badge className="border-accent2/30 bg-accent2/10 text-ink">No backend</Badge>
            </div>
          </header>
          <main className="min-w-0 p-5 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
