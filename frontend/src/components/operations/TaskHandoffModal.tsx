'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  Shuffle,
  X,
  User,
  AlertCircle,
  CheckCircle2,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StaffProfileItem {
  id: string;
  userId: string;
  dutyStatus: 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';
  department: string;
  maxConcurrentTasks: number;
  activeTasksCount: number;
  availableSlots: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    uniqueUserId: string;
    email: string;
    avatarUrl?: string;
  };
}

interface TaskHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskType: 'WITHDRAWAL' | 'RECHARGE' | 'DISPUTE';
  taskId: string;
  taskTitle?: string;
  currentStaffId?: string;
  onSuccess: () => void;
}

export function TaskHandoffModal({
  isOpen,
  onClose,
  taskType,
  taskId,
  taskTitle,
  currentStaffId,
  onSuccess,
}: TaskHandoffModalProps) {
  const { lang } = useLanguage();
  const [staffList, setStaffList] = useState<StaffProfileItem[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedStaffId('');
      setReason('');
      setErrorMsg(null);
      return;
    }

    const fetchStaff = async () => {
      setLoadingStaff(true);
      setErrorMsg(null);
      try {
        const res = await api.get('/operations/active-staff');
        if (res.data?.success && Array.isArray(res.data.data)) {
          // Filter out current staff member
          const filtered = res.data.data.filter((s: StaffProfileItem) => s.userId !== currentStaffId);
          setStaffList(filtered);
          if (filtered.length > 0) {
            // Pre-select staff with most available slots
            const bestCandidate = [...filtered].sort((a, b) => b.availableSlots - a.availableSlots)[0];
            setSelectedStaffId(bestCandidate.userId);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to fetch active staff members');
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [isOpen, currentStaffId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে একজন দায়িত্বপ্রাপ্ত স্টাফ নির্বাচন করুন।' : 'Please select a staff member.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg(lang === 'bn' ? 'হস্তান্তরের কারণ বা নোট লেখা বাধ্যতামূলক।' : 'Handover reason or notes is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/operations/reassign', {
        taskType,
        taskId,
        toStaffId: selectedStaffId,
        reason: reason.trim(),
      });

      if (res.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reassign task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'সহকর্মীকে কাজ হস্তান্তর করুন' : 'Reassign Task to Colleague'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {taskTitle || `${taskType} #${taskId.slice(-6)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Active Staff List Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'bn' ? 'অন-ডিউটি সহকর্মী নির্বাচন করুন' : 'Select On-Duty Colleague'}
            </label>

            {loadingStaff ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                {lang === 'bn' ? 'সক্রিয় স্টাফদের তালিকা লোড হচ্ছে...' : 'Loading active staff members...'}
              </div>
            ) : staffList.length === 0 ? (
              <div className="p-6 text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-2xl font-medium">
                {lang === 'bn'
                  ? 'বর্তমানে অন্য কোনো স্টাফ ডিউটিতে নেই। সুপার অ্যাডমিনের সাথে যোগাযোগ করুন বা পরবর্তীতে চেষ্টা করুন।'
                  : 'No other staff members are currently On Duty.'}
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {staffList.map((st) => {
                  const isSelected = selectedStaffId === st.userId;
                  return (
                    <div
                      key={st.userId}
                      onClick={() => setSelectedStaffId(st.userId)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                          {st.user.firstName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{st.user.firstName} {st.user.lastName}</span>
                            <span className="text-[10px] text-amber-500 font-mono">@{st.user.uniqueUserId}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-emerald-500 font-medium">
                              <Activity className="w-2.5 h-2.5" />
                              {st.dutyStatus}
                            </span>
                            <span>•</span>
                            <span>{st.department}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            st.activeTasksCount >= st.maxConcurrentTasks
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {st.activeTasksCount} / {st.maxConcurrentTasks} {lang === 'bn' ? 'কাজ' : 'tasks'}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {st.availableSlots > 0
                            ? (lang === 'bn' ? `${st.availableSlots} স্লট খালি` : `${st.availableSlots} free slots`)
                            : (lang === 'bn' ? 'লোড ফুল' : 'Full capacity')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Handover Reason / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'bn' ? 'হস্তান্তরের কারণ ও বিশেষ নোট (Handover Notes)' : 'Handover Notes & Context'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: ইউজার ব্যাংক অ্যাকাউন্টের তথ্যে বিভ্রান্তি তৈরি হয়েছে, অন্য সহকর্মীর স্পেশাল রিভিউ প্রয়োজন...'
                  : 'E.g., Customer needs urgent bank verification, handover required...'
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-medium"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedStaffId || !reason.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Shuffle className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'হস্তান্তর সম্পন্ন করুন' : 'Confirm Handover'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

