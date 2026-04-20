import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Forum } from './pages/Forum';
import { Header } from './components/Header';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Forum />} />
        <Route path="*" element={<Forum />} />
      </Routes>
    </BrowserRouter>
  );
}
