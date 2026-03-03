'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Evidence = {
  id: string;
  title: string;
  text: string;
  sourceType: string;
  sourceRef?: string | null;
  confidence: number;
};

export function EvidenceClient({ locale, projectId }: { locale: string; projectId: string }) {
  const [items, setItems] = useState<Evidence[]>([]);
  const [form, setForm] = useState({ title: '', text: '', sourceType: 'guideline', sourceRef: '', confidence: 0.8 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/protocol-os/projects/${projectId}/evidence`, { cache: 'no-store' });
    const payload = await res.json();
    setItems(payload.data ?? []);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    setSaving(true);
    await fetch(`/api/protocol-os/projects/${projectId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setSaving(false);
    setForm({ title: '', text: '', sourceType: 'guideline', sourceRef: '', confidence: 0.8 });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/protocol-os/evidence/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Evidence Snippets</CardTitle>
        <CardDescription>Paste guideline / registry / internal snippets for traceable decisions.</CardDescription>
      </Card>

      <Card className="space-y-3">
        <Input placeholder="Snippet title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        <Textarea placeholder="Evidence text" rows={4} value={form.text} onChange={(e) => setForm((s) => ({ ...s, text: e.target.value }))} />
        <div className="grid gap-2 md:grid-cols-3">
          <Input placeholder="source type" value={form.sourceType} onChange={(e) => setForm((s) => ({ ...s, sourceType: e.target.value }))} />
          <Input placeholder="source ref" value={form.sourceRef} onChange={(e) => setForm((s) => ({ ...s, sourceRef: e.target.value }))} />
          <Input type="number" step="0.1" min="0" max="1" value={form.confidence} onChange={(e) => setForm((s) => ({ ...s, confidence: Number(e.target.value) }))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={add} disabled={saving}>{saving ? 'Saving...' : 'Add Snippet'}</Button>
          <Link href={`/${locale}/projects/${projectId}/studio`} className="rounded border border-accent1/40 bg-accent1/10 px-3 py-2 text-sm">Open Studio</Link>
        </div>
      </Card>

      <Card>
        <CardTitle>Current Evidence</CardTitle>
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="rounded border border-ink/10 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <button type="button" onClick={() => remove(item.id)} className="text-xs text-red-600">Delete</button>
              </div>
              <p className="mt-1 text-xs text-ink/70">{item.sourceType} · confidence {item.confidence.toFixed(2)}</p>
              <p className="mt-2 text-sm text-ink/80">{item.text}</p>
            </div>
          ))}
          {!items.length ? <p className="text-sm text-ink/60">No snippets yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
