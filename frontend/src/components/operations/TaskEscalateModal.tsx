'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  ShieldAlert,
  X,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface TaskEscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle?: string;
  onSuccess: () => void;
}

export function TaskEscalateModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onSuccess,
}: TaskEscalateModalProps) {
  const { lang } = useLanguage();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg(
        lang === 'bn'
          ? 'সুপার অ্যাডমিনের জন্য এস্কেলেশনের সুনির্দিষ্ট কারণ বা সারসংক্ষেপ লিখুন।'
          : 'Please provide an escalation summary for the Super Admin.'
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/operations/escalate', {
        taskType: 'DISPUTE',
        taskId,
        reason: reason.trim(),
      });

      if (res.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to escalate task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{lang === 'bn' ? 'সুপার অ্যাডমিনে এস্কেলেট করুন' : 'Escalate to Super Admin'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {taskTitle || `Dispute #${taskId.slice(-6)}`}
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

        {/* Warning Banner */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{lang === 'bn' ? 'জরুরি সিদ্ধান্ত ও উচ্চতর পর্যালোচনা' : 'High Priority Escalation'}</span>
          </div>
          <p>
            {lang === 'bn'
              ? 'এই ডিসপুটটি সরাসরি সুপার অ্যাডমিনের প্রাইওরিটি কিউতে চলে যাবে এবং ইনস্ট্যান্ট অ্যালার্ট জারি হবে।'
              : 'This dispute will be routed to the Super Admin priority queue with high-urgency telemetry.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'bn' ? 'এস্কেলেশনের কারণ ও মামলার বিবরণ' : 'Escalation Reason & Summary'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'উভয় পক্ষের দাবি পরস্পরবিরোধী, প্রমাণাদি স্পষ্ট নয়, বা বড় অংকের অমীমাংসিত ফান্ডিং সংক্রান্ত জটিলতা...'
                  : 'Conflicting claims, fraud suspicion, or high-value dispute requiring senior resolution...'
              }
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-medium"
            />
          </div>

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
              disabled={submitting || !reason.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <ArrowUpRight className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'সুপার অ্যাডমিনে পাঠান' : 'Send to Super Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

