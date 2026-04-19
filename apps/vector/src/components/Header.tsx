import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiUrl, hostLabel, isDefault, setStoredHost, clearStoredHost } from '../api/host';
import { ping } from '../api/oracle';

type NavItem = { path: string; label: string; studio?: string };

const FALLBACK_NAV: NavItem[] = [
  { path: '/', label: 'Overview' },
  { path: '/feed', label: 'Feed' },
  { path: '/map', label: 'Memory' },
  { path: '/search', label: 'Search' },
  { path: '/forum', label: 'Forum' },
  { path: '/pulse', label: 'Pulse' },
  { path: '/sessions', label: 'Sessions' },
  { path: '/plugins', label: 'Plugins' },
  { path: '/activity?tab=searches', label: 'Activity' },
];

const FALLBACK_TOOLS: NavItem[] = [
  { path: '/playground', label: 'Playground' },
  { path: '/compare', label: 'Compare' },
  { path: '/evolution', label: 'Evolution' },
  { path: '/traces', label: 'Traces' },
  { path: '/schedule', label: 'Schedule' },
];

const CACHE_KEY = 'vector_oracle_studio_menu_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

type NavSet = { main: NavItem[]; tools: NavItem[] };

type MenuApiItem = {
  path: string;
  label: string;
  group?: string;
  order?: number;
  studio?: string;
};

type BackendStatus = 'checking' | 'live' | 'demo';

/** True when the current page is served from a vector.* hostname. */
export function isVectorHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.includes('vector.');
}

/** Paths that stay on vector.* instead of jumping cross-origin to studio.* */
function isPlaygroundPath(path: string): boolean {
  const clean = path.split('?')[0];
  return clean === '/' || clean === '/playground';
}

function readCachedNav(): NavSet | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.nav as NavSet;
  } catch {
    return null;
  }
}

function writeCachedNav(nav: NavSet): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), nav }));
  } catch {}
}

export function Header() {
  const location = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [nav, setNav] = useState<NavSet>(() => readCachedNav() ?? { main: FALLBACK_NAV, tools: FALLBACK_TOOLS });

  // Backend status chip — soft-mode polling (matches BackendGate cadence).
  useEffect(() => {
    let cancelled = false;
    const check = () => ping().then((ok) => { if (!cancelled) setBackendStatus(ok ? 'live' : 'demo'); });
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Backend version (ui version + api version label).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/health'));
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && typeof data.version === 'string') setBackendVersion(data.version);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Dynamic menu from backend (/api/menu) with localStorage cache + fallback.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/menu'));
        if (!res.ok) return;
        const data = await res.json();
        const items: MenuApiItem[] = Array.isArray(data?.items) ? data.items : [];
        if (cancelled || items.length === 0) return;
        const main: Array<NavItem & { order: number }> = [];
        const tools: Array<NavItem & { order: number }> = [];
        for (const item of items) {
          if (!item || typeof item.path !== 'string' || typeof item.label !== 'string') continue;
          const bucket = item.group === 'tools' ? tools : item.group === 'main' ? main : null;
          if (!bucket) continue;
          const entry: NavItem & { order: number } = {
            path: item.path,
            label: item.label,
            order: typeof item.order === 'number' ? item.order : 999,
          };
          if (typeof item.studio === 'string' && item.studio) entry.studio = item.studio;
          bucket.push(entry);
        }
        const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;
        main.sort(byOrder);
        tools.sort(byOrder);
        const strip = ({ path, label, studio }: NavItem & { order: number }): NavItem =>
          studio ? { path, label, studio } : { path, label };
        const mainItems = main.map(strip);
        const next: NavSet = {
          main: mainItems.some((n) => n.path === '/' && !n.studio)
            ? mainItems
            : [{ path: '/', label: 'Overview' }, ...mainItems],
          tools: tools.map(strip),
        };
        setNav(next);
        writeCachedNav(next);
      } catch {
        // Backend unreachable — keep fallback/cached nav.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const navItems = nav.main;
  const toolsItems = nav.tools;
  const isActive = (path: string) => location.pathname === path.split('?')[0];
  const currentHost = hostLabel().replace(' (default)', '');

  // Cross-origin href, or null if the item should render as an internal Link.
  function crossOriginHref(item: NavItem): string | null {
    if (item.studio) {
      return `https://${item.studio}${item.path}?host=${encodeURIComponent(currentHost)}`;
    }
    if (isVectorHost() && !isPlaygroundPath(item.path)) {
      return `${STUDIO_ORIGIN}${item.path}?host=${encodeURIComponent(currentHost)}`;
    }
    return null;
  }

  const chip = {
    checking: { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', dot: '#94a3b8', text: 'checking…' },
    live:     { bg: 'rgba(74, 222, 128, 0.12)',  border: 'rgba(74, 222, 128, 0.4)',  dot: '#4ade80', text: 'live' },
    demo:     { bg: 'rgba(251, 191, 36, 0.12)',  border: 'rgba(251, 191, 36, 0.4)',  dot: '#fbbf24', text: 'demo mode' },
  }[backendStatus];

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{ background: 'rgba(10, 10, 15, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
    >
      {/* Top row: brand + version + backend chip + host picker */}
      <div className="flex justify-between items-center gap-4 px-4 py-2 max-w-[1400px] mx-auto">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-accent shrink-0 min-w-0">
          <span>ARRA 🔮Racle</span>
          <span
            className="text-[10px] font-medium text-text-muted bg-bg-card px-1.5 py-0.5 rounded"
            title={backendVersion ? `ui ${__APP_VERSION__} · api ${backendVersion}` : `ui ${__APP_VERSION__}`}
          >
            {__APP_VERSION__}
            {backendVersion && <span className="text-text-muted/60"> · </span>}
            {backendVersion && <span className="text-accent/80">{backendVersion}</span>}
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <button
            onClick={() => {
              const next = window.prompt(
                'Oracle host (leave empty to use default localhost:47778):\n\nExamples:\n  localhost:47778\n  http://mba.wg:47778\n  https://oracle.example.com',
                isDefault ? '' : hostLabel().replace(' (default)', '')
              );
              if (next === null) return;
              if (next.trim() === '') clearStoredHost();
              else setStoredHost(next.trim());
              window.location.reload();
            }}
            title={`Click to change host. Currently: ${hostLabel()}`}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all duration-150 ${
              isDefault
                ? 'border-border text-text-muted hover:bg-bg-card'
                : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isDefault ? 'bg-text-muted' : 'bg-accent animate-pulse'}`} />
            <span className="max-w-[220px] truncate">{hostLabel()}</span>
          </button>
          <span
            className="inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-[11px] font-semibold"
            style={{ background: chip.bg, border: `1px solid ${chip.border}`, color: chip.dot }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: chip.dot, boxShadow: `0 0 8px ${chip.dot}` }} />
            {chip.text}
          </span>
        </div>
      </div>

      {/* Nav row: full width, scrollable */}
      <nav className="flex items-center gap-0.5 px-4 pb-2 flex-wrap max-w-[1400px] mx-auto">
        {navItems.map(item => {
          const href = crossOriginHref(item);
          if (href) {
            return (
              <a
                key={`${href}`}
                href={href}
                className="px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent"
              >
                {item.label}
              </a>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
                isActive(item.path)
                  ? 'bg-accent/15 text-accent font-semibold border border-accent/20'
                  : 'text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent'
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        <span className="w-px h-4 bg-border mx-2" />

        {/* Tools dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setToolsOpen(true)}
          onMouseLeave={() => setToolsOpen(false)}
        >
          <button
            type="button"
            className={`px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 bg-transparent border-none cursor-pointer font-[inherit] ${
              toolsItems.some(t => isActive(t.path))
                ? 'bg-bg-card text-accent'
                : 'text-text-secondary hover:bg-bg-card hover:text-accent'
            }`}
          >
            Tools ▾
          </button>
          {toolsOpen && (
            <>
              <div className="absolute top-full left-0 right-0 h-2" />
              <div className="absolute top-[calc(100%+4px)] right-0 bg-bg-card border border-border rounded-xl p-1 min-w-[140px] shadow-lg z-[200]">
                {toolsItems.map(item => {
                  const href = crossOriginHref(item);
                  if (href) {
                    return (
                      <a
                        key={`${href}`}
                        href={href}
                        className="block px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 text-text-secondary hover:bg-white/5 hover:text-accent"
                        onClick={() => setToolsOpen(false)}
                      >
                        {item.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
                        isActive(item.path)
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:bg-white/5 hover:text-accent'
                      }`}
                      onClick={() => setToolsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
