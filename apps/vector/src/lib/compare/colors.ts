// Stable per-docId color: hash → HSL → hex. Same id → same color across columns.

const HUE_STEPS = 12;
const SATURATION = 62;
const LIGHTNESS = 56;

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function hslToHex(h: number, s: number, l: number): string {
  const sd = s / 100;
  const ld = l / 100;
  const a = sd * Math.min(ld, 1 - ld);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = ld - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function colorForDocId(docId: string): string {
  const h = hash32(docId);
  const hue = (h % HUE_STEPS) * (360 / HUE_STEPS);
  return hslToHex(hue, SATURATION, LIGHTNESS);
}

export function cssVarForDocId(docId: string): string {
  const tag = hash32(docId).toString(36).padStart(7, '0').slice(0, 7);
  return `--doc-color-${tag}`;
}
