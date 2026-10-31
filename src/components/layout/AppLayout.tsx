import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './Header.tsx';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Page title mapping based on route
  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/' || path === '/admin/dashboard') return { title: 'Executive Overview & Financial KPI Dashboard', subtitle: 'Live metrics calculated from persistent records' };
    if (path === '/staff/dashboard') return { title: 'Staff Operations & Accounts Dashboard', subtitle: 'Assigned customer portfolios, pending tasks, and recent operational activity' };
    if (path === '/customer/dashboard') return { title: 'Customer Account & Subscription Portal', subtitle: 'Active services, recurring billing timeline, and payment receipts' };
    if (path.startsWith('/customers')) return { title: 'Customer Ledger & Accounts', subtitle: 'Manage accounts, subscription history, and outstanding receivables' };
    if (path.startsWith('/products')) return { title: 'Products & Multi-Tier Variants', subtitle: 'Software offerings, services, and seat-based add-ons' };
    if (path.startsWith('/plans')) return { title: 'Subscription Plans & Policy Rules', subtitle: 'Daily, weekly, monthly, and yearly recurring schedules' };
    if (path.startsWith('/quotations')) return { title: 'Quotations & B2B Proposals', subtitle: 'Draft, issue, accept, and convert proposals to active subscriptions' };
    if (path.startsWith('/subscriptions')) return { title: 'Subscriptions Lifecycle Hub', subtitle: 'The core engine: activation, pause policies, renewals, and audit history' };
    if (path.startsWith('/invoices')) return { title: 'Invoices & Billing Snapshots', subtitle: 'Recurring and one-time invoices with itemized tax and discounts' };
    if (path.startsWith('/payments')) return { title: 'Payments & Payment Allocations', subtitle: 'Record collections, partial allocations, and authorized reversals' };
    if (path.startsWith('/revenue-guard')) return { title: 'Revenue Guard – Leakage Sentinel', subtitle: '10 automated audit rules preventing unbilled cycles and duplicate invoices' };
    if (path.startsWith('/health-monitor')) return { title: 'Subscription Health Monitor', subtitle: 'Explainable rule-based scoring (0-100) with factor breakdowns' };
    if (path.startsWith('/renewals')) return { title: 'Smart Renewal & Dunning Center', subtitle: 'Multi-stage renewal notifications and overdue dunning automation' };
    if (path.startsWith('/simulator')) return { title: 'Change Simulator & What-If Studio', subtitle: 'Real-time proration calculations and predictive ARR modeling' };
    if (path.startsWith('/reconciliation')) return { title: 'Payment Reconciliation Assistant', subtitle: 'Import bank statement CSVs, auto-match, and allocate payments' };
    if (path.startsWith('/reports')) return { title: 'Portfolio Intelligence & Reports', subtitle: 'MRR, ARR, cash vs invoiced revenues, cohorts, and LTV metrics' };
    if (path.startsWith('/billing-engine')) return { title: 'Automated Billing Engine Hub', subtitle: 'Scheduled job logs, idempotent duplicate prevention, and retries' };
    if (path.startsWith('/staff')) return { title: 'Staff Accounts & RBAC', subtitle: 'Manage permissions, customer assignments, and operational staff' };
    if (path.startsWith('/audit-logs')) return { title: 'Immutable Audit Trail', subtitle: 'Chronological timeline of financial operations and system events' };
    if (path.startsWith('/email-logs')) return { title: 'Email Dispatch & Delivery Logs', subtitle: 'System notifications, dunning sequences, and invoice receipts' };
    if (path.startsWith('/ai-hub')) return { title: 'AI Studio & Revenue Intelligence Hub', subtitle: 'Gemini 3.8 Flash, 4 Argon, Live API voice, and audio speech-to-text transcription' };
    if (path.startsWith('/settings')) return { title: 'Platform Settings & Policies', subtitle: 'Accounting currency, tax rules, and billing retry tolerances' };
    return { title: 'NEXORA Platform', subtitle: 'Subscription & Revenue Intelligence Platform' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F7FA] dark:bg-[#0B132B] font-sans antialiased text-[#1B2938] dark:text-slate-100 transition-colors duration-200">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
