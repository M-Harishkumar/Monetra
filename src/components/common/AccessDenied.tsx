import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

interface AccessDeniedProps {
  requiredRoles?: UserRole[];
  currentRole?: UserRole;
  attemptedPath?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRoles = ['ADMIN'],
  currentRole,
  attemptedPath,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, switchRole } = useAuth();

  const userRole = currentRole || role;
  const path = attemptedPath || location.pathname;

  const getUserDashboardPath = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'STAFF':
        return '/staff/dashboard';
      case 'CUSTOMER':
        return '/customer/dashboard';
      default:
        return '/';
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'Administrator';
      case 'STAFF':
        return 'Staff Member';
      case 'CUSTOMER':
        return 'Customer';
      default:
        return r;
    }
  };

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'STAFF':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CUSTOMER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const ownDashboard = getUserDashboardPath(userRole);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[#E1E7EE] bg-white p-6 shadow-xl sm:p-8 dark:bg-[#14243A] dark:border-slate-800">
        
        {/* Monetra Brand Watermark */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E1E7EE] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16A6A1] text-white">
              <Zap className="h-4 w-4 fill-white" />
            </div>
            <span className="text-sm font-bold text-[#14243A] dark:text-white font-heading">
              MONETRA
            </span>
          </div>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-[#D64545] border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900/50">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-[#D64545] ring-8 ring-rose-50/50 dark:bg-rose-950/40 dark:ring-rose-950/20">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1B2938] dark:text-white font-heading">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-[#718096] dark:text-slate-400">
            Your account does not have permission to view or manage resources at{' '}
            <code className="rounded-md bg-[#F4F7FA] px-2 py-0.5 font-mono text-xs font-semibold text-[#14243A] border border-[#E1E7EE] dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
              {path}
            </code>
            .
          </p>
        </div>

        {/* Roles Details */}
        <div className="mt-6 rounded-xl border border-[#E1E7EE] bg-[#F4F7FA] p-4 space-y-3 dark:bg-slate-900/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#718096] dark:text-slate-400">Your Current Account Role:</span>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase border ${getRoleBadgeStyle(
                userRole
              )}`}
            >
              {getRoleLabel(userRole)} ({userRole})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#718096] dark:text-slate-400">Authorized Role(s):</span>
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              {requiredRoles.map((r) => (
                <span
                  key={r}
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase border ${getRoleBadgeStyle(
                    r
                  )}`}
                >
                  {getRoleLabel(r)}
                </span>
              ))}
            </div>
          </div>

          <p className="border-t border-[#E1E7EE] dark:border-slate-800 pt-2.5 text-[11px] text-[#718096] dark:text-slate-500">
            Monetra Role-Based Access Control (RBAC) isolates internal revenue metrics, staff operational tools, and individual client accounts.
          </p>
        </div>

        {/* Primary Return Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate(ownDashboard)}
            className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-[#14243A] py-2.5 px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#203A56] dark:bg-[#16A6A1] dark:hover:bg-[#149692] transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Return to {getRoleLabel(userRole)} Dashboard</span>
          </button>

          {/* Quick Demo Switch helper for convenience */}
          {requiredRoles[0] && requiredRoles[0] !== userRole && (
            <button
              onClick={async () => {
                await switchRole(requiredRoles[0]);
                navigate(path);
              }}
              className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl border border-[#16A6A1]/40 bg-[#16A6A1]/10 py-2.5 px-4 text-xs font-semibold text-[#16A6A1] hover:bg-[#16A6A1]/20 transition-colors cursor-pointer"
            >
              <span>Switch to {getRoleLabel(requiredRoles[0])} (Demo)</span>
            </button>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#718096] hover:text-[#1B2938] dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go back to previous page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
