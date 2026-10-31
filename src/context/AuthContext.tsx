import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { api, setAuthToken, setDemoRole, getDemoRole } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole>((getDemoRole() as UserRole) || 'ADMIN');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('nexora_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const profile = await api.getMe();
      setUser(profile);
      setRoleState(profile.role);
      setDemoRole(profile.role);
    } catch (err) {
      // Invalid or expired token
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    setAuthToken(res.token);
    setUser(res.user);
    setRoleState(res.user.role);
    setDemoRole(res.user.role);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setDemoRole('ADMIN');
  };

  const switchRole = async (targetRole: UserRole) => {
    try {
      const res = await api.switchRole(targetRole);
      setAuthToken(res.token);
      setUser(res.user);
      setRoleState(res.user.role);
      setDemoRole(res.user.role);
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
