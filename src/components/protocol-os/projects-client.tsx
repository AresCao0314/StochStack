'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Project = {
  id: string;
  name: string;
  indication: string;
  phase: string;
  status: string;
  updatedAt: string;
};

export function ProjectsClient({ locale }: { locale: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', indication: '', phase: 'Phase II' });
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/protocol-os/projects', { cache: 'no-store' });
    const payload = await res.json();
    setProjects(payload.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createProject() {
    setError('');
    const res = await fetch('/api/protocol-os/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const payload = await res.json();
    if (!payload.ok) {
      setError(payload.error ?? 'Failed to create project');
      return;
    }
    setForm({ name: '', indication: '', phase: 'Phase II' });
    await load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Protocol OS (Decision-Centric)</CardTitle>
        <CardDescription>Create projects and drive design decisions through structured graph + policy scoring.</CardDescription>
      </Card>

      <Card className="space-y-3">
        <CardTitle>New Project</CardTitle>
        <div className="grid gap-2 md:grid-cols-3">
          <Input placeholder="Project name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <Input placeholder="Indication" value={form.indication} onChange={(e) => setForm((s) => ({ ...s, indication: e.target.value }))} />
          <Input placeholder="Phase" value={form.phase} onChange={(e) => setForm((s) => ({ ...s, phase: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={createProject}>Create</Button>
          {error ? <span className="text-xs text-red-600">{error}</span> : null}
        </div>
      </Card>

      <Card>
        <CardTitle>Projects</CardTitle>
        {loading ? (
          <p className="mt-2 text-sm text-ink/60">Loading...</p>
        ) : (
          <div className="mt-3 space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-ink/15 bg-white/70 p-3">
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-ink/60">
                    {project.indication} · {project.phase} · {project.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/${locale}/projects/${project.id}/brief`} className="rounded border border-ink/20 px-2 py-1 text-xs">Brief</Link>
                  <Link href={`/${locale}/projects/${project.id}/evidence`} className="rounded border border-ink/20 px-2 py-1 text-xs">Evidence</Link>
                  <Link href={`/${locale}/projects/${project.id}/studio`} className="rounded border border-accent1/40 bg-accent1/10 px-2 py-1 text-xs">Studio</Link>
                </div>
              </div>
            ))}
            {!projects.length ? <p className="text-sm text-ink/60">No projects yet.</p> : null}
          </div>
        )}
      </Card>
    </div>
  );
}
