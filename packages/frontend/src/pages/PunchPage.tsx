import { useState, useEffect } from 'react';
import { clockIn, clockOut, getPunches } from '../api/punches.api';
import { useAuth } from '../context/AuthContext';

export default function PunchPage() {
  const { user } = useAuth();
  const [punches, setPunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPunches = async () => {
    try {
      const data = await getPunches({ employeeId: user!.id });
      setPunches(data);
    } catch (err) {
      console.error('Failed to load punches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPunches();
  }, []);

  const handleClockIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await clockIn();
      setMessage({ type: 'success', text: 'Entrada registrada exitosamente' });
      fetchPunches();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Error al registrar entrada',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await clockOut();
      setMessage({ type: 'success', text: 'Salida registrada exitosamente' });
      fetchPunches();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Error al registrar salida',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const hasOpenPunch = punches.some((p) => p.status === 'OPEN');

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-DO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ponchar</h1>

      {/* Clock In / Clock Out Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleClockIn}
          className="btn btn-success btn-lg"
          disabled={actionLoading || hasOpenPunch}
        >
          {actionLoading ? <span className="loading loading-spinner"></span> : 'Entrada'}
        </button>
        <button
          onClick={handleClockOut}
          className="btn btn-error btn-lg"
          disabled={actionLoading || !hasOpenPunch}
        >
          {actionLoading ? <span className="loading loading-spinner"></span> : 'Salida'}
        </button>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Punch History */}
      <h2 className="text-lg font-semibold mb-3">Historial de Ponches</h2>
      {loading ? (
        <span className="loading loading-spinner"></span>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Tardanza</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {punches.map((punch) => (
                <tr key={punch.id}>
                  <td>{formatDate(punch.clockIn)}</td>
                  <td>{formatTime(punch.clockIn)}</td>
                  <td>{formatTime(punch.clockOut)}</td>
                  <td>
                    {punch.workedMinutes != null
                      ? `${Math.floor(punch.workedMinutes / 60)}h ${punch.workedMinutes % 60}m`
                      : '-'}
                  </td>
                  <td>
                    {punch.tardinessMinutes > 0 ? (
                      <span className="text-warning">{punch.tardinessMinutes} min</span>
                    ) : (
                      <span className="text-success">OK</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        punch.status === 'OPEN'
                          ? 'badge-warning'
                          : punch.status === 'CLOSED'
                            ? 'badge-success'
                            : punch.status === 'AUTO_CLOSED'
                              ? 'badge-info'
                              : 'badge-secondary'
                      }`}
                    >
                      {punch.status}
                    </span>
                  </td>
                </tr>
              ))}
              {punches.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center opacity-50">
                    No hay ponches registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
