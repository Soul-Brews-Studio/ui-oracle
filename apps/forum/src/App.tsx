import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasePathProvider, BuildFooter } from '@ui-oracle/shared-ui';
import { Forum } from './pages/Forum';
import { Header } from './components/Header';

export function ForumRoutes() {
  return (
    <Routes>
      <Route index element={<Forum />} />
      <Route path="*" element={<Forum />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BasePathProvider value="">
        <Header />
        <ForumRoutes />
        <BuildFooter />
      </BasePathProvider>
    </BrowserRouter>
  );
}
