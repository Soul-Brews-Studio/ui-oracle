import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BasePathProvider, BuildFooter } from '@ui-oracle/shared-ui';
import Schedule from './pages/Schedule';
import { Header } from './components/Header';

export function ScheduleRoutes() {
  return (
    <Routes>
      <Route index element={<Schedule />} />
      <Route path="*" element={<Schedule />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BasePathProvider value="">
        <Header />
        <ScheduleRoutes />
        <BuildFooter />
      </BasePathProvider>
    </BrowserRouter>
  );
}
