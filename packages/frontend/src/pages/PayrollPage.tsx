import { useState, useEffect } from 'react';
import api from '../api/client';

export default function PayrollPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [periodType, setPeriodType] = useState<'WEEKLY' | 'BIWEEKLY'>('WEEKLY');

  const fetchPayroll = async () => {
    try {
      const { data } = await api.get('/payroll');
      setSummaries(data.data);
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handleGenerate = async () => {
    if (!periodStart || !periodEnd) {
      alert('Seleccione fecha de inicio y fin');
      return;
    }
    setGenerating(true);
    try {
      await api.post('/payroll/generate', { periodStart, periodEnd, periodType });
      fetchPayroll();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error generando nómina');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async (id: number) => {
    try {
      await api.put(`/payroll/${id}/finalize`);
      fetchPayroll();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error');
    }
  };

  const handleRevert = async (id: number) => {
    try {
      await api.put(`/payroll/${id}/revert`);
      fetchPayroll();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error');
    }
  };

  const formatMoney = (val: string | number) => `RD$${Number(val).toFixed(2)}`;
  const formatHours = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  if (loading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nómina</h1>

      {/* Generate Payroll */}
      <div className="card bg-base-200 p-4 mb-6">
        <h2 className="font-semibold mb-3">Generar Nómina</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="form-control">
            <label className="label"><span className="label-text">Inicio</span></label>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Fin</span></label>
            <input
              type="date"
              className="input input-bordered input-sm"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Tipo</span></label>
            <select
              className="select select-bordered select-sm"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
            >
              <option value="WEEKLY">Semanal</option>
              <option value="BIWEEKLY">Quincenal</option>
            </select>
          </div>
          <button
            onClick={handleGenerate}
            className={`btn btn-primary btn-sm ${generating ? 'loading' : ''}`}
            disabled={generating}
          >
            Generar
          </button>
        </div>
      </div>

      {/* Payroll Summary Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Depto.</th>
              <th>Total Horas</th>
              <th>Regular</th>
              <th>Extras</th>
              <th>Noche</th>
              <th>Feriado</th>
              <th>Bruto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.employee?.firstName} {s.employee?.lastName}
                </td>
                <td>{s.employee?.department?.name || '-'}</td>
                <td>{formatHours(s.totalWorkedMinutes)}</td>
                <td>{formatMoney(s.regularPay)}</td>
                <td>{formatMoney(s.overtimePay)}</td>
                <td>{formatMoney(s.nightPremiumPay)}</td>
                <td>{formatMoney(s.holidayPay)}</td>
                <td className="font-bold">{formatMoney(s.grossPay)}</td>
                <td>
                  <span
                    className={`badge ${s.status === 'DRAFT' ? 'badge-warning' : 'badge-success'}`}
                  >
                    {s.status}
                  </span>
                </td>
                <td>
                  {s.status === 'DRAFT' && (
                    <button
                      onClick={() => handleFinalize(s.id)}
                      className="btn btn-success btn-xs"
                    >
                      Finalizar
                    </button>
                  )}
                  {s.status === 'FINALIZED' && (
                    <button
                      onClick={() => handleRevert(s.id)}
                      className="btn btn-warning btn-xs"
                    >
                      Revertir
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {summaries.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center opacity-50">
                  No hay registros de nómina
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
