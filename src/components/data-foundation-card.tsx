'use client';

import Link from 'next/link';
import { Database, Layers, ArrowRight, BarChart3 } from 'lucide-react';

interface DataFoundationCardProps {
  locale: string;
}

export function DataFoundationCard({ locale }: DataFoundationCardProps) {
  return (
    <Link 
      href={`/${locale}/signal/data-foundation`}
      className="group block p-6 rounded-xl border border-ink/10 bg-gradient-to-br from-white to-gray-50 hover:border-indigo-300 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Data Foundation Architecture
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              六层数据架构映射
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
      </div>

      <p className="text-sm text-gray-600 mt-4 leading-relaxed">
        Clinical Authoring 2.0 + Site Feasibility + Trial Simulation 三项目映射到 Data Foundation 各层的数据对象清单。
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs">
          <Layers className="w-3 h-3" />
          6 Layers
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs">
          <BarChart3 className="w-3 h-3" />
          3 Projects
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs">
          <Database className="w-3 h-3" />
          可视化
        </span>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <span>2026-03-01</span>
        <span>•</span>
        <span>Data Architecture</span>
      </div>
    </Link>
  );
}
