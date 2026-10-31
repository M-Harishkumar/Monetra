import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Repeat,
  Calendar,
  Receipt,
  CreditCard,
  Download,
  CheckCircle,
  FileText,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { downloadInvoicePdf } from '../../components/common/PdfGenerator.ts';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPortalData = async () => {
      try {
        setIsLoading(true);
        const [subs, invs, pays, quots] = await Promise.all([
          api.getSubscriptions(),
          api.getInvoices(),
          api.getPayments(),
          api.getQuotations(),
        ]);
        setSubscriptions(subs);
        setInvoices(invs);
        setPayments(pays);
        setQuotations(quots);
      } catch (err) {
        console.error('Failed to load customer portal:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPortalData();
  }, []);

  const activeSub = subscriptions.find(s => s.status === 'ACTIVE') || subscriptions[0];
  const totalOutstanding = invoices
    .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + (i.outstandingAmount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
                Welcome, {user?.name}
              </h2>
              <Badge variant="success" size="sm">
                Verified Account
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Manage your company subscriptions, billing schedules, invoices, and payment receipts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <NavLink
              to="/simulator"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <Sliders className="h-4 w-4 text-teal-600" />
              Request Plan Upgrade / Change
            </NavLink>
          </div>
        </div>
      </div>

      {/* Customer Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Plan"
          value={activeSub?.planName || 'Enterprise Subscription'}
          subtitle={`Billing: ${activeSub?.billingFrequency || 'Monthly'}`}
          icon={Repeat}
          highlight
        />

        <StatCard
          title="Next Renewal Date"
          value={activeSub?.nextBillingDate ? activeSub.nextBillingDate.slice(0, 10) : 'N/A'}
          subtitle={`Amount: ${formatCurrency(activeSub?.totalRecurringAmount)}`}
          icon={Calendar}
        />

        <StatCard
          title="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle={totalOutstanding > 0 ? 'Payment pending' : 'Account current'}
          icon={Receipt}
          trend={
            totalOutstanding > 0
              ? { value: 'Payment due', isPositive: false, period: '' }
              : { value: 'Zero balance', isPositive: true, period: 'All clear' }
          }
        />

        <StatCard
          title="Completed Payments"
          value={payments.length}
          subtitle={`Total settled: ${formatCurrency(
            payments.reduce((sum, p) => sum + (p.amount || 0), 0)
          )}`}
          icon={CreditCard}
        />
      </div>

      {/* Main Subscriptions Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Your Subscriptions
            </h3>
            <p className="text-xs text-slate-500">Active contracts and recurring services</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {subscriptions.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">No active subscriptions found.</p>
          ) : (
            subscriptions.map(sub => (
              <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{sub.planName}</h4>
                    <Badge variant={getStatusBadgeVariant(sub.status)} size="sm">
                      {sub.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Subscription #{sub.subscriptionNumber} • Frequency: {sub.billingFrequency} • Seats: {sub.quantity}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Started on: {sub.startDate.slice(0, 10)} • Next Renewal: {sub.nextBillingDate?.slice(0, 10)}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <span className="text-base font-bold text-slate-900 font-tabular-nums">
                    {formatCurrency(sub.totalRecurringAmount)}
                    <span className="text-xs font-normal text-slate-400">/{sub.billingFrequency}</span>
                  </span>
                  <NavLink
                    to="/simulator"
                    className="mt-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Modify / Upgrade Plan →
                  </NavLink>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoices & Statements Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Invoices & Statements
            </h3>
            <p className="text-xs text-slate-500">Download official tax invoices and payment proofs</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5">Invoice #</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Due Date</th>
                <th className="py-2.5 text-right">Total Amount</th>
                <th className="py-2.5 text-right">Outstanding</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No invoices issued yet.
                  </td>
                </tr>
              ) : (
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-semibold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                    <td className="py-3 text-slate-500">{inv.invoiceDate.slice(0, 10)}</td>
                    <td className="py-3 text-slate-500">{inv.dueDate.slice(0, 10)}</td>
                    <td className="py-3 text-right font-medium font-tabular-nums text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3 text-right font-bold font-tabular-nums text-rose-600">
                      {formatCurrency(inv.outstandingAmount)}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={getStatusBadgeVariant(inv.status)} size="sm">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => downloadInvoicePdf(inv)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Download className="h-3 w-3 text-slate-500" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
