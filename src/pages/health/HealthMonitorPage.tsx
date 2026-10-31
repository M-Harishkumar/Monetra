import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, AlertTriangle, AlertOctagon, Sliders, CheckCircle2 } from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const HealthMonitorPage: React.FC = () => {
  const { role } = useAuth();
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  // Admin configurable weights
  const [weights, setWeights] = useState({
    paymentReliability: 35,
    overduePenalty: 25,
    cancellationRisk: 20,
    statusFactor: 10,
    disputePenalty: 10,
  });

  const loadHealthData = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSubscriptionHealth();
      setHealthScores(data);
      if (data.length > 0) setSelectedSub(data[0]);
    } catch (err) {
      console.error('Failed to load health scores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
          <Activity className="h-6 w-6 text-teal-600" />
          Subscription Health Scoring Engine
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Transparent, explainable rule-based scoring (0–100) evaluating payment reliability, overdue friction, and churn signals.
        </p>
      </div>

      {/* Health Distribution Scorecard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800">Healthy (80–100)</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-950 font-tabular-nums">
            {healthScores.filter(s => s.category === 'Healthy').length} Subscriptions
          </p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Low churn risk; ideal expansion targets.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-800">At Risk (50–79)</span>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-950 font-tabular-nums">
            {healthScores.filter(s => s.category === 'At Risk').length} Subscriptions
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Payment delay or pending renewal friction.
          </p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800">Critical (0–49)</span>
            <AlertOctagon className="h-5 w-5 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-950 font-tabular-nums">
            {healthScores.filter(s => s.category === 'Critical').length} Subscriptions
          </p>
          <p className="text-[11px] text-rose-700 mt-0.5">
            Active cancellation request or multiple overdue bills.
          </p>
        </div>
      </div>

      {/* Split View: Subscriptions List vs Deep Dive Factor Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Accounts List (5 cols) */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden lg:col-span-5">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider">
              Monitored Subscriptions
            </h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
            {healthScores.map(s => {
              const isSelected = selectedSub?.subscriptionId === s.subscriptionId;
              return (
                <div
                  key={s.subscriptionId}
                  onClick={() => setSelectedSub(s)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-50/70 border-l-4 border-l-teal-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{s.customerName}</h4>
                      <p className="font-mono text-[11px] text-slate-400">
                        {s.subscriptionNumber} • {s.planName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-tabular-nums ${
                          s.category === 'Healthy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.category === 'At Risk'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.score} / 100
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Explainable Factors (7 cols) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-7">
          {selectedSub ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Health Factor Breakdown: {selectedSub.customerName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Subscription #{selectedSub.subscriptionNumber} • Recurring: {formatCurrency(selectedSub.totalRecurringAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-2xl font-extrabold font-tabular-nums ${
                      selectedSub.category === 'Healthy'
                        ? 'text-emerald-600'
                        : selectedSub.category === 'At Risk'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {selectedSub.score}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedSub.category}
                  </p>
                </div>
              </div>

              {/* Factors list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Contributing Scoring Factors
                </h4>

                <div className="space-y-2.5">
                  {(selectedSub.factors || []).map((factor: any, fIdx: number) => (
                    <div
                      key={fIdx}
                      className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900">{factor.name}</span>
                        <p className="text-slate-600 text-[11px]">{factor.description}</p>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs shrink-0 ml-3 ${
                          factor.impactScore < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {factor.impactScore < 0 ? `${factor.impactScore} pts` : '+0 pts'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action Checklist */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-950 mb-2">
                  Actionable Account Manager Recommendations
                </h4>
                <ul className="space-y-1.5 text-xs text-teal-900">
                  {(selectedSub.recommendedActions || []).map((action: string, aIdx: number) => (
                    <li key={aIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Select a subscription on the left to view explainable health calculations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
