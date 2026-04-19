import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Feed } from './pages/Feed';
import { DocRedirect } from './pages/DocRedirect';
import { Header } from './components/Header';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/doc/:id" element={<DocRedirect />} />
        <Route path="*" element={<Feed />} />
      </Routes>
    </BrowserRouter>
  );
}
