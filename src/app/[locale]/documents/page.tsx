import type { Metadata } from 'next';
import Link from 'next/link';
import type { Document, Study } from '@prisma/client';
import { db } from '@/lib/protocolWorkflow/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Documents | StochStack',
  description: 'All ingested protocol workflow documents.'
};

export default async function DocumentsPage({ params }: { params: { locale: string } }) {
  const docs = await db.document.findMany({
    include: { study: true },
    orderBy: { uploadedAt: 'desc' }
  });

  return (
    <div className="space-y-4">
      <section className="noise-border rounded-lg p-4">
        <h1 className="text-3xl font-bold md:text-5xl">Documents</h1>
        <p className="mt-2 text-sm text-ink/70">Business view: every source document version used in extraction is tracked here.</p>
      </section>
      <section className="space-y-2">
        {docs.map((doc: Document & { study: Study }) => (
          <article key={doc.id} className="noise-border rounded-lg p-4 text-sm">
            <p className="font-semibold">{doc.filename}</p>
            <p className="text-xs text-ink/60">{doc.type} · {doc.versionTag} · {new Date(doc.uploadedAt).toLocaleString()}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Link href={`/${params.locale}/workflow/${doc.studyId}`} className="underline">
                Open Workflow
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
