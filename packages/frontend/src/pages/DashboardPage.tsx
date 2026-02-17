import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupervisorDashboard, getEmployeeDashboard } from '../api/dashboard.api';

export default function DashboardPage() {
  const { user, isSupervisor } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = isSupervisor
          ? await getSupervisorDashboard()
          : await getEmployeeDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isSupervisor]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Bienvenido, {user?.firstName} {user?.lastName}
      </h1>

      {isSupervisor ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Ponches Abiertos</div>
            <div className="stat-value text-warning">{stats?.openPunches || 0}</div>
            <div className="stat-desc">Empleados actualmente fichados</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Correcciones Pendientes</div>
            <div className="stat-value text-error">{stats?.pendingCorrections || 0}</div>
            <div className="stat-desc">Requieren aprobación</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Auto-Cerrados Hoy</div>
            <div className="stat-value text-info">{stats?.autoClosedToday || 0}</div>
            <div className="stat-desc">Cerrados automáticamente</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Empleados Activos</div>
            <div className="stat-value">{stats?.activeEmployees || 0}</div>
            <div className="stat-desc">En el sistema</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Estado de Hoy</div>
            <div className="stat-value text-lg">
              {stats?.todayStatus === 'OPEN'
                ? 'Fichado'
                : stats?.todayStatus === 'CLOSED'
                  ? 'Completado'
                  : 'Sin Fichar'}
            </div>
            <div className="stat-desc">
              {stats?.todayClockIn
                ? `Entrada: ${new Date(stats.todayClockIn).toLocaleTimeString('es-DO')}`
                : 'No has fichado hoy'}
            </div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Horas Esta Semana</div>
            <div className="stat-value">{stats?.weekWorkedHours || 0}h</div>
            <div className="stat-desc">De 44h semanales</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Correcciones Pendientes</div>
            <div className="stat-value">{stats?.pendingCorrections || 0}</div>
            <div className="stat-desc">En espera de aprobación</div>
          </div>
        </div>
      )}
    </div>
  );
}
