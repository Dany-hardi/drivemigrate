import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Connect from './pages/Connect.jsx';
import Select from './pages/Select.jsx';
import Progress from './pages/Progress.jsx';
import Done from './pages/Done.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/select" element={<Select />} />
      <Route path="/progress/:jobId" element={<Progress />} />
      <Route path="/done/:jobId" element={<Done />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
