import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Mail,
  Building,
  MapPin,
  FileText,
  CreditCard,
  Repeat,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  X,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const CustomersPage: React.FC = () => {
  const { role } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Drawer states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    billingAddress: '',
    taxId: '',
    country: 'India',
    city: 'Bengaluru',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCustomers({ search, status: statusFilter });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter]);

  const openCustomerDetail = async (id: string) => {
    setSelectedCustomerId(id);
    setIsDetailLoading(true);
    try {
      const data = await api.getCustomer(id);
      setCustomerDetail(data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setIsSubmitting(true);
      await api.createCustomer(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        billingAddress: '',
        taxId: '',
        country: 'India',
        city: 'Bengaluru',
      });
      await loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.setCustomerStatus(id, nextStatus);
      await loadCustomers();
      if (selectedCustomerId === id) {
        await openCustomerDetail(id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to change status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Customer Directory & Accounts
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Unified ledger of customer profiles, ongoing subscriptions, issued invoices, and outstanding receivables.
          </p>
        </div>

        {role !== 'CUSTOMER' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Customer
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, company, email, or customer ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-xs">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Accounts</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Account / Company</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Active Subs</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
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
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">{c.customerNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      {c.companyName && <p className="text-[11px] text-slate-400">{c.companyName}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <p>{c.email}</p>
                      {c.phone && <p className="text-[11px] text-slate-400">{c.phone}</p>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-800">
                        {c.activeSubscriptionsCount ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium font-tabular-nums text-slate-900">
                      {formatCurrency(c.totalInvoiced)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-tabular-nums">
                      <span className={c.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {formatCurrency(c.outstandingBalance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(c.status)} size="sm">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openCustomerDetail(c.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Side Sheet */}
      {selectedCustomerId && customerDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomerId(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {customerDetail.customer.name}
                  </h3>
                  <Badge variant={getStatusBadgeVariant(customerDetail.customer.status)} size="sm">
                    {customerDetail.customer.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  #{customerDetail.customer.customerNumber} • {customerDetail.customer.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400">Company:</span>
                    <p className="font-semibold text-slate-800">{customerDetail.customer.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Tax ID / GST:</span>
                    <p className="font-semibold text-slate-800 font-mono">{customerDetail.customer.taxId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span>
                    <p className="font-semibold text-slate-800">
                      {customerDetail.customer.city}, {customerDetail.customer.country}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Billing Address:</span>
                    <p className="font-semibold text-slate-800">{customerDetail.customer.billingAddress || 'N/A'}</p>
                  </div>
                </div>

                {role === 'ADMIN' && (
                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() =>
                        handleStatusToggle(customerDetail.customer.id, customerDetail.customer.status)
                      }
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      {customerDetail.customer.status === 'ACTIVE'
                        ? 'Deactivate Account'
                        : 'Reactivate Account'}
                    </button>
                  </div>
                )}
              </div>

              {/* Subscriptions section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Repeat className="h-4 w-4 text-teal-600" />
                  Subscription Portfolio ({customerDetail.subscriptions.length})
                </h4>
                <div className="space-y-2">
                  {customerDetail.subscriptions.map((s: any) => (
                    <div key={s.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{s.subscriptionNumber}</span>
                          <Badge variant={getStatusBadgeVariant(s.status)} size="sm">
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Frequency: {s.billingFrequency} • Next Billing: {s.nextBillingDate?.slice(0, 10)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 font-tabular-nums">
                        {formatCurrency(s.totalRecurringAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Invoices History ({customerDetail.invoices.length})
                </h4>
                <div className="space-y-2">
                  {customerDetail.invoices.map((inv: any) => (
                    <div key={inv.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</span>
                          <Badge variant={getStatusBadgeVariant(inv.status)} size="sm">
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Due Date: {inv.dueDate?.slice(0, 10)} • Outstanding: {formatCurrency(inv.outstandingAmount)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 font-tabular-nums">
                        {formatCurrency(inv.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Recorded Payments ({customerDetail.payments.length})
                </h4>
                <div className="space-y-2">
                  {customerDetail.payments.map((p: any) => (
                    <div key={p.id} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{p.paymentNumber}</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Method: {p.paymentMethod} • Ref: {p.transactionReference}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600 font-tabular-nums">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Customer"
        description="Add a verified customer account for billing, quotations, and recurring contracts."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Contact Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Johnathan Miller"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Acme Global Inc."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID / GST Number</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="29AABCB1234F1Z8"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Street Address</label>
            <textarea
              rows={2}
              value={formData.billingAddress}
              onChange={e => setFormData({ ...formData, billingAddress: e.target.value })}
              placeholder="Suite 500, Tech Park Avenue..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
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
              disabled={isSubmitting}
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
