'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Save,
  RotateCcw,
  Languages,
  HelpCircle,
  ShieldAlert,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import {
  RechargeInstructionModal,
  DEFAULT_INSTRUCTIONS,
  RechargeInstructionsData,
  RechargeStep,
} from './RechargeInstructionModal';

interface RechargeInstructionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function RechargeInstructionEditorModal({
  isOpen,
  onClose,
  onSaved,
}: RechargeInstructionEditorModalProps) {
  const { lang: appLang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [editLang, setEditLang] = useState<'bn' | 'en'>('bn');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<RechargeInstructionsData>(DEFAULT_INSTRUCTIONS);

  // Fetch current instructions from backend
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const res: any = await api.get('/settings/recharge-instructions');
        const data = res?.data || res;
        if (data && typeof data === 'object') {
          setFormData({
            ...DEFAULT_INSTRUCTIONS,
            ...data,
          });
        }
      } catch (err) {
        console.error('Failed to load recharge instructions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Handlers for steps
  const handleStepChange = (index: number, field: keyof RechargeStep, value: any) => {
    const updatedSteps = [...(formData.steps || [])];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value,
    };
    setFormData({ ...formData, steps: updatedSteps });
  };

  const handleAddStep = () => {
    const currentSteps = formData.steps || [];
    const nextNum = currentSteps.length + 1;
    const newStep: RechargeStep = {
      stepNumber: nextNum,
      titleBn: `নতুন ধাপ ${nextNum}`,
      titleEn: `New Step ${nextNum}`,
      descriptionBn: 'ধাপের বিস্তারিত বর্ণনা এখানে লিখুন।',
      descriptionEn: 'Enter step details here.',
      badgeText: `Step ${nextNum}`,
    };
    setFormData({ ...formData, steps: [...currentSteps, newStep] });
  };

  const handleRemoveStep = (index: number) => {
    const updated = (formData.steps || []).filter((_, idx) => idx !== index);
    // renumber
    const renumbered = updated.map((st, idx) => ({
      ...st,
      stepNumber: idx + 1,
      badgeText: `Step ${idx + 1}`,
    }));
    setFormData({ ...formData, steps: renumbered });
  };

  // Handlers for notes
  const handleNoteChange = (index: number, langKey: 'bn' | 'en', value: string) => {
    if (langKey === 'bn') {
      const updated = [...(formData.importantNotesBn || [])];
      updated[index] = value;
      setFormData({ ...formData, importantNotesBn: updated });
    } else {
      const updated = [...(formData.importantNotesEn || [])];
      updated[index] = value;
      setFormData({ ...formData, importantNotesEn: updated });
    }
  };

  const handleAddNote = () => {
    setFormData({
      ...formData,
      importantNotesBn: [...(formData.importantNotesBn || []), 'নতুন সতর্কতা নির্দেশনা এখানে লিখুন...'],
      importantNotesEn: [...(formData.importantNotesEn || []), 'Enter new security guideline here...'],
    });
  };

  const handleRemoveNote = (index: number) => {
    setFormData({
      ...formData,
      importantNotesBn: (formData.importantNotesBn || []).filter((_, idx) => idx !== index),
      importantNotesEn: (formData.importantNotesEn || []).filter((_, idx) => idx !== index),
    });
  };

  // Reset to system defaults
  const handleResetDefaults = () => {
    if (confirm(appLang === 'bn' ? 'আপনি কি নিশ্চিত যে সকল নির্দেশিকা ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?' : 'Are you sure you want to reset to default instructions?')) {
      setFormData(DEFAULT_INSTRUCTIONS);
      setStatusMsg({
        type: 'success',
        text: appLang === 'bn' ? 'ডিফল্ট মান লোড হয়েছে। সংরক্ষণ করতে Save চাপুন।' : 'Defaults loaded. Click Save to persist.',
      });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Save to Backend
  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await api.post('/settings/admin/recharge-instructions', formData);
      setStatusMsg({
        type: 'success',
        text: appLang === 'bn' ? 'রিচার্জ নির্দেশিকা সফলভাবে সংরক্ষিত হয়েছে!' : 'Recharge instructions saved successfully!',
      });
      if (onSaved) onSaved();
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save';
      setStatusMsg({
        type: 'error',
        text: typeof msg === 'string' ? msg : JSON.stringify(msg),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{appLang === 'bn' ? 'রিচার্জ নির্দেশিকা এডিটর' : 'Recharge Instructions Editor'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30">
                  Admin Tool
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {appLang === 'bn'
                  ? 'ইউজারদের ওয়ালেট পেজে প্রদর্শিত রিচার্জ গাইডলাইন, ধাপসমূহ ও সতর্কবার্তা সম্পাদনা করুন।'
                  : 'Customize the instructions, steps, and security notices displayed to users on /dashboard/wallet.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab & Language Switcher Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{appLang === 'bn' ? 'নির্দেশিকা এডিটর' : 'Editor Form'}</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{appLang === 'bn' ? 'লাইভ প্রিভিউ' : 'Live Preview'}</span>
            </button>
          </div>

          {/* Language Switcher for Form */}
          {activeTab === 'editor' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" />
                <span>Language:</span>
              </span>
              <button
                type="button"
                onClick={() => setEditLang('bn')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  editLang === 'bn'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                বাংলা (BN)
              </button>
              <button
                type="button"
                onClick={() => setEditLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  editLang === 'en'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English (EN)
              </button>
            </div>
          )}
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-b border-rose-500/30'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading instructions...</div>
          ) : activeTab === 'preview' ? (
            /* Live Preview Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>
                  💡 <strong>লাইভ প্রিভিউ মোড:</strong> ইউজাররা `/dashboard/wallet` পেজে &quot;রিচার্জ নির্দেশিকা&quot; বাটনে চাপলে এটি দেখতে পাবে।
                </span>
                <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  Interactive
                </span>
              </div>
              <RechargeInstructionModal
                isOpen={true}
                onClose={() => {}}
                data={formData}
                isPreview={true}
              />
            </div>
          ) : (
            /* Editor Form Tab */
            <div className="space-y-6">
              {/* Section 1: Titles */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>{editLang === 'bn' ? 'প্রধান শিরোনাম ও সাবটাইটেল (বাংলা)' : 'Main Title & Subtitle (English)'}</span>
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {editLang === 'bn' ? 'নির্দেশিকার শিরোনাম (Title BN) *' : 'Instruction Title (Title EN) *'}
                    </label>
                    <input
                      type="text"
                      value={editLang === 'bn' ? (formData.titleBn || '') : (formData.titleEn || '')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [editLang === 'bn' ? 'titleBn' : 'titleEn']: e.target.value,
                        })
                      }
                      placeholder={editLang === 'bn' ? 'যেমন: কিভাবে ব্যালেন্স রিচার্জ করবেন?' : 'e.g. How to Recharge Wallet Balance?'}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {editLang === 'bn' ? 'সাবটাইটেল / সংক্ষিপ্ত বর্ণনা (Subtitle BN) *' : 'Subtitle / Description (Subtitle EN) *'}
                    </label>
                    <textarea
                      rows={2}
                      value={editLang === 'bn' ? (formData.subtitleBn || '') : (formData.subtitleEn || '')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [editLang === 'bn' ? 'subtitleBn' : 'subtitleEn']: e.target.value,
                        })
                      }
                      placeholder={editLang === 'bn' ? 'নিচের ধাপগুলো অনুসরণ করে সহজে টাকা যোগ করুন...' : 'Follow these simple steps...'}
                      className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Step-by-Step Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{editLang === 'bn' ? 'স্টেপ-বাই-স্টেপ গাইডলাইন ধাপসমূহ' : 'Step-by-Step Instructions'}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {formData.steps?.length || 0} Steps
                    </span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{appLang === 'bn' ? 'নতুন ধাপ যোগ করুন' : 'Add Step'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.steps || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center border border-amber-500/30">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {editLang === 'bn' ? `ধাপ ${idx + 1}` : `Step ${idx + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={step.badgeText || ''}
                            onChange={(e) => handleStepChange(idx, 'badgeText', e.target.value)}
                            placeholder="Badge (e.g. Step 1)"
                            className="w-24 px-2 py-1 text-[10px] font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          />

                          {(formData.steps || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              title="Delete Step"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            {editLang === 'bn' ? 'ধাপের শিরোনাম (Title) *' : 'Step Title *'}
                          </label>
                          <input
                            type="text"
                            value={editLang === 'bn' ? (step.titleBn || '') : (step.titleEn || '')}
                            onChange={(e) =>
                              handleStepChange(
                                idx,
                                editLang === 'bn' ? 'titleBn' : 'titleEn',
                                e.target.value,
                              )
                            }
                            placeholder={editLang === 'bn' ? 'যেমন: পেমেন্ট মেথড ও নম্বর নির্বাচন করুন' : 'e.g. Select Payment Method'}
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            {editLang === 'bn' ? 'ধাপের বিস্তারিত ব্যাখ্যা (Description) *' : 'Step Description *'}
                          </label>
                          <textarea
                            rows={2}
                            value={editLang === 'bn' ? (step.descriptionBn || '') : (step.descriptionEn || '')}
                            onChange={(e) =>
                              handleStepChange(
                                idx,
                                editLang === 'bn' ? 'descriptionBn' : 'descriptionEn',
                                e.target.value,
                              )
                            }
                            placeholder={editLang === 'bn' ? 'ইউজার কি করবে তার সহজ ব্যাখ্যা লিখুন...' : 'Clear explanation of what user should do...'}
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Important Security & Safety Notes */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{editLang === 'bn' ? 'জরুরি সতর্কবার্তা ও নিরাপত্তা নিয়মাবলী' : 'Important Security Rules'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{appLang === 'bn' ? '+ সতর্কতা যোগ' : '+ Add Note'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(editLang === 'bn' ? formData.importantNotesBn || [] : formData.importantNotesEn || []).map(
                    (note, nIdx) => (
                      <div key={nIdx} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => handleNoteChange(nIdx, editLang, e.target.value)}
                          placeholder="সতর্কবার্তা লিখুন..."
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(nIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Section 4: Support Contact Info */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-emerald-500" />
                  <span>{appLang === 'bn' ? 'সাপোর্ট ও যোগাযোগ চ্যানেল' : 'Support Channels'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp Number</span>
                    </label>
                    <input
                      type="text"
                      value={formData.supportWhatsapp || ''}
                      onChange={(e) => setFormData({ ...formData, supportWhatsapp: e.target.value })}
                      placeholder="+880 1700-000000"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-sky-500" />
                      <span>Support Hotline Phone</span>
                    </label>
                    <input
                      type="text"
                      value={formData.supportPhone || ''}
                      onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                      placeholder="+880 1700-000000"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{appLang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset Defaults'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {appLang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? (appLang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (appLang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Instructions')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

