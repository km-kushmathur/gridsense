import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import { SkeletonCard } from './components/SkeletonCard';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Simulator = lazy(() => import('./pages/Simulator'));

function PageFallback() {
  return (
    <div className="page-shell" aria-label="Loading page">
      <div className="grid gap-6">
        <SkeletonCard className="h-12 w-64 rounded-2xl" />
        <SkeletonCard className="h-8 w-96 rounded-2xl" />
        <SkeletonCard className="h-[300px] rounded-[28px]" />
        <SkeletonCard className="h-[200px] rounded-[28px]" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Onboarding />} />
        <Route path="/city/:cityName" element={<Dashboard />} />
        <Route path="/city/:cityName/simulate" element={<Simulator />} />
      </Routes>
    </Suspense>
  );
}
