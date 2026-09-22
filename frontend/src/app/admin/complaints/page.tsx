'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Eye,
  MessageSquare,
  FileText,
  Paperclip,
  Maximize2,
  X,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { getSocket } from '@/lib/socket';

interface ComplaintItem {
  id: string;
  ticketNumber: string;
  userId: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  trackingNumber?: string | null;
  evidenceUrls?: string[] | null;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';
  adminNotes?: string | null;
  isReadByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    uniqueUserId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
  };
  assignedTo?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
  resolvedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export default function AdminComplaintsPage() {
  const { lang } = useLanguage();
  const { user: currentAdmin } = useAuthStore();

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected for Details Modal
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_REVIEW');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  // Lightbox for Evidence Images
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res: any = await api.get('/complaints/admin/unread-count');
      const data = res?.data !== undefined ? res.data : res;
      if (typeof data?.count === 'number') {
        setUnreadCount(data.count);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 50,
      };
      if (activeTab !== 'ALL') {
        params.status = activeTab;
      }
      if (categoryFilter !== 'ALL') {
        params.category = categoryFilter;
      }
      if (priorityFilter !== 'ALL') {
        params.priority = priorityFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res: any = await api.get('/complaints/admin', { params });
      const data = res?.data !== undefined ? res.data : res;
      const list = data?.complaints || data?.items || (Array.isArray(data) ? data : []);
      setComplaints(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchComplaints();
    fetchUnreadCount();
  }, [fetchComplaints, fetchUnreadCount]);

  // Real-time socket listeners
  useEffect(() => {
    const socket = getSocket();

    const handleComplaintNew = () => {
      fetchComplaints();
      fetchUnreadCount();
    };

    const handleComplaintUpdate = () => {
      fetchComplaints();
      fetchUnreadCount();
    };

    socket.on('complaint:new', handleComplaintNew);
    socket.on('complaint:update', handleComplaintUpdate);
    socket.on('complaint:read', handleComplaintUpdate);

    return () => {
      socket.off('complaint:new', handleComplaintNew);
      socket.off('complaint:update', handleComplaintUpdate);
      socket.off('complaint:read', handleComplaintUpdate);
    };
  }, [fetchComplaints, fetchUnreadCount]);

  const handleOpenDetail = async (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setAdminNotes(complaint.adminNotes || '');
    setSelectedStatus(complaint.status);
    setUpdateMessage('');

    // Mark as read if not read
    if (!complaint.isReadByAdmin) {
      try {
        await api.patch(`/complaints/admin/${complaint.id}/read`);
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaint.id ? { ...c, isReadByAdmin: true } : c)),
        );
        fetchUnreadCount();
      } catch {
        // ignore
      }
    }
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;
    setUpdatingStatus(true);
    setUpdateMessage('');

    try {
      const res: any = await api.patch(`/complaints/admin/${selectedComplaint.id}`, {
        status: selectedStatus,
        adminNotes: adminNotes.trim() || undefined,
      });

      const updated = res?.data !== undefined ? res.data : res;
      setComplaints((prev) =>
        prev.map((c) => (c.id === selectedComplaint.id ? { ...c, ...updated } : c)),
      );
      setSelectedComplaint((prev) => (prev ? { ...prev, ...updated } : null));
      setUpdateMessage(
        lang === 'bn' ? 'স্ট্যাটাস সফলভাবে আপডেট হয়েছে' : 'Status updated successfully',
      );
      fetchUnreadCount();
    } catch (err: any) {
      setUpdateMessage(
        err?.response?.data?.message ||
          (lang === 'bn' ? 'আপডেট করতে ব্যর্থ হয়েছে' : 'Failed to update complaint'),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-wider border border-rose-500/30">
            {lang === 'bn' ? 'অতি জরুরি' : 'Urgent'}
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider border border-amber-500/30">
            {lang === 'bn' ? 'জরুরি' : 'High'}
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold text-[10px] uppercase tracking-wider border border-sky-500/30">
            {lang === 'bn' ? 'মাঝারি' : 'Medium'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider border border-slate-500/30">
            {lang === 'bn' ? 'সাধারণ' : 'Low'}
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'অপেক্ষমান' : 'Pending'}</span>
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center gap-1 border border-sky-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'তদন্তাধীন' : 'In Review'}</span>
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নিষ্পত্তি সম্পন্ন' : 'Resolved'}</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'বাতিলকৃত' : 'Rejected'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryName = (c: string) => {
    switch (c) {
      case 'ESCROW':
        return lang === 'bn' ? 'এসক্রো লেনদেন' : 'Escrow Deal';
      case 'DEPOSIT_WITHDRAWAL':
        return lang === 'bn' ? 'ডিপোজিট / উইথড্র' : 'Deposit / Cashout';
      case 'SCAM':
        return lang === 'bn' ? 'স্ক্যাম রিপোর্ট' : 'Scam Report';
      case 'ACCOUNT':
        return lang === 'bn' ? 'অ্যাকাউন্ট ও নিরাপত্তা' : 'Account & Security';
      case 'BUG':
        return lang === 'bn' ? 'কারিগরি ত্রুটি' : 'Technical Bug';
      default:
        return lang === 'bn' ? 'অন্যান্য' : 'Other';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'ব্যবহারকারীদের অভিযোগ ও ডিসপ্যুট' : 'Complaints & Dispute Center'}
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-xs animate-pulse shadow-xs">
                    {unreadCount} {lang === 'bn' ? 'টি নতুন অমীমাংসিত' : 'Unread'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'ব্যবহারকারীদের দাখিলকৃত প্রতারণা অভিযোগ, লেনদেন জটিলতা ও টিকিট ব্যবস্থাপনা'
                  : 'Manage user dispute tickets, scam reports, and official arbitration requests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                fetchComplaints();
                fetchUnreadCount();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {[
              { key: 'ALL', labelBn: 'সবগুলো', labelEn: 'All' },
              { key: 'PENDING', labelBn: 'অপেক্ষমান', labelEn: 'Pending' },
              { key: 'IN_REVIEW', labelBn: 'তদন্তাধীন', labelEn: 'In Review' },
              { key: 'RESOLVED', labelBn: 'নিষ্পত্তিকৃত', labelEn: 'Resolved' },
              { key: 'REJECTED', labelBn: 'বাতিলকৃত', labelEn: 'Rejected' },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    active
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {lang === 'bn' ? tab.labelBn : tab.labelEn}
                </button>
              );
            })}
          </div>

          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <option value="ALL">{lang === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
              <option value="ESCROW">{lang === 'bn' ? 'এসক্রো লেনদেন' : 'Escrow'}</option>
              <option value="DEPOSIT_WITHDRAWAL">{lang === 'bn' ? 'ডিপোজিট / উইথড্র' : 'Deposit / Cashout'}</option>
              <option value="SCAM">{lang === 'bn' ? 'স্ক্যাম রিপোর্ট' : 'Scam'}</option>
              <option value="ACCOUNT">{lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account'}</option>
              <option value="BUG">{lang === 'bn' ? 'বাগ রিপোর্ট' : 'Bug'}</option>
              <option value="OTHER">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <option value="ALL">{lang === 'bn' ? 'সকল প্রায়োরিটি' : 'All Priorities'}</option>
              <option value="URGENT">{lang === 'bn' ? 'অতি জরুরি (Urgent)' : 'Urgent'}</option>
              <option value="HIGH">{lang === 'bn' ? 'জরুরি (High)' : 'High'}</option>
              <option value="MEDIUM">{lang === 'bn' ? 'মাঝারি (Medium)' : 'Medium'}</option>
              <option value="LOW">{lang === 'bn' ? 'সাধারণ (Low)' : 'Low'}</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'টিকিট বা ইউজার সার্চ...' : 'Search ticket or user...'}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 mx-auto border-3 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {lang === 'bn' ? 'অভিযোগের তালিকা লোড হচ্ছে...' : 'Loading complaints...'}
          </p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {lang === 'bn' ? 'কোনো অভিযোগ পাওয়া যায়নি' : 'No complaints found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {lang === 'bn'
              ? 'এই ফিল্টারে বর্তমানে কোনো অমীমাংসিত অভিযোগ বা ডিসপ্যুট টিকিট নেই।'
              : 'There are no complaints matching the selected filters at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {complaints.map((item) => {
            const hasAttachments =
              Array.isArray(item.evidenceUrls) && item.evidenceUrls.length > 0;
            const isUnread = !item.isReadByAdmin;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition hover:shadow-md ${
                  isUnread
                    ? 'border-rose-500/50 dark:border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Side: Ticket Meta + Subject */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Ticket Badge */}
                      <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-slate-900 text-amber-400 dark:bg-slate-800 dark:text-amber-400 border border-slate-800 dark:border-slate-700">
                        {item.ticketNumber}
                      </span>

                      {/* Unread indicator */}
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                          {lang === 'bn' ? 'নতুন (New)' : 'New'}
                        </span>
                      )}

                      {/* Category */}
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-slate-700">
                        {getCategoryName(item.category)}
                      </span>

                      {/* Priority */}
                      {getPriorityBadge(item.priority)}

                      {/* Tracking number if any */}
                      {item.trackingNumber && (
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          ID: {item.trackingNumber}
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.subject}
                    </h3>

                    {/* Description preview */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Complainant User Info & Time */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-800 dark:text-slate-200 font-bold">
                          {item.user?.firstName || 'ইউজার'} {item.user?.lastName || ''}
                        </span>
                        {item.user?.uniqueUserId && (
                          <span className="font-mono text-[10px] text-slate-400">
                            (@{item.user.uniqueUserId})
                          </span>
                        )}
                      </div>

                      {item.user?.phone && (
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.user.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>

                      {hasAttachments && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          <Paperclip className="w-3 h-3" />
                          <span>
                            {item.evidenceUrls?.length}{' '}
                            {lang === 'bn' ? 'টি প্রমাণপত্র' : 'Attachments'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Status Badge & Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {getStatusBadge(item.status)}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'তদন্ত ও সমাধান' : 'Review & Action'}</span>
                      </button>

                      <Link
                        href={`/admin/cms?userId=${item.userId}`}
                        className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition border border-sky-200 dark:border-sky-800"
                        title={lang === 'bn' ? 'ইউজারের সাথে সরাসরি চ্যাট করুন' : 'Chat with user'}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Action Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {selectedComplaint.ticketNumber}
                    </span>
                    {getPriorityBadge(selectedComplaint.priority)}
                    {getStatusBadge(selectedComplaint.status)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Complainant User Profile Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                    {selectedComplaint.user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>
                        {selectedComplaint.user?.firstName} {selectedComplaint.user?.lastName}
                      </span>
                      {selectedComplaint.user?.uniqueUserId && (
                        <span className="font-mono text-xs text-slate-400">
                          (@{selectedComplaint.user.uniqueUserId})
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedComplaint.user?.phone && (
                        <span className="font-mono">{selectedComplaint.user.phone}</span>
                      )}
                      {selectedComplaint.user?.email && (
                        <span>{selectedComplaint.user.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/cms?userId=${selectedComplaint.userId}`}
                    className="px-3 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-sky-600 transition shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ইউজার চ্যাট' : 'Open Chat'}</span>
                  </Link>
                  <Link
                    href={`/admin/users?search=${selectedComplaint.user?.uniqueUserId || selectedComplaint.user?.phone || ''}`}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:opacity-80 transition"
                    title={lang === 'bn' ? 'ইউজার প্রোফাইল অডিট' : 'Audit User Profile'}
                  >
                    <User className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Subject & Deal ID */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'অভিযোগের বিষয় ও ট্র্যাকিং' : 'Subject & Reference'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedComplaint.subject}
                </h3>
                {selectedComplaint.trackingNumber && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-mono font-bold">
                    <span>{lang === 'bn' ? 'ট্রানজ্যাকশন আইডি:' : 'Transaction ID:'}</span>
                    <span>{selectedComplaint.trackingNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('track', selectedComplaint.trackingNumber || '')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      {copiedKey === 'track' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Full Description */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'bn' ? 'ইউজারের পূর্ণাঙ্গ বিবরণ' : 'Full Statement by Complainant'}
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint.description}
                </div>
              </div>

              {/* Evidence Screenshots Lightbox */}
              {Array.isArray(selectedComplaint.evidenceUrls) &&
                selectedComplaint.evidenceUrls.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {lang === 'bn' ? 'সংযুক্ত প্রমাণপত্র / স্ক্রিনশট' : 'Evidence Attachments'} (
                      {selectedComplaint.evidenceUrls.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedComplaint.evidenceUrls.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setLightboxImage(getImageUrl(url))}
                          className="relative h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer bg-slate-100 dark:bg-slate-800 hover:border-rose-400 transition"
                        >
                          <img
                            src={getImageUrl(url)}
                            alt={`Evidence ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Admin Resolution & Action Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-800/60 dark:to-amber-950/20 border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'অ্যাডমিন তদন্ত ও সমাধান ব্যবস্থা' : 'Admin Resolution & Action'}</span>
                </div>

                {updateMessage && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-700 dark:text-amber-300">
                    {updateMessage}
                  </div>
                )}

                {/* Status Switcher Buttons */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'bn' ? 'অভিযোগের অবস্থা নির্ধারণ করুন:' : 'Change Ticket Status:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        value: 'PENDING',
                        labelBn: 'অপেক্ষমান',
                        labelEn: 'Pending',
                        icon: Clock,
                        color: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10',
                      },
                      {
                        value: 'IN_REVIEW',
                        labelBn: 'তদন্তাধীন',
                        labelEn: 'In Review',
                        icon: ShieldAlert,
                        color: 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-500/10',
                      },
                      {
                        value: 'RESOLVED',
                        labelBn: 'নিষ্পত্তি সম্পন্ন',
                        labelEn: 'Resolved',
                        icon: CheckCircle2,
                        color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
                      },
                      {
                        value: 'REJECTED',
                        labelBn: 'বাতিলকৃত',
                        labelEn: 'Rejected',
                        icon: XCircle,
                        color: 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/10',
                      },
                    ].map((st) => {
                      const Icon = st.icon;
                      const isSelected = selectedStatus === st.value;
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => setSelectedStatus(st.value)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            isSelected
                              ? `${st.color} shadow-xs ring-2 ring-amber-500/30`
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{lang === 'bn' ? st.labelBn : st.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'bn'
                      ? 'অ্যাডমিন নোট / সমাধানের সিদ্ধান্ত (ইউজার ও অডিটের জন্য)'
                      : 'Admin Notes / Decision Summary:'}
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'অভিযোগের বিষয়ে গৃহীত পদক্ষেপ, মধ্যস্থতার সিদ্ধান্ত বা ব্যাখ্যা এখানে লিখুন...'
                        : 'Enter resolution notes, mediation outcome, or internal remarks...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={handleUpdateComplaint}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {updatingStatus ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        <span>{lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>{lang === 'bn' ? 'স্ট্যাটাস ও নোট আপডেট করুন' : 'Save & Update'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for viewing full screenshots */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage}
              alt="Full Evidence"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}

