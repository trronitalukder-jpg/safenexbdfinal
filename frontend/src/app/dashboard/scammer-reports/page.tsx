'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Search,
  ExternalLink,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';

interface MyReport {
  id: string;
  phone: string | null;
  facebookLink: string | null;
  scammerName: string | null;
  category: string;
  description: string;
  amountLost: number | null;
  proofImages: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MyScammerReportsPage() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.get('/scammer-reports/my-reports');
      const data = res?.data !== undefined ? res.data : res;
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const categoryLabelsBn: Record<string, string> = {
    TRANSACTION_FRAUD: 'লেনদেন সংক্রান্ত প্রতারণা',
    FAKE_PRODUCT: 'পণ্য না দিয়ে যোগাযোগ বিচ্ছিন্ন',
    ACCOUNT_THEFT: 'ফেসবুক পেজ / আইডি চুরি',
    FAKE_SERVICE: 'ভুয়া সার্ভিস',
    OTHER: 'অন্যান্য প্রতারণা',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isBn ? 'আপনার দাখিলকৃত রিপোর্টসমূহ' : 'My Fraud Reports'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isBn ? 'প্রতারক রিপোর্ট ট্র্যাকিং' : 'Scammer Report Tracker'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {isBn
              ? 'আপনার দাখিলকৃত প্রতিটি রিপোর্ট অ্যাডমিন প্যানেল থেকে পর্যালোচনা করা হচ্ছে। আপনার পরিচয় শতভাগ গোপন রাখা হয়েছে।'
              : 'Track status of your submitted reports. Your identity is strictly confidential.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isBn ? 'নতুন রিপোর্ট দিন' : 'Submit Report'}</span>
          </Link>

          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>{isBn ? 'সার্চ ইঞ্জিন' : 'Search Checker'}</span>
          </Link>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">{isBn ? 'লোড হচ্ছে...' : 'Loading reports...'}</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {isBn ? 'আপনি এখনো কোনো প্রতারকের বিরুদ্ধে রিপোর্ট দাখিল করেননি' : 'No Reports Submitted Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              {isBn
                ? 'অনলাইনে কেনাবেচা বা লেনদেনে কেউ প্রতারণা করলে সঠিক প্রমাণসহ রিপোর্ট দাখিল করে অন্যদের সচেতন করুন।'
                : 'Help keep the community safe by reporting scammers with proof.'}
            </p>
          </div>
          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs sm:text-sm transition-colors"
          >
            <span>{isBn ? 'স্ক্যামার চেকারে যান' : 'Go to Checker'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">
                    {report.scammerName || (isBn ? 'নামহীন প্রতারক' : 'Unnamed')}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(report.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Status Badge */}
                {report.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>{isBn ? 'পেন্ডিং (পর্যালোচনা চলছে)' : 'Pending Review'}</span>
                  </span>
                ) : report.status === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অনুমোদিত (পাবলিক সার্চে লাইভ)' : 'Approved & Live'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বাতিল' : 'Rejected'}</span>
                  </span>
                )}
              </div>

              {/* Target Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {report.phone && (
                  <div>
                    <span className="text-slate-500">{isBn ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                    <p className="font-mono text-slate-300 font-semibold">{report.phone}</p>
                  </div>
                )}
                {report.facebookLink && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">{isBn ? 'ফেসবুক লিংক:' : 'Facebook:'}</span>
                    <a
                      href={report.facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1 break-all"
                    >
                      <span>{report.facebookLink}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">{isBn ? 'ক্যাটাগরি:' : 'Category:'}</span>
                  <p className="text-slate-300 font-medium">
                    {isBn ? categoryLabelsBn[report.category] || report.category : report.category}
                  </p>
                </div>
                {report.amountLost && (
                  <div>
                    <span className="text-slate-500">{isBn ? 'টাকার পরিমাণ:' : 'Amount:'}</span>
                    <p className="font-bold text-red-400">৳{report.amountLost.toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 block mb-0.5">{isBn ? 'আপনার দাখিলকৃত বিবরণ:' : 'Description:'}</span>
                <p className="whitespace-pre-line">{report.description}</p>
              </div>

              {report.rejectionReason && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  <span className="font-bold block mb-0.5">{isBn ? 'বাতিলের কারণ (অ্যাডমিন নোট):' : 'Rejection Reason:'}</span>
                  <p>{report.rejectionReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
