import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import PunchPage from './pages/PunchPage';
import EmployeesPage from './pages/EmployeesPage';
import ShiftsPage from './pages/ShiftsPage';
import CorrectionsPage from './pages/CorrectionsPage';
import PayrollPage from './pages/PayrollPage';
import HolidaysPage from './pages/HolidaysPage';
import AuditLogPage from './pages/AuditLogPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/punch" element={<PunchPage />} />
        <Route path="/corrections" element={<CorrectionsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/shifts" element={<ShiftsPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
      </Route>
    </Routes>
  );
}
