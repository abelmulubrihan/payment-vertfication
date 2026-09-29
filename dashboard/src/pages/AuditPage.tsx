import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, User, Calendar, Activity, Lock, RefreshCw } from 'lucide-react';
import { auditApi } from '../services/api';
import { AuditLog } from '../types';

export const AuditPage: React.FC = () => {
  const { data: logs, isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.getAll({ limit: 100 })
  });

  const getActionBadge = (action: string) => {
    if (action.includes('DUPLICATE')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (action.includes('CREATED')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (action.includes('EXPORTED')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
    return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Immutable Financial Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic and timestamped trail of all system, receipt and financial activities.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-2 transition-all self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Logs Feed */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-3">Staff / User</th>
                <th className="py-3 px-3">Details</th>
                <th className="py-3 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 uppercase text-[11px] font-semibold text-slate-300">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-white">
                      {log.user_name || 'System'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">
                      {log.details || JSON.stringify(log.new_value) || '-'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
