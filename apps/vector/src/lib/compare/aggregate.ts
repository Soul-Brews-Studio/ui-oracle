import type { Document } from '../../api/oracle';

export type ByModel = Record<string, Document[]>;

/**
 * Top-K agreement: of models with ≥K results, the fraction that picked the
 * plurality id at rank K (1-indexed). 1 = all agree, 0 = no data.
 */
export function topKAgreement(byModel: ByModel, k: number = 1): number {
  const idsAtK: string[] = [];
  for (const docs of Object.values(byModel)) {
    if (docs.length >= k) idsAtK.push(docs[k - 1].id);
  }
  if (idsAtK.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const id of idsAtK) counts.set(id, (counts.get(id) ?? 0) + 1);
  let max = 0;
  for (const n of counts.values()) if (n > max) max = n;
  return max / idsAtK.length;
}

/** |∩|/|∪| of top-K id-sets across all models. Single model → 1. */
export function topKJaccard(byModel: ByModel, k: number = 5): number {
  const sets = Object.values(byModel).map(
    (docs) => new Set(docs.slice(0, k).map((d) => d.id)),
  );
  if (sets.length === 0) return 0;
  if (sets.length === 1) return sets[0].size === 0 ? 0 : 1;
  const union = new Set<string>();
  for (const s of sets) for (const id of s) union.add(id);
  if (union.size === 0) return 0;
  const intersect = new Set<string>(sets[0]);
  for (let i = 1; i < sets.length; i++) {
    for (const id of Array.from(intersect)) {
      if (!sets[i].has(id)) intersect.delete(id);
    }
  }
  return intersect.size / union.size;
}

/**
 * For ids appearing in ≥2 columns, mean of (maxRank − minRank).
 * Rank is 1-indexed. Returns 0 when no id is shared.
 */
export function avgRankShift(byModel: ByModel): number {
  const ranks = new Map<string, number[]>();
  for (const docs of Object.values(byModel)) {
    docs.forEach((d, i) => {
      const arr = ranks.get(d.id);
      if (arr) arr.push(i + 1);
      else ranks.set(d.id, [i + 1]);
    });
  }
  const shifts: number[] = [];
  for (const arr of ranks.values()) {
    if (arr.length >= 2) {
      let mn = arr[0];
      let mx = arr[0];
      for (const r of arr) {
        if (r < mn) mn = r;
        if (r > mx) mx = r;
      }
      shifts.push(mx - mn);
    }
  }
  if (shifts.length === 0) return 0;
  let sum = 0;
  for (const s of shifts) sum += s;
  return sum / shifts.length;
}

/** Doc ids appearing in ≥2 columns. */
export function sharedIds(byModel: ByModel): Set<string> {
  const counts = new Map<string, number>();
  for (const docs of Object.values(byModel)) {
    const seen = new Set<string>();
    for (const d of docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
    }
  }
  const out = new Set<string>();
  for (const [id, n] of counts) if (n >= 2) out.add(id);
  return out;
}

/** Doc ids that appear only in `model`'s column. */
export function uniqueIds(byModel: ByModel, model: string): Set<string> {
  const here = byModel[model];
  if (!here) return new Set();
  const others = new Set<string>();
  for (const [m, docs] of Object.entries(byModel)) {
    if (m === model) continue;
    for (const d of docs) others.add(d.id);
  }
  const out = new Set<string>();
  for (const d of here) if (!others.has(d.id)) out.add(d.id);
  return out;
}
