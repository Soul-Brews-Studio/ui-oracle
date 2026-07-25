import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Pulse from './pages/Pulse';
import { Header } from './components/Header';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Pulse />} />
        <Route path="*" element={<Pulse />} />
      </Routes>
    </BrowserRouter>
  );
}
