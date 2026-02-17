import { useState } from 'react';
import { mockPayroll } from '../data/mockData';

export default function PayrollPage() {
  const [summaries] = useState(mockPayroll);

  const formatMoney = (val: number) => `RD$${Number(val).toFixed(2)}`;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nómina</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Período</th>
              <th>Horas</th>
              <th>Tarifa/hr</th>
              <th>Bruto</th>
              <th>Deducciones</th>
              <th>Neto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.id}>
                <td>{summary.firstName} {summary.lastName}</td>
                <td>{new Date(summary.period).toLocaleDateString('es-DO')}</td>
                <td>{summary.hoursWorked}h</td>
                <td>{formatMoney(summary.hourlyRate)}</td>
                <td className="font-semibold">{formatMoney(summary.grossSalary)}</td>
                <td>{formatMoney(summary.deductions)}</td>
                <td className="font-bold text-green-600">{formatMoney(summary.netSalary)}</td>
                <td>
                  <span className={`badge ${
                    summary.status === 'PAID' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {summary.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {summaries.length === 0 && (
        <div className="alert">
          <span>No hay registros de nómina</span>
        </div>
      )}
    </div>
  );
}
