import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { getNotes, getPorts } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://stochstack.com';
  const staticPaths = [
    '',
    '/prototypes',
    '/ventures',
    '/atlas',
    '/ventures/protocol-os-lite',
    '/notes',
    '/life/books',
    '/about',
    '/contact',
    '/signal',
    '/ops-twin',
    '/ops-twin/eval',
    '/workflow',
    '/documents',
    '/runs',
    '/diff'
  ];

  const routes = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date()
    }))
  );

  const prototypes = locales.flatMap((locale) =>
    getPorts().map((item) => ({
      url: `${base}/${locale}/prototypes/${item.slug}`,
      lastModified: new Date()
    }))
  );

  const notes = locales.flatMap((locale) =>
    getNotes().map((item) => ({
      url: `${base}/${locale}/notes/${item.slug}`,
      lastModified: new Date(item.date)
    }))
  );

  return [...routes, ...prototypes, ...notes];
}
