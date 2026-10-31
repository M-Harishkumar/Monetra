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
  const { role } = useAuth();

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
        return 'bg-[#EAF4FF] text-[#368CE7] border-[#D9E8F5]';
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
      <div className="w-full max-w-xl rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-xl sm:p-8">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#D9E8F5]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#368CE7] text-white">
              <Zap className="h-4 w-4 fill-white" />
            </div>
            <span className="text-sm font-bold text-[#243B53] font-heading">
              NEXORA
            </span>
          </div>
          <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-[#D9535D] border border-rose-200">
            HTTP 403 FORBIDDEN
          </span>
        </div>

        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-[#D9535D] ring-8 ring-rose-50/50">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#243B53] font-heading">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-[#647A91]">
            Your account does not have permission to view or manage resources at{' '}
            <code className="rounded-md bg-[#F4F9FF] px-2 py-0.5 font-mono text-xs font-semibold text-[#243B53] border border-[#D9E8F5]">
              {path}
            </code>
            .
          </p>
        </div>

        {/* Roles Details */}
        <div className="mt-6 rounded-xl border border-[#D9E8F5] bg-[#F4F9FF] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#647A91]">Your Current Account Role:</span>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold uppercase border ${getRoleBadgeStyle(
                userRole
              )}`}
            >
              {getRoleLabel(userRole)} ({userRole})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#647A91]">Authorized Role(s):</span>
            <div className="flex flex-wrap items-center gap-1.5 justify-end">
              {requiredRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-md bg-white border border-[#D9E8F5] px-2 py-0.5 text-[11px] font-bold text-[#243B53]"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2 border-t border-[#D9E8F5] text-xs text-[#647A91]">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#368CE7]" />
            <span>
              NEXORA enforces cryptographic role-based access control. Direct navigation to unauthorized paths is rejected.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(ownDashboard, { replace: true })}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#368CE7] py-2.5 px-5 text-xs font-bold text-white shadow-md shadow-[#368CE7]/20 hover:bg-[#2e79cc] transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Return to My Dashboard</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[#D9E8F5] bg-white py-2.5 px-4 text-xs font-semibold text-[#243B53] hover:bg-[#F4F9FF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
