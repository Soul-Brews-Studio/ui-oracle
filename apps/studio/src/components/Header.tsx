import { useEffect, useState } from 'react';
import { AppHeader, AppLink as Link } from '@ui-oracle/shared-ui';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE, ping } from '../api/oracle';
import menuConfig from '../../menu.json';

/** Studio-specific extras: session duration, search/learning counters, settings link, logout. */
function StudioExtras() {
  const { isAuthenticated, authEnabled, logout } = useAuth();
  const [stats, setStats] = useState({ searches: 0, learnings: 0 });
  const [sessionStart] = useState(() => {
    const stored = localStorage.getItem('oracle_session_start');
    if (stored) return parseInt(stored);
    const now = Date.now();
    localStorage.setItem('oracle_session_start', String(now));
    return now;
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/session/stats?since=${sessionStart}`);
        if (res.ok) {
          const data = await res.json();
          setStats({ searches: data.searches, learnings: data.learnings });
        }
      } catch {
        // Ignore — counters just stay at 0.
      }
    };
    loadStats();
    const id = setInterval(loadStats, 30000);
    return () => clearInterval(id);
  }, [sessionStart]);

  const mins = Math.floor((Date.now() - sessionStart) / 60000);
  const duration = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;

  return (
    <>
      <span className="text-text-muted">{duration}</span>
      <span className="text-text-muted">{stats.searches}s</span>
      <span className="text-text-muted">{stats.learnings}l</span>
      <span className="w-px h-3 bg-border mx-1" />
      <Link
        to="/settings"
        className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-bg-card transition-all duration-150"
        title="Settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </Link>
      {authEnabled && isAuthenticated && (
        <button
          onClick={logout}
          className="p-1.5 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 bg-transparent border-none cursor-pointer transition-all duration-150"
          title="Sign out"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      )}
    </>
  );
}

/**
 * Studio bundle header — composes the shared AppHeader with studio-specific
 * extras (session stats, settings, auth logout). Cross-origin routing
 * (including the studio→vector bounce for playground/compare) lives in the
 * unified resolver in shared-ui.
 */
export function Header() {
  return (
    <AppHeader
      ping={ping}
      topRowExtras={<StudioExtras />}
      menuConfig={menuConfig}
    />
  );
}
