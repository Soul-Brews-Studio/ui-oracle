import { useCallback, useEffect, useRef, useState } from 'react';
import { compareSearch, type Document } from '../api/oracle';

export interface ModelState {
  results: Document[];
  loading: boolean;
  error: string | null;
  latencyMs: number;
}

export interface Agreement {
  top1: number;
  top5Jaccard: number;
  avgShift: number;
}

export interface CompareSearchState {
  byModel: Record<string, ModelState>;
  agreement: Agreement;
  loading: boolean;
  fire: (q?: string) => void;
}

export interface UseCompareSearchArgs {
  query: string;
  enabledModels: string[];
  limit?: number;
  debounceMs?: number;
  auto?: boolean;
}

const EMPTY_AGREEMENT: Agreement = { top1: 0, top5Jaccard: 0, avgShift: 0 };

export function useCompareSearch({
  query,
  enabledModels,
  limit = 20,
  debounceMs = 300,
  auto = true,
}: UseCompareSearchArgs): CompareSearchState {
  const [byModel, setByModel] = useState<Record<string, ModelState>>({});
  const [agreement, setAgreement] = useState<Agreement>(EMPTY_AGREEMENT);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);

  const run = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || enabledModels.length === 0) {
        setByModel({});
        setAgreement(EMPTY_AGREEMENT);
        setLoading(false);
        return;
      }
      const myReqId = ++reqIdRef.current;
      setLoading(true);
      setByModel((prev) => {
        const next: Record<string, ModelState> = {};
        for (const m of enabledModels) {
          next[m] = {
            results: prev[m]?.results ?? [],
            loading: true,
            error: null,
            latencyMs: prev[m]?.latencyMs ?? 0,
          };
        }
        return next;
      });

      try {
        const data = await compareSearch({ query: trimmed, models: enabledModels, limit });
        if (myReqId !== reqIdRef.current) return;
        const next: Record<string, ModelState> = {};
        for (const m of enabledModels) {
          const entry = data.byModel[m];
          next[m] = entry
            ? {
                results: entry.results,
                loading: false,
                error: null,
                latencyMs: Math.round(entry.elapsed_ms),
              }
            : { results: [], loading: false, error: 'no data', latencyMs: 0 };
        }
        setByModel(next);
        setAgreement({
          top1: data.agreement.top1,
          top5Jaccard: data.agreement.top5_jaccard,
          avgShift: data.agreement.avg_rank_shift,
        });
      } catch (err) {
        if (myReqId !== reqIdRef.current) return;
        const message = err instanceof Error ? err.message : String(err);
        const next: Record<string, ModelState> = {};
        for (const m of enabledModels) {
          next[m] = { results: [], loading: false, error: message, latencyMs: 0 };
        }
        setByModel(next);
        setAgreement(EMPTY_AGREEMENT);
      } finally {
        if (myReqId === reqIdRef.current) setLoading(false);
      }
    },
    [enabledModels, limit],
  );

  useEffect(() => {
    if (!auto) return;
    const id = window.setTimeout(() => void run(query), debounceMs);
    return () => window.clearTimeout(id);
  }, [query, auto, debounceMs, run]);

  const fire = useCallback((q?: string) => void run(q ?? query), [run, query]);

  return { byModel, agreement, loading, fire };
}
