import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, Calendar, CreditCard, ArrowUpRight,
  ShieldCheck, Receipt, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { reportApi, transactionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { TransactionModal } from '../components/TransactionModal';

const PROVIDER_COLORS: Record<string, string> = {
  TELEBIRR: '#059669', // Emerald
  CBE: '#9333ea',      // Purple
  GENERIC: '#3b82f6',  // Blue
  AWASH: '#f59e0b',    // Amber
  BOA: '#06b6d4',      // Cyan
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Fetch Dashboard Metrics
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => reportApi.getDashboard(),
    refetchInterval: 10000 // auto-refresh every 10s
  });

  // Fetch Monthly Trend Data for Chart
  const { data: monthlyReport } = useQuery({
    queryKey: ['report-monthly-chart'],
    queryFn: () => reportApi.getPeriodReport('monthly')
  });

  // Fetch Recent Transactions
  const { data: recentTxs, refetch: refetchTxs } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => transactionApi.getAll({ limit: 8 })
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchTxs();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 p-6 rounded-3xl border border-emerald-500/20 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Restaurant Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Good Morning, {user?.full_name?.split(' ')[0] || 'Abel'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time receipt verification & payment totals calculated directly from atomic transaction records.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 self-start sm:self-center transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* 4 Main Summary Cards (Section 13) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Total */}
        <div className="glass-card p-5 rounded-3xl border border-emerald-500/30 glow-emerald space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Today's Total</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {metrics?.today_total !== undefined ? `${Number(metrics.today_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '...'}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center">
              <Receipt className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span className="font-bold text-slate-200">{metrics?.today_count || 0}</span>
              <span className="ml-1">scanned transactions</span>
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Week</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {metrics?.this_week_total !== undefined ? `${Number(metrics.this_week_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '...'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span className="font-bold text-slate-200">{metrics?.this_week_count || 0}</span> transactions this week
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {metrics?.this_month_total !== undefined ? `${Number(metrics.this_month_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '...'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span className="font-bold text-slate-200">{metrics?.this_month_count || 0}</span> transactions this month
            </div>
          </div>
        </div>

        {/* This Year */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Year</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {metrics?.this_year_total !== undefined ? `${Number(metrics.this_year_total).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB` : '...'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              <span className="font-bold text-slate-200">{metrics?.this_year_count || 0}</span> transactions this year
            </div>
          </div>
        </div>
      </div>

      {/* Provider Breakdown Cards (Section 13) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics?.provider_summary_today && metrics.provider_summary_today.length > 0 ? (
          metrics.provider_summary_today.map((prov) => (
            <div
              key={prov.provider}
              className="glass-card p-5 rounded-3xl border border-slate-800 flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {prov.provider_display_name}
                </span>
                <div className="text-xl font-extrabold text-white">
                  {prov.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">{prov.transaction_count}</span> transactions ({prov.percentage_amount}%)
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: `${PROVIDER_COLORS[prov.provider] || '#3b82f6'}20`,
                  color: PROVIDER_COLORS[prov.provider] || '#3b82f6'
                }}
              >
                {prov.provider.substring(0, 3)}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 glass-card p-6 rounded-3xl text-center text-slate-400 text-xs">
            No transactions recorded yet today. Scan a receipt to start!
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Revenue Trend */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white">Daily Revenue Trend</h3>
              <p className="text-xs text-slate-400">Calculated dynamically from payment receipts</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyReport?.timeline_breakdown || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v} ETB`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem' }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} ETB`, 'Revenue']}
                />
                <Area type="monotone" dataKey="total_amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Provider Volume Breakdown */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-base text-white">Provider Distribution</h3>
            <p className="text-xs text-slate-400">Transactions by Payment Method</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={monthlyReport?.providers_breakdown || []}
                  dataKey="total_amount"
                  nameKey="provider_display_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {(monthlyReport?.providers_breakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.provider] || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem' }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} ETB`, 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Scanned Transactions Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Click any row for complete receipt information</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2">
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Provider</th>
                <th className="py-3 px-3">Reference No.</th>
                <th className="py-3 px-3">Payer</th>
                <th className="py-3 px-3">Waiter</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {recentTxs?.items && recentTxs.items.length > 0 ? (
                recentTxs.items.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-3 font-mono text-slate-300">{tx.payment_time || tx.created_at.slice(11, 16)}</td>
                    <td className="py-3.5 px-3 font-semibold text-white">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.provider === 'CBE' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {tx.provider_display_name || tx.provider}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-emerald-400 font-medium">{tx.reference_number || tx.invoice_number || '-'}</td>
                    <td className="py-3.5 px-3 text-slate-300">{tx.payer_name || 'Customer'}</td>
                    <td className="py-3.5 px-3 text-slate-400">{tx.scanned_by_user_name || 'Abel'}</td>
                    <td className="py-3.5 px-3 font-extrabold text-white text-right text-sm">
                      {tx.amount ? `${Number(tx.amount).toFixed(2)} ETB` : '-'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {tx.receipt_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdated={handleRefresh}
        />
      )}
    </div>
  );
};
