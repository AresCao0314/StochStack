'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FilterBar } from '@/components/filter-bar';
import type { Locale } from '@/lib/i18n';
import type { Note } from '@/lib/types';

type NotesBrowserProps = {
  locale: Locale;
  notes: Note[];
  allLabel: string;
  topicLabel: string;
  topicLabels?: Record<string, string>;
};

export function NotesBrowser({ locale, notes, allLabel, topicLabel, topicLabels }: NotesBrowserProps) {
  const topics = useMemo(() => [allLabel, ...Array.from(new Set(notes.map((item) => item.topic)))], [allLabel, notes]);
  const [topic, setTopic] = useState(allLabel);

  const filtered = notes.filter((item) => topic === allLabel || item.topic === topic);
  const renderTopic = (value: string) => topicLabels?.[value] ?? value;

  return (
    <section className="space-y-6">
      <FilterBar
        label={topicLabel}
        options={topics.map((value) => renderTopic(value))}
        value={renderTopic(topic)}
        onChange={(nextDisplay) => {
          const raw = topics.find((rawValue) => renderTopic(rawValue) === nextDisplay) ?? allLabel;
          setTopic(raw);
        }}
      />

      <div className="space-y-4">
        {filtered.map((note, idx) => (
          <motion.article
            key={note.slug}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.3, delay: idx * 0.03 }}
            className="noise-border rounded-lg p-4"
          >
            <div className="mb-2 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-ink/60">
              <span>{renderTopic(note.topic)}</span>
              <span>{note.date}</span>
            </div>
            <h3 className="text-2xl font-semibold leading-snug">{note.title[locale]}</h3>
            <p className="mt-2 text-ink/75">{note.excerpt[locale]}</p>
            <Link href={`/${locale}/notes/${note.slug}`} className="glitch-link mt-3 inline-block text-sm">
              open log
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
