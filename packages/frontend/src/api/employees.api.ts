import api from './client';

export async function getEmployees(includeInactive = false) {
  const { data } = await api.get('/employees', { params: { includeInactive } });
  return data.data;
}

export async function getEmployee(id: number) {
  const { data } = await api.get(`/employees/${id}`);
  return data.data;
}

export async function createEmployee(input: Record<string, unknown>) {
  const { data } = await api.post('/employees', input);
  return data.data;
}

export async function updateEmployee(id: number, input: Record<string, unknown>) {
  const { data } = await api.put(`/employees/${id}`, input);
  return data.data;
}

export async function deleteEmployee(id: number) {
  const { data } = await api.delete(`/employees/${id}`);
  return data.data;
}
