'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type BriefFields = {
  objective: string;
  constraints: string;
  successCriteria: string;
  comparator: string;
  geography: string;
};

export function BriefClient({ locale, projectId }: { locale: string; projectId: string }) {
  const [fields, setFields] = useState<BriefFields>({
    objective: '',
    constraints: '',
    successCriteria: '',
    comparator: '',
    geography: ''
  });
  const [saved, setSaved] = useState('');

  useEffect(() => {
    fetch(`/api/protocol-os/projects/${projectId}/brief`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.data?.fieldsJson) {
          setFields((prev) => ({ ...prev, ...(payload.data.fieldsJson as Partial<BriefFields>) }));
        }
      })
      .catch(() => undefined);
  }, [projectId]);

  async function save() {
    const res = await fetch(`/api/protocol-os/projects/${projectId}/brief`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldsJson: fields })
    });
    const payload = await res.json();
    setSaved(payload.ok ? 'Saved.' : payload.error ?? 'Failed to save.');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Brief</CardTitle>
        <CardDescription>Capture indication goals and constraints before design generation.</CardDescription>
      </Card>

      <Card className="space-y-3">
        <label className="text-xs uppercase tracking-[0.12em] text-ink/60">Objective</label>
        <Textarea value={fields.objective} onChange={(e) => setFields((s) => ({ ...s, objective: e.target.value }))} rows={3} />

        <label className="text-xs uppercase tracking-[0.12em] text-ink/60">Constraints</label>
        <Textarea value={fields.constraints} onChange={(e) => setFields((s) => ({ ...s, constraints: e.target.value }))} rows={3} />

        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-ink/60">Success Criteria</label>
            <Input value={fields.successCriteria} onChange={(e) => setFields((s) => ({ ...s, successCriteria: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.12em] text-ink/60">Comparator</label>
            <Input value={fields.comparator} onChange={(e) => setFields((s) => ({ ...s, comparator: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-[0.12em] text-ink/60">Geography</label>
          <Input value={fields.geography} onChange={(e) => setFields((s) => ({ ...s, geography: e.target.value }))} />
        </div>

        <div className="flex gap-2">
          <Button onClick={save}>Save Brief</Button>
          <Link href={`/${locale}/projects/${projectId}/evidence`} className="rounded border border-ink/20 px-3 py-2 text-sm">Next: Evidence</Link>
          {saved ? <span className="self-center text-xs text-ink/60">{saved}</span> : null}
        </div>
      </Card>
    </div>
  );
}
