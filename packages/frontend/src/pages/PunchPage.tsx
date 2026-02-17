import { useState } from 'react';
import { mockPunches } from '../data/mockData';

export default function PunchPage() {
  const [punches] = useState(mockPunches);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClockIn = () => {
    setActionLoading(true);
    setMessage(null);
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Entrada registrada exitosamente' });
      setActionLoading(false);
    }, 500);
  };

  const handleClockOut = () => {
    setActionLoading(true);
    setMessage(null);
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Salida registrada exitosamente' });
      setActionLoading(false);
    }, 500);
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

      <h2 className="text-lg font-semibold mb-3">Historial de Ponches</h2>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {punches.map((punch) => (
              <tr key={punch.id}>
                <td>{formatDate(punch.date)}</td>
                <td>{formatTime(punch.clockInTime)}</td>
                <td>{formatTime(punch.clockOutTime)}</td>
                <td>
                  <span className={`badge ${punch.status === 'OPEN' ? 'badge-warning' : 'badge-success'}`}>
                    {punch.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
