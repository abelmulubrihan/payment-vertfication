import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, Lock, User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('abel');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, quickSwitchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      await quickSwitchRole(role);
      navigate(role === 'WAITER' ? '/daily' : '/');
    } catch (err: any) {
      setError('Failed to login with selected test account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
            <QrCode className="w-8 h-8 text-slate-950 font-bold" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PayVerify Ethiopia</h1>
          <p className="text-xs text-slate-400">
            Restaurant Payment Receipt Verification & Management
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Username or Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. abel or manager"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-emerald-400" /> 1-Click Demo Logins:
            </span>
            <span>PW: password123</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('WAITER')}
              className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 font-bold text-center transition-all"
            >
              Waiter (Abel)
            </button>
            <button
              onClick={() => handleQuickLogin('MANAGER')}
              className="p-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/30 text-blue-300 font-bold text-center transition-all"
            >
              Manager
            </button>
            <button
              onClick={() => handleQuickLogin('OWNER')}
              className="p-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-300 font-bold text-center transition-all"
            >
              Owner
            </button>
            <button
              onClick={() => handleQuickLogin('ACCOUNTANT')}
              className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/30 text-amber-300 font-bold text-center transition-all"
            >
              Accountant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
