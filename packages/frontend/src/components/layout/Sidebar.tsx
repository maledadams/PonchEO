import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = {
  all: [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/punch', label: 'Ponchar', icon: '⏱️' },
    { path: '/corrections', label: 'Correcciones', icon: '✏️' },
  ],
  supervisor: [
    { path: '/employees', label: 'Empleados', icon: '👥' },
    { path: '/shifts', label: 'Turnos', icon: '📅' },
    { path: '/payroll', label: 'Nómina', icon: '💰' },
    { path: '/holidays', label: 'Feriados', icon: '🎉' },
    { path: '/audit', label: 'Auditoría', icon: '📋' },
  ],
};

export default function Sidebar() {
  const { user, logout, isSupervisor } = useAuth();
  const location = useLocation();

  const items = [...navItems.all, ...(isSupervisor ? navItems.supervisor : [])];

  return (
    <div className="w-64 bg-base-200 min-h-screen flex flex-col">
      <div className="p-4 border-b border-base-300">
        <h1 className="text-xl font-bold">PonchEO</h1>
        <p className="text-sm opacity-70">Sistema de Asistencia</p>
      </div>

      <nav className="flex-1 p-2">
        <ul className="menu">
          {items.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-base-300">
        <div className="text-sm">
          <p className="font-medium">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="opacity-70">{user?.role === 'SUPERVISOR' ? 'Supervisor' : 'Empleado'}</p>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm mt-2 w-full">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
