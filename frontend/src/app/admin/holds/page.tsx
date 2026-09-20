'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  KeyRound,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Send,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/context/LanguageContext';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

// Generate random secure password
const generatePassword = () => {
  const words = ['Safnex', 'Secure', 'Bangla', 'User', 'BDPass', 'TrustPass'];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const symbols = ['#', '@', '!', '$'];
  const randomSym = symbols[Math.floor(Math.random() * symbols.length)];
  return `${randomWord}${randomSym}${randomNum}`;
};

export default function AdminPasswordResetPage() {
  const { lang } = useLanguage();

  // Active Tab: 'requests' | 'all-users'
  const [activeTab, setActiveTab] = useState<'requests' | 'all-users'>('requests');

  // Reset Requests State
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatus, setRequestStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('ALL');

  // All Users State
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Password Reset Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Status/Notice Banner
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // Load Reset Requests
  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const params = new URLSearchParams();
      if (requestSearch.trim()) params.append('search', requestSearch.trim());
      if (requestStatus !== 'ALL') params.append('status', requestStatus);

      const res = await api.get(`/admin/password-resets?${params.toString()}`);
      const data = unwrap(res);
      const items = Array.isArray(data) ? data : data?.items || [];
      setRequests(items);
    } catch (err: any) {
      setRequests([]);
      showNotice(err.message || 'Failed to load password reset requests', 'error');
    } finally {
      setRequestsLoading(false);
    }
  }, [requestSearch, requestStatus]);

  // Load All Users
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append('search', userSearch.trim());
      params.append('limit', '50');

      const res = await api.get(`/admin/users?${params.toString()}`);
      const data = unwrap(res);
      const items = Array.isArray(data) ? data : data?.items || [];
      setUsers(items);
    } catch (err: any) {
      setUsers([]);
      showNotice(err.message || 'Failed to load users', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (activeTab === 'all-users') {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  // Open Modal for Request
  const handleOpenForRequest = (req: any) => {
    setActiveRequest(req);
    setTargetUser(
      req.user || {
        fullName: req.fullName,
        uniqueUserId: req.uniqueUserId,
        phone: req.phone,
        email: req.email,
        id: req.userId,
      }
    );
    const pwd = generatePassword();
    setNewPassword(pwd);
    setAdminNote('');
    setCopied(false);
    setModalOpen(true);
  };

  // Open Modal directly for User
  const handleOpenForUser = (u: any) => {
    setActiveRequest(null);
    setTargetUser(u);
    const pwd = generatePassword();
    setNewPassword(pwd);
    setAdminNote('');
    setCopied(false);
    setModalOpen(true);
  };

  // Generate new password in modal
  const handleGenerateNew = () => {
    setNewPassword(generatePassword());
    setCopied(false);
  };

  // Get SMS / Mail Template
  const getSmsMessage = () => {
    const name = targetUser?.fullName || targetUser?.firstName || 'সম্মানিত গ্রাহক';
    return `প্রিয় ${name}, SafnexBD তে আপনার অ্যাকাউন্টের নতুন পাসওয়ার্ড: ${newPassword}। দয়া করে লগইন করে পাসওয়ার্ড পরিবর্তন করে নিন।`;
  };

  const handleCopyMessage = () => {
    const msg = getSmsMessage();
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showNotice('মেসেজটি ক্লিপবোর্ডে কপি করা হয়েছে! (Message copied)');
  };

  // Submit Password Reset
  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showNotice('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (activeRequest) {
        // Resolve request
        await api.post(`/admin/password-resets/${activeRequest.id}/resolve`, {
          newPassword,
          adminNote: adminNote.trim() || undefined,
        });
        showNotice(
          `পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে! ইউজারকে ২৪ ঘণ্টার মধ্যে SMS বা ইমেইল পাঠিয়ে দিন।`
        );
      } else if (targetUser?.id) {
        // Direct reset
        await api.post(`/admin/users/${targetUser.id}/reset-password`, {
          newPassword,
          adminNote: adminNote.trim() || undefined,
        });
        showNotice(
          `User @${targetUser.uniqueUserId} এর পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!`
        );
      }

      setModalOpen(false);
      loadRequests();
      if (activeTab === 'all-users') loadUsers();
    } catch (err: any) {
      showNotice(err.message || 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Reject Request
  const handleRejectRequest = async (req: any) => {
    const reason = prompt('রিকোয়েস্ট বাতিল করার কারণ লিখুন (Reason for rejection):');
    if (reason === null) return;

    try {
      await api.patch(`/admin/password-resets/${req.id}/status`, {
        status: 'REJECTED',
        adminNote: reason.trim() || 'Rejected by admin after verification.',
      });
      showNotice('রিকোয়েস্ট বাতিল করা হয়েছে।');
      loadRequests();
    } catch (err: any) {
      showNotice(err.message || 'ব্যর্থ হয়েছে', 'error');
    }
  };

  // KPI Calculations
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
  const totalCount = requests.length;

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
              : 'bg-rose-950/90 text-rose-300 border-rose-700/60'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="ml-2 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {lang === 'bn' ? 'পাসওয়ার্ড রিসেট ও রিকভারি' : 'Password Reset & Account Recovery'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'ইউজারদের পাসওয়ার্ড রিসেট রিকোয়েস্ট পর্যালোচনা করুন, নতুন পাসওয়ার্ড জেনারেট করুন এবং ২৪ ঘণ্টার মধ্যে ব্যবহারকারীকে জানান।'
                  : 'Manage password reset requests, generate secure credentials, and notify users within 24 hours.'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'requests') loadRequests();
            else loadUsers();
          }}
          disabled={requestsLoading || usersLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold shadow-sm transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${requestsLoading || usersLoading ? 'animate-spin text-amber-500' : ''}`} />
          <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
        </button>
      </div>

      {/* 24-Hour Policy Notice Callout */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-amber-800 dark:text-amber-300">
            {lang === 'bn' ? 'অ্যাডমিন গাইডলাইন ও সময়সীমা (২৪ ঘণ্টা)' : 'Admin Guideline & 24-Hour Delivery'}
          </div>
          <p className="text-amber-900/80 dark:text-amber-200/80 text-[11px] leading-relaxed">
            {lang === 'bn'
              ? 'ইউজাররা যখন পাসওয়ার্ড ভুলে যাওয়ার রিকোয়েস্ট পাঠান, তাদের বার্তা দেওয়া হয়: "অ্যাডমিন পাসওয়ার্ড পরিবর্তন করে ২৪ ঘণ্টার মধ্যে আপনার ফোন অথবা ইমেইলে পাঠিয়ে দেবে"। পাসওয়ার্ড জেনারেট করে আপডেট করার পর নিচের রেডিমেড মেসেজ কপি করে ব্যবহারকারীর ফোন (SMS) বা ইমেইলে পাঠিয়ে দিন।'
              : 'When users submit a reset request, they are told: "Admin will reset your password and send it to your phone or email within 24 hours". After updating the password, copy the generated message and send it to their phone (SMS) or email.'}
          </p>
        </div>
      </div>

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'পেন্ডিং রিকোয়েস্ট' : 'Pending Requests'}
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'রিসেট সম্পন্ন' : 'Completed Resets'}
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'মোট রিকোয়েস্ট' : 'Total Requests'}
            </div>
            <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">{totalCount}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn' ? 'রেজিস্টার্ড ইউজার' : 'Registered Users'}
            </div>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{users.length || '50+'}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'requests'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{lang === 'bn' ? 'পাসওয়ার্ড রিসেট রিকোয়েস্ট' : 'Password Reset Requests'}</span>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'requests' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all-users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'all-users'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'bn' ? 'সকল ইউজারের পাসওয়ার্ড পরিবর্তন' : 'All Users Password Manager'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PASSWORD RESET REQUESTS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadRequests();
              }}
              className="relative flex-1"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Search by Name, User ID, Phone, Email..."
                className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['ALL', 'PENDING', 'COMPLETED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setRequestStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    requestStatus === st
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st === 'ALL'
                    ? lang === 'bn' ? 'সকল' : 'All'
                    : st === 'PENDING'
                    ? lang === 'bn' ? 'পেন্ডিং' : 'Pending'
                    : st === 'COMPLETED'
                    ? lang === 'bn' ? 'সম্পন্ন' : 'Completed'
                    : lang === 'bn' ? 'বাতিল' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {requestsLoading ? (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading password reset requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
              <KeyRound className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">
                {lang === 'bn' ? 'কোনো পাসওয়ার্ড রিসেট রিকোয়েস্ট পাওয়া যায়নি' : 'No Password Reset Requests Found'}
              </p>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'ব্যবহারকারীরা লগইন পেজ থেকে রিকোয়েস্ট পাঠালে এখানে প্রদর্শিত হবে।'
                  : 'Requests submitted by users from the login page will appear here.'}
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="p-3.5">User Identity</th>
                      <th className="p-3.5">Contact Details</th>
                      <th className="p-3.5">User Note / Info</th>
                      <th className="p-3.5">Request Time</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {requests.map((r) => {
                      const isPending = r.status === 'PENDING';
                      const isCompleted = r.status === 'COMPLETED';

                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* User Identity */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              {r.user?.avatarUrl ? (
                                <img
                                  src={getImageUrl(r.user.avatarUrl)}
                                  alt={r.fullName}
                                  className="w-8 h-8 rounded-full object-cover border border-amber-500/30 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center flex-shrink-0 text-xs border border-amber-500/30">
                                  {r.fullName?.charAt(0) || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white">{r.fullName}</div>
                                <div className="font-mono text-amber-400 text-[11px] font-semibold">
                                  @{r.uniqueUserId}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact Details */}
                          <td className="p-3.5 text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-white font-medium">
                              <Phone className="w-3 h-3 text-amber-400 flex-shrink-0" />
                              <span>{r.phone}</span>
                            </div>
                            {r.email && (
                              <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                <span>{r.email}</span>
                              </div>
                            )}
                          </td>

                          {/* User Note */}
                          <td className="p-3.5 max-w-xs">
                            <div className="text-slate-300 truncate text-[11px]">
                              {r.notes || <span className="text-slate-500 italic">No notes provided</span>}
                            </div>
                            {r.adminNote && (
                              <div className="text-amber-400/90 text-[10px] mt-0.5 truncate">
                                Admin: {r.adminNote}
                              </div>
                            )}
                          </td>

                          {/* Request Time */}
                          <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                isPending
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : isCompleted
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPending ? 'bg-amber-400 animate-pulse' : isCompleted ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              <span>{r.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenForRequest(r)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                  isPending
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                }`}
                                title="Generate / Reset Password for User"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>{isPending ? 'Generate & Reset' : 'Reset Again'}</span>
                              </button>

                              {isPending && (
                                <button
                                  onClick={() => handleRejectRequest(r)}
                                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-rose-400 transition"
                                  title="Reject Request"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL USERS PASSWORD MANAGER                                         */}
      {/* ========================================================================= */}
      {activeTab === 'all-users' && (
        <div className="space-y-4">
          {/* User Search Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadUsers();
              }}
              className="relative"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search registered users by Name, Unique User ID, Phone, Email..."
                className="w-full pl-9 pr-24 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                className="absolute right-2 top-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black"
              >
                Search User
              </button>
            </form>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading user database...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-white">No users found</p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Available Balance</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl ? (
                              <img
                                src={getImageUrl(u.avatarUrl)}
                                alt={u.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-amber-500/30 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                                {u.fullName?.charAt(0) || u.firstName?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white">{u.fullName || `${u.firstName} ${u.lastName}`}</div>
                              <div className="font-mono text-amber-400 text-[11px] font-semibold">
                                @{u.uniqueUserId}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-[11px]">
                          <div>{u.email}</div>
                          <div className="text-slate-500">{u.phone}</div>
                        </td>

                        <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">
                          ৳ {Number(u.wallet?.availableBalance || 0).toLocaleString()}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenForUser(u)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                            title="Reset password for this user"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Reset Password</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASSWORD GENERATE & RESET MODAL                                           */}
      {/* ========================================================================= */}
      {modalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ও জেনারেট' : 'Generate & Reset Password'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {targetUser.fullName || `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim()} (@{targetUser.uniqueUserId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* User Details Summary */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Phone Number:</span>
                <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span>{targetUser.phone}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Email Address:</span>
                <div className="font-bold text-white flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{targetUser.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitReset} className="space-y-4">
              {/* Password Generator / Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'bn' ? 'নতুন পাসওয়ার্ড (New Password) *' : 'New Password *'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNew}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'আরেকটি জেনারেট করুন' : 'Generate New'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter or generate password..."
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-sm tracking-wide focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Ready-made Message to send user */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>
                      {lang === 'bn' ? 'ইউজারকে পাঠানোর মেসেজ (SMS / Mail)' : 'Message for User (SMS / Mail)'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                      copied
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
                    }`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'কপি হয়েছে!' : 'Copy Message'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] leading-relaxed select-all">
                  {getSmsMessage()}
                </div>
              </div>

              {/* Admin Audit Note */}
              <div>
                <label className="block text-slate-400 text-xs mb-1">
                  {lang === 'bn' ? 'অ্যাডমিন নোট (ঐচ্ছিক)' : 'Admin Audit Note (Optional)'}
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="e.g. Sent via SMS to 017... / User confirmed via WhatsApp"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 24h Promise Alert */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  {lang === 'bn'
                    ? 'পাসওয়ার্ড পরিবর্তন সম্পন্ন হলে ব্যবহারকারীর সাথে যোগাযোগ করে নতুন পাসওয়ার্ড সরবরাহ করুন।'
                    : 'Once confirmed, the new password takes effect immediately in the database and past sessions are invalidated.'}
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Updating DB...' : 'Save & Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
