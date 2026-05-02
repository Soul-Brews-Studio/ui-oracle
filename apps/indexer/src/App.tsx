import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Indexer from './pages/Indexer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Indexer />} />
        <Route path="*" element={<Indexer />} />
      </Routes>
    </BrowserRouter>
  );
}
