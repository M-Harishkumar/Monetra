import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { NotificationCenter } from './NotificationCenter.tsx';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, subtitle }) => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
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

  const getRoleBadgeClasses = (r: string) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-[#EAF4FF] text-[#368CE7] border-[#D9E8F5]';
      case 'STAFF':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CUSTOMER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#D9E8F5] bg-white/95 px-4 backdrop-blur-md sm:px-6 transition-colors duration-200">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-[#647A91] hover:bg-[#F4F9FF] hover:text-[#243B53] lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-[#243B53] font-heading sm:text-lg">
            {title || 'Subscription & Revenue Intelligence'}
          </h1>
          {subtitle && <p className="text-xs text-[#647A91]">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Actions, AI Assistant shortcut, Quick Billing, and Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick AI Assistant Shortcut */}
        <button
          onClick={() => navigate('/ai-assistant')}
          title="Open AI Assistant"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#DCEEFF] bg-[#EAF4FF] px-2.5 py-1.5 text-xs font-semibold text-[#368CE7] hover:bg-[#DCEEFF] transition-colors cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#368CE7]" />
          <span>AI Assistant</span>
        </button>

        {/* Quick Billing Action for Admin/Staff */}
        {role !== 'CUSTOMER' && (
          <button
            onClick={handleQuickBilling}
            disabled={isBillingRunning}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-[#D9E8F5] bg-[#F4F9FF] px-3 py-1.5 text-xs font-semibold text-[#243B53] hover:bg-[#EAF4FF] hover:text-[#368CE7] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`h-3.5 w-3.5 text-[#368CE7] ${isBillingRunning ? 'animate-spin' : ''}`} />
            <span>{isBillingRunning ? 'Billing Run...' : 'Run Billing Job'}</span>
          </button>
        )}

        {/* Currency badge */}
        <div className="hidden lg:flex items-center gap-1 rounded-lg bg-[#F4F9FF] px-2.5 py-1 text-xs font-medium text-[#243B53] border border-[#D9E8F5]">
          <span className="font-semibold">INR</span>
          <span className="text-[#647A91]">|</span>
          <span>₹</span>
        </div>

        {/* Role badge */}
        <span
          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide uppercase border ${getRoleBadgeClasses(
            role
          )}`}
        >
          {role}
        </span>

        {/* Role-Gated Notification Center */}
        <NotificationCenter />

        {/* Profile Button */}
        <button
          onClick={() => navigate('/profile')}
          title="User Profile & Security Management"
          aria-label="User Profile"
          className="flex h-9 items-center gap-2 rounded-lg border border-[#D9E8F5] bg-[#F4F9FF] px-2.5 text-xs font-semibold text-[#243B53] hover:bg-[#EAF4FF] hover:border-[#368CE7] transition-colors cursor-pointer"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DCEEFF] text-[10px] font-bold text-[#368CE7]">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="hidden md:inline max-w-[110px] truncate">{user?.name || 'Profile'}</span>
        </button>
      </div>

      {/* Quick toast notification */}
      {billingToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-medium text-[#243B53] shadow-xl border border-[#D9E8F5] animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-[#249B70] shrink-0" />
          <span>{billingToast}</span>
        </div>
      )}
    </header>
  );
};
