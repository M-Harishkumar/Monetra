import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Search,
  Filter,
  Play,
  Pause,
  RotateCw,
  XCircle,
  Clock,
  History,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Sliders,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { NavLink } from 'react-router-dom';

export const SubscriptionsPage: React.FC = () => {
  const { role } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Timeline Drawer
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [subDetail, setSubDetail] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const openSubscriptionTimeline = async (id: string) => {
    setSelectedSubId(id);
    setIsDetailLoading(true);
    try {
      const data = await api.getSubscription(id);
      setSubDetail(data);
    } catch (err) {
      console.error('Failed to load subscription details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleTransition = async (id: string, action: string, reason?: string) => {
    try {
      await api.transitionSubscription(id, action, reason);
      await loadSubscriptions();
      if (selectedSubId === id) {
        await openSubscriptionTimeline(id);
      }
    } catch (err: any) {
      alert(err.message || `Failed to perform action '${action}'`);
    }
  };

  const filteredSubs = subscriptions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.subscriptionNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.planName && s.planName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Subscription Lifecycle Hub
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Enforce valid state transitions (Draft → Confirmed → Active → Paused → Closed) and inspect chronological timeline audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/billing-engine"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Billing Engine Admin →
          </NavLink>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by subscription #, customer, or plan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-xs">Lifecycle State:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All States</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLATION_REQUESTED">Cancellation Requested</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Seats</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4 text-right">Recurring Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Health</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No subscriptions found matching filter.
                  </td>
                </tr>
              ) : (
                filteredSubs.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <button
                        onClick={() => openSubscriptionTimeline(s.id)}
                        className="hover:text-teal-600 hover:underline flex items-center gap-1"
                      >
                        {s.subscriptionNumber}
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{s.customerName}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900">{s.planName}</span>
                      <span className="text-[11px] text-slate-400 block">Qty: {s.quantity} seat(s)</span>
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-slate-600">{s.billingFrequency}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{s.nextBillingDate?.slice(0, 10)}</td>
                    <td className="py-3.5 px-4 text-right font-bold font-tabular-nums text-slate-900">
                      {formatCurrency(s.totalRecurringAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(s.status)} size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          s.healthCategory === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : s.healthCategory === 'At Risk'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {s.healthScore}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleTransition(s.id, 'activate')}
                            title="Activate Subscription"
                            className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          >
                            Activate
                          </button>
                        )}

                        {s.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleTransition(s.id, 'pause', 'Customer requested operational pause')}
                              title="Pause Subscription"
                              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Pause
                            </button>
                            <button
                              onClick={() => handleTransition(s.id, 'renew', 'Manual renewal')}
                              title="Renew Next Cycle"
                              className="rounded-md bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 border border-teal-200"
                            >
                              Renew
                            </button>
                          </>
                        )}

                        {s.status === 'PAUSED' && (
                          <button
                            onClick={() => handleTransition(s.id, 'resume')}
                            className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            Resume
                          </button>
                        )}

                        {s.status !== 'CLOSED' && role === 'ADMIN' && (
                          <button
                            onClick={() => handleTransition(s.id, 'close', 'Administrative contract termination')}
                            className="rounded-md text-[11px] text-slate-400 hover:text-rose-600 p-1"
                            title="Terminate Contract"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Timeline Drawer */}
      {selectedSubId && subDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedSubId(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {subDetail.subscription.subscriptionNumber}
                  </h3>
                  <Badge variant={getStatusBadgeVariant(subDetail.subscription.status)} size="sm">
                    {subDetail.subscription.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {subDetail.customer?.name} • Plan: {subDetail.plan?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubId(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Health Score Overview */}
              {subDetail.healthScore && (
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Subscription Health</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        subDetail.healthScore.category === 'Healthy'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {subDetail.healthScore.category} ({subDetail.healthScore.score}/100)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Transparent rule-based scoring derived from payment timeliness and contract stability.
                  </p>
                </div>
              )}

              {/* Chronological Timeline & Audit Trail (Section 24) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-teal-600" />
                  Chronological Subscription Audit Trail
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2 before:w-0.5 before:bg-slate-200">
                  {subDetail.events && subDetail.events.length > 0 ? (
                    subDetail.events.map((evt: any) => (
                      <div key={evt.id} className="relative">
                        <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 font-mono">
                              {evt.eventType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(evt.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs">{evt.description}</p>
                          <p className="text-[11px] text-slate-400">
                            By actor: <strong className="text-slate-700 font-semibold">{evt.actorName}</strong>
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No events logged yet.</p>
                  )}
                </div>
              </div>

              {/* Invoices Generated */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-blue-600" />
                  Generated Recurring Invoices ({subDetail.invoices?.length || 0})
                </h4>
                <div className="space-y-2">
                  {(subDetail.invoices || []).map((inv: any) => (
                    <div key={inv.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</span>
                        <p className="text-[11px] text-slate-500">Period: {inv.billingPeriod}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 font-tabular-nums">{formatCurrency(inv.total)}</span>
                        <div className="mt-0.5">
                          <Badge variant={getStatusBadgeVariant(inv.status)} size="sm">
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
