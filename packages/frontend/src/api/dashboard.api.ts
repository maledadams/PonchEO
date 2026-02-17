import api from './client';

export async function getSupervisorDashboard() {
  const { data } = await api.get('/dashboard/supervisor');
  return data.data;
}

export async function getEmployeeDashboard() {
  const { data } = await api.get('/dashboard/employee');
  return data.data;
}
