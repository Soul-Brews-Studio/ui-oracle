import { useEffect, useMemo, useState } from 'react';
import type { Document } from '../api/oracle';
import { getStats } from '../api/oracle';
import { hostLabel } from '../api/host';
import { CompareHUD, CompareColumns, CompareEmpty, type ViewFilter } from '../components/compare';
import { useCompareSearch } from '../hooks/useCompareSearch';
import { sharedIds as computeShared, uniqueIds as computeUnique, type ByModel } from '../lib/compare';

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

// Seed with an Oracle principle so first paint has real content — not an empty loader.
const DEFAULT_QUERY = 'patterns over intentions';

export default function Compare() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [available, setAvailable] = useState<string[]>([]);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [view, setView] = useState<ViewFilter>('all');

  useEffect(() => {
    (async () => {
      try {
        const s = await getStats();
        const models = (s.vectors ?? []).map((v) => v.model).filter((m): m is string => !!m);
        setAvailable(models);
        setEnabled(models.slice(0, 3));
      } catch {}
    })();
  }, []);

  const { byModel, agreement, loading, fire } = useCompareSearch({ query, enabledModels: enabled });

  const raw = useMemo<ByModel>(() => {
    const out: ByModel = {};
    for (const m of enabled) out[m] = byModel[m]?.results ?? [];
    return out;
  }, [byModel, enabled]);

  const shared = useMemo(() => computeShared(raw), [raw]);
  const uniqueByModel = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    for (const model of enabled) m[model] = computeUnique(raw, model);
    return m;
  }, [raw, enabled]);

  const filter = (doc: Document, model: string): boolean => {
    if (view === 'overlap') return shared.has(doc.id);
    if (view === 'diff') return uniqueByModel[model]?.has(doc.id) ?? false;
    return true;
  };

  const toggle = (m: string) =>
    setEnabled((e) => (e.includes(m) ? e.filter((x) => x !== m) : [...e, m]));

  const currentHost = hostLabel().replace(' (default)', '');

  return (
    <div className="max-w-[1400px] mx-auto py-6 px-6">
      <CompareHUD
        query={query}
        onQueryChange={setQuery}
        onSubmit={() => fire()}
        loading={loading}
        availableModels={available}
        enabledModels={enabled}
        onToggleModel={toggle}
        view={view}
        onViewChange={setView}
        agreement={agreement}
      />
      {enabled.length === 0 ? (
        <CompareEmpty variant="empty" />
      ) : (
        <CompareColumns
          enabledModels={enabled}
          byModel={byModel}
          sharedIds={shared}
          uniqueIdsByModel={uniqueByModel}
          filter={filter}
          currentHost={currentHost}
          studioOrigin={STUDIO_ORIGIN}
        />
      )}
    </div>
  );
}
