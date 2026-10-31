import React, { useState, useEffect } from 'react';
import { Layers, Plus, Calendar, Shield, Check, Info } from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const PlansPage: React.FC = () => {
  const { role } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    billingPrice: '',
    billingFrequency: 'monthly',
    minimumQuantity: 1,
    allowPause: true,
    allowEarlyClosure: true,
    allowAutoClosure: true,
    allowRenewal: true,
    allowUpgrade: true,
    allowDowngrade: true,
  });

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlan({
        ...form,
        billingPrice: Number(form.billingPrice),
        minimumQuantity: Number(form.minimumQuantity),
      });
      setIsModalOpen(false);
      setForm({
        name: '',
        code: '',
        description: '',
        billingPrice: '',
        billingFrequency: 'monthly',
        minimumQuantity: 1,
        allowPause: true,
        allowEarlyClosure: true,
        allowAutoClosure: true,
        allowRenewal: true,
        allowUpgrade: true,
        allowDowngrade: true,
      });
      await loadPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to create plan.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Subscription Plans & Policy Rules
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Configure calendar-aware billing schedules (daily, weekly, monthly, yearly) and lifecycle policies.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Subscription Plan
          </button>
        )}
      </div>

      {/* Calendar-Aware Policy Documentation Card */}
      <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 p-4 text-xs text-teal-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">NEXORA Calendar-Aware Billing Date Policy:</p>
          <p className="text-teal-800 text-[11px] leading-relaxed">
            Recurring monthly cycles billed on day 29, 30, or 31 automatically cap at the target month's maximum days
            (e.g., January 31st advances to February 28th on standard years, or February 29th on leap years).
            Yearly renewals handle February 29th leap days accurately. Next billing dates are advanced only after
            successful invoice snapshot creation.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <div
            key={plan.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {plan.code}
                </span>
                <Badge variant={getStatusBadgeVariant(plan.status)} size="sm">
                  {plan.status}
                </Badge>
              </div>

              <h3 className="mt-3 text-lg font-bold text-slate-900 font-heading">{plan.name}</h3>
              <p className="mt-1 text-xs text-slate-600 line-clamp-2">{plan.description}</p>

              {/* Price Tag */}
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 font-tabular-nums">
                  {formatCurrency(plan.billingPrice)}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  /{plan.billingFrequency}
                </span>
              </div>

              {/* Lifecycle Policy Matrix */}
              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Plan Policy Rules:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={plan.allowPause ? 'text-emerald-600' : 'text-slate-300'}>●</span>
                    <span>Pause: {plan.allowPause ? 'Allowed' : 'Prohibited'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={plan.allowEarlyClosure ? 'text-emerald-600' : 'text-slate-300'}>●</span>
                    <span>Early Close: {plan.allowEarlyClosure ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={plan.allowUpgrade ? 'text-emerald-600' : 'text-slate-300'}>●</span>
                    <span>Upgrade: {plan.allowUpgrade ? 'Permitted' : 'Locked'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className={plan.allowRenewal ? 'text-emerald-600' : 'text-slate-300'}>●</span>
                    <span>Renewal: {plan.allowRenewal ? 'Auto-renew' : 'Manual'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span>Min Qty: {plan.minimumQuantity || 1} seat</span>
              <span className="text-teal-600 font-semibold font-mono">CALENDAR-AWARE</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Plan"
        description="Set billing frequency, price, and operational policies."
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Enterprise Pro Plus"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Code *</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="PRO-PLUS-M"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.billingPrice}
                onChange={e => setForm({ ...form, billingPrice: e.target.value })}
                placeholder="8999.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Frequency *</label>
              <select
                value={form.billingFrequency}
                onChange={e => setForm({ ...form, billingFrequency: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Features and SLA entitlements..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="rounded-lg bg-slate-50 p-3 space-y-2 border border-slate-200">
            <span className="text-[11px] font-bold uppercase text-slate-700">Lifecycle Permissions:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowPause}
                  onChange={e => setForm({ ...form, allowPause: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>Allow Temporary Pause</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowEarlyClosure}
                  onChange={e => setForm({ ...form, allowEarlyClosure: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>Allow Early Closure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowUpgrade}
                  onChange={e => setForm({ ...form, allowUpgrade: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>Allow Tier Upgrade</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowDowngrade}
                  onChange={e => setForm({ ...form, allowDowngrade: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>Allow Tier Downgrade</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700"
            >
              Save Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
