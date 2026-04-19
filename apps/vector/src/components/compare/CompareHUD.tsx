import type { FormEvent } from 'react';
import { CompareAgreement } from './CompareAgreement';
import type { Agreement } from '../../hooks/useCompareSearch';

export type ViewFilter = 'all' | 'overlap' | 'diff';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: () => void;
  loading: boolean;
  availableModels: string[];
  enabledModels: string[];
  onToggleModel: (model: string) => void;
  view: ViewFilter;
  onViewChange: (v: ViewFilter) => void;
  agreement: Agreement;
}

const VIEWS: { id: ViewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'overlap', label: 'Overlap' },
  { id: 'diff', label: 'Diff' },
];

export function CompareHUD({
  query,
  onQueryChange,
  onSubmit,
  loading,
  availableModels,
  enabledModels,
  onToggleModel,
  view,
  onViewChange,
  agreement,
}: Props) {
  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <div
      className="rounded-2xl p-4 mb-5 backdrop-blur-lg flex flex-col gap-3"
      style={{ background: 'rgba(20, 20, 35, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      <form onSubmit={handleFormSubmit} className="flex max-md:flex-col gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Compare query across embedders…"
          className="flex-1 py-2.5 px-4 rounded-[10px] text-[14px] text-text-primary border border-border outline-none focus:border-accent transition-colors duration-200 placeholder:text-text-muted backdrop-blur-lg [&::-webkit-search-cancel-button]:hidden [&::-webkit-clear-button]:hidden [&::-ms-clear]:hidden"
          style={{ WebkitAppearance: 'none', background: 'rgba(10, 10, 20, 0.6)' }}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent border-none text-white py-2.5 px-5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching…' : 'Go'}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-text-muted uppercase tracking-wide mr-1">Models</span>
          {availableModels.map((m) => {
            const on = enabledModels.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => onToggleModel(m)}
                className={`text-[12px] font-mono py-1 px-2.5 rounded-full transition-all duration-150 ${on ? 'bg-accent/15 text-accent border border-accent/40' : 'text-text-muted border border-border hover:text-text-primary hover:border-white/20'}`}
              >
                {m}
              </button>
            );
          })}
        </div>

        <span className="w-px h-4 bg-border" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-text-muted uppercase tracking-wide mr-1">View</span>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={`text-[12px] py-1 px-2.5 rounded-md transition-all duration-150 ${view === v.id ? 'bg-white/10 text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <CompareAgreement agreement={agreement} />
    </div>
  );
}
