import React from 'react';
import { useAuth } from '../context/AuthContext';
import { QrCode, Shield, RefreshCw, UserCheck, LogOut, Building, User } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenScanner }) => {
  const { user, logout, quickSwitchRole } = useAuth();

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'WAITER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ACCOUNTANT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <QrCode className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                PayVerify
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                ETHIOPIA
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
              <Building className="w-3 h-3 text-slate-500" />
              <span>{user?.restaurant_name || 'Habesha Cultural Restaurant'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400/90">{user?.branch_name || 'Bole Branch'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Quick Role Switcher for Pair-Programming & Demo Testing */}
        <div className="hidden lg:flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 py-1 font-medium flex items-center">
            <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-500" /> Switch Role:
          </span>
          {(['OWNER', 'MANAGER', 'WAITER', 'ACCOUNTANT'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => quickSwitchRole(r)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                user?.role === r
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r === 'WAITER' ? 'Waiter (Abel)' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Scan Payment Action Button */}
        <button
          onClick={onOpenScanner}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan Payment QR</span>
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{user?.full_name}</div>
            <div className="flex items-center justify-end space-x-1 mt-0.5">
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
