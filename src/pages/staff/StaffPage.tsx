import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, ShieldCheck, Mail, Phone, Lock } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const StaffPage: React.FC = () => {
  const { role } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      const data = await api.getStaff();
      setStaff(data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaff(form);
      setIsModalOpen(false);
      setForm({ name: '', email: '', phone: '', password: '' });
      await loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to create staff account.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-teal-600" />
            Staff Accounts & Role-Based Permissions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Provision operational staff with scoped permissions to manage accounts, issue quotations, and reconcile payments.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Provision Staff Member
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Role Permission</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : (
                staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{s.email}</td>
                    <td className="py-3.5 px-4 text-slate-500">{s.phone || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                          s.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="success" size="sm">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{s.createdAt.slice(0, 10)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Staff Account"
        description="Creates an operational account with Staff role permissions."
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rachel Adams"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="rachel.adams@nexora.io"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Staff@Nexora123!"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            Staff can view assigned accounts, manage quotations and subscriptions, and reconcile payments, but cannot alter system settings.
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
