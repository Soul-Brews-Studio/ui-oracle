import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasePathProvider } from '@ui-oracle/shared-ui';
import { Feed } from './pages/Feed';
import { DocRedirect } from './pages/DocRedirect';
import { Header } from './components/Header';

export function FeedRoutes() {
  return (
    <Routes>
      <Route index element={<Feed />} />
      <Route path="doc/:id" element={<DocRedirect />} />
      <Route path="*" element={<Feed />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BasePathProvider value="">
        <Header />
        <FeedRoutes />
      </BasePathProvider>
    </BrowserRouter>
  );
}
