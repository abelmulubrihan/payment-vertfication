import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Building, Plus, Shield, Check, X, UserPlus, Phone, MapPin
} from 'lucide-react';
import { userApi, branchApi } from '../services/api';
import { UserProfile, Branch, UserRole } from '../types';

export const UsersPage: React.FC = () => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newRole, setNewRole] = useState<UserRole>('WAITER');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const { data: users, refetch: refetchUsers } = useQuery<UserProfile[]>({
    queryKey: ['users-list'],
    queryFn: () => userApi.getAll()
  });

  const { data: branches, refetch: refetchBranches } = useQuery<Branch[]>({
    queryKey: ['branches-list'],
    queryFn: () => branchApi.getAll()
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.create({
        username: newUsername,
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        branch_id: selectedBranchId || undefined
      });
      setIsAddUserOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      refetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Staff Roles & Branches</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Team Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based access control (Owner, Manager, Waiter, Accountant).
          </p>
        </div>

        <button
          onClick={() => setIsAddUserOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Branches List */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center space-x-2">
          <Building className="w-4 h-4 text-emerald-400" />
          <span>Restaurant Branches</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches?.map((b) => (
            <div key={b.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{b.name}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  {b.code || 'MAIN'}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{b.address || 'Addis Ababa'}</span>
              </div>
              {b.phone && (
                <div className="text-xs text-slate-400 flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{b.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white">Active Staff & Credentials</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Branch</th>
                <th className="py-3 px-3 text-center">Role</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-white">{u.full_name}</td>
                  <td className="py-3.5 px-3 font-mono text-slate-300">{u.username}</td>
                  <td className="py-3.5 px-3 text-slate-400">{u.email}</td>
                  <td className="py-3.5 px-3 text-slate-300">{u.branch_name || 'Bole'}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Add New Staff Member</h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Abel Tesfaye"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. abel_waiter"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. abel@payverify.et"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="WAITER">WAITER (Scan & View own)</option>
                  <option value="MANAGER">MANAGER (Reports & Staff)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Audit & Export)</option>
                  <option value="OWNER">OWNER (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Branch</label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Default Branch (Bole)</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition-all"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
