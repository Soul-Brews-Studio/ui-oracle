import type { Document } from '../api/oracle';

/** Canned demo results for when backend is offline — keeps the showcase usable. */
const DEMO_DOCS: Document[] = [
  { id: 'principle/nothing-deleted', type: 'principle', content: '# Nothing is Deleted\n\nOracle keeps every trace. Supersede, never erase.', source_file: 'principles/nothing-deleted.md', concepts: ['memory', 'trust'], score: 0.94 },
  { id: 'principle/patterns-over-intentions', type: 'principle', content: '# Patterns Over Intentions\n\nPatterns in behavior matter more than stated intentions.', source_file: 'principles/patterns.md', concepts: ['patterns', 'trust'], score: 0.91 },
  { id: 'learning/mcp-transport', type: 'learning', content: '# MCP uses stdio or SSE\n\nThe Model Context Protocol is transport-agnostic but the common path is stdio for local tools.', source_file: 'learnings/mcp.md', concepts: ['mcp', 'transport'], score: 0.88 },
  { id: 'retro/federation-handshake', type: 'retro', content: '# Federation handshake\n\nHTTP 3457 not SSH port 22. Two channels independent.', source_file: 'retros/2026-04-18.md', concepts: ['federation', 'network'], score: 0.82 },
  { id: 'principle/external-brain', type: 'principle', content: '# External Brain, Not Command\n\nOracle is memory you can query, not a boss that tells you what to do.', source_file: 'principles/external-brain.md', concepts: ['memory', 'autonomy'], score: 0.79 },
  { id: 'learning/vector-vs-fts', type: 'learning', content: '# Vector vs FTS\n\nFTS matches literal tokens. Vector captures semantic meaning.', source_file: 'learnings/search.md', concepts: ['search', 'embeddings'], score: 0.76 },
  { id: 'principle/curiosity-creates-existence', type: 'principle', content: '# Curiosity Creates Existence\n\nWhat you attend to becomes what is.', source_file: 'principles/curiosity.md', concepts: ['attention'], score: 0.71 },
  { id: 'learning/form-formless', type: 'learning', content: '# Form and Formless\n\nStructure when needed, space when not.', source_file: 'learnings/form.md', concepts: ['design'], score: 0.64 },
];

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hashQuery(q: string): number {
  let h = 0;
  for (let i = 0; i < q.length; i++) h = ((h << 5) - h + q.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Return per-mode demo results. Different slice/ordering per mode so the comparison looks real. */
export function demoSearch(query: string, mode: 'fts' | 'vector' | 'hybrid') {
  const seed = hashQuery(query + mode);
  const all = shuffle(DEMO_DOCS, seed);
  // Simulate per-mode characteristics
  let slice: Document[];
  if (mode === 'fts')    slice = all.slice(0, 5).map((d, i) => ({ ...d, score: Math.max(0.2, 0.95 - i * 0.12) }));
  else if (mode === 'vector') slice = all.slice(0, 7).map((d, i) => ({ ...d, score: Math.max(0.3, 0.88 - i * 0.08) }));
  else                   slice = all.slice(0, 8).map((d, i) => ({ ...d, score: Math.max(0.35, 0.92 - i * 0.07) }));
  return {
    results: slice.map(d => ({ ...d, source: mode })),
    total: slice.length,
    query,
  };
}
