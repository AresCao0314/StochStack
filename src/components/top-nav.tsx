'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { localeMeta, locales, type Locale } from '@/lib/i18n';

type TopNavProps = {
  locale: Locale;
  nav: {
    home: string;
    prototypes: string;
    ventures: string;
    atlas: string;
    notes: string;
    life: string;
    about: string;
    contact: string;
  };
};

export function TopNav({ locale, nav }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const links = [
    { href: `/${locale}`, label: nav.home },
    { href: `/${locale}/prototypes`, label: nav.prototypes },
    { href: `/${locale}/ventures`, label: nav.ventures },
    { href: `/${locale}/atlas`, label: nav.atlas },
    { href: `/${locale}/notes`, label: nav.notes },
    { href: `/${locale}/life/books`, label: nav.life },
    { href: `/${locale}/about`, label: nav.about },
    { href: `/${locale}/contact`, label: nav.contact }
  ];

  function onLocaleChange(next: string) {
    if (!pathname) return;
    const segments = pathname.split('/').filter(Boolean);
    segments[0] = next;
    router.push('/' + segments.join('/'));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-base/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href={`/${locale}`} className="font-mono text-sm tracking-[0.2em] uppercase">
          StochStack
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="glitch-link text-sm">
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="nav-indicator"
                    className="h-[2px] w-4 bg-accent1"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center rounded border border-ink/20 bg-base px-2 py-1 text-xs">
            <span className="sr-only">language switch</span>
            <select
              aria-label="Language switch"
              className="appearance-none bg-transparent pr-6 text-xs"
              value={locale}
              onChange={(event) => onLocaleChange(event.target.value)}
            >
              {locales.map((code) => (
                <option key={code} value={code}>
                  {localeMeta[code].flag} {localeMeta[code].label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-1" />
          </label>

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="scanline rounded border border-ink/20 p-2"
          >
            {resolvedTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
