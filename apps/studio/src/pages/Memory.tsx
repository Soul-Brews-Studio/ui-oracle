import { SectionTabs } from '@ui-oracle/shared-ui';
import { useSearchParams } from 'react-router-dom';
import { Map } from './Map';
import { Planets } from './Planets';
import { PluginScene } from '../components/PluginScene';

/**
 * Memory — one home for every view of the document universe.
 *
 * These visualisations all render the same corpus, but historically lived in
 * two places: Map/Planets under studio, and map3d/graph3d as Canvas plugins.
 * That split mirrored the old pre-monorepo repo boundaries, not anything a
 * user cares about, so the data-backed views are gathered here behind one
 * switcher. Canvas stays what it actually is — a sandbox for plugins that draw
 * procedural scenes rather than your knowledge.
 *
 * The active view lives in `?view=` so a particular view is linkable/shareable.
 */
const VIEWS = [
  { id: 'map', label: 'Map', hint: 'Globes per project — the default knowledge map' },
  { id: 'planets', label: 'Planets', hint: 'Orbital view: documents orbit their project star' },
  { id: 'map3d', label: 'Map 3D', hint: 'Raw 3D point map (plugin)' },
  { id: 'graph3d', label: 'Graph 3D', hint: 'Force-directed concept graph (plugin)' },
] as const;

type ViewId = typeof VIEWS[number]['id'];

function isViewId(v: string | null): v is ViewId {
  return v != null && VIEWS.some(x => x.id === v);
}

export function Memory() {
  const [params] = useSearchParams();
  const raw = params.get('view');
  const view: ViewId = isViewId(raw) ? raw : 'map';

  // Switching views is a plain link now (section tabs carry ?view=); it drops ?q= as it always did.

  return (
    <div className="relative">
      {/* Memory's pages (Feed, Map, Planets, Map 3D, Graph 3D, Canvas) as the one section tab row, floating
          top-left over the scene: the one free corner (top-centre is each view's search, top-right the fps). */}
      <div className="absolute top-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-[10px] p-1 backdrop-blur-xl border border-white/[0.08]" style={{ background: 'rgba(10, 10, 20, 0.7)' }}>
        <SectionTabs />
      </div>

      {/* Only the active view is mounted — each builds a full Three.js scene, so
          keeping the others alive would burn GPU and memory for nothing. */}
      {view === 'map' && <Map />}
      {view === 'planets' && <Planets />}
      {(view === 'map3d' || view === 'graph3d') && (
        <div className="h-[calc(100dvh-var(--app-header-h,100px))] w-full">
          <PluginScene plugin={view} />
        </div>
      )}
    </div>
  );
}
