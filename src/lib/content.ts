import ports from '@/content/ports.json';
import notes from '@/content/notes.json';
import quotes from '@/content/console-quotes.json';
import books from '@/content/life/books.json';
import tennis from '@/content/life/tennis.json';
import editing from '@/content/life/editing.json';
import films from '@/content/life/films.json';
import architecture from '@/content/life/architecture.json';
import type { LifeModule, Note, Port } from '@/lib/types';

const lifeModules = {
  books,
  tennis,
  editing,
  films,
  architecture
} as const;

export function getPorts() {
  return ports as Port[];
}

export function getActivePorts() {
  return getPorts().filter((item) => !item.archived);
}

export function getArchivedPorts() {
  return getPorts().filter((item) => item.archived);
}

export function getPortBySlug(slug: string) {
  return getPorts().find((item) => item.slug === slug);
}

export function getAllTags() {
  return Array.from(new Set(getPorts().flatMap((item) => item.tags))).sort();
}

export function getNotes() {
  return notes as Note[];
}

export function getNoteBySlug(slug: string) {
  return getNotes().find((item) => item.slug === slug);
}

export function getConsoleQuotes() {
  return quotes as Record<'en' | 'zh' | 'de', string>[];
}

export function getLifeModule(section: keyof typeof lifeModules): LifeModule {
  return lifeModules[section] as LifeModule;
}

export function getLifeSections() {
  return Object.keys(lifeModules) as Array<keyof typeof lifeModules>;
}
