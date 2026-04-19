import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Playground from './pages/Playground';
import Compare from './pages/Compare';
import { Header } from './components/Header';
import { VectorSubNav } from './components/VectorSubNav';
import { BackendGate } from './components/BackendGate';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <VectorSubNav />
      <BackendGate>
        {({ backendLive }) => (
          <Routes>
            <Route path="/compare" element={<Compare />} />
            <Route path="/" element={<Playground backendLive={backendLive} />} />
            <Route path="*" element={<Playground backendLive={backendLive} />} />
          </Routes>
        )}
      </BackendGate>
    </BrowserRouter>
  );
}
