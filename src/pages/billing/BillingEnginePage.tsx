import React, { useState, useEffect } from 'react';
import { Zap, Play, CheckCircle2, AlertOctagon, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';

export const BillingEnginePage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastExecutionResult, setLastExecutionResult] = useState<any>(null);

  const loadRuns = async () => {
    try {
      setIsLoading(true);
      const data = await api.getBillingRuns();
      setRuns(data);
    } catch (err) {
      console.error('Failed to load billing runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleTriggerRun = async () => {
    try {
      setIsRunning(true);
      const result = await api.triggerBillingRun();
      setLastExecutionResult(result);
      await loadRuns();
    } catch (err: any) {
      alert(err.message || 'Billing execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Trigger Run */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
            Automated Recurring Billing Engine
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Calendar-aware scheduled daemon scanning active subscriptions, enforcing idempotency locks, and advancing billing anchors.
          </p>
        </div>

        <button
          onClick={handleTriggerRun}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          <Zap className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Executing Billing Run...' : 'Execute Manual Billing Run'}
        </button>
      </div>

      {/* Safety & Idempotency Guarantee Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            Duplicate Prevention
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Idempotent composite constraint on <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">[subscriptionId, billingPeriod]</code> guarantees zero duplicate bills.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <Clock className="h-4 w-4 text-blue-600" />
            Date Advancement Policy
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Next billing date is advanced <em>only after</em> successful invoice creation. Never advanced on failure.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
            <RefreshCw className="h-4 w-4 text-purple-600" />
            Calendar-Aware Logic
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Leap years (Feb 29) and month-end anchors (Jan 31 → Feb 28) are computed cleanly without drift.
          </p>
        </div>
      </div>

      {/* Latest Execution Details Banner */}
      {lastExecutionResult && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-5 shadow-2xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-teal-950 font-heading flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              Latest Billing Run Result ({lastExecutionResult.runNumber})
            </h3>
            <span className="text-xs text-teal-700 font-medium">
              Executed at {new Date(lastExecutionResult.runDate).toLocaleTimeString()}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-xs border-t border-teal-200/60 pt-3">
            <div>
              <span className="text-teal-700">Scanned:</span>
              <p className="font-bold text-teal-950 text-base">{lastExecutionResult.totalSubscriptionsScanned}</p>
            </div>
            <div>
              <span className="text-teal-700">Successful:</span>
              <p className="font-bold text-emerald-700 text-base">{lastExecutionResult.successfulInvoicesCount}</p>
            </div>
            <div>
              <span className="text-teal-700">Skipped (Not Due/Policy):</span>
              <p className="font-bold text-slate-700 text-base">{lastExecutionResult.skippedCount}</p>
            </div>
            <div>
              <span className="text-teal-700">Failed Attempts:</span>
              <p className="font-bold text-rose-700 text-base">{lastExecutionResult.failedInvoicesCount}</p>
            </div>
          </div>
          {lastExecutionResult.logDetails && (
            <div className="mt-3 rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-200 max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{lastExecutionResult.logDetails}</pre>
            </div>
          )}
        </div>
      )}

      {/* Execution Runs History Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Billing Execution History
          </h3>
          <span className="text-xs text-slate-500">Scheduled node-cron & manual triggers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Run #</th>
                <th className="py-3 px-4">Execution Timestamp</th>
                <th className="py-3 px-4">Triggered By</th>
                <th className="py-3 px-4 text-center">Subscriptions Scanned</th>
                <th className="py-3 px-4 text-center">Invoices Generated</th>
                <th className="py-3 px-4 text-center">Skipped</th>
                <th className="py-3 px-4 text-center">Failed</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No billing runs on record. Click 'Execute Manual Billing Run' above.
                  </td>
                </tr>
              ) : (
                runs.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.runNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600">{new Date(r.runDate).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{r.scheduledBy}</td>
                    <td className="py-3.5 px-4 text-center font-bold font-tabular-nums text-slate-800">
                      {r.totalSubscriptionsScanned}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-tabular-nums text-emerald-600">
                      {r.successfulInvoicesCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium font-tabular-nums text-slate-500">
                      {r.skippedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-tabular-nums text-rose-600">
                      {r.failedInvoicesCount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                        {r.status}
                      </Badge>
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
