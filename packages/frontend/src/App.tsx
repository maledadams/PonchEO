import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PunchPage from './pages/PunchPage';
import EmployeesPage from './pages/EmployeesPage';
import ShiftsPage from './pages/ShiftsPage';
import CorrectionsPage from './pages/CorrectionsPage';
import PayrollPage from './pages/PayrollPage';
import HolidaysPage from './pages/HolidaysPage';
import AuditLogPage from './pages/AuditLogPage';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/punch" element={<PunchPage />} />
        <Route path="/corrections" element={<CorrectionsPage />} />

        {/* Supervisor-only routes */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute requireRole="SUPERVISOR">
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shifts"
          element={
            <ProtectedRoute requireRole="SUPERVISOR">
              <ShiftsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute requireRole="SUPERVISOR">
              <PayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/holidays"
          element={
            <ProtectedRoute requireRole="SUPERVISOR">
              <HolidaysPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute requireRole="SUPERVISOR">
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
