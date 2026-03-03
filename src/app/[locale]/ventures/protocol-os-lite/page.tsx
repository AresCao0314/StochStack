import type { Metadata } from 'next';
import Link from 'next/link';
import { ProtocolOsLitePage } from '@/components/protocol-os-lite-page';
import { type Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return {
    title: 'Protocol OS Lite | Ventures | StochStack',
    description: 'Single-page mock workflow for Protocol OS demo (no backend dependency).'
  };
}

export default function ProtocolOsLiteRoute({ params }: { params: { locale: Locale } }) {
  return (
    <div className="space-y-4">
      <Link href={`/${params.locale}/ventures`} className="text-xs uppercase tracking-[0.12em] text-ink/60">
        ← Back to Ventures
      </Link>
      <ProtocolOsLitePage locale={params.locale} />
    </div>
  );
}
