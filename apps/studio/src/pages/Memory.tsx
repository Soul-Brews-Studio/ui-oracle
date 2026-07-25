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
  const [params, setParams] = useSearchParams();
  const raw = params.get('view');
  const view: ViewId = isViewId(raw) ? raw : 'map';

  const setView = (id: ViewId) => {
    const next = new URLSearchParams(params);
    if (id === 'map') next.delete('view');
    else next.set('view', id);
    // Each view owns its own search/filter params; drop them when switching so
    // a stale highlight from one view does not leak into the next.
    next.delete('q');
    setParams(next, { replace: true });
  };

  return (
    <div className="relative">
      {/* Floating switcher — top-left is the one free corner across these views
          (top-centre is each view's search box, top-right is the fps readout). */}
      <div
        className="absolute top-3 left-3 z-20 flex gap-1 rounded-[10px] p-1 backdrop-blur-xl border border-white/[0.08]"
        style={{ background: 'rgba(10, 10, 20, 0.7)' }}
        role="tablist"
        aria-label="Memory view"
      >
        {VIEWS.map(v => (
          <button
            key={v.id}
            role="tab"
            aria-selected={v.id === view}
            onClick={() => setView(v.id)}
            title={v.hint}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150 cursor-pointer border ${
              v.id === view
                ? 'text-accent border-accent/40 bg-accent/15'
                : 'text-text-secondary border-transparent hover:text-accent'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Only the active view is mounted — each builds a full Three.js scene, so
          keeping the others alive would burn GPU and memory for nothing. */}
      {view === 'map' && <Map />}
      {view === 'planets' && <Planets />}
      {(view === 'map3d' || view === 'graph3d') && (
        <div className="h-[calc(100vh-64px)] w-full">
          <PluginScene plugin={view} />
        </div>
      )}
    </div>
  );
}
