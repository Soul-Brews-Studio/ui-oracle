/**
 * The one navigation model (Nat 2026-11-25, from a Codex UX review): seven sections in the top bar, and
 * each section's pages as one tab row under the page title. Paths are the combined app's (apps/all), where
 * studio sits at the root and the sibling apps at /forum, /schedule, /vector, /canvas, /indexer, /feed.
 * Filters (Feed type, Forum status, date ranges) are not tabs: they stay beside the list they filter.
 */

export interface SectionTab { label: string; path: string; match?: (pathname: string, search: URLSearchParams) => boolean }
export interface Section { key: string; label: string; tabs: SectionTab[] }

const under = (p: string) => (pathname: string) => pathname === p || pathname.startsWith(`${p}/`);
const memoryView = (view: string | null) => (pathname: string, search: URLSearchParams) =>
  (pathname === '/map' && (search.get('view') ?? 'map') === (view ?? 'map')) || (view === 'planets' && pathname === '/planets');

export const SECTIONS: Section[] = [
  { key: 'overview', label: 'Overview', tabs: [
    { label: 'Summary', path: '/', match: (p) => p === '/' },
    { label: 'Activity', path: '/activity' },
    { label: 'Pulse', path: '/pulse' },
  ] },
  { key: 'search', label: 'Search', tabs: [
    { label: 'Search', path: '/search', match: (p) => under('/search')(p) || under('/doc')(p) },
    { label: 'Compare methods', path: '/vector', match: (p) => p === '/vector' || p === '/vector/' || p === '/playground' },
    { label: 'Compare models', path: '/vector/compare', match: (p) => p === '/vector/compare' || p === '/compare' },
  ] },
  { key: 'memory', label: 'Memory', tabs: [
    { label: 'Feed', path: '/feed' },
    { label: 'Map', path: '/map', match: memoryView(null) },
    { label: 'Planets', path: '/map?view=planets', match: memoryView('planets') },
    { label: 'Map 3D', path: '/map?view=map3d', match: memoryView('map3d') },
    { label: 'Graph 3D', path: '/map?view=graph3d', match: memoryView('graph3d') },
    { label: 'Canvas', path: '/canvas' },
  ] },
  { key: 'workspace', label: 'Workspace', tabs: [
    { label: 'Forum', path: '/forum' },
    { label: 'Schedule', path: '/schedule' },
  ] },
  { key: 'history', label: 'History', tabs: [
    { label: 'Traces', path: '/traces' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Evolution', path: '/evolution' },
    { label: 'Superseded', path: '/superseded' },
    { label: 'Handoff', path: '/handoff' },
  ] },
  { key: 'hub', label: 'Hub', tabs: [{ label: 'Hub', path: '/hub' }] },
  { key: 'settings', label: 'Settings', tabs: [
    { label: 'Access', path: '/settings' },
    { label: 'Indexer', path: '/indexer' },
    { label: 'Plugins', path: '/plugins' },
    { label: 'Menu editor', path: '/menu' },
  ] },
];

export function tabMatches(tab: SectionTab, pathname: string, search: URLSearchParams): boolean {
  if (tab.match) return tab.match(pathname, search);
  return under(tab.path.split('?')[0])(pathname);
}

export function sectionFor(pathname: string, search: URLSearchParams = new URLSearchParams()): Section | null {
  return SECTIONS.find((s) => s.tabs.some((t) => tabMatches(t, pathname, search))) ?? null;
}
