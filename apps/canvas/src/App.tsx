import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasePathProvider, BuildFooter } from '@ui-oracle/shared-ui';
import CanvasHost from './pages/CanvasHost';
import { Header } from './components/Header';

export function CanvasRoutes() {
  return (
    <Routes>
      <Route index element={<CanvasHost />} />
      <Route path="*" element={<CanvasHost />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BasePathProvider value="">
        <Header />
        <CanvasRoutes />
        <BuildFooter />
      </BasePathProvider>
    </BrowserRouter>
  );
}
