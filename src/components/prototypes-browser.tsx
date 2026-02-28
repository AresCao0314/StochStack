'use client';

import { useMemo, useState } from 'react';
import { FilterBar } from '@/components/filter-bar';
import { PortGrid } from '@/components/port-grid';
import type { Locale } from '@/lib/i18n';
import type { Port, PortStatus } from '@/lib/types';

type PrototypesBrowserProps = {
  locale: Locale;
  ports: Port[];
  allLabel: string;
  tagLabel: string;
  statusLabel: string;
  visitLabel: string;
};

export function PrototypesBrowser({
  locale,
  ports,
  allLabel,
  tagLabel,
  statusLabel,
  visitLabel
}: PrototypesBrowserProps) {
  const tags = useMemo(() => [allLabel, ...Array.from(new Set(ports.flatMap((item) => item.tags)))], [allLabel, ports]);
  const statuses = [allLabel, 'alpha', 'beta', 'live'];
  const [tag, setTag] = useState(allLabel);
  const [status, setStatus] = useState(allLabel);

  const filtered = ports.filter((item) => {
    const tagPass = tag === allLabel || item.tags.includes(tag);
    const statusPass = status === allLabel || item.status === (status as PortStatus);
    return tagPass && statusPass;
  });

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FilterBar label={tagLabel} options={tags} value={tag} onChange={setTag} />
        <FilterBar label={statusLabel} options={statuses} value={status} onChange={setStatus} />
      </div>
      <PortGrid locale={locale} ports={filtered} detailPath visitLabel={visitLabel} />
    </section>
  );
}
