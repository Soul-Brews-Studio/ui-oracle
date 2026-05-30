import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@ui-oracle/shared-ui';
import { search } from '../api/oracle';
import type { Document } from '../api/oracle';
import { LogCard } from '../components/LogCard';

const RECENT_KEY = 'oracle-recent-searches';
const RECENT_LIMIT = 8;

function getRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function rememberSearch(q: string): string[] {
  const term = q.trim();
  if (!term) return getRecent();
  // most-recent first, case-insensitive dedup, capped
  const next = [term, ...getRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_LIMIT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — ignore */
  }
  return next;
}

const CHIP =
  'bg-bg-card border border-border text-text-secondary px-4 py-2 rounded-[20px] cursor-pointer text-sm transition-all duration-200 hover:border-accent hover:text-accent';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => getRecent());

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams]);

  async function doSearch(q: string) {
    if (!q.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await search(q, 'all', 50);
      setResults(data.results);
      setTotal(data.total);
      setRecent(rememberSearch(q));
    } finally {
      setLoading(false);
    }
  }

  // Used by the form and the Recent/suggestion chips. Updating searchParams
  // triggers doSearch via the effect above.
  function runSearch(term: string) {
    const q = term.trim();
    if (!q) return;
    setQuery(q);
    setSearchParams({ q });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  return (
    <PageShell maxWidth="720px">
      <h1 className="text-[32px] font-bold text-text-primary mb-6 text-center">Search Oracle</h1>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for patterns, principles, learnings..."
          className="flex-1 bg-bg-card border border-border text-text-primary px-5 py-4 rounded-lg text-base outline-none transition-colors duration-200 focus:border-accent placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden [&::-webkit-clear-button]:hidden [&::-ms-clear]:hidden"
          style={{ WebkitAppearance: 'none' }}
          autoFocus
        />
        <button
          type="submit"
          className="bg-accent border-none text-white px-8 py-4 rounded-lg text-base font-medium cursor-pointer transition-colors duration-200 hover:bg-accent-hover"
        >
          Search
        </button>
      </form>

      {loading && <div className="text-center text-text-muted py-12">Searching...</div>}

      {!loading && searched && (
        <div className="mt-6">
          <p className="text-text-secondary text-sm mb-6">
            {total} results for "{searchParams.get('q')}"
          </p>

          {results.length > 0 ? (
            <div className="flex flex-col">
              {results.map(doc => (
                <LogCard key={doc.id} doc={doc} />
              ))}
            </div>
          ) : (
            <div className="text-center text-text-muted py-12 bg-bg-card rounded-xl">
              No results found. Try a different search term.
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center mt-12">
          {recent.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <p className="text-text-muted text-sm">Recent searches</p>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
                    setRecent([]);
                  }}
                  className="text-text-muted text-xs underline-offset-2 hover:text-accent hover:underline"
                >
                  clear
                </button>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                {recent.map(term => (
                  <button key={term} type="button" onClick={() => runSearch(term)} className={CHIP}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-text-muted text-sm mb-4">Try searching for:</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {['trust', 'safety', 'git', 'context', 'pattern'].map(term => (
              <button key={term} type="button" onClick={() => runSearch(term)} className={CHIP}>
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
