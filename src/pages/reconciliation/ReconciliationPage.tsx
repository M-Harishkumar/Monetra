import React, { useState, useEffect } from 'react';
import {
  Scale,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Check,
  Download,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api, formatCurrency } from '../../services/api.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';

export const ReconciliationPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Manual Match selection
  const [matchingTxn, setMatchingTxn] = useState<any>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

  const loadReconciliation = async () => {
    try {
      setIsLoading(true);
      const [reconData, invList] = await Promise.all([
        api.getReconciliationData(),
        api.getInvoices(),
      ]);
      setData(reconData);
      setInvoices(invList.filter((i: any) => i.status !== 'PAID' && i.status !== 'CANCELLED'));
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliation();
  }, []);

  const handleUploadSampleCsv = async () => {
    // Generate realistic bank CSV statement
    const sampleCsv = `Date,Reference,Description,Amount,Customer,Invoice
2025-01-15,TXN-HDFC-991204,"NEFT INWARD ACME CLOUD SOLUTIONS INV-2025-002",8258.82,Acme Cloud Solutions,INV-2025-002
2025-01-16,TXN-WIRE-448102,"WIRE FROM APEX MEDIA LABS PARTIAL PAYMENT",5000.00,Apex Media Labs,INV-2025-003
2025-01-16,TXN-STRIPE-448129,"DUPLICATE REF STRIPE CARD SETTLEMENT",10000.00,Apex Media Labs,INV-2025-003
2025-01-17,TXN-IMPS-119283,"IMPS UNKNOWN DEPOSIT / DIRECT VENDOR CREDIT",3500.00,,`;

    try {
      setIsUploading(true);
      const res = await api.uploadReconciliationCsv({
        fileName: 'Bank_Statement_Jan_2025.csv',
        csvContent: sampleCsv,
      });
      alert(`Imported ${res.bankImport.totalRows} bank transactions! ${res.bankImport.matchedRows} exact matches auto-categorized.`);
      await loadReconciliation();
    } catch (err: any) {
      alert(err.message || 'CSV upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmMatch = async (txn: any, invoiceIdToMatch?: string) => {
    const targetInvId = invoiceIdToMatch || invoices.find(i => i.invoiceNumber === txn.invoiceMatch)?.id;
    if (!targetInvId) {
      alert('Please select an invoice to allocate this bank payment against.');
      return;
    }

    try {
      await api.matchReconciliation({
        bankTransactionId: txn.id,
        invoiceId: targetInvId,
      });
      alert('Bank transaction matched! Payment recorded and invoice balance updated.');
      setMatchingTxn(null);
      await loadReconciliation();
    } catch (err: any) {
      alert(err.message || 'Matching failed.');
    }
  };

  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
            <Scale className="h-6 w-6 text-teal-600" />
            Payment Reconciliation Assistant
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Import external bank statement CSVs, auto-match by UTR/Invoice reference, and perform authorized payment ledger allocations.
          </p>
        </div>

        <button
          onClick={handleUploadSampleCsv}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Parsing Statement...' : 'Import Statement CSV (Sample)'}
        </button>
      </div>

      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase text-slate-500">Total Imported</span>
          <p className="mt-1 text-2xl font-bold text-slate-900 font-tabular-nums">{transactions.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase text-emerald-800">Exact Matches</span>
          <p className="mt-1 text-2xl font-bold text-emerald-950 font-tabular-nums">
            {transactions.filter((t: any) => t.matchStatus === 'exact').length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase text-amber-800">Possible / Review</span>
          <p className="mt-1 text-2xl font-bold text-amber-950 font-tabular-nums">
            {transactions.filter((t: any) => t.matchStatus === 'possible').length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
          <span className="text-xs font-bold uppercase text-slate-500">Unmatched Deposits</span>
          <p className="mt-1 text-2xl font-bold text-slate-700 font-tabular-nums">
            {transactions.filter((t: any) => t.matchStatus === 'unmatched').length}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Bank Transactions & Matching Engine
          </h3>
          <span className="text-xs text-slate-400">
            Rule: Ambiguous transactions are never auto-allocated without staff verification.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bank Reference</th>
                <th className="py-3 px-4">Narrative / Description</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4">Suggested Account</th>
                <th className="py-3 px-4 text-center">Match Status</th>
                <th className="py-3 px-4 text-right">Reconciliation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No bank statement records imported yet.
                  </td>
                </tr>
              ) : (
                transactions.map((txn: any) => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500">{txn.transactionDate.slice(0, 10)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{txn.transactionReference}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{txn.description}</td>
                    <td className="py-3.5 px-4 text-right font-bold font-tabular-nums text-emerald-600">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {txn.customerNameMatch ? (
                        <div>
                          <span className="font-semibold text-slate-900">{txn.customerNameMatch}</span>
                          {txn.invoiceMatch && (
                            <span className="block font-mono text-[10px] text-slate-400">
                              Matches {txn.invoiceMatch}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unknown Customer</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={getStatusBadgeVariant(txn.matchStatus)} size="sm">
                        {txn.matchStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {txn.matchStatus === 'exact' && !txn.matchedPaymentId && (
                        <button
                          onClick={() => handleConfirmMatch(txn)}
                          className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                        >
                          Approve Match
                        </button>
                      )}

                      {txn.matchStatus === 'possible' && (
                        <button
                          onClick={() => {
                            setMatchingTxn(txn);
                            setSelectedInvoiceId('');
                          }}
                          className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 border border-amber-200"
                        >
                          Manual Allocate
                        </button>
                      )}

                      {txn.matchedPaymentId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Reconciled
                        </span>
                      )}

                      {txn.matchStatus === 'duplicate' && (
                        <span className="text-[11px] font-bold text-rose-600">Duplicate</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Allocation Modal */}
      {matchingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Manual Invoice Allocation
            </h3>
            <p className="text-xs text-slate-500">
              Transaction: <strong>{matchingTxn.transactionReference}</strong> for{' '}
              <strong className="text-emerald-700 font-bold">{formatCurrency(matchingTxn.amount)}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Open Invoice to Allocate
              </label>
              <select
                value={selectedInvoiceId}
                onChange={e => setSelectedInvoiceId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Select open invoice...</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customerName} (Due: {formatCurrency(inv.outstandingAmount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setMatchingTxn(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmMatch(matchingTxn, selectedInvoiceId)}
                disabled={!selectedInvoiceId}
                className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
