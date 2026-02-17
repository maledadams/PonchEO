import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, LoginResponse } from '../api/auth.api';

interface User {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'EMPLOYEE' | 'SUPERVISOR';
  department: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isSupervisor: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('poncheo_token');
    const savedUser = localStorage.getItem('poncheo_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result: LoginResponse = await apiLogin(email, password);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('poncheo_token', result.token);
    localStorage.setItem('poncheo_user', JSON.stringify(result.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('poncheo_token');
    localStorage.removeItem('poncheo_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isSupervisor: user?.role === 'SUPERVISOR',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
