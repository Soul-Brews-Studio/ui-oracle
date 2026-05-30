import { useMemo, useState } from 'react';
import { KnowledgeMap } from 'knowledge-map-3d';
import { useNavigate } from 'react-router-dom';
import { useBase } from '@ui-oracle/shared-ui';
import { usePlanetsData } from '../../hooks/usePlanetsData';
import { usePlanetsSearch } from '../../hooks/usePlanetsSearch';
import { PlanetsLoading, PlanetsEmpty } from '../../components/planets/PlanetsEmpty';
import { PlanetsHUD } from '../../components/planets/PlanetsHUD';
import { TYPE_COLORS } from '../../lib/type-colors';

export function MapPlugin() {
  const data = usePlanetsData();
  const search = usePlanetsSearch();
  const base = useBase();
  const navigate = useNavigate();
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(() => new Set(Object.keys(TYPE_COLORS)));

  const filteredDocs = useMemo(
    () => data.documents.filter((d) => visibleTypes.has(d.type)),
    [data.documents, visibleTypes],
  );

  const toggleType = (t: string) =>
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  if (data.loading) return <PlanetsLoading />;
  if (data.error) return <PlanetsEmpty message={data.error} />;
  if (data.documents.length === 0) return <PlanetsEmpty />;

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-black">
      <KnowledgeMap
        documents={filteredDocs}
        clusters={data.clusters}
        nebulae={data.nebulae}
        highlightIds={search.matchIds}
        onDocumentClick={(doc) => {
          if (base) {
            // Combined bundle: studio's doc viewer is at the root /doc/:id.
            navigate(`/doc/${encodeURIComponent(doc.id)}`);
          } else {
            window.location.href = `/doc/${encodeURIComponent(doc.id)}`;
          }
        }}
        typeColors={TYPE_COLORS}
        embedded
        heightMode="auto"
        className="w-full h-full"
      />
      <PlanetsHUD
        query={search.query}
        onQueryChange={search.setQuery}
        onClear={search.clear}
        matchCount={search.matchIds.size}
        visibleTypes={visibleTypes}
        onToggleType={toggleType}
      />
    </div>
  );
}
