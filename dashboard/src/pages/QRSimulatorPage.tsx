import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode, Sparkles, RefreshCw, Send, CheckCircle,
  AlertTriangle, Copy, ShieldCheck, Smartphone
} from 'lucide-react';
import { qrApi } from '../services/api';
import { QRDecodeResult } from '../types';
import { ScanPreviewModal } from '../components/ScanPreviewModal';

export const QRSimulatorPage: React.FC = () => {
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<any>(null);
  const [customPayload, setCustomPayload] = useState('');
  const [decodeResult, setDecodeResult] = useState<QRDecodeResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    qrApi.getSampleQrs().then((data) => {
      setPresets(data);
      if (data && data.length > 0) {
        setSelectedPreset(data[0]);
        setCustomPayload(data[0].qr_payload);
      }
    });
  }, []);

  const handleSelectPreset = (preset: any) => {
    setSelectedPreset(preset);
    setCustomPayload(preset.qr_payload);
  };

  const handleTestScan = async () => {
    try {
      const res = await qrApi.decode(customPayload);
      setDecodeResult(res);
      setIsPreviewOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to decode QR code');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive QR Lab & Receipt Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">QR Simulator</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test live QR decoding, provider detection, field extraction & duplicate alerts in real time.
          </p>
        </div>

        <button
          onClick={handleTestScan}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center space-x-2 transition-all"
        >
          <QrCode className="w-4 h-4" />
          <span>Simulate Scan on Payload</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preset Selector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Realistic Ethiopian Presets</span>
            </h3>

            <div className="space-y-2.5">
              {presets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedPreset?.id === p.id
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.provider === 'CBE' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {p.provider}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-xs">
                      {p.amount.toFixed(2)} ETB
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-1.5">{p.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Ref: {p.reference}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Generated QR Code & Payload Editor */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Live QR Render */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={customPayload || 'https://payverify.et'}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Scan this QR with phone camera or waiter app!</span>
              </div>
            </div>

            {/* Quick Actions & Info */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Selected Provider</span>
                <div className="text-lg font-extrabold text-white">
                  {selectedPreset?.provider_display_name || selectedPreset?.provider || 'Custom QR'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-slate-300 text-[11px]">
                <div className="flex items-center text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Direct Parsing Strategy
                </div>
                <p>
                  The system decodes reference numbers, amounts, dates, and verification links without claiming fake bank settlement.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleTestScan}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all"
                >
                  Decode & Show Result Preview
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw Payload'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Editable Raw Payload Textarea */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>Edit Raw QR Payload (Custom Testing):</span>
              <span className="text-[11px] font-mono text-emerald-400">{customPayload.length} bytes</span>
            </div>
            <textarea
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Scan Preview Modal */}
      {isPreviewOpen && decodeResult && (
        <ScanPreviewModal
          decodeResult={decodeResult}
          onClose={() => setIsPreviewOpen(false)}
          onSuccess={() => {
            alert('Transaction saved to database!');
          }}
        />
      )}
    </div>
  );
};
