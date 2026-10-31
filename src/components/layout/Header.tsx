import React, { useState } from 'react';
import { Menu, Bell, Search, Zap, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, subtitle }) => {
  const { role, user } = useAuth();
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [billingToast, setBillingToast] = useState<string | null>(null);

  const handleQuickBilling = async () => {
    try {
      setIsBillingRunning(true);
      const res = await api.triggerBillingRun();
      setBillingToast(
        `Billing run complete: ${res.successfulInvoicesCount} invoices generated, ${res.skippedCount} skipped.`
      );
      setTimeout(() => setBillingToast(null), 5000);
    } catch (err: any) {
      setBillingToast(`Billing run note: ${err?.message || 'Failed to trigger run.'}`);
      setTimeout(() => setBillingToast(null), 5000);
    } finally {
      setIsBillingRunning(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-slate-900 font-heading sm:text-lg">
            {title || 'Subscription & Revenue Intelligence'}
          </h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Actions, Quick Billing, and User indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Billing Action for Admin/Staff */}
        {role !== 'CUSTOMER' && (
          <button
            onClick={handleQuickBilling}
            disabled={isBillingRunning}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-xs hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 text-teal-600 ${isBillingRunning ? 'animate-spin' : ''}`} />
            <span>{isBillingRunning ? 'Billing Run...' : 'Run Billing Job'}</span>
          </button>
        )}

        {/* Currency badge */}
        <div className="hidden md:flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
          <span className="font-semibold text-slate-900">INR</span>
          <span className="text-slate-400">|</span>
          <span>₹</span>
        </div>

        {/* Role badge */}
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wide uppercase border ${
            role === 'ADMIN'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : role === 'STAFF'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {role}
        </span>
      </div>

      {/* Quick toast notification */}
      {billingToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
          <span>{billingToast}</span>
        </div>
      )}
    </header>
  );
};
