'use client';

import { useEffect, useRef } from 'react';

export function HeroSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let t = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const cols = 26;
      const rows = 12;
      const cellW = w / cols;
      const cellH = h / rows;
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const nx = x / cols;
          const ny = y / rows;
          const noise = Math.sin((nx + t) * 8 + pointerX * 4) * Math.cos((ny + t) * 6 + pointerY * 3);
          const alpha = Math.max(0.06, Math.min(0.35, 0.2 + noise * 0.12));
          ctx.fillStyle = `rgba(11,15,20,${alpha})`;
          ctx.fillRect(x * cellW + 0.6, y * cellH + 0.6, cellW - 1.2, cellH - 1.2);
        }
      }

      ctx.strokeStyle = 'rgba(0,228,124,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 8) {
        const wave = h * 0.48 + Math.sin(x * 0.02 + t * 5 + pointerX * 4) * 16;
        if (x === 0) ctx.moveTo(x, wave);
        else ctx.lineTo(x, wave);
      }
      ctx.stroke();

      t += 0.004;
      raf = requestAnimationFrame(draw);
    };

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width;
      pointerY = (event.clientY - rect.top) / rect.height;
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div className="noise-border relative h-56 w-full overflow-hidden rounded-lg bg-warm md:h-72">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="signal visualization" />
      <p className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60">
        stochastic signal mesh
      </p>
    </div>
  );
}
