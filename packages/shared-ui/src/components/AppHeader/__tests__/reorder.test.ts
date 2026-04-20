import { describe, it, expect } from 'bun:test';
import { reorderNavSet } from '../reorder';
import type { NavSet } from '../nav-types';

const nav: NavSet = {
  main: [
    { path: '/', label: 'Overview' },
    { path: '/search', label: 'Search' },
    { path: '#', label: 'Memory' },
    { path: '/', label: 'Canvas' },
    { path: '/', label: 'Feed' },
  ],
  tools: [
    { path: '/', label: 'Schedule' },
    { path: '/pulse', label: 'Pulse' },
    { path: '/sessions', label: 'Sessions' },
    { path: '/plugins', label: 'Plugins' },
    { path: '/', label: 'Vector Playground' },
    { path: '/compare', label: 'Compare' },
    { path: '/evolution', label: 'Evolution' },
  ],
};

describe('reorderNavSet', () => {
  it('returns identity when config is undefined', () => {
    const out = reorderNavSet(nav);
    expect(out.main.map((i) => i.label)).toEqual([
      'Overview', 'Search', 'Memory', 'Canvas', 'Feed',
    ]);
    expect(out.tools.map((i) => i.label)).toEqual([
      'Schedule', 'Pulse', 'Sessions', 'Plugins', 'Vector Playground', 'Compare', 'Evolution',
    ]);
  });

  it('returns identity when config orders are empty', () => {
    const out = reorderNavSet(nav, { mainOrder: [], toolsOrder: [] });
    expect(out.main.map((i) => i.label)).toEqual([
      'Overview', 'Search', 'Memory', 'Canvas', 'Feed',
    ]);
    expect(out.tools.map((i) => i.label)).toEqual([
      'Schedule', 'Pulse', 'Sessions', 'Plugins', 'Vector Playground', 'Compare', 'Evolution',
    ]);
  });

  it('applies partial config: declared-first, rest preserves original order', () => {
    const out = reorderNavSet(nav, { mainOrder: ['Feed', 'Memory'] });
    expect(out.main.map((i) => i.label)).toEqual([
      'Feed', 'Memory', 'Overview', 'Search', 'Canvas',
    ]);
    // tools untouched
    expect(out.tools.map((i) => i.label)).toEqual([
      'Schedule', 'Pulse', 'Sessions', 'Plugins', 'Vector Playground', 'Compare', 'Evolution',
    ]);
  });

  it('ignores unknown labels in config', () => {
    const out = reorderNavSet(nav, { mainOrder: ['Nope', 'Feed', 'Phantom'] });
    expect(out.main.map((i) => i.label)).toEqual([
      'Feed', 'Overview', 'Search', 'Memory', 'Canvas',
    ]);
  });

  it('reorders main and tools independently', () => {
    const out = reorderNavSet(nav, {
      mainOrder: ['Canvas'],
      toolsOrder: ['Vector Playground', 'Compare'],
    });
    expect(out.main.map((i) => i.label)).toEqual([
      'Canvas', 'Overview', 'Search', 'Memory', 'Feed',
    ]);
    expect(out.tools.map((i) => i.label)).toEqual([
      'Vector Playground', 'Compare', 'Schedule', 'Pulse', 'Sessions', 'Plugins', 'Evolution',
    ]);
  });

  it('is case sensitive on label match', () => {
    const out = reorderNavSet(nav, { mainOrder: ['feed', 'MEMORY'] });
    expect(out.main.map((i) => i.label)).toEqual([
      'Overview', 'Search', 'Memory', 'Canvas', 'Feed',
    ]);
  });

  it('dedupes repeated labels in config (first occurrence wins)', () => {
    const out = reorderNavSet(nav, { mainOrder: ['Feed', 'Feed', 'Memory'] });
    expect(out.main.map((i) => i.label)).toEqual([
      'Feed', 'Memory', 'Overview', 'Search', 'Canvas',
    ]);
  });
});
