import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasePathProvider } from '@ui-oracle/shared-ui';
import Indexer from './pages/Indexer';

export function IndexerRoutes() {
  return (
    <Routes>
      <Route index element={<Indexer />} />
      <Route path="*" element={<Indexer />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BasePathProvider value="">
        <IndexerRoutes />
      </BasePathProvider>
    </BrowserRouter>
  );
}
