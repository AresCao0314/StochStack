'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Locale } from '@/lib/i18n';
import type { Port } from '@/lib/types';

type PortGridProps = {
  locale: Locale;
  ports: Port[];
  detailPath?: boolean;
  visitLabel: string;
};

const statusColors: Record<Port['status'], string> = {
  alpha: 'bg-accent3/30',
  beta: 'bg-accent2/30',
  live: 'bg-accent1/30'
};

export function PortGrid({ locale, ports, detailPath = false, visitLabel }: PortGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ports.map((item, index) => (
        <motion.article
          key={item.slug}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.35, delay: index * 0.03 }}
          className="noise-border scanline group rounded-lg bg-base p-4"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold">{item.name[locale]}</h3>
            <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.14em] ${statusColors[item.status]}`}>
              {item.status}
            </span>
          </div>
          <p className="text-sm text-ink/75">{item.description[locale]}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded border border-ink/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            {detailPath ? (
              <Link href={`/${locale}/prototypes/${item.slug}`} className="glitch-link">
                details
              </Link>
            ) : (
              <a href={item.link} target="_blank" rel="noreferrer" className="glitch-link">
                {visitLabel}
              </a>
            )}
            <ArrowUpRight size={15} className="opacity-70 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </motion.article>
      ))}
    </div>
  );
}
