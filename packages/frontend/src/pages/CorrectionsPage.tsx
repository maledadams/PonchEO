import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function CorrectionsPage() {
  const { isSupervisor } = useAuth();
  const [corrections, setCorrections] = useState<any[]>([]);
  const [myPunches, setMyPunches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    punchId: '',
    correctedClockIn: '',
    correctedClockOut: '',
    reason: '',
  });

  const fetchCorrections = async () => {
    try {
      const [{ data: correctionsData }, { data: punchesData }] = await Promise.all([
        api.get('/corrections'),
        isSupervisor ? Promise.resolve({ data: { data: [] } }) : api.get('/punches'),
      ]);
      setCorrections(correctionsData.data);
      if (!isSupervisor) {
        setMyPunches(punchesData.data);
      }
    } catch (err) {
      console.error('Failed to load corrections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const handleApprove = async (id: number) => {
    const comments = prompt('Comentarios (opcional):');
    try {
      await api.post(`/corrections/${id}/approve`, { comments });
      fetchCorrections();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleReject = async (id: number) => {
    const comments = prompt('Razón del rechazo:');
    try {
      await api.post(`/corrections/${id}/reject`, { comments });
      fetchCorrections();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleCreate = async () => {
    if (!form.punchId || !form.correctedClockIn || !form.reason) {
      alert('Completa punch, hora de entrada corregida y razon');
      return;
    }

    setCreating(true);
    try {
      const correctedClockInIso = new Date(form.correctedClockIn).toISOString();
      const correctedClockOutIso = form.correctedClockOut
        ? new Date(form.correctedClockOut).toISOString()
        : undefined;

      await api.post('/corrections', {
        punchId: Number(form.punchId),
        correctedClockIn: correctedClockInIso,
        correctedClockOut: correctedClockOutIso,
        reason: form.reason,
      });
      setForm({
        punchId: '',
        correctedClockIn: '',
        correctedClockOut: '',
        reason: '',
      });
      fetchCorrections();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error creando correccion');
    } finally {
      setCreating(false);
    }
  };

  const formatDateTime = (str: string | null) => {
    if (!str) return '-';
    return new Date(str).toLocaleString('es-DO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Correcciones</h1>

      {!isSupervisor && (
        <div className="card bg-base-200 p-4 mb-6">
          <h2 className="font-semibold mb-3">Solicitar correccion</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label"><span className="label-text">Ponche</span></label>
              <select
                className="select select-bordered"
                value={form.punchId}
                onChange={(e) => setForm({ ...form, punchId: e.target.value })}
              >
                <option value="">Selecciona un ponche</option>
                {myPunches.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {new Date(p.clockIn).toLocaleString('es-DO')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Entrada corregida</span></label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={form.correctedClockIn}
                onChange={(e) => setForm({ ...form, correctedClockIn: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Salida corregida (opcional)</span></label>
              <input
                type="datetime-local"
                className="input input-bordered"
                value={form.correctedClockOut}
                onChange={(e) => setForm({ ...form, correctedClockOut: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Razon</span></label>
              <input
                type="text"
                className="input input-bordered"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={handleCreate}
              className={`btn btn-primary btn-sm ${creating ? 'loading' : ''}`}
              disabled={creating}
            >
              Enviar solicitud
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Solicitado por</th>
              <th>Entrada Original</th>
              <th>Salida Original</th>
              <th>Entrada Corregida</th>
              <th>Salida Corregida</th>
              <th>Razón</th>
              <th>Estado</th>
              {isSupervisor && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {corrections.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.requestedBy?.firstName} {c.requestedBy?.lastName}
                </td>
                <td>{formatDateTime(c.originalClockIn)}</td>
                <td>{formatDateTime(c.originalClockOut)}</td>
                <td>{formatDateTime(c.correctedClockIn)}</td>
                <td>{formatDateTime(c.correctedClockOut)}</td>
                <td className="max-w-xs truncate">{c.reason}</td>
                <td>
                  <span
                    className={`badge ${
                      c.status === 'PENDING'
                        ? 'badge-warning'
                        : c.status === 'APPROVED'
                          ? 'badge-success'
                          : 'badge-error'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                {isSupervisor && (
                  <td>
                    {c.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="btn btn-success btn-xs"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(c.id)}
                          className="btn btn-error btn-xs"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {corrections.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center opacity-50">
                  No hay correcciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
