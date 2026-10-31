import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Mail,
  Receipt,
  Repeat,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';

export const RenewalCenterPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadRenewals = async () => {
    try {
      setIsLoading(true);
      const res = await api.getUpcomingRenewals();
      setData(res);
    } catch (err) {
      console.error('Failed to load renewals data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRenewals();
  }, []);

  const handleSendReminder = async (params: {
    subscriptionId?: string;
    invoiceId?: string;
    reminderType: string;
  }) => {
    try {
      setIsSending(true);
      await api.sendReminder(params);
      setActionMessage(`Reminder (${params.reminderType}) dispatched successfully. Logged to email ledger.`);
      setTimeout(() => setActionMessage(null), 5000);
      await loadRenewals();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reminder.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-teal-600" />
            Smart Renewal & Dunning Engine
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Multi-stage automated reminder schedule: T-7d, T-3d, Renewal Day, T+3d overdue, T+7d overdue, and T+15d grace termination.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs font-semibold text-teal-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Dunning Sequence Timeline Visualizer */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Automated Cadence Schedule
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          <div className="rounded-lg bg-blue-50/80 border border-blue-200 p-2.5">
            <span className="font-bold text-blue-900 block text-xs">T-7 Days</span>
            <p className="text-[11px] text-blue-700 mt-1">Pre-renewal notice & card check</p>
          </div>
          <div className="rounded-lg bg-blue-50/80 border border-blue-200 p-2.5">
            <span className="font-bold text-blue-900 block text-xs">T-3 Days</span>
            <p className="text-[11px] text-blue-700 mt-1">Upcoming charge reminder</p>
          </div>
          <div className="rounded-lg bg-teal-50 border border-teal-200 p-2.5">
            <span className="font-bold text-teal-900 block text-xs">Renewal Day</span>
            <p className="text-[11px] text-teal-700 mt-1">Invoice issued & charge attempt</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
            <span className="font-bold text-amber-900 block text-xs">T+3 Overdue</span>
            <p className="text-[11px] text-amber-700 mt-1">Payment decline notification</p>
          </div>
          <div className="rounded-lg bg-orange-50 border border-orange-200 p-2.5">
            <span className="font-bold text-orange-900 block text-xs">T+7 Overdue</span>
            <p className="text-[11px] text-orange-700 mt-1">Escalation notice to finance</p>
          </div>
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5">
            <span className="font-bold text-rose-900 block text-xs">T+15 Grace End</span>
            <p className="text-[11px] text-rose-700 mt-1">Service suspension warning</p>
          </div>
        </div>
      </div>

      {/* Two Column Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Upcoming Renewals */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
              <Repeat className="h-4 w-4 text-teal-600" />
              Upcoming Contract Renewals ({data?.upcomingRenewals?.length || 0})
            </h3>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {isLoading ? (
              <p className="py-6 text-center text-xs text-slate-400">Loading...</p>
            ) : data?.upcomingRenewals?.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No renewals approaching in next 14 days.</p>
            ) : (
              data.upcomingRenewals.map((sub: any) => (
                <div key={sub.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{sub.customerName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      #{sub.subscriptionNumber} • Renewal: {sub.nextBillingDate?.slice(0, 10)} (
                      {sub.daysUntilRenewal === 0
                        ? 'Today!'
                        : sub.daysUntilRenewal > 0
                        ? `in ${sub.daysUntilRenewal} days`
                        : `${Math.abs(sub.daysUntilRenewal)} days ago`}
                      )
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-tabular-nums">
                      {formatCurrency(sub.totalRecurringAmount)}
                    </span>
                    <button
                      onClick={() =>
                        handleSendReminder({
                          subscriptionId: sub.id,
                          reminderType: sub.daysUntilRenewal <= 3 ? 'pre_renewal_3d' : 'pre_renewal_7d',
                        })
                      }
                      disabled={isSending}
                      className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      Dispatch
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Overdue Invoices in Dunning */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
              <Receipt className="h-4 w-4 text-rose-600" />
              Invoices in Active Dunning Sequence ({data?.overdueInvoices?.length || 0})
            </h3>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {isLoading ? (
              <p className="py-6 text-center text-xs text-slate-400">Loading...</p>
            ) : data?.overdueInvoices?.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">Zero overdue invoices in dunning!</p>
            ) : (
              data.overdueInvoices.map((inv: any) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{inv.customerName}</span>
                      <span className="rounded-sm bg-rose-100 text-rose-800 px-1.5 py-0.2 text-[10px] font-bold">
                        {inv.daysPastDue}d overdue
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Invoice #{inv.invoiceNumber} • Due Date: {inv.dueDate?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-600 font-tabular-nums">
                      {formatCurrency(inv.outstandingAmount)}
                    </span>
                    <button
                      onClick={() =>
                        handleSendReminder({
                          invoiceId: inv.id,
                          reminderType: inv.daysPastDue >= 15 ? 'overdue_15d' : 'overdue_7d',
                        })
                      }
                      disabled={isSending}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      <Send className="h-3 w-3" />
                      Send Dunning
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
