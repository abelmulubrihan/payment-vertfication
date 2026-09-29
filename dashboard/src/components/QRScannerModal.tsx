import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X, Camera, Upload, Keyboard, Sparkles, RefreshCw, AlertCircle, Check
} from 'lucide-react';
import { qrApi } from '../services/api';
import { QRDecodeResult } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecoded: (result: QRDecodeResult) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onDecoded,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualPayload, setManualPayload] = useState('');
  const [presets, setPresets] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-region';

  useEffect(() => {
    // Load presets
    qrApi.getSampleQrs().then((data) => setPresets(data)).catch(() => {});
  }, []);

  // Initialize and clean up Camera Scanner
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    const timer = setTimeout(() => {
      startCamera();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Stop on first successful scan
          await stopCamera();
          processPayload(decodedText);
        },
        () => {
          // Frame ignore
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Camera access not available or permission denied. You can use image upload or presets.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignore
      }
    }
    setIsCameraActive(false);
  };

  const processPayload = async (payload: string) => {
    if (!payload.trim()) return;
    setIsProcessing(true);
    try {
      const result = await qrApi.decode(payload);
      onDecoded(result);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to decode QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      processPayload(decodedText);
    } catch (err) {
      alert('Could not detect a valid QR code in this image. Please try another image or preset.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="glass-card bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Scan Payment QR</h3>
            <p className="text-xs text-slate-400">Place the QR code inside the frame</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'camera' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'presets' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethiopian Presets</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'upload' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload / Paste</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-h-[300px] flex items-center justify-center border border-slate-800">
              <div id={qrRegionId} className="w-full h-full"></div>
              
              {/* Animated Target Frame Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-emerald-500/80 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br"></div>
                  
                  {/* Laser Scan Line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 animate-scan"></div>
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <p className="text-xs text-slate-300">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('presets')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-bold"
                  >
                    Use Ethiopian Presets
                  </button>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400">
              Point camera at Telebirr or CBE receipt QR code
            </div>
          </div>
        )}

        {/* Tab 2: Ethiopian Receipt Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            <div className="text-xs text-slate-400">
              Click any realistic Ethiopian payment receipt to test instant decoding:
            </div>
            {presets.map((p) => (
              <div
                key={p.id}
                onClick={() => processPayload(p.qr_payload)}
                className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.provider === 'CBE' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {p.provider}
                    </span>
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {p.title}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Ref: <span className="text-slate-300 font-bold">{p.reference}</span> • <span className="text-emerald-400 font-bold">{p.amount.toFixed(2)} ETB</span>
                  </div>
                </div>

                <div className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white font-bold transition-all">
                  Scan ➜
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Upload Image / Paste Text */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div id="file-scanner-temp" className="hidden"></div>
            
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-slate-900 transition-all text-center space-y-2">
              <Upload className="w-8 h-8 text-emerald-400" />
              <div className="text-xs font-bold text-slate-200">Upload Receipt Image (QR)</div>
              <div className="text-[11px] text-slate-400">Supports PNG, JPG, JPEG</div>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="space-y-2 pt-2">
              <label className="text-xs text-slate-400 block font-medium">Or Paste Raw QR Payload Text:</label>
              <textarea
                value={manualPayload}
                onChange={(e) => setManualPayload(e.target.value)}
                placeholder="Paste URL, Telebirr text, or CBE receipt string..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={() => processPayload(manualPayload)}
                disabled={!manualPayload.trim() || isProcessing}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all"
              >
                {isProcessing ? 'Processing...' : 'Decode Pasted Payload'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
