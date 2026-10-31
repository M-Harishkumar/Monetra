import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Search, Eye, X } from 'lucide-react';
import { api } from '../../services/api.ts';
import { Badge } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';

export const EmailLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  useEffect(() => {
    const loadEmails = async () => {
      try {
        setIsLoading(true);
        const data = await api.getEmailLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load email logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmails();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
          <Mail className="h-6 w-6 text-teal-600" />
          Email Dispatch & Dunning Logs
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Inspection log of all system emails: welcome notices, invoices, payment receipts, renewal reminders, and overdue dunning.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Template Type</th>
                <th className="py-3 px-4 text-center">Delivery Status</th>
                <th className="py-3 px-4 text-right">View Message</th>
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
                logs.map(em => (
                  <tr key={em.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(em.sentAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">{em.recipient}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{em.subject}</td>
                    <td className="py-3 px-4 font-mono capitalize text-[11px] text-slate-500">
                      {em.templateType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success" size="sm">
                        {em.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmail(em)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        Preview
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Body Modal */}
      {selectedEmail && (
        <Modal
          isOpen={!!selectedEmail}
          onClose={() => setSelectedEmail(null)}
          title={selectedEmail.subject}
          description={`To: ${selectedEmail.recipient} • Sent: ${new Date(selectedEmail.sentAt).toLocaleString()}`}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 font-sans text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
            {selectedEmail.emailBody}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setSelectedEmail(null)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Close Preview
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
