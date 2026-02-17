import api from './client';

export async function clockIn() {
  const { data } = await api.post('/punches/clock-in');
  return data.data;
}

export async function clockOut() {
  const { data } = await api.post('/punches/clock-out');
  return data.data;
}

export async function getPunches(params?: Record<string, string | number>) {
  const { data } = await api.get('/punches', { params });
  return data.data;
}

export async function getOpenPunches() {
  const { data } = await api.get('/punches/open');
  return data.data;
}
