import React, { useState, useEffect } from 'react';
import { CreditCard, Search, RotateCcw, CheckCircle, AlertCircle, ArrowDownLeft } from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const PaymentsPage: React.FC = () => {
  const { role } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPayments();
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleReversePayment = async (id: string, ref: string) => {
    const reason = prompt(`Enter justification for reversing payment ${ref}:`);
    if (!reason) return;

    try {
      await api.reversePayment(id, reason);
      alert('Payment reversed successfully and invoice balance restored.');
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'Payment reversal failed.');
    }
  };

  const filteredPayments = payments.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      return (
        p.paymentNumber.toLowerCase().includes(q) ||
        p.transactionReference.toLowerCase().includes(q) ||
        (p.customerName && p.customerName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Payment Records & Ledger
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Audit history of realized customer payments, methods (Wire, UPI, Card), allocations, and reversals.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by payment #, UTR reference, or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Payment #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Invoice Linked</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Transaction Ref / UTR</th>
                <th className="py-3 px-4 text-right">Settled Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.customerName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {p.invoiceNumber ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5">{p.invoiceNumber}</span>
                      ) : (
                        <span className="text-amber-600 font-semibold text-[11px]">Unallocated Deposit</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{p.paymentDate.slice(0, 10)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{p.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{p.transactionReference}</td>
                    <td className="py-3.5 px-4 text-right font-bold font-tabular-nums text-emerald-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(p.status)} size="sm">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'COMPLETED' && role === 'ADMIN' && (
                        <button
                          onClick={() => handleReversePayment(p.id, p.paymentNumber)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                          title="Reverse Payment"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reverse
                        </button>
                      )}
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
