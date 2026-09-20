'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Shield,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  Power,
  RotateCcw,
  UserCheck,
  UserX,
  Wallet,
  Mail,
  Phone,
  MapPin,
  Building,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  CreditCard,
  Package,
  Activity,
  Briefcase,
  GraduationCap,
  Globe,
  FileText,
  Star,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, inactive, deleted
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all'); // all, verified, unverified
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    verified: 0,
  });

  // Modals state
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [viewUserLoading, setViewUserLoading] = useState(false);
  const [previewNidImage, setPreviewNidImage] = useState<string | null>(null);
  const [adjustingUser, setAdjustingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<{ user: any; nextStatus: boolean } | null>(null);

  // Adjustment Form State
  const [availAdj, setAvailAdj] = useState<number>(0);
  const [holdAdj, setHoldAdj] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [adjError, setAdjError] = useState('');
  const [adjSuccess, setAdjSuccess] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);

  // Action feedback
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter === 'active') params.append('isActive', 'true');
      if (statusFilter === 'inactive') params.append('isActive', 'false');
      if (statusFilter === 'deleted') params.append('showDeleted', 'true');
      if (verifiedFilter === 'verified') params.append('isVerified', 'true');
      if (verifiedFilter === 'unverified') params.append('isVerified', 'false');
      params.append('page', String(currentPage));
      params.append('limit', '20');

      const res = await api.get(`/admin/users?${params.toString()}`);
      const data = unwrap(res);
      const items = Array.isArray(data) ? data : data?.items || [];
      setUsers(items);

      if (data?.meta) {
        setMeta(data.meta);
      }

      // Compute quick stats from current data or total meta
      if (statusFilter === 'all' && !search && verifiedFilter === 'all') {
        const act = items.filter((u: any) => u.isActive && !u.deletedAt).length;
        const ver = items.filter((u: any) => u.isVerified).length;
        setStats({
          total: data?.meta?.total ?? items.length,
          active: act,
          inactive: items.length - act,
          verified: ver,
        });
      }
    } catch (err: any) {
      setUsers([]);
      showNotice(err.message || 'Failed to load users list', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, verifiedFilter, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  // Open User Profile View
  const handleOpenProfile = async (user: any) => {
    setViewUser(user);
    setViewUserLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}`);
      const fullData = unwrap(res);
      if (fullData && fullData.id) {
        setViewUser(fullData);
      }
    } catch {
      // Keep basic data if detailed fetch fails
    } finally {
      setViewUserLoading(false);
    }
  };

  // Status toggle handler
  const handleToggleStatus = async (user: any, targetActive: boolean) => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { isActive: targetActive });
      showNotice(`User ${user.fullName || user.uniqueUserId} is now ${targetActive ? 'Active' : 'Inactive'}.`);
      setStatusModalUser(null);
      if (viewUser && viewUser.id === user.id) {
        setViewUser({ ...viewUser, isActive: targetActive });
      }
      loadUsers();
    } catch (err: any) {
      showNotice(err.message || 'Failed to update user status', 'error');
    }
  };

  // Verification toggle handler
  const handleToggleVerify = async (user: any, currentVerified: boolean) => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { isVerified: !currentVerified });
      showNotice(`Verification updated for ${user.fullName || user.uniqueUserId}.`);
      if (viewUser && viewUser.id === user.id) {
        setViewUser({ ...viewUser, isVerified: !currentVerified });
      }
      loadUsers();
    } catch (err: any) {
      showNotice(err.message || 'Failed to toggle verification', 'error');
    }
  };

  // KYC Status handler (Approve / Reject)
  const handleKycStatus = async (user: any, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, {
        verificationStatus: status,
        isVerified: status === 'VERIFIED',
      });
      showNotice(`KYC status for ${user.fullName || user.uniqueUserId} updated to ${status}.`);
      if (viewUser && viewUser.id === user.id) {
        setViewUser({
          ...viewUser,
          verificationStatus: status,
          isVerified: status === 'VERIFIED',
        });
      }
      loadUsers();
    } catch (err: any) {
      showNotice(err.message || 'Failed to update KYC status', 'error');
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (user: any) => {
    try {
      await api.delete(`/admin/users/${user.id}`);
      showNotice(`User ${user.fullName || user.uniqueUserId} successfully deleted (soft-deleted).`);
      setDeletingUser(null);
      if (viewUser && viewUser.id === user.id) {
        setViewUser(null);
      }
      loadUsers();
    } catch (err: any) {
      showNotice(err.message || 'Failed to delete user', 'error');
    }
  };

  // Restore User Handler
  const handleRestoreUser = async (user: any) => {
    try {
      await api.patch(`/admin/users/${user.id}/restore`, {});
      showNotice(`User ${user.fullName || user.uniqueUserId} restored successfully.`);
      if (viewUser && viewUser.id === user.id) {
        setViewUser({ ...viewUser, deletedAt: null, isActive: true });
      }
      loadUsers();
    } catch (err: any) {
      showNotice(err.message || 'Failed to restore user', 'error');
    }
  };

  // Wallet Adjustment Handler
  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjError('');
    setAdjSuccess('');

    if (!reason.trim() || reason.trim().length < 5) {
      setAdjError('A descriptive reason (min 5 characters) is mandatory for audit logging.');
      return;
    }

    setAdjLoading(true);
    try {
      await api.post('/wallet/admin/adjust', {
        userId: adjustingUser.id,
        availableAdjustment: Number(availAdj),
        holdAdjustment: Number(holdAdj),
        reason: reason.trim(),
      });

      setAdjSuccess('Wallet successfully adjusted and logged to immutable audit ledger.');
      loadUsers();
      if (viewUser && viewUser.id === adjustingUser.id) {
        setViewUser({
          ...viewUser,
          wallet: {
            ...viewUser.wallet,
            availableBalance: Number(viewUser.wallet?.availableBalance || 0) + Number(availAdj),
            holdBalance: Number(viewUser.wallet?.holdBalance || 0) + Number(holdAdj),
          },
        });
      }
      setTimeout(() => {
        setAdjustingUser(null);
        setAdjSuccess('');
      }, 1500);
    } catch (err: any) {
      setAdjError(err.message || 'Adjustment failed');
    } finally {
      setAdjLoading(false);
    }
  };

  const isSuperAdmin = (u: any) => {
    return (
      u?.roles?.includes('SUPER_ADMIN') ||
      u?.userRoles?.some((ur: any) => ur?.role?.name === 'SUPER_ADMIN') ||
      u?.email?.toLowerCase() === 'admin@safnexbd.com'
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionNotice && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
              : 'bg-rose-950/90 text-rose-300 border-rose-700/60'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{actionNotice.text}</span>
          <button onClick={() => setActionNotice(null)} className="ml-2 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">User Management</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Manage user access, active/inactive states, profile details, and audited wallet balances
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadUsers()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold shadow-sm transition"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Registered</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{stats.total || meta.total || users.length}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Users</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.active || users.filter((u) => u.isActive && !u.deletedAt).length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Inactive / Banned</div>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {users.filter((u) => !u.isActive || u.deletedAt).length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <UserX className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">KYC Verified</div>
            <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">
              {users.filter((u) => u.isVerified).length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <BadgeCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, User ID (@Rahim123), Phone, Email..."
            className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-14 top-2 text-slate-500 hover:text-slate-300 text-xs"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
            <option value="deleted">Deleted / Banned</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All KYC Status</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading user records from database...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-white">No users found</p>
          <p className="text-xs text-slate-400">No users match your current search or filter criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setVerifiedFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-1.5 rounded-xl bg-sky-600/20 text-sky-400 text-xs font-semibold hover:bg-sky-600/30 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">Contact Info</th>
                  <th className="p-3.5">Available Balance</th>
                  <th className="p-3.5">Hold Balance</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">KYC Verified</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => {
                  const superAdmin = isSuperAdmin(u);
                  const isDeleted = Boolean(u.deletedAt);

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isDeleted ? 'bg-rose-950/10 opacity-70' : ''
                      }`}
                    >
                      {/* User Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleOpenProfile(u)}
                            className="relative group flex-shrink-0"
                            title="Click to view full profile"
                          >
                            {u.avatarUrl ? (
                              <img
                                src={getImageUrl(u.avatarUrl)}
                                alt={u.fullName || 'User'}
                                className="w-9 h-9 rounded-full object-cover border border-sky-500/30 group-hover:border-sky-400 transition"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center group-hover:brightness-110 transition shadow-inner">
                                {u.fullName?.charAt(0) || u.firstName?.charAt(0) || 'U'}
                              </div>
                            )}
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenProfile(u)}
                                className="font-bold text-white hover:text-sky-400 transition text-left"
                              >
                                {u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unnamed User'}
                              </button>
                              {superAdmin && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold border border-amber-500/30">
                                  SUPER ADMIN
                                </span>
                              )}
                              {isDeleted && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-extrabold border border-rose-500/30">
                                  DELETED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] mt-0.5">
                              <span className="font-mono text-sky-400 font-medium">@{u.uniqueUserId}</span>
                              {u.roles && u.roles.length > 0 && !superAdmin && (
                                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                                  {u.roles.join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-3.5 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span>{u.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span>{u.phone || 'No phone'}</span>
                        </div>
                      </td>

                      {/* Available Balance */}
                      <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>৳</span>
                          <span>{Number(u.wallet?.availableBalance || 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Hold Balance */}
                      <td className="p-3.5 font-bold text-amber-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>৳</span>
                          <span>{Number(u.wallet?.holdBalance || 0).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Status (Active / Inactive Toggle) */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isDeleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>Deleted</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setStatusModalUser({ user: u, nextStatus: !u.isActive })}
                            disabled={superAdmin}
                            title={
                              superAdmin
                                ? 'Super Admin cannot be deactivated'
                                : u.isActive
                                ? 'Click to Deactivate'
                                : 'Click to Activate'
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                              u.isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                            } ${superAdmin ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                              }`}
                            />
                            <span>{u.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        )}
                      </td>

                      {/* KYC Verified */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleVerify(u, u.isVerified)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition ${
                            u.isVerified
                              ? 'text-sky-400 bg-sky-500/10 hover:bg-sky-500/20'
                              : 'text-slate-500 bg-slate-800/40 hover:text-slate-300'
                          }`}
                          title="Click to toggle KYC verification"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span>{u.isVerified ? 'Verified' : 'Unverified'}</span>
                        </button>
                      </td>

                      {/* Actions Column */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Profile View Option */}
                          <button
                            onClick={() => handleOpenProfile(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white text-sky-400 transition"
                            title="View Full Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Adjust Balance Option */}
                          <button
                            onClick={() => {
                              setAdjustingUser(u);
                              setAvailAdj(0);
                              setHoldAdj(0);
                              setReason('');
                              setAdjError('');
                              setAdjSuccess('');
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 transition"
                            title="Adjust Wallet Balance (Audited)"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                          </button>

                          {/* Active / Inactive Quick Action */}
                          {!isDeleted && !superAdmin && (
                            <button
                              onClick={() => setStatusModalUser({ user: u, nextStatus: !u.isActive })}
                              className={`p-1.5 rounded-lg transition ${
                                u.isActive
                                  ? 'bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400'
                                  : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400'
                              }`}
                              title={u.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete or Restore Option */}
                          {isDeleted ? (
                            <button
                              onClick={() => handleRestoreUser(u)}
                              className="p-1.5 rounded-lg bg-emerald-950/50 text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                              title="Restore Deleted User"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeletingUser(u)}
                              disabled={superAdmin}
                              className={`p-1.5 rounded-lg transition ${
                                superAdmin
                                  ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                                  : 'bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400'
                              }`}
                              title={superAdmin ? 'Super Admin cannot be deleted' : 'Delete User Account'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {meta && meta.totalPages > 1 && (
            <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing page <span className="text-white font-bold">{meta.page}</span> of{' '}
                <span className="text-white font-bold">{meta.totalPages}</span> ({meta.total} total users)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={meta.page <= 1}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1 text-xs"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={meta.page >= meta.totalPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DETAILED PROFILE VIEW MODAL                                            */}
      {/* ========================================================================= */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden my-6 text-xs animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 border-b border-slate-800">
              <button
                onClick={() => setViewUser(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {viewUser.avatarUrl ? (
                  <img
                    src={getImageUrl(viewUser.avatarUrl)}
                    alt={viewUser.fullName || 'User'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-sky-500/40 shadow-xl"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center border-2 border-sky-500/40 shadow-xl">
                    {viewUser.fullName?.charAt(0) || viewUser.firstName?.charAt(0) || 'U'}
                  </div>
                )}

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-lg font-black text-white">
                      {viewUser.fullName || `${viewUser.firstName || ''} ${viewUser.lastName || ''}`.trim()}
                    </h2>
                    {isSuperAdmin(viewUser) && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <span className="font-mono text-sky-400 font-bold">@{viewUser.uniqueUserId}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Member since{' '}
                      {viewUser.createdAt
                        ? new Date(viewUser.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        viewUser.deletedAt
                          ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                          : viewUser.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          viewUser.deletedAt
                            ? 'bg-rose-500'
                            : viewUser.isActive
                            ? 'bg-emerald-400'
                            : 'bg-rose-400'
                        }`}
                      />
                      <span>
                        {viewUser.deletedAt ? 'Deleted' : viewUser.isActive ? 'Active Account' : 'Inactive / Banned'}
                      </span>
                    </span>

                    {/* KYC Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        viewUser.isVerified
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <BadgeCheck className="w-3 h-3" />
                      <span>{viewUser.isVerified ? 'KYC Verified' : 'Unverified KYC'}</span>
                    </span>

                    {/* Roles */}
                    {viewUser.roles &&
                      viewUser.roles.map((r: string) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700"
                        >
                          {r}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {viewUserLoading && (
                <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-800 text-sky-300 text-[11px] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>Loading complete profile details and history...</span>
                </div>
              )}

              {/* 1. Wallet Balances */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Wallet className="w-3.5 h-3.5 text-sky-400" />
                    <span>Wallet & Balances</span>
                  </h3>
                  <button
                    onClick={() => {
                      setAdjustingUser(viewUser);
                      setAvailAdj(0);
                      setHoldAdj(0);
                      setReason('');
                      setAdjError('');
                      setAdjSuccess('');
                    }}
                    className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>Adjust Balance</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Available Balance</div>
                    <div className="text-base font-black text-emerald-400 mt-1">
                      ৳ {Number(viewUser.wallet?.availableBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Ready for withdrawal/spend</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Hold Balance</div>
                    <div className="text-base font-black text-amber-400 mt-1">
                      ৳ {Number(viewUser.wallet?.holdBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Locked in escrow deals</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total User Assets</div>
                    <div className="text-base font-black text-sky-400 mt-1">
                      ৳{' '}
                      {(
                        Number(viewUser.wallet?.availableBalance || 0) +
                        Number(viewUser.wallet?.holdBalance || 0)
                      ).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Available + Hold</div>
                  </div>
                </div>
              </div>

              {/* 2. Personal & Contact Information */}
              <div>
                <h3 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Contact & Profile Details</span>
                </h3>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Email Address</span>
                    <div className="font-semibold text-white mt-0.5 break-all">{viewUser.email}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Phone Number</span>
                    <div className="font-semibold text-white mt-0.5">{viewUser.phone || 'Not provided'}</div>
                  </div>

                  {viewUser.additionalPhone && (
                    <div>
                      <span className="text-slate-400 text-[11px]">Additional Phone</span>
                      <div className="font-semibold text-white mt-0.5">{viewUser.additionalPhone}</div>
                    </div>
                  )}

                  {viewUser.gender && (
                    <div>
                      <span className="text-slate-400 text-[11px]">Gender</span>
                      <div className="font-semibold text-white mt-0.5">{viewUser.gender}</div>
                    </div>
                  )}

                  {viewUser.dateOfBirth && (
                    <div>
                      <span className="text-slate-400 text-[11px]">Date of Birth</span>
                      <div className="font-semibold text-white mt-0.5">
                        {new Date(viewUser.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 text-[11px]">Detailed Address</span>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {[viewUser.address, viewUser.upazila, viewUser.district, viewUser.division, viewUser.country || 'Bangladesh'].filter(Boolean).join(', ')}
                      {viewUser.postalCode ? ` - ${viewUser.postalCode}` : ''}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px]">Business Details</span>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {viewUser.businessName ? (
                        <span>
                          {viewUser.businessName}{' '}
                          {viewUser.businessType ? `(${viewUser.businessType})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">Regular Account (No business profile)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. KYC & NID Verification Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <BadgeCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>NID Verification & KYC Documents</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewUser.verificationStatus === 'VERIFIED' || viewUser.isVerified
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : viewUser.verificationStatus === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          : viewUser.verificationStatus === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {viewUser.verificationStatus || (viewUser.isVerified ? 'VERIFIED' : 'UNVERIFIED')}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 text-[11px]">NID Holder Name</span>
                      <div className="font-semibold text-white mt-0.5">{viewUser.nidName || 'Not submitted'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">NID Number</span>
                      <div className="font-semibold text-white font-mono mt-0.5">{viewUser.nidNumber || 'Not submitted'}</div>
                    </div>
                  </div>

                  {/* NID Photos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-slate-400 text-[11px] block mb-1.5">NID Front Side Photo</span>
                      {viewUser.nidFrontUrl ? (
                        <div
                          onClick={() => setPreviewNidImage(viewUser.nidFrontUrl)}
                          className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center cursor-pointer hover:border-sky-500 transition"
                        >
                          <img
                            src={getImageUrl(viewUser.nidFrontUrl)}
                            alt="NID Front"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white font-bold text-[11px] gap-1">
                            <Eye className="w-4 h-4" />
                            <span>Click to Zoom</span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-slate-500 text-[11px]">
                          Front photo not uploaded
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block mb-1.5">NID Back Side Photo</span>
                      {viewUser.nidBackUrl ? (
                        <div
                          onClick={() => setPreviewNidImage(viewUser.nidBackUrl)}
                          className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video flex items-center justify-center cursor-pointer hover:border-sky-500 transition"
                        >
                          <img
                            src={getImageUrl(viewUser.nidBackUrl)}
                            alt="NID Back"
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white font-bold text-[11px] gap-1">
                            <Eye className="w-4 h-4" />
                            <span>Click to Zoom</span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-slate-500 text-[11px]">
                          Back photo not uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KYC Approval / Rejection Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleKycStatus(viewUser, 'VERIFIED')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve KYC (ভেরিফাই করুন)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKycStatus(viewUser, 'REJECTED')}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject KYC (বাতিল করুন)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Education & Career Information */}
              {(viewUser.profession || viewUser.company || viewUser.jobTitle || viewUser.institution || viewUser.educationLevel) && (
                <div>
                  <h3 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
                    <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                    <span>Education & Career Details</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {viewUser.profession && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Profession</span>
                        <div className="font-semibold text-white mt-0.5">{viewUser.profession}</div>
                      </div>
                    )}
                    {viewUser.company && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Company / Organization</span>
                        <div className="font-semibold text-white mt-0.5">{viewUser.company}</div>
                      </div>
                    )}
                    {viewUser.jobTitle && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Job Title</span>
                        <div className="font-semibold text-white mt-0.5">{viewUser.jobTitle}</div>
                      </div>
                    )}
                    {viewUser.institution && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Institution</span>
                        <div className="font-semibold text-white mt-0.5">{viewUser.institution}</div>
                      </div>
                    )}
                    {viewUser.educationLevel && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Education Level</span>
                        <div className="font-semibold text-white mt-0.5">{viewUser.educationLevel}</div>
                      </div>
                    )}
                    {viewUser.graduationYear && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Graduation Year</span>
                        <div className="font-semibold text-white font-mono mt-0.5">{viewUser.graduationYear}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Headline, Bio, Skills & Social Links */}
              {(viewUser.headline || viewUser.bio || viewUser.skills || viewUser.website || viewUser.socialLinks) && (
                <div>
                  <h3 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Headline, Bio & Social Profiles</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    {viewUser.headline && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Headline</span>
                        <div className="font-bold text-sky-400 mt-0.5">{viewUser.headline}</div>
                      </div>
                    )}

                    {viewUser.bio && (
                      <div>
                        <span className="text-slate-400 text-[11px]">Bio</span>
                        <div className="text-slate-200 mt-0.5 whitespace-pre-line leading-relaxed">{viewUser.bio}</div>
                      </div>
                    )}

                    {viewUser.skills && (
                      <div>
                        <span className="text-slate-400 text-[11px] block mb-1">Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {viewUser.skills.split(',').map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-sky-950 text-sky-300 text-[10px] font-semibold border border-sky-800"
                            >
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {viewUser.socialLinks && Object.values(viewUser.socialLinks).some(Boolean) && (
                      <div>
                        <span className="text-slate-400 text-[11px] block mb-1">Social Links</span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(viewUser.socialLinks).map(([k, v]: [string, any]) => {
                            if (!v) return null;
                            return (
                              <a
                                key={k}
                                href={String(v).startsWith('http') ? String(v) : `https://${v}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 text-[11px] font-semibold flex items-center gap-1 border border-slate-800"
                              >
                                <Globe className="w-3 h-3" />
                                <span className="capitalize">{k}: {String(v)}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Activity Statistics */}
              <div>
                <h3 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>Platform Activity & Usage</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Products Listed</div>
                    <div className="text-sm font-black text-white mt-1">
                      {viewUser.counts?.products ?? viewUser.productsCount ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Total Transactions</div>
                    <div className="text-sm font-black text-white mt-1">
                      {viewUser.counts?.transactions ?? viewUser.transactionsCount ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Recharge Requests</div>
                    <div className="text-sm font-black text-emerald-400 mt-1">
                      {viewUser.counts?.recharges ?? viewUser.rechargesCount ?? 0}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Withdrawals</div>
                    <div className="text-sm font-black text-amber-400 mt-1">
                      {viewUser.counts?.withdrawals ?? viewUser.withdrawalsCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Payment Accounts if any */}
              {viewUser.paymentAccounts && viewUser.paymentAccounts.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs uppercase tracking-wider mb-2">
                    <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                    <span>Saved Payment Methods ({viewUser.paymentAccounts.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewUser.paymentAccounts.map((acc: any) => (
                      <div
                        key={acc.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-xs">{acc.accountType || acc.provider}</div>
                          <div className="font-mono text-slate-400 text-[11px]">{acc.accountNumber}</div>
                        </div>
                        {acc.isDefault && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[9px] font-bold">
                            Default
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Active / Inactive Toggle inside profile */}
                {!viewUser.deletedAt && !isSuperAdmin(viewUser) && (
                  <button
                    onClick={() => handleToggleStatus(viewUser, !viewUser.isActive)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      viewUser.isActive
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{viewUser.isActive ? 'Deactivate User' : 'Activate User'}</span>
                  </button>
                )}

                {/* KYC Verification Toggle */}
                <button
                  onClick={() => handleToggleVerify(viewUser, viewUser.isVerified)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <BadgeCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>{viewUser.isVerified ? 'Revoke KYC' : 'Verify KYC'}</span>
                </button>

                {/* Delete / Restore User Button */}
                {viewUser.deletedAt ? (
                  <button
                    onClick={() => handleRestoreUser(viewUser)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore User</span>
                  </button>
                ) : (
                  !isSuperAdmin(viewUser) && (
                    <button
                      onClick={() => setDeletingUser(viewUser)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/40 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-800/60 transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete User</span>
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setViewUser(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACTIVE / INACTIVE TOGGLE CONFIRMATION MODAL                            */}
      {/* ========================================================================= */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  statusModalUser.nextStatus ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}
              >
                {statusModalUser.nextStatus ? <UserCheck className="w-6 h-6" /> : <UserX className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {statusModalUser.nextStatus ? 'Activate User Account' : 'Deactivate / Ban User'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {statusModalUser.user.fullName} (@{statusModalUser.user.uniqueUserId})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-slate-300">
              <p>
                {statusModalUser.nextStatus
                  ? `Are you sure you want to ACTIVATE this user account? The user will be able to log in, participate in transactions, and access their wallet.`
                  : `Are you sure you want to DEACTIVATE this user? The user will be blocked from logging in, their active sessions will be terminated, and they will not be able to execute any transactions.`}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(statusModalUser.user, statusModalUser.nextStatus)}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition ${
                  statusModalUser.nextStatus
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {statusModalUser.nextStatus ? 'Activation' : 'Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE USER CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-rose-900/60 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Delete User Account</h3>
                <p className="text-[11px] text-slate-400">
                  {deletingUser.fullName} (@{deletingUser.uniqueUserId})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Balance Warning if user has funds */}
              {(Number(deletingUser.wallet?.availableBalance || 0) > 0 ||
                Number(deletingUser.wallet?.holdBalance || 0) > 0) && (
                <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-800 text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Warning: Existing Wallet Balance!</span>
                  </div>
                  <p className="text-[11px]">
                    This user currently holds ৳
                    {Number(deletingUser.wallet?.availableBalance || 0).toLocaleString()} available and ৳
                    {Number(deletingUser.wallet?.holdBalance || 0).toLocaleString()} hold balance.
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-2">
                <p>
                  Are you sure you want to delete user <span className="text-white font-bold">{deletingUser.fullName}</span>?
                </p>
                <p className="text-slate-400 text-[11px]">
                  • The user will be immediately deactivated and removed from active user listings.
                  <br />
                  • Financial ledgers and past transaction records are preserved for auditing integrity.
                  <br />• This action can be restored later by an Administrator if required.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(deletingUser)}
                disabled={isSuperAdmin(deletingUser)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition"
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. WALLET ADJUSTMENT MODAL (Rule 7 & Audited)                             */}
      {/* ========================================================================= */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {adjustingUser.avatarUrl ? (
                  <img
                    src={getImageUrl(adjustingUser.avatarUrl)}
                    alt={adjustingUser.fullName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-sky-500/30 flex-shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    {adjustingUser.fullName?.charAt(0) || 'U'}
                  </div>
                )}
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>
                    Adjust Wallet: {adjustingUser.fullName} ({adjustingUser.uniqueUserId})
                  </span>
                </h3>
              </div>
              <button onClick={() => setAdjustingUser(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs">
              <div>
                <span className="text-slate-400">Current Available:</span>
                <div className="font-bold text-emerald-400">
                  ৳ {Number(adjustingUser.wallet?.availableBalance || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Current Hold:</span>
                <div className="font-bold text-amber-400">
                  ৳ {Number(adjustingUser.wallet?.holdBalance || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {adjError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {adjError}
              </div>
            )}
            {adjSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">
                {adjSuccess}
              </div>
            )}

            <form onSubmit={handleAdjustWallet} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Available Balance Adjustment (+ or -)</label>
                <input
                  type="number"
                  value={availAdj}
                  onChange={(e) => setAvailAdj(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 500 or -200"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Hold Balance Adjustment (+ or -)</label>
                <input
                  type="number"
                  value={holdAdj}
                  onChange={(e) => setHoldAdj(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 100 or -100"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-bold mb-1">Mandatory Audit Reason (Rule 7) *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this manual financial adjustment is being made..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingUser(null)}
                  disabled={adjLoading}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjLoading}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition"
                >
                  {adjLoading ? 'Adjusting...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NID Image Lightbox */}
      {previewNidImage && (
        <div
          onClick={() => setPreviewNidImage(null)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-3xl p-2 border border-slate-700 shadow-2xl overflow-hidden">
            <button
              onClick={() => setPreviewNidImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={getImageUrl(previewNidImage)}
              alt="NID Document"
              className="max-h-[85vh] w-auto rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
