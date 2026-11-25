import { afterEach, describe, expect, test } from 'bun:test';
import type { NavItem } from '../nav-types';

const canvas = { path: '/', label: 'Canvas', group: 'main', studio: 'canvas.buildwithoracle.com' } as unknown as NavItem;
const feed = { path: '/', label: 'Feed', group: 'main', studio: 'feed.buildwithoracle.com' } as unknown as NavItem;
const g = globalThis as { window?: unknown };
const at = (href: string) => {
  const u = new URL(href);
  g.window = { location: { hostname: u.hostname, port: u.port, origin: u.origin, protocol: u.protocol } };
};
afterEach(() => { delete g.window; });
// host.ts reads window.location at import time; load it with a real-looking window
// (another test file may leave a bare `window` stub on globalThis).
at('http://localhost:47944/');
const { externalHost, keepInApp, leavesSelfServedApp } = await import('../external');
delete g.window;

describe('nav items that leave the app', () => {
  test('served by an arra backend: Canvas stays in-app, Feed still opens its own site', () => {
    at('http://localhost:47944/hub');
    const [c, f] = keepInApp([canvas, feed]);
    expect(c.path).toBe('/canvas');
    expect(c.studio).toBeUndefined();
    expect(f.studio).toBe('feed.buildwithoracle.com');
  });
  test('on the public studio domain nothing is rewritten', () => {
    at('https://studio.buildwithoracle.com/');
    expect(keepInApp([canvas])[0]).toBe(canvas);
  });
  test('studio and vector pages are in this bundle; feed, forum and schedule are not', () => {
    expect(leavesSelfServedApp({ studio: 'studio.buildwithoracle.com' })).toBe(false);
    expect(leavesSelfServedApp({ studio: 'vector.buildwithoracle.com' })).toBe(false);
    expect(leavesSelfServedApp({ studio: undefined })).toBe(false);
    expect(leavesSelfServedApp({ studio: 'feed.buildwithoracle.com' })).toBe(true);
    expect(leavesSelfServedApp({ studio: 'schedule.buildwithoracle.com' })).toBe(true);
  });
  test('the tooltip names the host it opens', () => {
    expect(externalHost('https://feed.buildwithoracle.com/?host=x')).toBe('feed.buildwithoracle.com');
  });
});
