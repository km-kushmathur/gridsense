import { Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Onboarding />} />
      <Route path="/city/:cityName" element={<Dashboard />} />
      <Route path="/city/:cityName/simulate" element={<Simulator />} />
    </Routes>
  );
}
