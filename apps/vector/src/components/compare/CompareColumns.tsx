import type { Document } from '../../api/oracle';
import type { ModelState } from '../../hooks/useCompareSearch';
import { CompareResultCard } from './CompareResultCard';
import { CompareEmpty } from './CompareEmpty';

interface Props {
  enabledModels: string[];
  byModel: Record<string, ModelState>;
  sharedIds: Set<string>;
  uniqueIdsByModel: Record<string, Set<string>>;
  filter: (doc: Document, model: string) => boolean;
  currentHost: string;
  studioOrigin: string;
}

export function CompareColumns({
  enabledModels,
  byModel,
  sharedIds,
  uniqueIdsByModel,
  filter,
  currentHost,
  studioOrigin,
}: Props) {
  const cols = enabledModels.length;
  const grid =
    cols >= 3
      ? 'grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1'
      : cols === 2
        ? 'grid-cols-2 max-md:grid-cols-1'
        : 'grid-cols-1';

  return (
    <div className={`grid ${grid} gap-4`}>
      {enabledModels.map((model) => {
        const state = byModel[model];
        return (
          <div key={model} className="flex flex-col min-w-0 gap-2">
            <ColumnHeader model={model} state={state} />
            {!state || state.loading ? (
              <CompareEmpty variant="loading" />
            ) : state.error ? (
              <CompareEmpty variant="error" message={state.error} />
            ) : state.results.length === 0 ? (
              <CompareEmpty variant="empty" />
            ) : (
              <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
                {state.results
                  .map((doc, index) => ({ doc, index }))
                  .filter(({ doc }) => filter(doc, model))
                  .map(({ doc, index }) => (
                    <CompareResultCard
                      key={doc.id}
                      doc={doc}
                      rank={index + 1}
                      shared={sharedIds.has(doc.id)}
                      unique={uniqueIdsByModel[model]?.has(doc.id) ?? false}
                      currentHost={currentHost}
                      studioOrigin={studioOrigin}
                    />
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ColumnHeader({ model, state }: { model: string; state: ModelState | undefined }) {
  return (
    <div
      className="py-2.5 px-3.5 rounded-xl backdrop-blur-lg flex items-baseline gap-2"
      style={{ background: 'rgba(20, 20, 35, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      <span className="text-[13px] font-bold font-mono text-accent">{model}</span>
      <span className="text-[11px] text-text-muted tabular-nums">
        {state?.results.length ?? 0} · {state?.latencyMs ?? 0}ms
      </span>
    </div>
  );
}
