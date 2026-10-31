import React, { useState } from 'react';
import { Menu, Zap, CheckCircle2, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { api } from '../../services/api.ts';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, subtitle }) => {
  const { role } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E7EE] bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-[#14243A]/95 sm:px-6 transition-colors duration-200">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-[#1B2938] dark:text-white font-heading sm:text-lg">
            {title || 'Subscription & Revenue Intelligence'}
          </h1>
          {subtitle && <p className="text-xs text-[#718096] dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Actions, Quick Billing, Theme Toggle and User Role indicator */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Billing Action for Admin/Staff */}
        {role !== 'CUSTOMER' && (
          <button
            onClick={handleQuickBilling}
            disabled={isBillingRunning}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#16A6A1]/30 bg-[#16A6A1]/10 px-3 py-1.5 text-xs font-semibold text-[#16A6A1] hover:bg-[#16A6A1]/20 transition-colors disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${isBillingRunning ? 'animate-spin' : ''}`} />
            <span>{isBillingRunning ? 'Billing Run...' : 'Run Billing Job'}</span>
          </button>
        )}

        {/* Currency badge */}
        <div className="hidden md:flex items-center gap-1 rounded-md bg-[#F4F7FA] dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-[#1B2938] dark:text-slate-200 border border-[#E1E7EE] dark:border-slate-700">
          <span className="font-semibold">INR</span>
          <span className="text-slate-400">|</span>
          <span>₹</span>
        </div>

        {/* Dark/Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E1E7EE] dark:border-slate-700 bg-[#F4F7FA] dark:bg-slate-800 text-[#1B2938] dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-[#203A56] hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Role badge */}
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wide uppercase border ${
            role === 'ADMIN'
              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
              : role === 'STAFF'
              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
          }`}
        >
          {role}
        </span>
      </div>

      {/* Quick toast notification */}
      {billingToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-[#14243A] px-4 py-3 text-xs font-medium text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#16A6A1] shrink-0" />
          <span>{billingToast}</span>
        </div>
      )}
    </header>
  );
};
