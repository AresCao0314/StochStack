import type { Metadata } from 'next';
import { DataFoundationVisualization } from '@/components/data-foundation-visualization';
import { getDictionary, type Locale } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  return {
    title: 'Data Foundation Architecture | Signal',
    description: 'Clinical Authoring 2.0 + Site Feasibility + Trial Simulation - Six Layer Data Architecture',
    openGraph: {
      title: 'Data Foundation Architecture | StochStack Signal',
      description: 'Six-layer data architecture mapping for clinical operations'
    }
  };
}

export default function DataFoundationPage({ params }: { params: { locale: Locale } }) {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-ink/10 py-6 mb-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/${params.locale}/signal`}
              className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Signal
            </Link>
          </div>
          <div className="mt-4">
            <p className="section-title">signal logs</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Data Foundation Architecture</h1>
            <p className="text-ink/60 mt-2 max-w-2xl">
              六层数据架构映射：Clinical Authoring 2.0 + Site Feasibility + Trial Simulation
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4">
        <DataFoundationVisualization />
        
        {/* Article Metadata */}
        <div className="mt-12 pt-8 border-t border-ink/10">
          <div className="flex flex-wrap gap-6 text-sm text-ink/50">
            <div>
              <span className="font-medium text-ink">Published:</span> 2026-03-01
            </div>
            <div>
              <span className="font-medium text-ink">Category:</span> Data Architecture
            </div>
            <div>
              <span className="font-medium text-ink">Projects:</span> Clinical Authoring 2.0, Site Feasibility, Trial Simulation
            </div>
            <div>
              <span className="font-medium text-ink">Layers:</span> 6 (L0-L5)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
