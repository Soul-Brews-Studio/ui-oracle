import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { BasePathProvider, useBase, withBase, BuildFooter } from '@ui-oracle/shared-ui';
import { Header } from './components/Header';

import { Overview } from './pages/Overview';
import { Feed } from './pages/Feed';
import { DocDetail } from './pages/DocDetail';
import { Search } from './pages/Search';
import { Handoff } from './pages/Handoff';
import { Activity } from './pages/Activity';
import { Evolution } from './pages/Evolution';
import { Traces } from './pages/Traces';
import { Superseded } from './pages/Superseded';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { Playground } from './pages/Playground';
import { Compare } from './pages/Compare';
import { CommandPalette } from './components/CommandPalette';
import { BackendGate } from './components/BackendGate';
import { Map } from './pages/Map';
import { Schedule } from './pages/Schedule';
import { Pulse } from './pages/Pulse';
import { Plugins } from './pages/Plugins';
import { Sessions } from './pages/Sessions';
import { Canvas } from './pages/Canvas';
import { Planets } from './pages/Planets';
import { MenuEditor } from './pages/MenuEditor';
import { Debug } from './pages/Debug';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getStats } from './api/oracle';
import { setVaultRepo } from './utils/docDisplay';
import { installUiErrorCapture } from './lib/ui-error-bus';

// Protected route wrapper
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authEnabled, isLoading } = useAuth();
  const location = useLocation();
  const base = useBase();

  if (isLoading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#888' }}>Loading...</div>;
  }

  if (authEnabled && !isAuthenticated) {
    return <Navigate to={withBase(base, '/login')} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ⌘K command palette — shared by standalone and combined mounts.
function CommandPaletteHotkey() {
  const [showCmdK, setShowCmdK] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmdK(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!showCmdK) return null;
  return <CommandPalette onClose={() => setShowCmdK(false)} />;
}

// Standalone-only header: hidden on /login (relative to the active base).
function StandaloneHeader() {
  const location = useLocation();
  const base = useBase();
  const isLoginPage = location.pathname === withBase(base, '/login');
  if (isLoginPage) return null;
  return <Header />;
}

/**
 * StudioRoutes — the named, relativized routes fragment.
 *
 * - No <BrowserRouter>: nested under <Route path="/studio/*"> in combined mode,
 *   or under root standalone.
 * - When `header` is true (standalone), renders the conditional <Header/>
 *   (hidden on /login). apps/all omits it and renders one unified header.
 * - Includes the ⌘K CommandPalette in both modes.
 */
export function StudioRoutes({ header = false }: { header?: boolean }) {
  useEffect(() => {
    installUiErrorCapture(); // app-wide client-error capture for HUGINN (/__debug)
    getStats().then(stats => {
      if (stats.vault_repo) setVaultRepo(stats.vault_repo);
    }).catch(() => {});
  }, []);

  return (
    <Routes>
      {/* HUGINN — secret observability page. No menu entry (URL-only), and
          mounted OUTSIDE BackendGate + AuthProvider so it stays reachable even
          when the backend is down — debugging that is the whole point. */}
      <Route path="__debug" element={<Debug />} />
      <Route path="debug" element={<Debug />} />
      <Route path="*" element={<GatedStudio header={header} />} />
    </Routes>
  );
}

function GatedStudio({ header }: { header: boolean }) {
  return (
    <BackendGate>
      <AuthProvider>
        {header && <StandaloneHeader />}
        <CommandPaletteHotkey />
        <Routes>
          <Route path="login" element={<Login />} />
          <Route index element={<RequireAuth><Overview /></RequireAuth>} />
          <Route path="feed" element={<RequireAuth><Feed /></RequireAuth>} />
          <Route path="doc/:id" element={<RequireAuth><DocDetail /></RequireAuth>} />
          <Route path="search" element={<RequireAuth><Search /></RequireAuth>} />
          <Route path="playground" element={<RequireAuth><Playground /></RequireAuth>} />
          <Route path="compare" element={<RequireAuth><Compare /></RequireAuth>} />
          <Route path="map" element={<RequireAuth><Map /></RequireAuth>} />
          <Route path="graph" element={<GraphRedirect />} />
          <Route path="graph3d" element={<GraphRedirect />} />
          <Route path="handoff" element={<RequireAuth><Handoff /></RequireAuth>} />
          <Route path="activity" element={<RequireAuth><Activity /></RequireAuth>} />
          <Route path="evolution" element={<RequireAuth><Evolution /></RequireAuth>} />
          <Route path="traces" element={<RequireAuth><Traces /></RequireAuth>} />
          <Route path="traces/:id" element={<RequireAuth><Traces /></RequireAuth>} />
          <Route path="superseded" element={<RequireAuth><Superseded /></RequireAuth>} />
          <Route path="pulse" element={<RequireAuth><Pulse /></RequireAuth>} />
          <Route path="sessions" element={<RequireAuth><Sessions /></RequireAuth>} />
          <Route path="sessions/:id" element={<RequireAuth><Sessions /></RequireAuth>} />
          <Route path="canvas" element={<RequireAuth><Canvas /></RequireAuth>} />
          <Route path="planets" element={<RequireAuth><Planets /></RequireAuth>} />
          <Route path="plugins" element={<RequireAuth><Plugins /></RequireAuth>} />
          <Route path="schedule" element={<RequireAuth><Schedule /></RequireAuth>} />
          <Route path="settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="menu" element={<RequireAuth><MenuEditor /></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </BackendGate>
  );
}

// Base-aware redirect for legacy /graph and /graph3d -> /map.
function GraphRedirect() {
  const base = useBase();
  return <Navigate to={withBase(base, '/map')} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <BasePathProvider value="">
        <StudioRoutes header />
        <BuildFooter />
      </BasePathProvider>
    </BrowserRouter>
  );
}
