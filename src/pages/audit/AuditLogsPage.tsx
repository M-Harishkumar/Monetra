import React, { useState, useEffect } from 'react';
import { History, Shield, Search, Clock, UserCheck } from 'lucide-react';
import { api } from '../../services/api.ts';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      return (
        l.description.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.eventType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-heading flex items-center gap-2">
          <History className="h-6 w-6 text-teal-600" />
          Immutable System Audit Trail
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Chronological, tamper-evident record of all billing modifications, payment reversals, and lifecycle changes.
        </p>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <input
          type="text"
          placeholder="Filter audit events by actor, event type, or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records matching search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{l.eventType}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{l.actorName}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                        {l.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-slate-600">{l.entityType}</td>
                    <td className="py-3 px-4 text-slate-600">{l.description}</td>
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
