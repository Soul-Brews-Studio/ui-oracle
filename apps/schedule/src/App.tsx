import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Schedule from './pages/Schedule';
import { Header } from './components/Header';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Schedule />} />
        <Route path="*" element={<Schedule />} />
      </Routes>
    </BrowserRouter>
  );
}
