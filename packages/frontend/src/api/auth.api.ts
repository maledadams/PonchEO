import api from './client';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'EMPLOYEE' | 'SUPERVISOR';
    department: string | null;
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.data;
}
