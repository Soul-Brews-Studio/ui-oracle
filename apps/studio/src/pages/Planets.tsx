import { useCallback, useMemo, useState } from 'react';
import { SectionTabs, useNavTo } from '@ui-oracle/shared-ui';
import { useLocation } from 'react-router-dom';
import { usePlanetsData } from '../hooks/usePlanetsData';
import { usePlanetsSearch } from '../hooks/usePlanetsSearch';
import { PlanetsCanvas } from '../components/planets/PlanetsCanvas';
import { PlanetsSidebar } from '../components/planets/PlanetsSidebar';
import { PlanetsHUD } from '../components/planets/PlanetsHUD';
import { PlanetsLoading, PlanetsEmpty } from '../components/planets/PlanetsEmpty';
import { NebulaLegend } from '../components/planets/NebulaLegend';
import { TYPE_COLORS } from '../lib/type-colors';

export function Planets() {
  const navigate = useNavTo();
  // Memory already floats the section tabs over this scene; only the standalone /planets route needs its own.
  const standalone = useLocation().pathname.replace(/\/$/, '').endsWith('/planets');
  const data = usePlanetsData();
  const search = usePlanetsSearch();
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(() => new Set(Object.keys(TYPE_COLORS)));
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const toggleType = useCallback((t: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }, []);

  const filteredDocs = useMemo(
    () => data.documents.filter((d) =>
      visibleTypes.has(d.type) && (!selectedProject || d.project === selectedProject)),
    [data.documents, visibleTypes, selectedProject],
  );

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of data.documents) c[d.type] = (c[d.type] || 0) + 1;
    return c;
  }, [data.documents]);

  if (data.loading) return <PlanetsLoading />;
  if (data.error) return <PlanetsEmpty message={data.error} />;
  if (data.documents.length === 0) return <PlanetsEmpty />;

  return (
    <div className="flex h-[calc(100dvh-var(--app-header-h,100px))] overflow-hidden bg-black">
      <div className="flex-1 relative overflow-hidden">
        <PlanetsCanvas
          documents={filteredDocs}
          clusters={data.clusters}
          nebulae={data.nebulae}
          highlightIds={search.matchIds}
          onDocumentClick={(doc) => navigate(`/doc/${doc.id}`)}
        />
        <PlanetsHUD
          query={search.query}
          onQueryChange={search.setQuery}
          onClear={search.clear}
          matchCount={search.matchIds.size}
          visibleTypes={visibleTypes}
          onToggleType={toggleType}
        />
        <NebulaLegend />
        {standalone && <div className="absolute top-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-[10px] p-1 backdrop-blur-xl border border-white/[0.08]" style={{ background: 'rgba(10, 10, 20, 0.7)' }}>
          <SectionTabs />
        </div>}
      </div>
      <PlanetsSidebar
        stats={data.stats}
        clusters={data.clusters}
        totalDocs={data.documents.length}
        typeCounts={typeCounts}
        matchCount={search.matchIds.size}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        model={data.model}
        onSetModel={data.setModel}
      />
    </div>
  );
}
