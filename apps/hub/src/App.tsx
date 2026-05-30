import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Hub } from './pages/Hub'
import { EmbedView } from './pages/EmbedView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/a/:id" element={<EmbedView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
