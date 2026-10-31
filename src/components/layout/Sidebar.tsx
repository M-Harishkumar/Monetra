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
  Bot,
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
        { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'Live AI', highlight: true },
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
        { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'Live AI', highlight: true },
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
        { name: 'AI Assistant', path: '/ai-assistant', icon: Sparkles, badge: 'Live AI', highlight: true },
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
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-72 flex-col bg-white text-[#243B53] border-r border-[#D9E8F5] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[#D9E8F5] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#368CE7] text-white shadow-xs">
              <Zap className="h-5 w-5 fill-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#243B53] font-heading">
                NEXORA
              </span>
              <span className="ml-1.5 rounded-sm bg-[#DCEEFF] px-1.5 py-0.5 text-[10px] font-bold text-[#368CE7] border border-[#BCEBFA]">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Verified Session Role Card (Read-Only) */}
        <div className="px-5 py-3 bg-[#F4F9FF] border-b border-[#D9E8F5]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#647A91]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#368CE7]" />
              SESSION ROLE:
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase border ${getRoleBadgeClasses(
                role
              )}`}
            >
              {role === 'CUSTOMER' ? 'Customer' : role}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <p className="px-3 text-[10px] font-bold tracking-wider text-[#647A91] uppercase">
                {section.group}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path === '/ai-assistant' && location.pathname === '/ai-hub');

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive: linkActive }) =>
                        `group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                          linkActive || isActive
                            ? 'bg-[#EAF4FF] text-[#368CE7] font-semibold border-l-4 border-[#368CE7]'
                            : 'text-[#647A91] hover:bg-[#F4F9FF] hover:text-[#243B53]'
                        } ${
                          item.highlight && !(linkActive || isActive)
                            ? 'border border-[#DCEEFF] bg-[#F4F9FF] text-[#368CE7]'
                            : ''
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 transition-colors text-[#368CE7]" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-[#DCEEFF] px-2 py-0.5 text-[10px] font-bold text-[#368CE7]">
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

        {/* User Profile Card & Logout Footer */}
        <div className="p-4 border-t border-[#D9E8F5] bg-white">
          <div className="flex items-center justify-between rounded-xl p-2.5 bg-[#F4F9FF] border border-[#D9E8F5]">
            <button
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              title="View and edit profile"
              className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-85 transition-opacity cursor-pointer group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DCEEFF] text-[#368CE7] font-bold text-xs border border-[#BCEBFA]">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#243B53] group-hover:text-[#368CE7] transition-colors">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-[10px] text-[#647A91]">{user?.email}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="text-[#647A91] hover:text-[#D9535D] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
