import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Scale,
  Percent,
  ShieldAlert,
  Activity,
  CalendarClock,
  SlidersHorizontal,
  BarChart3,
  UserCheck,
  History,
  Mail,
  Cog,
  Zap,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    {
      group: 'OVERVIEW',
      items: [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }],
    },
    {
      group: 'BUSINESS MANAGEMENT',
      items: [
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Products & Variants', path: '/products', icon: Package },
        { name: 'Subscription Plans', path: '/plans', icon: Layers },
        { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
        { name: 'Subscriptions', path: '/subscriptions', icon: Repeat, badge: 'Core' },
      ],
    },
    {
      group: 'FINANCIAL OPERATIONS',
      items: [
        { name: 'Invoices', path: '/invoices', icon: Receipt },
        { name: 'Payments & Ledger', path: '/payments', icon: CreditCard },
        { name: 'Reconciliation', path: '/reconciliation', icon: Scale },
        { name: 'Recurring Billing', path: '/billing-engine', icon: Zap },
      ],
    },
    {
      group: 'REVENUE INTELLIGENCE',
      items: [
        { name: 'Revenue Guard', path: '/revenue-guard', icon: ShieldAlert, badge: 'Alerts', highlight: true },
        { name: 'Subscription Health', path: '/health-monitor', icon: Activity },
        { name: 'Renewal Center', path: '/renewals', icon: CalendarClock },
        { name: 'Revenue Simulator', path: '/simulator', icon: SlidersHorizontal },
        { name: 'Portfolio Intelligence', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { name: 'Staff Management', path: '/staff', icon: UserCheck },
        { name: 'Audit Logs', path: '/audit-logs', icon: History },
        { name: 'Email Delivery Logs', path: '/email-logs', icon: Mail },
        { name: 'System Settings', path: '/settings', icon: Cog },
      ],
    },
  ];

  const staffNav = [
    {
      group: 'OVERVIEW',
      items: [{ name: 'Staff Dashboard', path: '/', icon: LayoutDashboard }],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Assigned Customers', path: '/customers', icon: Users },
        { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
        { name: 'Subscriptions', path: '/subscriptions', icon: Repeat },
        { name: 'Invoices', path: '/invoices', icon: Receipt },
        { name: 'Record Payments', path: '/payments', icon: CreditCard },
        { name: 'Reconciliation Assistant', path: '/reconciliation', icon: Scale },
      ],
    },
    {
      group: 'REVENUE INTELLIGENCE',
      items: [
        { name: 'Assigned Alerts', path: '/revenue-guard', icon: ShieldAlert, highlight: true },
        { name: 'Renewal Center', path: '/renewals', icon: CalendarClock },
        { name: 'Change Simulator', path: '/simulator', icon: SlidersHorizontal },
      ],
    },
  ];

  const customerNav = [
    {
      group: 'CUSTOMER PORTAL',
      items: [
        { name: 'My Subscriptions', path: '/', icon: Repeat },
        { name: 'Invoices & Receipts', path: '/invoices', icon: Receipt },
        { name: 'Payment History', path: '/payments', icon: CreditCard },
        { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
        { name: 'Plan Change Requests', path: '/simulator', icon: SlidersHorizontal },
      ],
    },
  ];

  const navSections = role === 'ADMIN' ? adminNav : role === 'STAFF' ? staffNav : customerNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col bg-slate-950 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 font-bold text-slate-950 shadow-md shadow-teal-500/20">
              <Zap className="h-5 w-5 fill-slate-950" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-heading">
                NEXORA
              </span>
              <span className="ml-1.5 rounded-sm bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Demo Fast Role Switcher */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              VIEW AS ROLE:
            </span>
            <span className="text-teal-400 font-mono uppercase">{role}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            {(['ADMIN', 'STAFF', 'CUSTOMER'] as const).map(r => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`py-1 text-[11px] font-medium rounded-md transition-colors ${
                  role === r
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {r === 'CUSTOMER' ? 'Client' : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
                {section.group}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item: any) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-teal-500/15 text-teal-400 font-semibold'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        } ${item.highlight ? 'border border-amber-500/20 bg-amber-500/5 text-amber-300' : ''}`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-teal-400" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] font-medium text-teal-300">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <div className="flex items-center justify-between rounded-xl p-2.5 bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">{user?.name || 'User'}</p>
                <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
