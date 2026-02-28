'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale } from '@/lib/i18n';

type LifeTabsProps = {
  locale: Locale;
  current: string;
  sections: Record<string, string>;
};

export function LifeTabs({ locale, current, sections }: LifeTabsProps) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {Object.entries(sections).map(([key, label]) => {
        const active = key === current;
        return (
          <Link
            key={key}
            href={`/${locale}/life/${key}`}
            className="relative rounded-full border border-ink/20 px-3 py-1 text-sm"
          >
            {active ? (
              <motion.span
                layoutId="life-tab"
                className="absolute inset-0 -z-10 rounded-full bg-accent3/28"
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              />
            ) : null}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
