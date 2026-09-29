import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Filter, Calendar, RefreshCw, ArrowUpDown,
  Receipt, DollarSign, Download, CheckCircle, AlertTriangle
} from 'lucide-react';
import { transactionApi, reportApi } from '../services/api';
import { Transaction } from '../types';
import { TransactionModal } from '../components/TransactionModal';

export const DailyTransactionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['daily-transactions', providerFilter, searchTerm],
    queryFn: () => transactionApi.getAll({
      date_from: new Date().toISOString().slice(0, 10),
      date_to: new Date().toISOString().slice(0, 10),
      provider: providerFilter,
      search: searchTerm,
      limit: 100
    }),
    refetchInterval: 8000
  });

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    reportApi.exportFile(format, {
      date_from: new Date().toISOString().slice(0, 10),
      date_to: new Date().toISOString().slice(0, 10),
      provider: providerFilter,
      search: searchTerm
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Today's Transactions & Today's Total (Section 11) */}
      <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Today's Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Daily Transactions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed of all payment receipts scanned today.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[130px]">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Today's Total</span>
            <span className="text-xl font-black text-emerald-400">
              {data ? `${Number(data.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '...'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[110px]">
            <span className="text-[11px] uppercase font-bold text-slate-400 block">Transactions</span>
            <span className="text-xl font-black text-white">{data?.total_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Reference No, Payer, Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="ALL">All Providers</option>
            <option value="TELEBIRR">Telebirr</option>
            <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
            <option value="GENERIC">Generic / Other</option>
          </select>

          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Table: Time | Bank/Provider | Amount | Reference No */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                <th className="py-4 px-4 font-bold">Time</th>
                <th className="py-4 px-4 font-bold">Bank / Provider</th>
                <th className="py-4 px-4 font-bold">Reference No.</th>
                <th className="py-4 px-4 font-bold">Payer</th>
                <th className="py-4 px-4 font-bold">Waiter</th>
                <th className="py-4 px-4 font-bold text-right">Amount (ETB)</th>
                <th className="py-4 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {data?.items && data.items.length > 0 ? (
                data.items.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-4 font-mono text-slate-300 font-medium">
                      {tx.payment_time || tx.created_at.slice(11, 16)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        tx.provider === 'CBE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {tx.provider_display_name || tx.provider}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-emerald-400 font-bold">
                      {tx.reference_number || tx.invoice_number || '-'}
                    </td>
                    <td className="py-4 px-4 text-slate-300">{tx.payer_name || 'Customer'}</td>
                    <td className="py-4 px-4 text-slate-400 font-medium">{tx.scanned_by_user_name || 'Abel'}</td>
                    <td className="py-4 px-4 font-black text-white text-right text-sm">
                      {tx.amount ? `${Number(tx.amount).toFixed(2)} ETB` : '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tx.is_duplicate
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {tx.receipt_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No transactions found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdated={refetch}
        />
      )}
    </div>
  );
};
