import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  UserCheck,
  FileText,
  Clock,
  X,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

export const RevenueGuardPage: React.FC = () => {
  const { role } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Investigation Drawer
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [staffNotes, setStaffNotes] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      const [alertData, staffData] = await Promise.all([
        api.getRevenueGuardAlerts(),
        api.getStaff().catch(() => []),
      ]);
      setAlerts(alertData);
      setStaffList(staffData);
    } catch (err) {
      console.error('Failed to load Revenue Guard alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleLiveScan = async () => {
    try {
      setIsScanning(true);
      const res = await api.scanRevenueGuard();
      alert(`Live scan completed! Detected ${res.alerts.length} issues totaling ${formatCurrency(res.totalExposure)} in financial leakage exposure.`);
      await loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const openInvestigation = (alertItem: any) => {
    setSelectedAlert(alertItem);
    setStaffNotes(alertItem.staffNotes || '');
    setAssignedStaffId(alertItem.assignedStaffId || '');
  };

  const handleUpdateAlert = async (status: string) => {
    if (!selectedAlert) return;
    try {
      setIsUpdating(true);
      await api.updateAlert(selectedAlert.id, {
        status,
        staffNotes,
        assignedStaffId,
      });
      setSelectedAlert(null);
      await loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to update alert.');
    } finally {
      setIsUpdating(false);
    }
  };

  const totalExposure = alerts
    .filter(a => a.status === 'new' || a.status === 'investigating')
    .reduce((sum, a) => sum + (a.estimatedFinancialImpact || 0), 0);

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const highCount = alerts.filter(a => a.severity === 'high' && a.status !== 'resolved').length;

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            Revenue Guard – Leakage Sentinel
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Automated 24/7 audit sentinel detecting unbilled active contracts, missed renewals, expired discounts, and unallocated cash.
          </p>
        </div>

        <button
          onClick={handleLiveScan}
          disabled={isScanning}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning System...' : 'Trigger Live Leakage Audit'}
        </button>
      </div>

      {/* Financial Exposure Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
            Total Revenue at Risk
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-rose-950 font-tabular-nums">
            {formatCurrency(totalExposure)}
          </h3>
          <p className="mt-1 text-xs text-rose-700">
            Unbilled recurring amounts and overdue arrears
          </p>
        </div>

        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Critical Severity Anomalies
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-amber-950 font-tabular-nums">
            {criticalCount}
          </h3>
          <p className="mt-1 text-xs text-amber-700">Immediate action required to stop cash bleed</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            High & Medium Alerts
          </p>
          <h3 className="mt-2 text-3xl font-extrabold text-slate-900 font-tabular-nums">
            {highCount}
          </h3>
          <p className="mt-1 text-xs text-slate-500">Scheduled for staff investigation and resolution</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-semibold">Filter Severity:</span>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          <span className="text-slate-500 font-semibold ml-2">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="new">New (Unassigned)</option>
            <option value="investigating">Under Investigation</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing {filteredAlerts.length} anomaly detections
        </span>
      </div>

      {/* Alerts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Issue Category</th>
                <th className="py-3 px-4">Customer Affected</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Est. Exposure</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Zero revenue leakage detected! All active billing matches expected ledger schedules.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(a.severity)} size="sm">
                        {a.severity}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono capitalize">
                      {a.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {a.customerName}
                      {a.subscriptionNumber && (
                        <p className="text-[10px] text-slate-400 font-mono">{a.subscriptionNumber}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs line-clamp-2">
                      {a.description}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold font-tabular-nums text-rose-600">
                      {formatCurrency(a.estimatedFinancialImpact)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="capitalize font-semibold text-xs text-slate-700">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openInvestigation(a)}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors shadow-2xs"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedAlert(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-rose-50/50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {selectedAlert.id} - Anomaly Review
                  </h3>
                  <Badge variant={getStatusBadgeVariant(selectedAlert.severity)} size="sm">
                    {selectedAlert.severity} Severity
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Issue Category</span>
                <p className="text-sm font-bold text-slate-900 capitalize mt-0.5">
                  {selectedAlert.category.replace(/_/g, ' ')}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Affected Customer</span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {selectedAlert.customerName}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Estimated Financial Loss</span>
                <p className="text-xl font-extrabold text-rose-600 font-tabular-nums mt-0.5">
                  {formatCurrency(selectedAlert.estimatedFinancialImpact)}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-1">
                <span className="font-bold text-slate-900 block">Root Cause Description:</span>
                <p className="text-slate-700 leading-relaxed">{selectedAlert.description}</p>
              </div>

              <div className="rounded-lg bg-teal-50 border border-teal-200 p-3.5 space-y-1 text-teal-900">
                <span className="font-bold block">Recommended Remediation:</span>
                <p className="text-teal-800 leading-relaxed">{selectedAlert.recommendedAction}</p>
              </div>

              {/* Assignment & Notes */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Investigating Staff Member
                  </label>
                  <select
                    value={assignedStaffId}
                    onChange={e => setAssignedStaffId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Investigation Notes
                  </label>
                  <textarea
                    rows={3}
                    value={staffNotes}
                    onChange={e => setStaffNotes(e.target.value)}
                    placeholder="Document root cause findings, customer contact log, and remediation steps..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Rule: Financial records are never automatically mutated. Staff manually resolve verified adjustments.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleUpdateAlert('dismissed')}
                disabled={isUpdating}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Dismiss False Positive
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateAlert('investigating')}
                  disabled={isUpdating}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleUpdateAlert('resolved')}
                  disabled={isUpdating}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
