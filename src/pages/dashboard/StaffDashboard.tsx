import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Repeat,
  FileSpreadsheet,
  Receipt,
  CalendarClock,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';

export const StaffDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStaffData = async () => {
      try {
        setIsLoading(true);
        const [cList, qList, iList, rData, aList] = await Promise.all([
          api.getCustomers(),
          api.getQuotations(),
          api.getInvoices(),
          api.getUpcomingRenewals(),
          api.getRevenueGuardAlerts(),
        ]);
        setCustomers(cList);
        setQuotations(qList);
        setInvoices(iList);
        setRenewals(rData);
        setAlerts(aList);
      } catch (err) {
        console.error('Failed to load staff dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStaffData();
  }, []);

  const pendingQuotations = quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT');
  const overdueInvoices = invoices.filter(i => i.isOverdue && i.status !== 'PAID' && i.status !== 'CANCELLED');
  const upcomingRenewalsCount = renewals?.upcomingRenewals?.length || 0;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
        <h2 className="text-lg font-bold text-blue-950 font-heading">
          Staff Operational Cockpit
        </h2>
        <p className="mt-1 text-xs text-blue-800">
          Prioritized tasks for your assigned customer portfolios: review pending quotations, follow up on overdue dunning, and monitor renewal deadlines.
        </p>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Accounts"
          value={customers.length}
          subtitle="Enterprise customer portfolios"
          icon={Users}
        />
        <StatCard
          title="Pending Quotations"
          value={pendingQuotations.length}
          subtitle="Proposals awaiting response"
          icon={FileSpreadsheet}
          trend={{ value: 'Action required', isPositive: false }}
        />
        <StatCard
          title="Overdue Invoices"
          value={overdueInvoices.length}
          subtitle="Requiring dunning outreach"
          icon={Receipt}
          trend={{ value: `${overdueInvoices.length} accounts in arrears`, isPositive: false }}
        />
        <StatCard
          title="Upcoming Renewals"
          value={upcomingRenewalsCount}
          subtitle="Next 14 days"
          icon={CalendarClock}
          highlight
        />
      </div>

      {/* Two Column Worklists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overdue Accounts Needing Followup */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
              <Receipt className="h-4 w-4 text-rose-600" />
              Overdue Collections Worklist
            </h3>
            <NavLink to="/invoices" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              View all invoices →
            </NavLink>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {overdueInvoices.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                All accounts are in good standing with zero overdue invoices!
              </p>
            ) : (
              overdueInvoices.map(inv => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{inv.customerName}</p>
                    <p className="text-[11px] text-slate-500">
                      Invoice #{inv.invoiceNumber} | Due: {inv.dueDate.slice(0, 10)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600 font-tabular-nums">
                      {formatCurrency(inv.outstandingAmount)}
                    </p>
                    <NavLink
                      to="/invoices"
                      className="inline-block mt-0.5 text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Record Payment
                    </NavLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Revenue Guard Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Assigned Revenue Sentinel Alerts
            </h3>
            <NavLink to="/revenue-guard" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              Audit center →
            </NavLink>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {alerts.slice(0, 4).map(alert => (
              <div key={alert.id} className="py-3 flex items-start justify-between text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(alert.severity)} size="sm">
                      {alert.severity}
                    </Badge>
                    <span className="font-semibold text-slate-900">{alert.customerName}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">{alert.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 font-tabular-nums">
                    {formatCurrency(alert.estimatedFinancialImpact)}
                  </span>
                  <div>
                    <NavLink
                      to="/revenue-guard"
                      className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-600 hover:text-teal-800"
                    >
                      Investigate <ExternalLink className="h-3 w-3" />
                    </NavLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
