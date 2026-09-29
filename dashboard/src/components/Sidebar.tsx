import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  QrCode,
  Users,
  ShieldCheck,
  Smartphone,
  Info,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const navItems = [
    { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    { to: '/daily', label: 'Daily Transactions', icon: ReceiptText, roles: ['OWNER', 'MANAGER', 'WAITER', 'ACCOUNTANT'] },
    { to: '/scanner-simulator', label: 'QR Scanner & Simulator', icon: QrCode, roles: ['OWNER', 'MANAGER', 'WAITER', 'ACCOUNTANT'] },
    { to: '/reports', label: 'Reports & Export', icon: BarChart3, roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
    { to: '/staff', label: 'Staff & Branches', icon: Users, roles: ['OWNER', 'MANAGER'] },
    { to: '/audit', label: 'Audit Trail', icon: ShieldCheck, roles: ['OWNER', 'MANAGER', 'ACCOUNTANT'] },
  ];

  const allowedNav = navItems.filter((item) => !role || item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between py-6 min-h-[calc(100vh-61px)]">
      <div className="space-y-6 px-4">
        {/* Verification Architecture Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-emerald-950/50 to-slate-900 border border-emerald-500/20 text-xs text-slate-300 space-y-1.5 shadow-inner">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct QR Receipt Mode</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Parses Telebirr, CBE & custom receipt QR codes without fake bank verification claims.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 px-3 pb-1">
            Menu
          </div>
          {allowedNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 pt-4 border-t border-slate-800/60 text-xs text-slate-500 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-400 font-medium">System Online</span>
        </div>
        <div className="text-[11px]">PayVerify Ethiopia v1.0 MVP</div>
      </div>
    </aside>
  );
};
