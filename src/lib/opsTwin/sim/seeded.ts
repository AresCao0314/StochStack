import type { Rng } from '@/lib/opsTwin/types';

export function hashToSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number): Rng {
  const nextRaw = mulberry32(seed || 1);
  return {
    next: () => nextRaw(),
    int: (min, max) => Math.floor(nextRaw() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(nextRaw() * arr.length)]
  };
}
