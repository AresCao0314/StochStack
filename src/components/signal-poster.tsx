'use client';

import { useEffect, useRef, useState } from 'react';

type SignalPosterProps = {
  regenerateLabel: string;
  downloadLabel: string;
};

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function SignalPoster({ regenerateLabel, downloadLabel }: SignalPosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1200;
    const h = 1600;
    canvas.width = w;
    canvas.height = h;

    const random = seededRandom(seed);

    ctx.fillStyle = '#F6F5F3';
    ctx.fillRect(0, 0, w, h);

    const cols = 24;
    const rows = 32;
    const cw = w / cols;
    const ch = h / rows;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const r = random();
        if (r > 0.58) continue;
        const tone = r > 0.44 ? 'rgba(11,15,20,0.82)' : r > 0.26 ? 'rgba(106,210,226,0.72)' : 'rgba(146,139,222,0.74)';
        ctx.fillStyle = tone;
        ctx.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4);
      }
    }

    ctx.fillStyle = 'rgba(0,228,124,0.5)';
    for (let i = 0; i < 16; i += 1) {
      const y = 180 + i * 78 + random() * 24;
      ctx.fillRect(100, y, w - 200, 1);
    }

    ctx.fillStyle = '#0B0F14';
    ctx.font = '700 84px sans-serif';
    ctx.fillText('STOCHSTACK', 96, 132);
    ctx.font = '400 24px monospace';
    ctx.fillText(`seed:${seed}`, 96, 1480);
  }, [seed]);

  function onDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `stoch-signal-${seed}.png`;
    link.click();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-label={regenerateLabel} onClick={() => setSeed(Math.floor(Math.random() * 100000))} className="scanline rounded border border-ink/20 px-3 py-2 text-sm">
          {regenerateLabel}
        </button>
        <button type="button" aria-label={downloadLabel} onClick={onDownload} className="scanline rounded border border-ink/20 px-3 py-2 text-sm">
          {downloadLabel}
        </button>
      </div>
      <canvas ref={canvasRef} className="poster-canvas" />
    </section>
  );
}
