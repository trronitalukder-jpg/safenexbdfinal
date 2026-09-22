'use client';

import React from 'react';
import {
  Sparkles,
  X,
  CreditCard,
  Send,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface RechargeStep {
  stepNumber: number;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  badgeText?: string;
}

export interface RechargeInstructionsData {
  titleBn?: string;
  titleEn?: string;
  subtitleBn?: string;
  subtitleEn?: string;
  steps?: RechargeStep[];
  importantNotesBn?: string[];
  importantNotesEn?: string[];
  supportPhone?: string;
  supportWhatsapp?: string;
  videoUrl?: string;
  updatedAt?: string;
}

export const DEFAULT_INSTRUCTIONS: RechargeInstructionsData = {
  titleBn: 'কিভাবে ব্যালেন্স রিচার্জ করবেন?',
  titleEn: 'How to Recharge Wallet Balance?',
  subtitleBn: 'নিচের ৪টি সহজ ধাপ অনুসরণ করে যেকোনো সময় আপনার অ্যাকাউন্টে টাকা যোগ করুন।',
  subtitleEn: 'Follow these 4 simple steps to safely add money to your SafnexBD wallet.',
  steps: [
    {
      stepNumber: 1,
      titleBn: 'পেমেন্ট মেথড ও নম্বর নির্বাচন করুন',
      titleEn: 'Select Payment Method & Copy Number',
      descriptionBn: 'বিকাশ, নগদ, রকেট বা ব্যাংক মেথড সিলেক্ট করুন এবং আমাদের প্রদর্শিত অফিশিয়াল পার্সোনাল বা মার্চেন্ট নম্বরটি কপি করুন।',
      descriptionEn: 'Choose bKash, Nagad, Rocket or Bank and copy our official payment number.',
      badgeText: 'Step 1',
    },
    {
      stepNumber: 2,
      titleBn: 'সঠিক পরিমাণ টাকা সেন্ড মানি করুন',
      titleEn: 'Send Money from Your App',
      descriptionBn: 'আপনার বিকাশ/নগদ অ্যাপ থেকে আমাদের নম্বরে কাঙ্ক্ষিত টাকার সমপরিমাণ অর্থ সেন্ড মানি (Send Money) অথবা পেমেন্ট করুন।',
      descriptionEn: 'Send the exact recharge amount to our number using your mobile banking app.',
      badgeText: 'Step 2',
    },
    {
      stepNumber: 3,
      titleBn: 'TrxID ও প্রেরক নম্বর সাবমিট করুন',
      titleEn: 'Submit TrxID & Sender Number',
      descriptionBn: 'টাকা পাঠানোর পর প্রাপ্ত ট্রানজেকশন আইডি (TrxID) ও যে নম্বর থেকে টাকা পাঠিয়েছেন তা রিচার্জ ফর্মে লিখে সাবমিট করুন।',
      descriptionEn: 'Enter the Transaction ID (TrxID) and your sender phone number in the form and submit.',
      badgeText: 'Step 3',
    },
    {
      stepNumber: 4,
      titleBn: 'দ্রুত ব্যালেন্স ভেরিফিকেশন ও ক্রেডিট',
      titleEn: 'Fast Verification & Instant Credit',
      descriptionBn: 'আমাদের সিস্টেম ও এডমিন দ্রুত আপনার ট্রানজেকশন যাচাই করে ৫ থেকে ১৫ মিনিটের মধ্যে আপনার ওয়ালেটে ব্যালেন্স যুক্ত করে দেবে।',
      descriptionEn: 'Our staff will verify your transaction details and credit your wallet within 5-15 minutes.',
      badgeText: 'Step 4',
    },
  ],
  importantNotesBn: [
    'সর্বদা ওয়ালেট পেজে প্রদর্শিত সর্বশেষ অফিসিয়াল নম্বরেই টাকা পাঠাবেন। পুরনো নম্বরে টাকা পাঠালে তা গ্রহণযোগ্য হবে না।',
    'ভুল TrxID বা ভুয়া রিকোয়েস্ট দিলে আপনার অ্যাকাউন্ট সাময়িক বা স্থায়ীভাবে ব্যান হতে পারে।',
    'টাকা পাঠানোর পর ট্রানজেকশনের এসএমএস বা কনফার্মেশন স্ক্রিনশট নিরাপদ রাখুন।',
    'যেকোনো জরুরি প্রয়োজনে আমাদের লাইভ সাপোর্ট বা হোয়াটসঅ্যাপে সরাসরি যোগাযোগ করুন।',
  ],
  importantNotesEn: [
    'Always send money to the latest official number displayed on the wallet recharge screen.',
    'Submitting fake TrxID or misleading information will cause instant account suspension.',
    'Keep your transaction SMS or payment screenshot safe until credited.',
    'Contact our 24/7 Live Support or WhatsApp if you need immediate assistance.',
  ],
  supportPhone: '+880 1700-000000',
  supportWhatsapp: '+880 1700-000000',
};

interface RechargeInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: RechargeInstructionsData | null;
  onProceedRecharge?: () => void;
  isPreview?: boolean;
}

const STEP_ICONS = [CreditCard, Send, FileText, ShieldCheck];

export function RechargeInstructionModal({
  isOpen,
  onClose,
  data,
  onProceedRecharge,
  isPreview = false,
}: RechargeInstructionModalProps) {
  const { lang } = useLanguage();

  if (!isOpen && !isPreview) return null;

  const currentData: RechargeInstructionsData = {
    ...DEFAULT_INSTRUCTIONS,
    ...(data || {}),
  };

  const title =
    lang === 'bn'
      ? currentData.titleBn || DEFAULT_INSTRUCTIONS.titleBn
      : currentData.titleEn || DEFAULT_INSTRUCTIONS.titleEn;

  const subtitle =
    lang === 'bn'
      ? currentData.subtitleBn || DEFAULT_INSTRUCTIONS.subtitleBn
      : currentData.subtitleEn || DEFAULT_INSTRUCTIONS.subtitleEn;

  const steps =
    currentData.steps && currentData.steps.length > 0
      ? currentData.steps
      : DEFAULT_INSTRUCTIONS.steps!;

  const notes =
    lang === 'bn'
      ? currentData.importantNotesBn && currentData.importantNotesBn.length > 0
        ? currentData.importantNotesBn
        : DEFAULT_INSTRUCTIONS.importantNotesBn!
      : currentData.importantNotesEn && currentData.importantNotesEn.length > 0
      ? currentData.importantNotesEn
      : DEFAULT_INSTRUCTIONS.importantNotesEn!;

  const content = (
    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
      {/* 1. Modal Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/30 p-5 sm:p-6 border-b border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  {lang === 'bn' ? 'অফিশিয়াল গাইড' : 'Official Guide'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">SafnexBD Wallet</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          {!isPreview && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
          {subtitle}
        </p>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
        {/* Step-by-Step Flow */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'bn' ? 'ধাপসমূহ (Step-by-Step Guide)' : 'Steps to Follow'}</span>
          </h4>

          <div className="grid grid-cols-1 gap-2.5">
            {steps.map((step, idx) => {
              const Icon = STEP_ICONS[idx % STEP_ICONS.length] || CheckCircle2;
              const stepTitle =
                lang === 'bn'
                  ? step.titleBn || step.titleEn
                  : step.titleEn || step.titleBn;
              const stepDesc =
                lang === 'bn'
                  ? step.descriptionBn || step.descriptionEn
                  : step.descriptionEn || step.descriptionBn;

              return (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30 transition flex items-start gap-3.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 font-black text-xs group-hover:scale-105 transition">
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {step.badgeText ? `${step.badgeText}: ` : `${idx + 1}. `}
                        {stepTitle}
                      </h5>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                        {step.badgeText || `Step ${idx + 1}`}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                      {stepDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Verification Guidelines */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{lang === 'bn' ? 'জরুরি সতর্কবার্তা ও নিরাপত্তা নিয়মাবলী' : 'Important Security & Verification Rules'}</span>
          </div>
          <ul className="space-y-1.5 text-[11px] sm:text-xs text-rose-900 dark:text-rose-300/90 leading-relaxed font-medium">
            {notes.map((note, nIdx) => (
              <li key={nIdx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Support Channels */}
        {(currentData.supportWhatsapp || currentData.supportPhone) && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'কোনো সহায়তার প্রয়োজন?' : 'Need 24/7 assistance?'}</span>
            </div>
            <div className="flex items-center gap-2">
              {currentData.supportWhatsapp && (
                <a
                  href={`https://wa.me/${currentData.supportWhatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
              {currentData.supportPhone && (
                <a
                  href={`tel:${currentData.supportPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{currentData.supportPhone}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal Footer */}
      <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-end gap-3">
        {!isPreview && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        )}

        {onProceedRecharge && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onProceedRecharge();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md shadow-sky-600/30 transition flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'এখনই রিচার্জ করুন' : 'Proceed to Recharge'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  if (isPreview) {
    return <div className="w-full flex justify-center py-4">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      {content}
    </div>
  );
}

