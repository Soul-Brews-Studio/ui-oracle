import { describe, expect, test } from 'bun:test';
import type { Document } from '../../../api/oracle';
import {
  avgRankShift,
  sharedIds,
  topKAgreement,
  topKJaccard,
  uniqueIds,
} from '../aggregate';

const d = (id: string): Document => ({
  id,
  type: 'principle',
  content: '',
  source_file: '',
  concepts: [],
});

describe('topKAgreement', () => {
  test('empty input → 0', () => {
    expect(topKAgreement({})).toBe(0);
  });
  test('single model → 1 (trivial majority)', () => {
    expect(topKAgreement({ m1: [d('a'), d('b')] })).toBe(1);
  });
  test('all models share rank-1 id', () => {
    expect(
      topKAgreement({ m1: [d('a'), d('b')], m2: [d('a'), d('c')], m3: [d('a')] }),
    ).toBe(1);
  });
  test('split plurality at k=1', () => {
    expect(topKAgreement({ m1: [d('a')], m2: [d('b')] })).toBe(0.5);
  });
  test('k=3 ignores models with <3 results', () => {
    expect(
      topKAgreement(
        { m1: [d('a'), d('b'), d('c')], m2: [d('x'), d('y'), d('c')], m3: [d('a')] },
        3,
      ),
    ).toBe(1);
  });
});

describe('topKJaccard', () => {
  test('empty → 0', () => {
    expect(topKJaccard({})).toBe(0);
  });
  test('single model with results → 1', () => {
    expect(topKJaccard({ m1: [d('a'), d('b')] })).toBe(1);
  });
  test('identical top-5 → 1', () => {
    const docs = [d('a'), d('b'), d('c'), d('d'), d('e')];
    expect(topKJaccard({ m1: docs, m2: docs })).toBe(1);
  });
  test('disjoint → 0', () => {
    expect(topKJaccard({ m1: [d('a'), d('b')], m2: [d('c'), d('d')] })).toBe(0);
  });
  test('partial overlap', () => {
    // top-5: {a,b,c} ∩ {b,c,d} = {b,c} = 2; ∪ = {a,b,c,d} = 4 → 0.5
    expect(
      topKJaccard({ m1: [d('a'), d('b'), d('c')], m2: [d('b'), d('c'), d('d')] }),
    ).toBe(0.5);
  });
  test('respects k parameter', () => {
    // k=1: {a} ∩ {b} = 0
    expect(topKJaccard({ m1: [d('a'), d('b')], m2: [d('b'), d('a')] }, 1)).toBe(0);
  });
});

describe('avgRankShift', () => {
  test('empty → 0', () => {
    expect(avgRankShift({})).toBe(0);
  });
  test('no shared ids → 0', () => {
    expect(avgRankShift({ m1: [d('a')], m2: [d('b')] })).toBe(0);
  });
  test('identical order → 0', () => {
    const docs = [d('a'), d('b'), d('c')];
    expect(avgRankShift({ m1: docs, m2: docs })).toBe(0);
  });
  test('reversed order of two shared ids', () => {
    // a: ranks [1, 2] shift=1; b: ranks [2, 1] shift=1 → mean 1
    expect(avgRankShift({ m1: [d('a'), d('b')], m2: [d('b'), d('a')] })).toBe(1);
  });
  test('mix: unique ids ignored', () => {
    // shared: a [1,1]→0, b [2,3]→1 ; c only in m1 → ignored
    expect(
      avgRankShift({ m1: [d('a'), d('b'), d('c')], m2: [d('a'), d('x'), d('b')] }),
    ).toBe(0.5);
  });
});

describe('sharedIds', () => {
  test('empty', () => {
    expect(sharedIds({}).size).toBe(0);
  });
  test('single column — nothing shared', () => {
    expect(sharedIds({ m1: [d('a'), d('b')] }).size).toBe(0);
  });
  test('ids in ≥2 columns', () => {
    const s = sharedIds({
      m1: [d('a'), d('b')],
      m2: [d('b'), d('c')],
      m3: [d('c'), d('d')],
    });
    expect([...s].sort()).toEqual(['b', 'c']);
  });
  test('duplicate in same column counts once', () => {
    // 'a' appears twice in m1 only — NOT shared
    expect(sharedIds({ m1: [d('a'), d('a')], m2: [d('b')] }).size).toBe(0);
  });
});

describe('uniqueIds', () => {
  test('unknown model → empty', () => {
    expect(uniqueIds({ m1: [d('a')] }, 'ghost').size).toBe(0);
  });
  test('only-here ids', () => {
    const u = uniqueIds(
      { m1: [d('a'), d('b')], m2: [d('b'), d('c')] },
      'm1',
    );
    expect([...u]).toEqual(['a']);
  });
  test('all shared → empty', () => {
    expect(
      uniqueIds({ m1: [d('a'), d('b')], m2: [d('a'), d('b')] }, 'm1').size,
    ).toBe(0);
  });
});
