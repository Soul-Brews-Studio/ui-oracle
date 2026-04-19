import { useEffect, useRef, useState } from 'react';
import { search } from '../api/oracle';
import type { Document } from '../api/oracle';
import { demoSearch } from '../data/demo';

interface ColumnResult {
  results: Document[];
  total: number;
  time: number;
  avgScore: number;
}

const SAMPLE_QUERIES = [
  'what is oracle',
  'how does MCP work',
  'patterns over intentions',
  'vector vs full-text search',
  'nothing is deleted',
  'federation handshake',
];

function useCountUp(target: number, duration = 400): number {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setValue(0); ref.current = 0; return; }
    const start = ref.current;
    const diff = target - start;
    const startTime = performance.now();
    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function Playground({ backendLive }: { backendLive: boolean }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ftsCol, setFtsCol] = useState<ColumnResult | null>(null);
  const [vectorCol, setVectorCol] = useState<ColumnResult | null>(null);
  const [hybridCol, setHybridCol] = useState<ColumnResult | null>(null);
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);

  async function doSearch(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setSearched(true);
    setResultsVisible(false);

    const modes = ['fts', 'vector', 'hybrid'] as const;
    const results = await Promise.all(
      modes.map(async (mode) => {
        const start = performance.now();
        try {
          const data = backendLive
            ? await search(q, 'all', 20, mode)
            : await simulateLatency(demoSearch(q, mode), mode);
          const time = Math.round(performance.now() - start);
          const scores = data.results.map(r => r.score || 0);
          const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
          return { results: data.results, total: data.total, time, avgScore: avg };
        } catch {
          // Backend failed mid-flight — fall back to demo data
          const data = demoSearch(q, mode);
          return { results: data.results, total: data.total, time: Math.round(performance.now() - start), avgScore: avgOf(data.results) };
        }
      })
    );

    setFtsCol(results[0]);
    setVectorCol(results[1]);
    setHybridCol(results[2]);
    setLoading(false);
    requestAnimationFrame(() => setResultsVisible(true));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  const ftsIds = new Set(ftsCol?.results.map(r => r.id) || []);
  const vectorIds = new Set(vectorCol?.results.map(r => r.id) || []);
  const hybridIds = new Set(hybridCol?.results.map(r => r.id) || []);
  const allIds = new Set([...ftsIds, ...vectorIds, ...hybridIds]);
  const sharedIds = new Set([...allIds].filter(id => ftsIds.has(id) && vectorIds.has(id)));
  const ftsOnly = new Set([...ftsIds].filter(id => !vectorIds.has(id)));
  const vectorOnly = new Set([...vectorIds].filter(id => !ftsIds.has(id)));
  const maxTime = Math.max(ftsCol?.time || 0, vectorCol?.time || 0, hybridCol?.time || 0, 1);

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero / pre-search */}
      {!searched && !loading && (
        <div className="max-w-[900px] mx-auto py-16 max-md:py-10 px-6 text-center">
          <div className="text-6xl max-md:text-5xl mb-4 inline-block animate-[float_4s_ease-in-out_infinite]">🔮</div>
          <h1 className="text-[56px] max-md:text-[36px] font-extrabold leading-[1.05] tracking-tight mb-4 bg-gradient-to-br from-[#60a5fa] via-[#a78bfa] to-[#4ade80] bg-clip-text text-transparent animate-[gradientShift_6s_ease-in-out_infinite] bg-[length:200%_200%]">
            Vector Playground
          </h1>
          <p className="text-[17px] max-md:text-[15px] text-text-secondary mb-2 max-w-[620px] mx-auto leading-relaxed">
            See how <span className="text-[#60a5fa] font-semibold">keyword</span>, <span className="text-[#a78bfa] font-semibold">semantic</span>, and <span className="text-[#4ade80] font-semibold">hybrid</span> search compare — side by side, on real Oracle memory.
          </p>
          <p className="text-[13px] text-text-muted mb-10">Type a query, or pick one below.</p>

          <form onSubmit={handleSubmit} className="flex max-md:flex-col gap-3 max-w-[640px] mx-auto mb-6">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. what is oracle"
              className="flex-1 py-3.5 px-[18px] rounded-[12px] text-[15px] text-text-primary border border-border outline-none focus:border-accent transition-colors duration-200 placeholder:text-text-muted backdrop-blur-lg [&::-webkit-search-cancel-button]:hidden [&::-webkit-clear-button]:hidden [&::-ms-clear]:hidden"
              style={{ WebkitAppearance: 'none', background: 'rgba(20, 20, 35, 0.6)' }}
              autoFocus
            />
            <button
              type="submit"
              className="bg-accent border-none text-white py-3.5 px-7 rounded-[12px] text-[15px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-accent-hover hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Compare →
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {SAMPLE_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => doSearch(q)}
                className="text-[12px] py-1.5 px-3 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-text-primary"
                style={{ background: 'rgba(20, 20, 35, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--color-text-secondary)' }}
              >{q}</button>
            ))}
          </div>

          <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4 mt-4 text-left">
            <FeatureCard color="#60a5fa" title="FTS5" desc="Full-text search using SQLite's FTS5 engine. Fast keyword matching with BM25 ranking." />
            <FeatureCard color="#a78bfa" title="Vector" desc="Semantic search using ChromaDB embeddings. Finds conceptually similar results — even with different words." />
            <FeatureCard color="#4ade80" title="Hybrid" desc="Best of both. Combines results and boosts docs found by both engines simultaneously." />
          </div>
        </div>
      )}

      {/* Post-search */}
      {(searched || loading) && (
        <div className="max-w-[1300px] mx-auto py-6 px-6">
          <form onSubmit={handleSubmit} className="flex max-md:flex-col gap-3 max-w-[720px] mx-auto mb-4">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search query..."
              className="flex-1 py-3.5 px-[18px] rounded-[12px] text-[15px] text-text-primary border border-border outline-none focus:border-accent transition-colors duration-200 placeholder:text-text-muted backdrop-blur-lg [&::-webkit-search-cancel-button]:hidden [&::-webkit-clear-button]:hidden [&::-ms-clear]:hidden"
              style={{ WebkitAppearance: 'none', background: 'rgba(20, 20, 35, 0.6)' }}
              autoFocus
            />
            <button
              type="submit"
              className="bg-accent border-none text-white py-3.5 px-7 rounded-[12px] text-[15px] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-accent-hover hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >{loading ? 'Searching…' : 'Compare →'}</button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {SAMPLE_QUERIES.slice(0, 4).map(q => (
              <button
                key={q}
                onClick={() => doSearch(q)}
                className="text-[11px] py-1 px-2.5 rounded-full transition-all duration-200 hover:border-accent hover:text-text-primary"
                style={{ background: 'rgba(20, 20, 35, 0.4)', border: '1px solid rgba(255, 255, 255, 0.06)', color: 'var(--color-text-muted)' }}
              >{q}</button>
            ))}
          </div>

          {loading && (
            <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4 mt-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-20 rounded-[12px] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%' }} />
                  {[0, 1, 2, 3, 4].map(j => (
                    <div key={j} className="h-[84px] rounded-[12px] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)', backgroundSize: '200% 100%', animationDelay: `${j * 80}ms` }} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {!loading && ftsCol && (
            <>
              <SummaryBar fts={ftsCol} vector={vectorCol} hybrid={hybridCol} sharedCount={sharedIds.size} maxTime={maxTime} />
              <div className="grid grid-cols-3 max-md:grid-cols-1 gap-4">
                <Column title="FTS5"   color="#60a5fa" data={ftsCol}    uniqueIds={ftsOnly}    sharedIds={sharedIds} hoveredDocId={hoveredDocId} onHover={setHoveredDocId} onSelect={setSelectedDoc} visible={resultsVisible} />
                <Column title="Vector" color="#a78bfa" data={vectorCol} uniqueIds={vectorOnly} sharedIds={sharedIds} hoveredDocId={hoveredDocId} onHover={setHoveredDocId} onSelect={setSelectedDoc} visible={resultsVisible} />
                <Column title="Hybrid" color="#4ade80" data={hybridCol} uniqueIds={new Set()}  sharedIds={sharedIds} hoveredDocId={hoveredDocId} onHover={setHoveredDocId} onSelect={setSelectedDoc} visible={resultsVisible} />
              </div>
            </>
          )}
        </div>
      )}

      {selectedDoc && <DocDrawer doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
    </div>
  );
}

function FeatureCard({ color, title, desc }: { color: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-[16px] py-7 px-6 backdrop-blur-lg cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_32px_rgba(255,255,255,0.04)]"
      style={{ background: 'rgba(20, 20, 35, 0.55)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}66`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)')}
    >
      <div className="text-[22px] font-extrabold mb-2.5 tracking-tight" style={{ color }}>{title}</div>
      <p className="text-[13px] text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}

function SummaryBar({ fts, vector, hybrid, sharedCount, maxTime }: {
  fts: ColumnResult | null; vector: ColumnResult | null; hybrid: ColumnResult | null; sharedCount: number; maxTime: number;
}) {
  const ftsCount = useCountUp(fts?.total || 0);
  const vecCount = useCountUp(vector?.total || 0);
  const hybCount = useCountUp(hybrid?.total || 0);
  const sharedAnim = useCountUp(sharedCount);

  return (
    <div
      className="flex max-md:flex-col items-center gap-6 py-4 px-6 rounded-2xl mb-5 backdrop-blur-lg"
      style={{ background: 'rgba(20, 20, 35, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      <div className="flex-1 flex max-md:w-full gap-6">
        {[
          { n: ftsCount, color: '#60a5fa', label: 'FTS',    t: fts?.time },
          { n: vecCount, color: '#a78bfa', label: 'Vector', t: vector?.time },
          { n: hybCount, color: '#4ade80', label: 'Hybrid', t: hybrid?.time },
        ].map(x => (
          <div key={x.label} className="flex-1 flex flex-col gap-0.5">
            <span className="text-[30px] font-extrabold leading-none tabular-nums" style={{ color: x.color }}>{x.n}</span>
            <span className="text-[11px] text-text-muted uppercase tracking-wide mb-1">{x.label}</span>
            <div className="h-[3px] rounded-sm overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="h-full rounded-sm transition-[width] duration-500 ease-out" style={{ width: `${((x.t || 0) / maxTime) * 100}%`, background: x.color }} />
            </div>
            <span className="text-[10px] text-text-muted tabular-nums">{x.t || 0}ms</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 min-w-[100px]">
        <div className="flex items-center">
          <div className="rounded-full shrink-0 transition-all duration-300" style={{ background: 'rgba(96, 165, 250, 0.15)', border: '1.5px solid rgba(96, 165, 250, 0.4)', width: `${Math.max(28, Math.min(56, (fts?.results.length || 0) * 3))}px`, height: `${Math.max(28, Math.min(56, (fts?.results.length || 0) * 3))}px` }} />
          <div className="rounded-full shrink-0 -ml-3 transition-all duration-300" style={{ background: 'rgba(167, 139, 250, 0.15)', border: '1.5px solid rgba(167, 139, 250, 0.4)', width: `${Math.max(28, Math.min(56, (vector?.results.length || 0) * 3))}px`, height: `${Math.max(28, Math.min(56, (vector?.results.length || 0) * 3))}px` }} />
        </div>
        <span className="text-[11px] text-text-muted tabular-nums">{sharedAnim} shared</span>
      </div>
    </div>
  );
}

function Column({ title, color, data, uniqueIds, sharedIds, hoveredDocId, onHover, onSelect, visible }: {
  title: string; color: string; data: ColumnResult | null;
  uniqueIds: Set<string>; sharedIds: Set<string>;
  hoveredDocId: string | null; onHover: (id: string | null) => void;
  onSelect: (doc: Document) => void;
  visible: boolean;
}) {
  if (!data) return null;
  return (
    <div className="flex flex-col min-w-0">
      <div
        className="relative overflow-hidden py-3.5 px-4 rounded-2xl mb-2.5 backdrop-blur-lg"
        style={{ background: 'rgba(20, 20, 35, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 animate-[glowPulse_3s_ease-in-out_infinite]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <span className="text-base font-bold block mb-2" style={{ color }}>{title}</span>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-text-primary tabular-nums">{data.results.length}</span>
          <span className="text-[11px] text-text-muted">results</span>
          <span className="w-px h-3 mx-0.5 self-center" style={{ background: 'rgba(255, 255, 255, 0.08)' }} />
          <span className="text-base font-bold text-text-primary tabular-nums">{data.time}ms</span>
          <span className="text-[11px] text-text-muted">time</span>
          <span className="w-px h-3 mx-0.5 self-center" style={{ background: 'rgba(255, 255, 255, 0.08)' }} />
          <span className="text-base font-bold text-text-primary tabular-nums">{Math.round(data.avgScore * 100)}%</span>
          <span className="text-[11px] text-text-muted">avg</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 max-h-[620px] overflow-y-auto pr-1">
        {data.results.map((doc, index) => {
          const scorePercent = Math.round((doc.score || 0) * 100);
          const isShared = sharedIds.has(doc.id);
          const isUnique = uniqueIds.has(doc.id);
          const isCrossHighlighted = hoveredDocId === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => onSelect(doc)}
              onMouseEnter={() => isShared ? onHover(doc.id) : undefined}
              onMouseLeave={() => onHover(null)}
              className={`text-left block rounded-[12px] p-3.5 cursor-pointer backdrop-blur-md transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.35)]`}
              style={{
                background: 'rgba(20, 20, 35, 0.55)',
                border: `1px solid ${
                  isCrossHighlighted ? 'rgba(74, 222, 128, 0.55)' :
                  isShared ? 'rgba(74, 222, 128, 0.25)' :
                  isUnique ? 'rgba(251, 191, 36, 0.18)' :
                  'rgba(255, 255, 255, 0.05)'
                }`,
                transitionDelay: visible ? `${index * 30}ms` : '0ms',
                boxShadow: isCrossHighlighted ? `0 0 20px rgba(74, 222, 128, 0.15)` : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 flex items-center gap-1.5">
                  <div className="flex-1 h-[4px] rounded-sm overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="h-full rounded-sm transition-[width] duration-500 ease-out" style={{ width: visible ? `${scorePercent}%` : '0%', background: `linear-gradient(90deg, ${color}, ${color}cc)`, transitionDelay: visible ? `${index * 30 + 200}ms` : '0ms' }} />
                  </div>
                  <span className="text-[11px] text-text-muted font-semibold min-w-[32px] text-right tabular-nums">{scorePercent}%</span>
                </div>
                {isShared && <span className="text-[9px] font-semibold uppercase tracking-wide py-0.5 px-[7px] rounded-md animate-[badgePulse_2.5s_ease-in-out_infinite]" style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)' }}>shared</span>}
                {isUnique && <span className="text-[9px] font-semibold uppercase tracking-wide py-0.5 px-[7px] rounded-md" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)' }}>unique</span>}
              </div>
              <div className="text-[11px] text-accent font-medium mb-1 capitalize">{doc.type}</div>
              <div className="text-[13px] text-text-primary leading-snug overflow-hidden text-ellipsis whitespace-nowrap">
                {firstLine(doc.content) || doc.id}
              </div>
            </button>
          );
        })}
        {data.results.length === 0 && (
          <div className="text-center text-text-muted py-10 px-4 text-[13px]" style={{ background: 'rgba(20, 20, 35, 0.3)', borderRadius: 12 }}>
            No results
          </div>
        )}
      </div>
    </div>
  );
}

function DocDrawer({ doc, onClose }: { doc: Document; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(5, 5, 10, 0.7)' }} />
      <div
        className="relative max-w-[720px] w-full max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-6 md:p-8"
        style={{ background: 'rgba(18, 18, 28, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-accent font-semibold uppercase tracking-wide mb-1">{doc.type}</div>
            <div className="text-[14px] text-text-muted truncate">{doc.source_file}</div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full grid place-items-center text-text-muted hover:text-text-primary transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            aria-label="close"
          >×</button>
        </div>
        <pre className="text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap font-[inherit]">{stripFrontmatter(doc.content)}</pre>
        {doc.concepts?.length > 0 && (
          <div className="mt-5 pt-4 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            {doc.concepts.map(c => (
              <span key={c} className="text-[11px] py-0.5 px-2 rounded-full" style={{ background: 'rgba(100, 181, 246, 0.1)', color: 'var(--color-accent)' }}>{c}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ——— helpers ———

function firstLine(content: string): string {
  return (content || '').replace(/^---[\s\S]*?---\s*/, '').replace(/^#+\s*/gm, '').split('\n')[0]?.slice(0, 80) ?? '';
}

function stripFrontmatter(content: string): string {
  return (content || '').replace(/^---[\s\S]*?---\s*/, '').trim();
}

function avgOf(rs: Document[]): number {
  if (!rs.length) return 0;
  return rs.reduce((a, r) => a + (r.score || 0), 0) / rs.length;
}

/** Delay demo response ~ mode-typical latency so the UI animation feels real. */
async function simulateLatency<T>(data: T, mode: 'fts' | 'vector' | 'hybrid'): Promise<T> {
  const ms = mode === 'fts' ? 30 + Math.random() * 40 : mode === 'vector' ? 120 + Math.random() * 80 : 90 + Math.random() * 60;
  await new Promise(r => setTimeout(r, ms));
  return data;
}
