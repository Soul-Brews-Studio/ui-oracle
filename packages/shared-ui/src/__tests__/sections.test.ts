import { describe, expect, test } from 'bun:test';
import { SECTIONS, sectionFor, tabMatches } from '../sections';

const at = (url: string) => { const u = new URL(url, 'http://x'); return { p: u.pathname, q: u.searchParams }; };
const section = (url: string) => { const { p, q } = at(url); return sectionFor(p, q)?.key ?? null; };

describe('seven-section navigation', () => {
  test('seven sections, no Tools', () => {
    expect(SECTIONS.map((s) => s.label)).toEqual(['Overview', 'Search', 'Memory', 'Workspace', 'History', 'Hub', 'Settings']);
  });
  test('every page lands in exactly one section', () => {
    const cases: Record<string, string> = {
      '/': 'overview', '/activity': 'overview', '/pulse': 'overview',
      '/search': 'search', '/doc/abc': 'search', '/vector': 'search', '/vector/compare': 'search',
      '/feed': 'memory', '/map': 'memory', '/map?view=graph3d': 'memory', '/planets': 'memory', '/canvas': 'memory',
      '/forum': 'workspace', '/forum/thread/1': 'workspace', '/schedule': 'workspace',
      '/traces': 'history', '/traces/abc': 'history', '/sessions/1': 'history', '/handoff': 'history',
      '/hub': 'hub', '/settings': 'settings', '/indexer': 'settings', '/plugins': 'settings', '/menu': 'settings',
    };
    for (const [url, key] of Object.entries(cases)) expect([url, section(url)]).toEqual([url, key]);
    for (const url of Object.keys(cases)) {
      const { p, q } = at(url);
      const hits = SECTIONS.filter((s) => s.tabs.some((t) => tabMatches(t, p, q)));
      expect([url, hits.length]).toEqual([url, 1]);
    }
  });
  test('Memory views are tabs: exactly one is active', () => {
    const memory = SECTIONS.find((s) => s.key === 'memory')!;
    const active = (url: string) => { const { p, q } = at(url); return memory.tabs.filter((t) => tabMatches(t, p, q)).map((t) => t.label); };
    expect(active('/map')).toEqual(['Map']);
    expect(active('/map?view=planets')).toEqual(['Planets']);
    expect(active('/map?view=map3d&q=x')).toEqual(['Map 3D']);
    expect(active('/planets')).toEqual(['Planets']);
  });
  test('unknown paths belong to no section', () => {
    expect(section('/nope')).toBeNull();
    expect(section('/overview-ish')).toBeNull();
  });
});
