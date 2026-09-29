import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Download, Calendar, Filter, DollarSign,
  TrendingUp, Users, PieChart as PieIcon, RefreshCw
} from 'lucide-react';
import { reportApi, transactionApi } from '../services/api';
import { ReportData, Transaction } from '../types';
import { TransactionModal } from '../components/TransactionModal';

export const ReportsPage: React.FC = () => {
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const { data: report, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ['report-period', periodType, dateFrom, dateTo, providerFilter],
    queryFn: () => reportApi.getPeriodReport(periodType, {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      provider: providerFilter !== 'ALL' ? providerFilter : undefined,
    })
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['report-tx-list', periodType, dateFrom, dateTo, providerFilter],
    queryFn: () => transactionApi.getAll({
      date_from: dateFrom || report?.date_from,
      date_to: dateTo || report?.date_to,
      provider: providerFilter !== 'ALL' ? providerFilter : undefined,
      limit: 100
    }),
    enabled: !!report
  });

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    reportApi.exportFile(format, {
      period_type: periodType,
      date_from: dateFrom || report?.date_from,
      date_to: dateTo || report?.date_to,
      provider: providerFilter !== 'ALL' ? providerFilter : undefined
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Financial Reconciliation & Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Audit Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Periodic calculations from individual transaction records.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Period Selector */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold">
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-850 w-full md:w-auto">
          {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPeriodType(t)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg capitalize transition-all ${
                periodType === t ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {periodType === 'custom' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Payment Providers</option>
            <option value="TELEBIRR">Telebirr</option>
            <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
            <option value="GENERIC">Generic / Other</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-emerald-500/20 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Total Period Revenue</span>
          <div className="text-2xl font-black text-emerald-400">
            {report ? `${Number(report.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '...'}
          </div>
          <p className="text-[11px] text-slate-500">From {report?.date_from} to {report?.date_to}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Total Transactions</span>
          <div className="text-2xl font-black text-white">{report?.total_transactions || 0}</div>
          <p className="text-[11px] text-slate-500">Verified receipt scans</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-2">
          <span className="text-xs uppercase font-bold text-slate-400">Average Transaction</span>
          <div className="text-2xl font-black text-white">
            {report ? `${Number(report.average_amount).toFixed(2)} ETB` : '...'}
          </div>
          <p className="text-[11px] text-slate-500">Per payment receipt</p>
        </div>
      </div>

      {/* Breakdown Grid: Providers & Waiters (Section 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Breakdown */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <span>Provider Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              TOTAL: <span className="text-emerald-400 font-bold">{report?.total_amount?.toLocaleString()} ETB</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2.5">Provider</th>
                  <th className="py-2.5 text-center">Transactions</th>
                  <th className="py-2.5 text-right">Amount (ETB)</th>
                  <th className="py-2.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {report?.providers_breakdown.map((p) => (
                  <tr key={p.provider}>
                    <td className="py-3 font-semibold text-white">{p.provider_display_name}</td>
                    <td className="py-3 text-center text-slate-300 font-mono">{p.transaction_count}</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      {p.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right text-slate-400 font-mono">{p.percentage_amount}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waiter Breakdown */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Waiter Performance</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2.5">Staff Name</th>
                  <th className="py-2.5 text-center">Transactions</th>
                  <th className="py-2.5 text-right">Total Amount (ETB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {report?.waiters_breakdown.map((w, idx) => (
                  <tr key={idx}>
                    <td className="py-3 font-semibold text-white">{w.waiter_name}</td>
                    <td className="py-3 text-center text-slate-300 font-mono">{w.transaction_count}</td>
                    <td className="py-3 text-right font-bold text-white">
                      {w.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Transaction Report Table (Section 15) */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-white">Report Transaction Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Provider/Bank</th>
                <th className="py-3 px-3">Reference No.</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payer</th>
                <th className="py-3 px-3">Waiter</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {transactionsData?.items.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-3 text-slate-300">{tx.payment_date}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-400">{tx.payment_time}</td>
                  <td className="py-3.5 px-3 font-semibold text-white">{tx.provider_display_name}</td>
                  <td className="py-3.5 px-3 font-mono text-emerald-400 font-bold">{tx.reference_number || '-'}</td>
                  <td className="py-3.5 px-3 font-extrabold text-white">{tx.amount ? `${tx.amount} ETB` : '-'}</td>
                  <td className="py-3.5 px-3 text-slate-300">{tx.payer_name || 'Customer'}</td>
                  <td className="py-3.5 px-3 text-slate-400">{tx.scanned_by_user_name || 'Abel'}</td>
                  <td className="py-3.5 px-3 text-slate-400">{tx.branch_name || 'Bole'}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {tx.receipt_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <TransactionModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onUpdated={refetch}
        />
      )}
    </div>
  );
};
