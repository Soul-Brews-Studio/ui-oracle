import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CanvasHost from './pages/CanvasHost';
import { Header } from './components/Header';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<CanvasHost />} />
        <Route path="*" element={<CanvasHost />} />
      </Routes>
    </BrowserRouter>
  );
}
