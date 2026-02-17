import { useState, useEffect } from 'react';
import api from '../api/client';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/audit-logs');
        setLogs(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <span className="loading loading-spinner loading-lg"></span>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Registro de Auditoría</h1>

      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Usuario ID</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>ID Entidad</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('es-DO')}
                </td>
                <td>{log.userId}</td>
                <td>
                  <span
                    className={`badge badge-sm ${
                      log.action === 'CREATE'
                        ? 'badge-success'
                        : log.action === 'UPDATE'
                          ? 'badge-warning'
                          : 'badge-error'
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td>{log.entityType}</td>
                <td>{log.entityId}</td>
                <td>
                  <details className="collapse">
                    <summary className="cursor-pointer text-xs text-primary">Ver JSON</summary>
                    <pre className="text-xs bg-base-200 p-2 rounded mt-1 max-w-md overflow-auto">
                      {JSON.stringify(log.newValues || log.oldValues, null, 2)}
                    </pre>
                  </details>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center opacity-50">
                  No hay registros de auditoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
