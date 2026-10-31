import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Download,
  CreditCard,
  Ban,
  CheckCircle,
  Clock,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { downloadInvoicePdf } from '../../components/common/PdfGenerator.ts';

export const InvoicesPage: React.FC = () => {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: '',
    notes: '',
  });

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openPaymentModal = (invoice: any) => {
    setActiveInvoice(invoice);
    setPaymentForm({
      amount: String(invoice.outstandingAmount),
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: `TXN-${Date.now().toString().slice(-6)}`,
      notes: `Settlement for invoice ${invoice.invoiceNumber}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;

    try {
      await api.recordPayment({
        customerId: activeInvoice.customerId,
        invoiceId: activeInvoice.id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        notes: paymentForm.notes,
      });
      setIsPaymentModalOpen(false);
      await loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed.');
    }
  };

  const handleCancelInvoice = async (id: string) => {
    const reason = prompt('Enter justification reason for invoice cancellation:');
    if (!reason) return;

    try {
      await api.cancelInvoice(id, reason);
      await loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Invoice cancellation failed.');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter === 'overdue' && !inv.isOverdue) return false;
    if (statusFilter !== 'all' && statusFilter !== 'overdue' && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        (inv.billingPeriod && inv.billingPeriod.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Invoice Management & Historical Snapshots
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Immutable financial snapshots preserving historical item rates, tax breakdowns, and payment allocations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, or billing period..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-xs">Filter by:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Invoices</option>
            <option value="overdue">Overdue Invoices</option>
            <option value="CONFIRMED">Confirmed (Pending Payment)</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Fully Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No invoices matching filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{inv.customerName}</p>
                      {inv.subscriptionNumber && (
                        <p className="text-[10px] text-slate-400 font-mono">{inv.subscriptionNumber}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{inv.billingPeriod}</td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.invoiceDate.slice(0, 10)}</td>
                    <td className="py-3.5 px-4">
                      <span className={inv.isOverdue ? 'font-bold text-rose-600' : 'text-slate-600'}>
                        {inv.dueDate.slice(0, 10)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium font-tabular-nums text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-tabular-nums">
                      <span className={inv.outstandingAmount > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {formatCurrency(inv.outstandingAmount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <Badge variant={getStatusBadgeVariant(inv.status)} size="sm">
                          {inv.status}
                        </Badge>
                        {inv.isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => downloadInvoicePdf(inv)}
                          title="Download PDF"
                          className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && role !== 'CUSTOMER' && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="rounded-md bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 border border-teal-200"
                          >
                            Record Payment
                          </button>
                        )}

                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && role === 'ADMIN' && (
                          <button
                            onClick={() => handleCancelInvoice(inv.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                            title="Cancel Invoice"
                          >
                            <Ban className="h-3.5 w-3.5" />
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${activeInvoice?.invoiceNumber}`}
        description="Allocate incoming bank wire, card, or UPI funds against invoice balance."
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold text-slate-900">{activeInvoice?.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Invoice Amount:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(activeInvoice?.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Outstanding:</span>
              <span className="font-bold text-rose-600">{formatCurrency(activeInvoice?.outstandingAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                required
                min="0.01"
                max={activeInvoice?.outstandingAmount}
                step="0.01"
                value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
              />
              <p className="mt-1 text-[10px] text-slate-400">Partial payments supported; over-allocation prevented.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                <option value="UPI">UPI / Instant Mandate</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash / Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference / UTR *</label>
            <input
              type="text"
              required
              value={paymentForm.transactionReference}
              onChange={e => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
              placeholder="e.g. TXN-WIRE-992102"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remittance Advice</label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="e.g. Authorized by customer finance dept..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              Confirm Payment Allocation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
