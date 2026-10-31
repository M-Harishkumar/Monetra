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
    try {
      setIsLoading(true);
      const profile = await api.getMe();
      setUser(profile);
      setRoleState(profile.role);
      setDemoRole(profile.role);
    } catch (err) {
      // In development, fallback to selected role's profile
      const defaultRole = getDemoRole() as UserRole;
      setRoleState(defaultRole);
      if (defaultRole === 'ADMIN') {
        setUser({
          id: 'USR-ADMIN-01',
          name: 'Elena Rostova',
          email: 'admin@nexora.io',
          role: 'ADMIN',
          status: 'ACTIVE',
        });
      } else if (defaultRole === 'STAFF') {
        setUser({
          id: 'USR-STAFF-01',
          name: 'Sarah Jenkins',
          email: 'staff.sarah@nexora.io',
          role: 'STAFF',
          status: 'ACTIVE',
        });
      } else {
        setUser({
          id: 'USR-CUST-01',
          name: 'Marcus Sterling',
          email: 'customer@nexora.io',
          role: 'CUSTOMER',
          customerId: 'CUST-001',
          status: 'ACTIVE',
        });
      }
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
    switchRole('ADMIN');
  };

  const switchRole = async (targetRole: UserRole) => {
    setDemoRole(targetRole);
    setRoleState(targetRole);
    setAuthToken(null);
    await fetchProfile();
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
