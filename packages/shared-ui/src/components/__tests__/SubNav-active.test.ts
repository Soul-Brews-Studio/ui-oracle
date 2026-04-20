import { describe, it, expect } from 'bun:test';
import { isSubNavItemActive } from '../SubNav-active';

describe('isSubNavItemActive', () => {
  it('matches plain pathname when item has no query', () => {
    expect(isSubNavItemActive('/pulse', '/pulse', '')).toBe(true);
    expect(isSubNavItemActive('/pulse', '/pulse', '?unused=1')).toBe(true);
  });

  it('rejects when pathname differs', () => {
    expect(isSubNavItemActive('/pulse', '/compare', '')).toBe(false);
    expect(isSubNavItemActive('/?plugin=map', '/other', '?plugin=map')).toBe(false);
  });

  it('matches query-scoped item when current search has the same param', () => {
    expect(isSubNavItemActive('/?plugin=map', '/', '?plugin=map')).toBe(true);
  });

  it('rejects query-scoped item when current param value differs', () => {
    expect(isSubNavItemActive('/?plugin=map', '/', '?plugin=graph')).toBe(false);
  });

  it('rejects query-scoped item when current search lacks the param', () => {
    expect(isSubNavItemActive('/?plugin=map', '/', '')).toBe(false);
  });

  it('requires every item param to match (subset semantics)', () => {
    expect(isSubNavItemActive('/?plugin=map&mode=edit', '/', '?plugin=map&mode=edit&extra=1')).toBe(true);
    expect(isSubNavItemActive('/?plugin=map&mode=edit', '/', '?plugin=map')).toBe(false);
  });
});
