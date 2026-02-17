import { createContext, useContext, ReactNode } from 'react';

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
  isSupervisor: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mockUser: User = {
  id: 1,
  employeeCode: 'EMP001',
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@poncheo.com',
  role: 'SUPERVISOR',
  department: 'Engineering',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const login = async (email: string, password: string) => {
    // No-op: auth removed
  };

  const logout = () => {
    // No-op: auth removed
  };

  return (
    <AuthContext.Provider
      value={{
        user: mockUser,
        token: 'demo-token',
        isLoading: false,
        isSupervisor: true,
        login,
        logout,
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
