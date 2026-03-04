'use client';

import { useMemo, useRef, useState } from 'react';
import type { AtlasDiagram } from '@/lib/atlas';

type Palette = {
  base: string;
  ink: string;
  accent1: string;
  accent2: string;
};

const fallbackPalette: Palette = {
  base: '#f6f5f3',
  ink: '#0b0f14',
  accent1: '#00e47c',
  accent2: '#6ad2e2'
};

function resolvePalette(): Palette {
  if (typeof window === 'undefined') {
    return fallbackPalette;
  }

  const style = window.getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => {
    const raw = style.getPropertyValue(name).trim();
    return raw || fallback;
  };

  return {
    base: pick('--color-base', fallbackPalette.base),
    ink: pick('--color-ink', fallbackPalette.ink),
    accent1: pick('--color-accent-1', fallbackPalette.accent1),
    accent2: pick('--color-accent-2', fallbackPalette.accent2)
  };
}

function downloadBlob(filename: string, blob: Blob) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(href);
}

export function InteractiveDiagram({ diagram }: { diagram: AtlasDiagram }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(100);
  const [layerState, setLayerState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(diagram.layers.map((layer) => [layer.id, layer.defaultVisible]))
  );
  const palette = useMemo(resolvePalette, []);

  const visibleNodes = diagram.nodes.filter((node) => layerState[node.layer]);
  const visibleEdges = diagram.edges.filter((edge) => layerState[edge.layer]);
  const nodeMap = new Map(diagram.nodes.map((node) => [node.id, node]));

  const renderNodeTone = (tone?: 'ink' | 'accent1' | 'accent2') => {
    if (tone === 'accent1') {
      return { fill: `${palette.accent1}1f`, stroke: palette.accent1 };
    }
    if (tone === 'accent2') {
      return { fill: `${palette.accent2}2a`, stroke: palette.accent2 };
    }
    return { fill: `${palette.base}`, stroke: `${palette.ink}66` };
  };

  const exportSvg = () => {
    if (!svgRef.current) {
      return;
    }
    const markup = svgRef.current.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(`${diagram.slug}.svg`, blob);
  };

  const exportPng = () => {
    if (!svgRef.current) {
      return;
    }

    const markup = svgRef.current.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = diagram.width;
      canvas.height = diagram.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.fillStyle = palette.base;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(`${diagram.slug}.png`, blob);
        }
      });
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  return (
    <div className="space-y-4">
      <div className="noise-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Zoom</span>
            <input
              type="range"
              min={60}
              max={170}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            <span className="w-12 text-right tabular-nums">{zoom}%</span>
          </div>

          <button
            type="button"
            className="rounded-md border border-ink/30 px-3 py-1 text-sm hover:bg-ink/10"
            onClick={exportPng}
          >
            Export PNG
          </button>
          <button
            type="button"
            className="rounded-md border border-ink/30 px-3 py-1 text-sm hover:bg-ink/10"
            onClick={exportSvg}
          >
            Export SVG
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {diagram.layers.map((layer) => (
            <label key={layer.id} className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-2 py-1 text-xs">
              <input
                type="checkbox"
                checked={Boolean(layerState[layer.id])}
                onChange={() =>
                  setLayerState((prev) => ({
                    ...prev,
                    [layer.id]: !prev[layer.id]
                  }))
                }
              />
              {layer.label}
            </label>
          ))}
        </div>
      </div>

      <div className="noise-border overflow-auto rounded-lg p-3">
        <svg
          ref={svgRef}
          width={(diagram.width * zoom) / 100}
          height={(diagram.height * zoom) / 100}
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          role="img"
          aria-label={diagram.title}
        >
          <rect x="0" y="0" width={diagram.width} height={diagram.height} fill={palette.base} />
          <defs>
            <marker id="atlas-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L10,5 L0,10 z" fill={`${palette.ink}aa`} />
            </marker>
          </defs>

          {visibleEdges.map((edge) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to || !layerState[from.layer] || !layerState[to.layer]) {
              return null;
            }

            const x1 = from.x + from.w / 2;
            const y1 = from.y + from.h / 2;
            const x2 = to.x + to.w / 2;
            const y2 = to.y + to.h / 2;

            return (
              <line
                key={edge.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={`${palette.ink}88`}
                strokeWidth={2}
                markerEnd="url(#atlas-arrow)"
              />
            );
          })}

          {visibleNodes.map((node) => {
            const tone = renderNodeTone(node.tone);
            return (
              <g key={node.id}>
                <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={10} fill={tone.fill} stroke={tone.stroke} strokeWidth={2} />
                <foreignObject x={node.x + 8} y={node.y + 8} width={node.w - 16} height={node.h - 16}>
                  <div
                    style={{
                      color: palette.ink,
                      fontSize: '12px',
                      lineHeight: '1.2',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      width: '100%',
                      height: '100%'
                    }}
                  >
                    {node.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

