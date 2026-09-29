import React, { useState } from 'react';
import {
  X, CheckCircle, AlertTriangle, ExternalLink, Shield,
  Building, User, Calendar, Clock, DollarSign, FileText, Lock
} from 'lucide-react';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { transactionApi } from '../services/api';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  transaction,
  onClose,
  onUpdated
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [status, setStatus] = useState(transaction?.receipt_status || 'RECEIPT_RECORDED');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!transaction) return null;

  const isManagerOrOwner = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const handleSaveNotes = async () => {
    if (!isManagerOrOwner) return;
    setIsSaving(true);
    try {
      await transactionApi.update(transaction.id, {
        receipt_status: status,
        notes: notes
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Failed to update transaction', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="glass-card bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {transaction.provider_display_name || transaction.provider}
              </span>
              {transaction.is_duplicate && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Duplicate Flagged
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-2">
              {transaction.amount ? `${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${transaction.currency}` : 'Amount Not Extracted'}
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              Ref: <span className="font-mono text-emerald-400 font-bold">{transaction.reference_number || transaction.invoice_number || 'N/A'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Payer Details</span>
            <div className="text-slate-200 font-semibold text-sm">{transaction.payer_name || 'Not Provided'}</div>
            <div className="text-slate-400 font-mono">{transaction.payer_account_masked || 'Account masked / hidden'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Receiver Details</span>
            <div className="text-slate-200 font-semibold text-sm">{transaction.receiver_name || transaction.restaurant_name || 'Restaurant'}</div>
            <div className="text-slate-400 font-mono">{transaction.receiver_account_masked || 'Merchant Account'}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Payment Timestamp</span>
            <div className="text-slate-200 font-semibold flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{transaction.payment_date || 'Unknown Date'}</span>
              <Clock className="w-3.5 h-3.5 text-slate-400 ml-2" />
              <span>{transaction.payment_time || 'Unknown Time'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Scanned By Waiter</span>
            <div className="text-slate-200 font-semibold flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{transaction.scanned_by_user_name || 'Staff'}</span>
              <span className="text-slate-500">({transaction.branch_name || 'Bole'})</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">Financial Breakdown</span>
            <div className="text-slate-300 flex justify-between">
              <span>Amount:</span>
              <span className="font-semibold">{transaction.amount ? `${Number(transaction.amount).toFixed(2)} ETB` : 'N/A'}</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Service Charge:</span>
              <span>{Number(transaction.service_charge || 0).toFixed(2)} ETB</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>VAT:</span>
              <span>{Number(transaction.vat || 0).toFixed(2)} ETB</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-medium">QR Status & Verification</span>
            <div className="text-emerald-400 font-semibold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{transaction.qr_status}</span>
            </div>
            {transaction.verification_url ? (
              <a
                href={transaction.verification_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 pt-1 truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{transaction.verification_url}</span>
              </a>
            ) : (
              <div className="text-slate-500 text-[11px]">No external verification URL</div>
            )}
          </div>
        </div>

        {/* Raw QR Payload Accordion / View */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Raw Decoded QR Payload (Audit Record)</span>
            <Lock className="w-3 h-3 text-slate-500" />
          </div>
          <pre className="text-[11px] font-mono bg-slate-900/80 p-2.5 rounded-xl text-slate-300 overflow-x-auto whitespace-pre-wrap border border-slate-800">
            {transaction.qr_payload}
          </pre>
        </div>

        {/* Manager Notes & Status Updates */}
        {isManagerOrOwner ? (
          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Manager Review & Audit Notes</span>
              <span className="text-[11px] text-amber-400 flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Financial values are immutable
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Receipt Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="RECEIPT_RECORDED">RECEIPT_RECORDED</option>
                  <option value="DUPLICATE">DUPLICATE</option>
                  <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verified paper bill with customer"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              {saveSuccess && <span className="text-emerald-400 font-semibold">✓ Saved!</span>}
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Update Notes / Status'}
              </button>
            </div>
          </div>
        ) : (
          transaction.notes && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-400 block font-medium">Notes:</span>
              <p className="mt-0.5">{transaction.notes}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
