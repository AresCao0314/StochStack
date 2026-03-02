import { NextResponse } from 'next/server';
import { db } from '@/lib/protocolWorkflow/db';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { changeSetId: string } }) {
  const changeSet = await db.changeSet.findUnique({ where: { id: params.changeSetId } });
  if (!changeSet) {
    return NextResponse.json({ ok: false, error: 'ChangeSet not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: changeSet }, {
    headers: {
      'Content-Disposition': `attachment; filename="changeset-${changeSet.id}.json"`
    }
  });
}
