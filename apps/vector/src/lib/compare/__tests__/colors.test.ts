import { describe, expect, test } from 'bun:test';
import { colorForDocId, cssVarForDocId } from '../colors';

describe('colorForDocId', () => {
  test('is deterministic — same id → same color', () => {
    expect(colorForDocId('abc')).toBe(colorForDocId('abc'));
    expect(colorForDocId('oracle-42')).toBe(colorForDocId('oracle-42'));
  });
  test('returns 7-char hex (#rrggbb)', () => {
    const c = colorForDocId('anything');
    expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
  test('distributes across hues — 10 random ids yield ≥3 distinct colors', () => {
    const ids = [
      'doc-1',
      'doc-2',
      'principle-nothing-deleted',
      'learning-42',
      'retro-2026-04-19',
      'a',
      'b',
      'xyzzy',
      'the-mirror',
      'form-and-formless',
    ];
    const colors = new Set(ids.map(colorForDocId));
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });
});

describe('cssVarForDocId', () => {
  test('is deterministic and starts with --doc-color-', () => {
    const v = cssVarForDocId('abc');
    expect(v).toBe(cssVarForDocId('abc'));
    expect(v.startsWith('--doc-color-')).toBe(true);
  });
  test('differs for different ids (most of the time)', () => {
    expect(cssVarForDocId('abc')).not.toBe(cssVarForDocId('xyz'));
  });
});
