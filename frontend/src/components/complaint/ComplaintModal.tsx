'use client';

import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  ShieldAlert,
  Send,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Trash2,
  Lock,
  Layers,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { compressImage, getImageUrl } from '@/lib/imageUtils';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTrackingNumber?: string;
}

export function ComplaintModal({
  isOpen,
  onClose,
  defaultTrackingNumber = '',
}: ComplaintModalProps) {
  const { lang } = useLanguage();

  const [category, setCategory] = useState<string>('ESCROW');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [subject, setSubject] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>(defaultTrackingNumber);
  const [description, setDescription] = useState<string>('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketNumber: string;
    id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const categories = [
    {
      value: 'ESCROW',
      labelBn: 'এসক্রো লেনদেন সংক্রান্ত',
      labelEn: 'Escrow & Transaction',
      icon: '🤝',
    },
    {
      value: 'DEPOSIT_WITHDRAWAL',
      labelBn: 'ডিপোজিট / উইথড্র সমস্যা',
      labelEn: 'Deposit / Cashout Issue',
      icon: '💳',
    },
    {
      value: 'SCAM',
      labelBn: 'স্ক্যাম বা প্রতারণা রিপোর্ট',
      labelEn: 'Fraud / Scam Report',
      icon: '🚨',
    },
    {
      value: 'ACCOUNT',
      labelBn: 'অ্যাকাউন্ট ও নিরাপত্তা',
      labelEn: 'Account & Security',
      icon: '🔐',
    },
    {
      value: 'BUG',
      labelBn: 'কারিগরি ত্রুটি বা বাগ',
      labelEn: 'Technical Bug',
      icon: '🐞',
    },
    {
      value: 'OTHER',
      labelBn: 'অন্যান্য অভিযোগ',
      labelEn: 'Other Complaint',
      icon: '📝',
    },
  ];

  const priorities = [
    { value: 'LOW', labelBn: 'সাধারণ', labelEn: 'Low', color: 'text-slate-500' },
    { value: 'MEDIUM', labelBn: 'মাঝারি', labelEn: 'Medium', color: 'text-sky-500' },
    { value: 'HIGH', labelBn: 'জরুরি', labelEn: 'High', color: 'text-amber-500' },
    { value: 'URGENT', labelBn: 'অতি জরুরি', labelEn: 'Urgent', color: 'text-rose-500' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (evidenceUrls.length + files.length > 5) {
      setUploadError(
        lang === 'bn'
          ? 'সর্বোচ্চ ৫টি প্রমাণ আপলোড করতে পারবেন'
          : 'You can upload maximum 5 attachments',
      );
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          setUploadError(
            lang === 'bn'
              ? 'শুধুমাত্র ছবি (JPG, PNG, WEBP) আপলোড করা যাবে'
              : 'Only image files are allowed',
          );
          continue;
        }

        const { base64Data, fileName: cleanFileName } = await compressImage(
          file,
          1200,
          1200,
          0.85,
        );
        const res: any = await api.post('/uploads', {
          base64Data,
          fileName: cleanFileName,
          folder: 'complaints',
        });

        const uploadedUrl = res?.fileUrl || res?.data?.fileUrl || res?.url;
        if (uploadedUrl) {
          newUrls.push(uploadedUrl);
        }
      }

      setEvidenceUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.message ||
          (lang === 'bn'
            ? 'ছবি আপলোড করতে ব্যর্থ হয়েছে'
            : 'Failed to upload image'),
      );
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeEvidence = (index: number) => {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!subject.trim()) {
      setErrorMessage(
        lang === 'bn' ? 'অভিযোগের বিষয়বস্তু লিখুন' : 'Please provide a subject',
      );
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage(
        lang === 'bn'
          ? 'বিস্তারিত বর্ণনায় কমপক্ষে ১০টি অক্ষর লিখুন'
          : 'Description must be at least 10 characters',
      );
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await api.post('/complaints', {
        category,
        priority,
        subject: subject.trim(),
        description: description.trim(),
        trackingNumber: trackingNumber.trim() || undefined,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      });

      const data = res?.data !== undefined ? res.data : res;
      setSubmittedTicket({
        ticketNumber: data.ticketNumber,
        id: data.id,
      });
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          (lang === 'bn'
            ? 'অভিযোগ সাবমিট করতে সমস্যা হয়েছে, আবার চেষ্টা করুন'
            : 'Failed to submit complaint, please try again'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (!submittedTicket) return;
    navigator.clipboard.writeText(submittedTicket.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetAndNew = () => {
    setSubmittedTicket(null);
    setSubject('');
    setDescription('');
    setTrackingNumber('');
    setEvidenceUrls([]);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{lang === 'bn' ? 'অভিযোগ দাখিল করুন' : 'File a Complaint / Report'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                  {lang === 'bn' ? 'অফিশিয়াল তদন্ত' : 'Official Review'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'আপনার যে কোনো সমস্যা বা প্রতারণার অভিযোগ এডমিন প্যানেলে সরাসরি দাখিল করুন'
                  : 'Submit any platform issue, transaction dispute, or scam report directly to Admin'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {submittedTicket ? (
            /* Success Screen */
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'অভিযোগ সফলভাবে দাখিল হয়েছে!' : 'Complaint Submitted Successfully!'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                  {lang === 'bn'
                    ? 'আপনার টিকিট নম্বরটি সংরক্ষণ করুন। আমাদের অ্যাডমিন ও মধ্যস্থতাকারী দল এটি দ্রুত পর্যালোচনা করে প্রয়োজনীয় পদক্ষেপ নেবে।'
                    : 'Please keep your ticket number. Our admin and arbitration team is reviewing it and will take appropriate action shortly.'}
                </p>
              </div>

              {/* Ticket Badge */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {lang === 'bn' ? 'টিকিট ট্র্যাকিং নম্বর' : 'Ticket Tracking No.'}
                  </span>
                  <span className="text-lg font-mono font-black text-amber-500 dark:text-amber-400">
                    {submittedTicket.ticketNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTicket}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      <span>{lang === 'bn' ? 'কপি হয়েছে' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'কপি করুন' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleResetAndNew}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {lang === 'bn' ? 'আরেকটি অভিযোগ দাখিল করুন' : 'Submit Another Complaint'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition shadow-md"
                >
                  {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          ) : (
            /* Complaint Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {lang === 'bn' ? 'অভিযোগের ধরন নির্বাচন করুন' : 'Select Complaint Category'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => {
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2 text-xs font-semibold ${
                          isSelected
                            ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs'
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span className="text-base">{cat.icon}</span>
                        <span className="truncate">
                          {lang === 'bn' ? cat.labelBn : cat.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Priority & Tracking Number (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'bn' ? 'জরুরিতা / প্রায়োরিটি' : 'Priority Level'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {priorities.map((p) => {
                      const isSelected = priority === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={`py-2 px-1 rounded-xl text-[11px] font-bold border text-center transition ${
                            isSelected
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {lang === 'bn' ? p.labelBn : p.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'bn' ? 'অর্ডার / ট্রানজ্যাকশন আইডি (ঐচ্ছিক)' : 'Deal / Transaction ID (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="TRX-123456 / ESC-987654"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
                  />
                </div>
              </div>

              {/* 3. Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'অভিযোগের সংক্ষিপ্ত বিষয়' : 'Subject of Complaint'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: ক্রেতা পণ্য পেয়েও কনফার্ম করছে না / উইথড্র আটকে আছে'
                      : 'e.g. Buyer not confirming delivery / Cashout delayed'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 font-medium"
                />
              </div>

              {/* 4. Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'বিস্তারিত বিবরণ' : 'Detailed Explanation'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'ঘটনাটি বিস্তারিতভাবে লিখুন। অপর পক্ষের নাম বা ইউজারনেম, কী ঘটেছে, কখন ঘটেছে ইত্যাদি উল্লেখ করুন...'
                      : 'Provide full details of what happened, usernames involved, timestamps, deal details...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 font-normal leading-relaxed resize-none"
                />
              </div>

              {/* 5. Screenshot / Evidence Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'প্রমাণ / স্ক্রিনশট (সর্বোচ্চ ৫টি)' : 'Evidence / Screenshots (Max 5)'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {evidenceUrls.length}/5
                  </span>
                </div>

                {uploadError && (
                  <p className="text-xs text-rose-500 mb-2">{uploadError}</p>
                )}

                {/* Previews */}
                <div className="flex flex-wrap gap-2.5 mb-2.5">
                  {evidenceUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800"
                    >
                      <img
                        src={getImageUrl(url)}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeEvidence(idx)}
                        className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  ))}

                  {evidenceUrls.length < 5 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 transition flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 hover:text-rose-500">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploading}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-bold">
                        {isUploading
                          ? lang === 'bn'
                            ? 'আপলোড...'
                            : 'Uploading'
                          : lang === 'bn'
                          ? 'যোগ করুন'
                          : 'Add Photo'}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{lang === 'bn' ? 'দাখিল হচ্ছে...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'অভিযোগ দাখিল করুন' : 'Submit Complaint'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

