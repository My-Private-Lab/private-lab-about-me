import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Utils from './pages/Utils';
import Cron from './pages/Cron';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/utils" element={<Utils />} />
      <Route path="/utils/cron" element={<Cron />} />

      {/* Preserve the original static URLs (and any unknown path). */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/projects.html" element={<Navigate to="/projects" replace />} />
      <Route path="/utils.html" element={<Navigate to="/utils" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
