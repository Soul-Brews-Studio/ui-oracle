import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasePathProvider, BuildFooter } from '@ui-oracle/shared-ui';
import Playground from './pages/Playground';
import Compare from './pages/Compare';
import { Header } from './components/Header';
import { BackendGate } from './components/BackendGate';

/**
 * Named routes fragment for combinable mode (no <BrowserRouter>, no <Header/>).
 * Routes are relativized so this can nest under <Route path="/vector/*"> in
 * apps/all, and under root when mounted standalone.
 */
export function VectorRoutes() {
  return (
    <BackendGate>
      {({ backendLive }) => (
        <Routes>
          <Route path="compare" element={<Compare />} />
          <Route index element={<Playground backendLive={backendLive} />} />
          <Route path="*" element={<Playground backendLive={backendLive} />} />
        </Routes>
      )}
    </BackendGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BasePathProvider value="">
        <Header />
        <VectorRoutes />
        <BuildFooter />
      </BasePathProvider>
    </BrowserRouter>
  );
}
