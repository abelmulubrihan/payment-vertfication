import React, { useState } from 'react';
import {
  X, CheckCircle, AlertTriangle, ExternalLink, Save,
  Check, Calendar, Clock, DollarSign, ShieldAlert, Sparkles
} from 'lucide-react';
import { QRDecodeResult } from '../types';
import { transactionApi } from '../services/api';

interface ScanPreviewModalProps {
  decodeResult: QRDecodeResult | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScanPreviewModal: React.FC<ScanPreviewModalProps> = ({
  decodeResult,
  onClose,
  onSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!decodeResult) return null;

  const { draft, is_duplicate, duplicate_info, message } = decodeResult;

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await transactionApi.create({
        provider: draft.provider,
        provider_display_name: draft.provider_display_name,
        reference_number: draft.reference_number,
        transaction_number: draft.transaction_number,
        invoice_number: draft.invoice_number,
        payer_name: draft.payer_name,
        payer_account_masked: draft.payer_account_masked,
        receiver_name: draft.receiver_name,
        receiver_account_masked: draft.receiver_account_masked,
        payment_type: draft.payment_type,
        payment_method: draft.payment_method,
        payment_channel: draft.payment_channel,
        amount: draft.amount,
        service_charge: draft.service_charge || 0.0,
        vat: draft.vat || 0.0,
        total_debited: draft.total_debited || draft.amount,
        currency: draft.currency || 'ETB',
        payment_date: draft.payment_date,
        payment_time: draft.payment_time,
        qr_payload: draft.qr_payload,
        verification_url: draft.verification_url,
        qr_status: draft.qr_status,
        idempotency_key: `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        allow_duplicate: is_duplicate // if user chooses to proceed
      });
      setIsSaved(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      console.error('Failed to save transaction', err);
      const detail = err.response?.data?.detail;
      setErrorMessage(typeof detail === 'string' ? detail : 'Duplicate transaction or network error.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-card bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Scan Result</h3>
              <p className="text-xs text-slate-400">Payment receipt parsed via provider adapter</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Alert Banner if duplicate exists */}
        {is_duplicate && duplicate_info && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>⚠ Duplicate Transaction</span>
            </div>
            <p className="text-slate-300">
              This reference number has already been recorded in your restaurant.
            </p>
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/20 space-y-1 text-[11px] text-slate-300 font-mono">
              <div>Recorded: <span className="text-white font-bold">{duplicate_info.recorded_at}</span></div>
              <div>Scanned By: <span className="text-white font-bold">{duplicate_info.scanned_by}</span></div>
              <div>Amount: <span className="text-emerald-400 font-bold">{duplicate_info.amount} ETB</span></div>
            </div>
          </div>
        )}

        {/* Missing Fields Warning */}
        {draft.missing_fields_warning && !is_duplicate && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <span>Some receipt information could not be automatically extracted from QR code.</span>
          </div>
        )}

        {/* Parsed Fields Preview */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <span className="text-slate-400">Payment Provider:</span>
            <span className="font-bold text-white text-sm px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
              {draft.provider_display_name || draft.provider}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <span className="text-slate-400">Reference No:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {draft.reference_number || draft.invoice_number || 'Not Extracted'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <span className="text-slate-400">Amount:</span>
            <span className="font-extrabold text-white text-base">
              {draft.amount !== null && draft.amount !== undefined ? `${Number(draft.amount).toFixed(2)} ETB` : 'Not Extracted'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <span className="text-slate-400">Payment Date:</span>
            <span className="text-slate-200 font-medium">
              {draft.payment_date || 'Not Extracted'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <span className="text-slate-400">Payment Time:</span>
            <span className="text-slate-200 font-medium">
              {draft.payment_time || 'Not Extracted'}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-850">
            <span className="text-slate-400">QR Status:</span>
            <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
              {draft.qr_status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Verification URL:</span>
            {draft.verification_url ? (
              <span className="text-blue-400 font-semibold flex items-center">
                <ExternalLink className="w-3 h-3 mr-1" /> Available
              </span>
            ) : (
              <span className="text-slate-500">None</span>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Success confirmation */}
        {isSaved ? (
          <div className="p-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/50 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 animate-bounce">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="text-emerald-400 font-extrabold text-base">✓ Transaction Recorded</div>
            <div className="text-xs text-slate-300">
              {draft.provider_display_name} • Ref: {draft.reference_number || 'N/A'} • {draft.amount ? `${draft.amount} ETB` : ''}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Transaction'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
