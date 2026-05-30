import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasePathProvider } from '@ui-oracle/shared-ui';
import { CombinedHeader } from './CombinedHeader';

import { StudioRoutes } from '../../studio/src/App';
import { VectorRoutes } from '../../vector/src/App';
import { CanvasRoutes } from '../../canvas/src/App';
import { FeedRoutes } from '../../feed/src/App';
import { ForumRoutes } from '../../forum/src/App';
import { ScheduleRoutes } from '../../schedule/src/App';
import { IndexerRoutes } from '../../indexer/src/App';

/**
 * The combined single-origin bundle. ONE <BrowserRouter> hosts every app under
 * its own base path. Each mounted fragment is wrapped in a <BasePathProvider>
 * so its internal links/redirects stay scoped. Apps that wrap their own
 * BackendGate/AuthProvider (studio, vector) keep doing so — we don't double-wrap.
 */
export default function App() {
  return (
    <BrowserRouter>
      <CombinedHeader />
      <Routes>
        {/* Satellites first (most specific) — each shadows any studio stub at the same path. */}
        <Route
          path="/vector/*"
          element={
            <BasePathProvider value="/vector">
              <VectorRoutes />
            </BasePathProvider>
          }
        />
        <Route
          path="/canvas/*"
          element={
            <BasePathProvider value="/canvas">
              <CanvasRoutes />
            </BasePathProvider>
          }
        />
        <Route
          path="/feed/*"
          element={
            <BasePathProvider value="/feed">
              <FeedRoutes />
            </BasePathProvider>
          }
        />
        <Route
          path="/forum/*"
          element={
            <BasePathProvider value="/forum">
              <ForumRoutes />
            </BasePathProvider>
          }
        />
        <Route
          path="/schedule/*"
          element={
            <BasePathProvider value="/schedule">
              <ScheduleRoutes />
            </BasePathProvider>
          }
        />
        <Route
          path="/indexer/*"
          element={
            <BasePathProvider value="/indexer">
              <IndexerRoutes />
            </BasePathProvider>
          }
        />
        {/* Studio mounted at the ROOT catch-all — its index route serves "/". */}
        <Route
          path="/*"
          element={
            <BasePathProvider value="">
              <StudioRoutes />
            </BasePathProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
