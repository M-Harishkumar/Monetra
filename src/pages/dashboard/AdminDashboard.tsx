import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Repeat,
  Users,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Calendar,
  Layers,
  Zap,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { NavLink } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('this_month');

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [filterPeriod]);

  if (isLoading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#368CE7] border-t-transparent" />
          <p className="text-xs font-medium text-[#647A91]">Aggregating real-time financial ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D9E8F5] pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#243B53] font-heading">
            Executive Financial & Subscription Intelligence
          </h2>
          <p className="mt-0.5 text-xs text-[#647A91]">
            Real-time reconciliation of recurring billing, active contracts, and leakage safeguards.
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#D9E8F5] bg-white p-1 text-xs font-medium shadow-2xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'last7', label: '7D' },
            { id: 'last30', label: '30D' },
            { id: 'this_month', label: 'This Month' },
            { id: 'this_year', label: 'This Year' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterPeriod(f.id)}
              className={`rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
                filterPeriod === f.id
                  ? 'bg-[#368CE7] font-semibold text-white shadow-2xs'
                  : 'text-[#647A91] hover:bg-[#F4F9FF] hover:text-[#243B53]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(data?.mrr)}
          subtitle="Contracted recurring run rate"
          icon={TrendingUp}
          trend={{ value: '+14.2%', isPositive: true }}
          highlight
        />

        <StatCard
          title="Annual Recurring Revenue"
          value={formatCurrency(data?.arr)}
          subtitle="Normalized 12-month projection"
          icon={DollarSign}
          trend={{ value: '+18.5%', isPositive: true, period: 'annual pace' }}
        />

        <StatCard
          title="Actual Cash Collected"
          value={formatCurrency(data?.cashCollected)}
          subtitle="Realized bank & gateway inflows"
          icon={CreditCard}
          trend={{ value: '94% collection rate', isPositive: true, period: 'to invoice ratio' }}
        />

        <StatCard
          title="Accounts Receivable (Due)"
          value={formatCurrency(data?.accountsReceivable)}
          subtitle={`Overdue: ${formatCurrency(data?.overdueBalance)}`}
          icon={Receipt}
          trend={{ value: '6 days avg dunning', isPositive: false }}
        />
      </div>

      {/* Secondary Guard & Health Alert Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Revenue Guard Alerts
            </span>
            <ShieldAlert className="h-5 w-5 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-900 font-tabular-nums">
              {data?.activeAlertsCount ?? 3}
            </span>
            <span className="text-xs font-medium text-rose-600">Active Leakages</span>
          </div>
          <p className="mt-1 text-xs text-rose-700/80">
            Est. Exposure: <strong className="font-semibold">{formatCurrency(data?.totalLeakageExposure)}</strong>
          </p>
          <NavLink
            to="/revenue-guard"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900"
          >
            Investigate sentinel alerts <ArrowUpRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              At-Risk Subscriptions
            </span>
            <Activity className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900 font-tabular-nums">
              {data?.atRiskSubsCount ?? 1}
            </span>
            <span className="text-xs font-medium text-amber-600">Health &lt; 80/100</span>
          </div>
          <p className="mt-1 text-xs text-amber-700/80">
            Overdue invoices or payment friction detected.
          </p>
          <NavLink
            to="/health-monitor"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900"
          >
            View health breakdown <ArrowUpRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>

        <div className="rounded-2xl border border-[#D9E8F5] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#647A91]">
              Active Subscribers
            </span>
            <Repeat className="h-5 w-5 text-[#368CE7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#243B53] font-tabular-nums font-heading">
              {data?.activeSubscriptions ?? 0}
            </span>
            <span className="text-xs font-medium text-[#647A91]">of {data?.totalSubscriptions} total</span>
          </div>
          <p className="mt-1 text-xs text-[#647A91]">
            Customer Churn: <strong className="font-semibold text-[#243B53]">{data?.churnRate}%</strong>
          </p>
          <NavLink
            to="/subscriptions"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#368CE7] hover:text-[#2e79cc]"
          >
            Manage active contracts <ArrowUpRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>

        <div className="rounded-2xl border border-[#D9E8F5] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#647A91]">
              Customer Base & ARPU
            </span>
            <Users className="h-5 w-5 text-[#368CE7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#243B53] font-tabular-nums font-heading">
              {data?.totalCustomers ?? 10}
            </span>
            <span className="text-xs font-medium text-[#647A91]">Accounts</span>
          </div>
          <p className="mt-1 text-xs text-[#647A91]">
            ARPU: <strong className="font-semibold text-[#243B53]">{formatCurrency(data?.arpu)}/mo</strong>
          </p>
          <NavLink
            to="/customers"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#368CE7] hover:text-[#2e79cc]"
          >
            Open customer directory <ArrowUpRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Two Column Layout: Monthly Performance Table + Plan Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Trend Table (2 cols) */}
        <div className="rounded-2xl border border-[#D9E8F5] bg-white p-6 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#D9E8F5] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#243B53] font-heading">
                Monthly Recurring Revenue Trajectory
              </h3>
              <p className="text-xs text-[#647A91]">
                Segregated tracking: Invoiced recurring commitments vs settled bank cash.
              </p>
            </div>
            <span className="rounded-md bg-[#EAF4FF] px-2 py-1 text-[11px] font-semibold text-[#368CE7] border border-[#DCEEFF]">
              Live Ledger Sync
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5">Period</th>
                  <th className="py-2.5 text-right">Contracted MRR</th>
                  <th className="py-2.5 text-right">Realized Cash</th>
                  <th className="py-2.5 text-right">Collection Efficiency</th>
                  <th className="py-2.5 text-right">Cohort Churn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(data?.monthlyTrend || []).map((row: any, idx: number) => {
                  const efficiency = row.mrr > 0 ? Math.min(100, Math.round((row.cash / row.mrr) * 100)) : 100;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-semibold text-slate-900">{row.month}</td>
                      <td className="py-3 text-right font-medium font-tabular-nums text-slate-900">
                        {formatCurrency(row.mrr)}
                      </td>
                      <td className="py-3 text-right font-medium font-tabular-nums text-emerald-600">
                        {formatCurrency(row.cash)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                          {efficiency}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-500">{row.churn}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plan Revenue Concentration (1 col) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Revenue by Plan Tier
              </h3>
              <p className="text-xs text-slate-500">Distribution across active plans</p>
            </div>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-5 space-y-4">
            {(data?.planBreakdown || []).map((p: any) => {
              const totalRev = data?.mrr || 1;
              const pct = Math.min(100, Math.round((p.revenue / totalRev) * 100));
              return (
                <div key={p.planId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="font-bold text-slate-900 font-tabular-nums">
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{p.subscribersCount} active subscribers</span>
                    <span>{pct}% of MRR</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <NavLink
              to="/simulator"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Simulate Price or Tier Migrations
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};
