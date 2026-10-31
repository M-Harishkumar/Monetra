import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const adminNav = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'AI Intelligence Hub', path: '/ai-hub', icon: Sparkles, badge: 'Gemini', highlight: true },
      ],
    },
    {
      group: 'BUSINESS MANAGEMENT',
      items: [
        { name: 'Customer Management', path: '/customers', icon: Users },
        { name: 'Products & Variants', path: '/products', icon: Package },
        { name: 'Subscription Plans', path: '/plans', icon: Layers },
        { name: 'Quotation Management', path: '/quotations', icon: FileSpreadsheet },
        { name: 'Subscription Management', path: '/subscriptions', icon: Repeat, badge: 'Core' },
      ],
    },
    {
      group: 'FINANCIAL OPERATIONS',
      items: [
        { name: 'Invoice Management', path: '/invoices', icon: Receipt },
        { name: 'Payment Management', path: '/payments', icon: CreditCard },
        { name: 'Payment Reconciliation', path: '/reconciliation', icon: Scale },
        { name: 'Recurring Billing', path: '/billing-engine', icon: Zap },
      ],
    },
    {
      group: 'REVENUE INTELLIGENCE',
      items: [
        { name: 'Revenue Guard', path: '/revenue-guard', icon: ShieldAlert, badge: 'Alerts' },
        { name: 'Subscription Health', path: '/health-monitor', icon: Activity },
        { name: 'Renewal & Dunning', path: '/renewals', icon: CalendarClock },
        { name: 'Revenue Simulator', path: '/simulator', icon: SlidersHorizontal },
        { name: 'Revenue Analytics', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { name: 'User & Staff Management', path: '/staff', icon: UserCheck },
        { name: 'User Profile & Directory', path: '/profile', icon: UserIcon },
        { name: 'Audit Logs', path: '/audit-logs', icon: History },
        { name: 'Email Delivery Logs', path: '/email-logs', icon: Mail },
        { name: 'System Settings', path: '/settings', icon: Cog },
      ],
    },
  ];

  const staffNav = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Staff Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
        { name: 'AI Intelligence Hub', path: '/ai-hub', icon: Sparkles, badge: 'Gemini', highlight: true },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Customer Management', path: '/customers', icon: Users },
        { name: 'Quotation Management', path: '/quotations', icon: FileSpreadsheet },
        { name: 'Subscription Management', path: '/subscriptions', icon: Repeat },
        { name: 'Invoice Management', path: '/invoices', icon: Receipt },
        { name: 'Payment Recording', path: '/payments', icon: CreditCard },
        { name: 'Payment Reconciliation', path: '/reconciliation', icon: Scale },
      ],
    },
    {
      group: 'REVENUE INTELLIGENCE',
      items: [
        { name: 'Assigned Alerts', path: '/revenue-guard', icon: ShieldAlert },
        { name: 'Renewal Monitoring', path: '/renewals', icon: CalendarClock },
        { name: 'Change Simulator', path: '/simulator', icon: SlidersHorizontal },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { name: 'My Profile', path: '/profile', icon: UserIcon },
      ],
    },
  ];

  const customerNav = [
    {
      group: 'CUSTOMER PORTAL',
      items: [
        { name: 'Customer Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
        { name: 'AI Intelligence Hub', path: '/ai-hub', icon: Sparkles, badge: 'Gemini', highlight: true },
        { name: 'Own Invoices & Receipts', path: '/invoices', icon: Receipt },
        { name: 'Own Payment History', path: '/payments', icon: CreditCard },
        { name: 'Own Quotations', path: '/quotations', icon: FileSpreadsheet },
        { name: 'Subscription Changes', path: '/simulator', icon: SlidersHorizontal },
        { name: 'My Profile', path: '/profile', icon: UserIcon },
      ],
    },
  ];

  // Strictly select navigation based on verified backend session role
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
                MONETRA
              </span>
              <span className="ml-1.5 rounded-sm bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Verified Authentication Session Role Badge (Read-Only, No Role Switcher) */}
        <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              SESSION ROLE:
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border ${
                role === 'ADMIN'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                  : role === 'STAFF'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              }`}
            >
              {role === 'CUSTOMER' ? 'Customer' : role}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.group}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive: linkActive }) =>
                        `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          linkActive || isActive
                            ? 'bg-teal-500/15 text-teal-400 font-semibold'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        } ${item.highlight ? 'border border-teal-500/20 bg-teal-500/5 text-teal-300' : ''}`
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
            <button
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              title="View and edit profile"
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30 group-hover:border-teal-400">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white group-hover:text-teal-300 transition-colors">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
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
