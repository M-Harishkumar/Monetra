import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Repeat,
  ExternalLink,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { downloadQuotationPdf } from '../../components/common/PdfGenerator.ts';

export const QuotationsPage: React.FC = () => {
  const { role } = useAuth();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    planId: '',
    quantity: 1,
    paymentTerms: 'Net 30',
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [qList, cList, pList] = await Promise.all([
        api.getQuotations(),
        api.getCustomers(),
        api.getPlans(),
      ]);
      setQuotations(qList);
      setCustomers(cList);
      setPlans(pList);
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuotation(form);
      setIsCreateModalOpen(false);
      setForm({ customerId: '', planId: '', quantity: 1, paymentTerms: 'Net 30', notes: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create quotation.');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateQuotationStatus(id, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Status change failed.');
    }
  };

  const handleConvert = async (id: string) => {
    if (!confirm('Convert this accepted quotation into an active subscription and issue initial invoice?')) {
      return;
    }
    try {
      const res = await api.convertQuotation(id);
      alert(`Success! Subscription ${res.subscription.subscriptionNumber} and Invoice ${res.invoice.invoiceNumber} created.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Conversion failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Quotations & Commercial Proposals
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Draft contract proposals, calculate taxes, dispatch PDF quotes, and convert to active subscriptions.
          </p>
        </div>

        {role !== 'CUSTOMER' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Quotation
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan / Offering</th>
                <th className="py-3 px-4">Terms</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                quotations.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{q.quotationNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{q.customerName || 'Customer'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{q.planName || 'Custom Plan'} (Qty: {q.quantity})</td>
                    <td className="py-3.5 px-4 text-slate-500">{q.paymentTerms}</td>
                    <td className="py-3.5 px-4 text-right font-medium font-tabular-nums text-slate-700">
                      {formatCurrency(q.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-tabular-nums text-slate-900">
                      {formatCurrency(q.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(q.status)} size="sm">
                        {q.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => downloadQuotationPdf(q)}
                          title="Download PDF"
                          className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {q.status === 'DRAFT' && role !== 'CUSTOMER' && (
                          <button
                            onClick={() => handleStatusChange(q.id, 'SENT')}
                            className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 border border-blue-200"
                          >
                            Send
                          </button>
                        )}

                        {q.status === 'SENT' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(q.id, 'ACCEPTED')}
                              className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusChange(q.id, 'REJECTED')}
                              className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-200"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {q.status === 'ACCEPTED' && role !== 'CUSTOMER' && (
                          <button
                            onClick={() => handleConvert(q.id)}
                            className="rounded-md bg-teal-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-teal-700 shadow-2xs"
                          >
                            Convert to Sub
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

      {/* Create Quotation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Draft Commercial Quotation"
        description="Select customer, subscription plan, and configure quantities."
      >
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Customer *</label>
            <select
              required
              value={form.customerId}
              onChange={e => setForm({ ...form, customerId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">Select a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.companyName || c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan *</label>
              <select
                required
                value={form.planId}
                onChange={e => setForm({ ...form, planId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Select a plan...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.billingPrice)}/{p.billingFrequency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Seats / Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
            <select
              value={form.paymentTerms}
              onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Due Upon Receipt">Due Upon Receipt</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Includes custom onboarding SLA package..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              Draft Quotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
