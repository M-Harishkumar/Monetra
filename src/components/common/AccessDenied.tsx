import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, UserCheck, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

interface AccessDeniedProps {
  requiredRoles: UserRole[];
  currentRole: UserRole;
  attemptedPath?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRoles,
  currentRole,
  attemptedPath,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { switchRole } = useAuth();

  const path = attemptedPath || location.pathname;

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CUSTOMER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'Administrator';
      case 'STAFF':
        return 'Staff Member';
      case 'CUSTOMER':
        return 'Customer / Client';
      default:
        return r;
    }
  };

  // Recommended role to switch to for quick demo testing
  const targetDemoRole = requiredRoles[0];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <Lock className="h-3.5 w-3.5" />
            <span>HTTP 403 Forbidden • Access Restricted</span>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl font-heading">
            Insufficient Role Permissions
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            You do not have the required authorization level to view or perform operations on{' '}
            <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-200">
              {path}
            </code>
            .
          </p>
        </div>

        {/* Roles details card */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Your Current Role:</span>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase border ${getRoleBadgeStyle(
                currentRole
              )}`}
            >
              {getRoleLabel(currentRole)} ({currentRole})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-500">Required Role(s):</span>
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

          <div className="border-t border-slate-200/80 pt-2.5 text-[11px] text-slate-500">
            Role-Based Access Control (RBAC) enforces strict separation between Administrator controls, Staff operational actions, and Customer portal views.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex w-full sm:w-1/2 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>

          {targetDemoRole && (
            <button
              onClick={async () => {
                await switchRole(targetDemoRole);
              }}
              className="flex w-full sm:w-1/2 items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-50 px-4 py-2.5 text-xs font-semibold text-teal-800 shadow-xs hover:bg-teal-100 transition-colors"
            >
              <UserCheck className="h-4 w-4 text-teal-600" />
              <span>Switch to {getRoleLabel(targetDemoRole)}</span>
            </button>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Go back to previous page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
