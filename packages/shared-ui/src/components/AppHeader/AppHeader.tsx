import type { ReactNode } from 'react';
import { hostLabel, isStudioHost, isVectorHost } from '../../host';
import { Brand } from './Brand';
import { VersionChip } from './VersionChip';
import { BackendChip } from './BackendChip';
import { HostPicker } from './HostPicker';
import { MainNav } from './MainNav';
import { ToolsDropdown } from './ToolsDropdown';
import { useBackendVersion, useMenu } from './use-menu';
import type { CrossOriginResolver, NavItem, NavSet } from './nav-types';

const DEFAULT_NAV: NavSet = {
  main: [
    { path: '/', label: 'Overview', studio: 'studio.buildwithoracle.com' },
    { path: '/search', label: 'Search', studio: 'studio.buildwithoracle.com' },
    { path: '/feed', label: 'Feed', studio: 'feed.buildwithoracle.com' },
    { path: '/map', label: 'Memory' },
    { path: '/forum', label: 'Forum' },
    { path: '/activity?tab=searches', label: 'Activity' },
    { path: '/traces', label: 'Traces' },
    {
      path: '/',
      label: 'Canvas',
      studio: 'canvas.buildwithoracle.com',
      children: [
        { path: '/', label: 'Map', studio: 'canvas.buildwithoracle.com', query: { plugin: 'map' } },
        { path: '/', label: 'Planets', studio: 'canvas.buildwithoracle.com', query: { plugin: 'planets' } },
        { path: '/', label: 'Wave', studio: 'canvas.buildwithoracle.com', query: { plugin: 'wave' } },
        { path: '/', label: 'Cube', studio: 'canvas.buildwithoracle.com', query: { plugin: 'cube' } },
        { path: '/', label: 'Torus', studio: 'canvas.buildwithoracle.com', query: { plugin: 'torus' } },
        { path: '/', label: 'Galaxy', studio: 'canvas.buildwithoracle.com', query: { plugin: 'galaxy' } },
        { path: '/', label: 'Solar', studio: 'canvas.buildwithoracle.com', query: { plugin: 'solar' } },
        { path: '/', label: 'Graph 3D', studio: 'canvas.buildwithoracle.com', query: { plugin: 'graph3d' } },
        { path: '/', label: 'Map 3D', studio: 'canvas.buildwithoracle.com', query: { plugin: 'map3d' } },
      ],
    },
  ],
  tools: [
    { path: '/schedule', label: 'Schedule', studio: 'schedule.buildwithoracle.com' },
    { path: '/pulse', label: 'Pulse' },
    { path: '/sessions', label: 'Sessions' },
    { path: '/plugins', label: 'Plugins' },
    { path: '/', label: 'Vector Playground', studio: 'vector.buildwithoracle.com' },
    { path: '/compare', label: 'Compare' },
    { path: '/evolution', label: 'Evolution' },
  ],
};

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

function appendQuery(base: string, query: Record<string, string> | undefined): string {
  if (!query) return base;
  const entries = Object.entries(query);
  if (entries.length === 0) return base;
  const sep = base.includes('?') ? '&' : '?';
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${base}${sep}${qs}`;
}

interface AppHeaderProps {
  /** Brand text — default "ARRA 🔮Racle". */
  brandLabel?: ReactNode;
  /** Backend reachability probe for the live/demo chip. */
  ping: () => Promise<boolean>;
  /** Extra content rendered on the top-row right side (e.g. session stats, logout). */
  topRowExtras?: ReactNode;
  /** Fallback nav used until /api/menu responds. Defaults to the standard Oracle menu. */
  fallbackNav?: NavSet;
  /** Override cross-origin logic. Default: vector.* → studio.* for non-playground paths. */
  crossOriginHref?: CrossOriginResolver;
  /** Hide the "Tools ▾" dropdown. */
  hideToolsDropdown?: boolean;
}

function defaultCrossOriginHref(item: NavItem): string | null {
  const currentHost = hostLabel().replace(' (default)', '');
  if (item.studio) {
    // `studio` field means "separate app on its own subdomain" — land at
    // root of that subdomain. `query` merges additional params for deep-links
    // (e.g. canvas plugin=map).
    const base = `https://${item.studio}/?host=${encodeURIComponent(currentHost)}`;
    return appendQuery(base, item.query);
  }
  if (isVectorHost()) {
    const clean = item.path.split('?')[0];
    const isPlayground = clean === '/' || clean === '/playground';
    if (!isPlayground) {
      return `${STUDIO_ORIGIN}${item.path}?host=${encodeURIComponent(currentHost)}`;
    }
    return null;
  }
  // Any other non-studio subdomain (canvas, feed, schedule, …): local items
  // don't exist here — bounce them to studio.
  if (!isStudioHost()) {
    return `${STUDIO_ORIGIN}${item.path}?host=${encodeURIComponent(currentHost)}`;
  }
  return null;
}

/**
 * Default composed header: Brand + VersionChip + HostPicker + BackendChip,
 * then a MainNav row with optional ToolsDropdown. Apps can still compose their
 * own header out of the primitives if they need something bespoke.
 */
export function AppHeader({
  brandLabel,
  ping,
  topRowExtras,
  fallbackNav = DEFAULT_NAV,
  crossOriginHref = defaultCrossOriginHref,
  hideToolsDropdown = false,
}: AppHeaderProps) {
  const { nav, loaded } = useMenu(fallbackNav);
  const backendVersion = useBackendVersion();

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 15, 0.7)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-px opacity-60 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, transparent 0%, rgba(125,180,255,0.25) 20%, rgba(180,125,255,0.30) 50%, rgba(125,255,220,0.25) 80%, transparent 100%)',
        }}
      />
      <div className="flex justify-between items-center gap-4 px-6 py-3 max-w-[1400px] mx-auto">
        <Brand label={brandLabel}>
          <VersionChip backendVersion={backendVersion} />
        </Brand>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <HostPicker />
          <BackendChip ping={ping} />
          {topRowExtras}
        </div>
      </div>

      <nav
        className={`flex items-center gap-1 px-6 pb-3 flex-wrap max-w-[1400px] mx-auto transition-opacity duration-150 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <MainNav items={nav.main} crossOriginHref={crossOriginHref} />
        {!hideToolsDropdown && nav.tools.length > 0 && (
          <>
            <span className="w-px h-4 bg-border mx-2" />
            <ToolsDropdown items={nav.tools} crossOriginHref={crossOriginHref} />
          </>
        )}
      </nav>
    </header>
  );
}

export { defaultCrossOriginHref };
