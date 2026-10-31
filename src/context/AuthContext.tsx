import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types.ts';
import { api, setAuthToken, setDemoRole, getDemoRole } from '../services/api.ts';
import { auth, db, googleProvider } from '../firebase/config.ts';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<User>;
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

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const res = await api.login(credentials);
    setAuthToken(res.token);
    setUser(res.user);
    setRoleState(res.user.role);
    setDemoRole(res.user.role);
    return res.user;
  };

  const loginWithGoogle = async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // 1. Sync / check profile in Firestore
      let userRole: UserRole = 'CUSTOMER';
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          userRole = (userDoc.data().role as UserRole) || 'CUSTOMER';
        } else {
          const emailLower = (fbUser.email || '').toLowerCase();
          if (emailLower.includes('admin') || emailLower.endsWith('@nexora.io')) {
            userRole = 'ADMIN';
          }
          await setDoc(userDocRef, {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Google User',
            role: userRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (firestoreErr) {
        console.warn('Firestore profile sync note:', firestoreErr);
      }

      // 2. Sync with backend API to issue signed JWT
      const res = await api.loginWithGoogle({
        uid: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || '',
        photoURL: fbUser.photoURL || undefined,
      });

      setAuthToken(res.token);
      setUser(res.user);
      setRoleState(res.user.role);
      setDemoRole(res.user.role);
      return res.user;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      throw new Error(err.message || 'Google authentication failed.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setUser(null);
    setDemoRole('ADMIN');
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_demo_role');
  };

  const switchRole = async (targetRole: UserRole): Promise<User> => {
    const res = await api.switchRole(targetRole);
    setAuthToken(res.token);
    setUser(res.user);
    setRoleState(res.user.role);
    setDemoRole(res.user.role);
    return res.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
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
