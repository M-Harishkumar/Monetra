import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  TrendingUp,
  RotateCw,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';

export const SimulatorPage: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'change' | 'whatif'>('change');

  // Subscription Change Simulator state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState('');
  const [targetPlanId, setTargetPlanId] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(1);
  const [changePreview, setChangePreview] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // What-If Revenue Simulator state
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenarioForm, setScenarioForm] = useState({
    name: 'Q2 Aggressive Expansion Model',
    description: '10% Price Increase on Enterprise tier with 25 new Starter accounts',
    priceAdjustmentPct: 10,
    newCustomerCount: 20,
    churnReductionPct: 5,
    notes: 'Models expansion assumptions',
  });
  const [isSavingScenario, setIsSavingScenario] = useState(false);

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [subs, pls, scns] = await Promise.all([
          api.getSubscriptions(),
          api.getPlans(),
          api.getScenarios().catch(() => []),
        ]);
        setSubscriptions(subs);
        setPlans(pls);
        setScenarios(scns);
        if (subs.length > 0) {
          setSelectedSubId(subs[0].id);
          setTargetQuantity(subs[0].quantity || 1);
        }
        if (pls.length > 1) {
          setTargetPlanId(pls[1].id);
        }
      } catch (err) {
        console.error('Failed to load simulator data:', err);
      }
    };
    loadInit();
  }, []);

  // Recalculate Change Proration when selection changes
  useEffect(() => {
    if (!selectedSubId || !targetPlanId) return;

    const runSimulation = async () => {
      try {
        setIsSimulating(true);
        const res = await api.previewSubscriptionChange({
          subscriptionId: selectedSubId,
          proposedPlanId: targetPlanId,
          proposedQuantity: targetQuantity,
        });
        setChangePreview(res);
      } catch (err) {
        console.error('Error simulating change:', err);
      } finally {
        setIsSimulating(false);
      }
    };

    runSimulation();
  }, [selectedSubId, targetPlanId, targetQuantity]);

  const handleApplyChange = async () => {
    if (!confirm('Apply this plan modification to the active customer contract?')) return;
    try {
      setIsApplying(true);
      await api.applySubscriptionChange({
        subscriptionId: selectedSubId,
        proposedPlanId: targetPlanId,
        proposedQuantity: targetQuantity,
      });
      alert('Subscription plan successfully updated! Timeline audit event recorded.');
      const updatedSubs = await api.getSubscriptions();
      setSubscriptions(updatedSubs);
    } catch (err: any) {
      alert(err.message || 'Failed to apply change.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingScenario(true);
      const newScenario = await api.createScenario(scenarioForm);
      setScenarios([newScenario, ...scenarios]);
      alert(`What-If Scenario '${newScenario.name}' saved successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to save scenario.');
    } finally {
      setIsSavingScenario(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Mode Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Revenue & Subscription Simulation Studio
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Preview mid-cycle proration credits and model hypothetical portfolio revenue scenarios.
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setActiveTab('change')}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              activeTab === 'change'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mid-Cycle Change Simulator
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`rounded-md px-3.5 py-1.5 transition-colors ${
              activeTab === 'whatif'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            What-If Portfolio Modeler
          </button>
        </div>
      </div>

      {activeTab === 'change' ? (
        /* TAB 1: SUBSCRIPTION CHANGE SIMULATOR */
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 font-heading mb-4">
              Select Subscription & Target Tier Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Active Subscription</label>
                <select
                  value={selectedSubId}
                  onChange={e => setSelectedSubId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {subscriptions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.subscriptionNumber} ({s.customerName} - {s.planName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Plan</label>
                <select
                  value={targetPlanId}
                  onChange={e => setTargetPlanId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCurrency(p.billingPrice)}/{p.billingFrequency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Seat Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={targetQuantity}
                  onChange={e => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Proration Comparison Matrix (Section 21) */}
          {changePreview && (
            <div className="rounded-xl border border-teal-200/80 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-teal-100 bg-teal-50/70 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-teal-950 font-heading">
                    Proration & Impact Comparison
                  </h3>
                  <p className="text-xs text-teal-800">
                    Cycle days remaining: <strong>{changePreview.daysRemaining} days</strong> of{' '}
                    <strong>{changePreview.daysTotal} total days</strong>.
                  </p>
                </div>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                  Documented Daily Proration Policy
                </span>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2.5">Parameter</th>
                        <th className="py-2.5 text-right">Current Agreement</th>
                        <th className="py-2.5 text-right text-teal-700">Proposed Upgrade / Change</th>
                        <th className="py-2.5 text-right">Net Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-tabular-nums">
                      <tr>
                        <td className="py-3 font-semibold text-slate-900">Subscription Plan</td>
                        <td className="py-3 text-right">{changePreview.currentPlanName}</td>
                        <td className="py-3 text-right font-bold text-teal-800">{changePreview.proposedPlanName}</td>
                        <td className="py-3 text-right text-slate-400">—</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-slate-900">Allocated Seats</td>
                        <td className="py-3 text-right">{changePreview.currentQuantity} seat(s)</td>
                        <td className="py-3 text-right font-bold text-teal-800">{changePreview.proposedQuantity} seat(s)</td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {changePreview.proposedQuantity - changePreview.currentQuantity >= 0 ? '+' : ''}
                          {changePreview.proposedQuantity - changePreview.currentQuantity} seats
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-semibold text-slate-900">Base Recurring Rate</td>
                        <td className="py-3 text-right">{formatCurrency(changePreview.currentRecurringAmount)}</td>
                        <td className="py-3 text-right font-bold text-teal-800">{formatCurrency(changePreview.proposedRecurringAmount)}</td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {formatCurrency(changePreview.proposedRecurringAmount - changePreview.currentRecurringAmount)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="py-3 font-semibold text-slate-900">Unused Days Credit (Refund)</td>
                        <td className="py-3 text-right text-slate-400">—</td>
                        <td className="py-3 text-right text-emerald-600 font-bold">
                          - {formatCurrency(changePreview.creditForUnusedCurrent)}
                        </td>
                        <td className="py-3 text-right text-emerald-600 font-bold">Credit Applied</td>
                      </tr>
                      <tr className="bg-slate-50/70">
                        <td className="py-3 font-semibold text-slate-900">Remaining Days Charge (New Plan)</td>
                        <td className="py-3 text-right text-slate-400">—</td>
                        <td className="py-3 text-right text-rose-600 font-bold">
                          + {formatCurrency(changePreview.chargeForRemainingNew)}
                        </td>
                        <td className="py-3 text-right text-rose-600 font-bold">Pro-rata Charge</td>
                      </tr>
                      <tr className="border-t-2 border-slate-900 font-bold text-sm bg-teal-50/40">
                        <td className="py-3.5 text-slate-900 font-heading">Next Cycle Invoice Estimated Total</td>
                        <td className="py-3.5 text-right text-slate-400">—</td>
                        <td className="py-3.5 text-right text-teal-900 text-base">
                          {formatCurrency(changePreview.nextInvoiceEstimate)}
                        </td>
                        <td className="py-3.5 text-right text-slate-900 text-base">
                          Net Due: {formatCurrency(changePreview.netProratedAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {role !== 'CUSTOMER' && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleApplyChange}
                      disabled={isApplying}
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isApplying ? 'Applying Plan Update...' : 'Confirm & Apply Plan Modification'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: WHAT-IF REVENUE SIMULATOR (Section 23) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Parameters Form (5 cols) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-5">
              <h3 className="text-sm font-bold text-slate-900 font-heading mb-4">
                Hypothetical Scenario Modeling
              </h3>

              <form onSubmit={handleSaveScenario} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scenario Title *</label>
                  <input
                    type="text"
                    required
                    value={scenarioForm.name}
                    onChange={e => setScenarioForm({ ...scenarioForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price Adjustment (% Change across all plans)
                  </label>
                  <input
                    type="number"
                    value={scenarioForm.priceAdjustmentPct}
                    onChange={e => setScenarioForm({ ...scenarioForm, priceAdjustmentPct: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">e.g. +12% price hike, or -10% promo discount</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Customer Acquisitions Target (Monthly)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scenarioForm.newCustomerCount}
                    onChange={e => setScenarioForm({ ...scenarioForm, newCustomerCount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Churn Reduction Target (% improvement)
                  </label>
                  <input
                    type="number"
                    value={scenarioForm.churnReductionPct}
                    onChange={e => setScenarioForm({ ...scenarioForm, churnReductionPct: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>

                {role === 'ADMIN' && (
                  <button
                    type="submit"
                    disabled={isSavingScenario}
                    className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    {isSavingScenario ? 'Saving Model...' : 'Save & Compare Scenario'}
                  </button>
                )}
              </form>
            </div>

            {/* Saved Scenarios Comparison (7 cols) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-7">
              <h3 className="text-sm font-bold text-slate-900 font-heading mb-4">
                Saved Projections & Sensitivity Models
              </h3>

              <div className="space-y-4">
                {scenarios.map(sc => (
                  <div key={sc.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{sc.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{sc.description}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold font-mono">
                        +{sc.projectedGrowthPct}% Expansion
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400">Baseline vs Projected MRR:</span>
                        <p className="font-semibold text-slate-900 font-tabular-nums text-sm mt-0.5">
                          {formatCurrency(sc.baselineMrr)} → <strong className="text-emerald-700">{formatCurrency(sc.simulatedMrr)}</strong>
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Projected ARR Expansion:</span>
                        <p className="font-semibold text-slate-900 font-tabular-nums text-sm mt-0.5">
                          {formatCurrency(sc.baselineArr)} → <strong className="text-emerald-700">{formatCurrency(sc.simulatedArr)}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
