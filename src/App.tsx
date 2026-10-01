import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Layout } from './components/common/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { SchedulePage } from './pages/SchedulePage';
import { GraphPage } from './pages/GraphPage';
import { TasksPage } from './pages/TasksPage';
import { ReportPage } from './pages/ReportPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 3D Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Radar App Layout & Subpages */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="report" element={<ReportPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
