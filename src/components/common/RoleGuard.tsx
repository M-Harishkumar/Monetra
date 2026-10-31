import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';
import { AccessDenied } from './AccessDenied.tsx';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <span className="text-xs font-semibold text-slate-500">Checking permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAccess = allowedRoles.includes(role);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <AccessDenied
        requiredRoles={allowedRoles}
        currentRole={role}
        attemptedPath={location.pathname}
      />
    );
  }

  return <>{children}</>;
};
