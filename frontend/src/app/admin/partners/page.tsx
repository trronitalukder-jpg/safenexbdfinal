'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Copy,
  Check,
  Eye,
  EyeOff,
  Code2,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Layers,
  Users,
  Activity,
  Zap,
} from 'lucide-react';

interface PartnerApp {
  id: string;
  appId: string;
  name: string;
  description: string | null;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
  allowedDomains: string | null;
  isActive: boolean;
  isLiveMode: boolean;
  totalUsers?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPartnersPage() {
  const { isSuperAdmin, hasAdminPermission } = useAuthStore();
  const { lang } = useLanguage();

  const canAccess = isSuperAdmin() || hasAdminPermission('partners');

  const [apps, setApps] = useState<PartnerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<PartnerApp | null>(null);
  const [credentialsApp, setCredentialsApp] = useState<PartnerApp | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Webhook Test state
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [webhookResult, setWebhookResult] = useState<any | null>(null);

  // Code generator state
  const [selectedSnippetApp, setSelectedSnippetApp] = useState<string>('');
  const [activeSnippetTab, setActiveSnippetTab] = useState<'wordpress' | 'nextjs' | 'laravel' | 'python' | 'html'>('wordpress');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    allowedDomains: '',
    webhookUrl: '',
    isLiveMode: true,
  });

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/partners');
      const data = Array.isArray(res) ? res : res?.data || [];
      setApps(data);
      if (data.length > 0 && !selectedSnippetApp) {
        setSelectedSnippetApp(data[0].appId);
      }
    } catch (err: any) {
      console.error('Failed to fetch partner apps:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to load partner apps',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchApps();
    }
  }, [canAccess]);

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Application name is required' });
      return;
    }

    try {
      const res: any = await api.post('/admin/partners', formData);
      const newApp = res?.data || res;
      setFeedback({
        type: 'success',
        message: lang === 'bn' ? 'মার্চেন্ট অ্যাপ সফলভাবে তৈরি করা হয়েছে!' : 'Partner application created successfully!',
      });
      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        allowedDomains: '',
        webhookUrl: '',
        isLiveMode: true,
      });
      await fetchApps();
      // Auto open credentials modal
      if (newApp && newApp.appId) {
        setCredentialsApp(newApp);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to create partner app',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    try {
      await api.patch(`/admin/partners/${editingApp.id}`, {
        name: editingApp.name,
        description: editingApp.description,
        allowedDomains: editingApp.allowedDomains,
        webhookUrl: editingApp.webhookUrl,
        isLiveMode: editingApp.isLiveMode,
        isActive: editingApp.isActive,
      });

      setFeedback({
        type: 'success',
        message: lang === 'bn' ? 'অ্যাপ সফলভাবে আপডেট করা হয়েছে!' : 'App updated successfully!',
      });
      setEditingApp(null);
      await fetchApps();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update app',
      });
    }
  };

  const handleToggleActive = async (app: PartnerApp) => {
    try {
      await api.patch(`/admin/partners/${app.id}`, {
        isActive: !app.isActive,
      });
      setApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, isActive: !a.isActive } : a)),
      );
      setFeedback({
        type: 'success',
        message: lang === 'bn' ? `স্ট্যাটাস পরিবর্তন করা হয়েছে: ${!app.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}` : `Status updated: ${!app.isActive ? 'Active' : 'Disabled'}`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to toggle status',
      });
    }
  };

  const handleRegenerateSecret = async (id: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই অ্যাপের সিক্রেট কী পুনরায় তৈরি করতে চান? আগের সিক্রেট কী আর কাজ করবে না!' : 'Are you sure you want to regenerate the API secret? Existing integrations using the old secret will break!')) {
      return;
    }

    try {
      const res: any = await api.post(`/admin/partners/${id}/regenerate-secret`);
      const updated = res?.data || res;
      setFeedback({
        type: 'success',
        message: lang === 'bn' ? 'নতুন সিক্রেট কী তৈরি হয়েছে!' : 'Secret key regenerated successfully!',
      });
      if (credentialsApp && credentialsApp.id === id) {
        setCredentialsApp(updated);
      }
      await fetchApps();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to regenerate secret',
      });
    }
  };

  const handleDelete = async (app: PartnerApp) => {
    if (!confirm(lang === 'bn' ? `আপনি কি "${app.name}" অ্যাপটি স্থায়ীভাবে মুছে ফেলতে চান?` : `Are you sure you want to permanently delete "${app.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/partners/${app.id}`);
      setFeedback({
        type: 'success',
        message: lang === 'bn' ? 'অ্যাপ সফলভাবে মুছে ফেলা হয়েছে।' : 'Partner app deleted successfully.',
      });
      await fetchApps();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to delete app',
      });
    }
  };

  const handleTestWebhook = async (app: PartnerApp) => {
    setTestingWebhookId(app.id);
    setWebhookResult(null);
    try {
      const res: any = await api.post(`/admin/partners/${app.id}/test-webhook`);
      const resultData = res?.data || res;
      setWebhookResult({
        appId: app.appId,
        url: app.webhookUrl,
        ...resultData,
      });
    } catch (err: any) {
      setWebhookResult({
        appId: app.appId,
        url: app.webhookUrl,
        dispatched: false,
        error: err.response?.data?.message || err.message,
      });
    } finally {
      setTestingWebhookId(null);
    }
  };

  // If unauthorized employee
  if (!canAccess) {
    return (
      <div className="p-6 max-w-4xl mx-auto mt-12">
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {lang === 'bn' ? 'অনুমতি নেই (Access Denied)' : 'Permission Restricted'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            {lang === 'bn'
              ? 'মার্চেন্ট ও এপিআই পার্টনার্স ম্যানেজমেন্ট দেখতে আপনার অ্যাকাউন্টে পারমিশন থাকতে হবে। সুপার অ্যাডমিন এই পারমিশন "কর্মচারী ও স্টাফ" মেনু থেকে অন/অফ করতে পারেন।'
              : 'You do not have access to Merchant & API Partner Management. Super Admin can grant this permission under the "Employees & Staff" section.'}
          </p>
        </div>
      </div>
    );
  }

  const currentSnippetApp = apps.find((a) => a.appId === selectedSnippetApp) || apps[0];
  const snippetAppId = currentSnippetApp?.appId || 'app_live_sample';
  const snippetApiKey = currentSnippetApp?.apiKey || 'pk_live_sample';

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {lang === 'bn' ? 'মার্চেন্ট ও এপিআই পার্টনার্স' : 'Merchant & API Partners'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                ECOSYSTEM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'WordPress, React, PHP, Python সাইটে SafnexBD চ্যাট, ওয়ালেট রিচার্জ ও এসক্রো ইন্টিগ্রেশন।'
                : 'Connect external websites via REST API, Webhooks & Embedded JS SDK for Chat, Wallet & Escrow.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/admin/docs?tab=api"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-semibold transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'এপিআই গাইড ও ম্যানুয়াল' : 'API Guide & Docs'}</span>
            <span className="sm:hidden">গাইড</span>
          </Link>
          <button
            onClick={fetchApps}
            disabled={loading}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-700"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নতুন পার্টনার অ্যাপ' : 'Create App'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Partner Apps</span>
            <Layers className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{apps.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span>Active Live Apps</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {apps.filter((a) => a.isActive && a.isLiveMode).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 text-xs font-semibold">
            <span>Test / Sandbox</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500 mt-2">
            {apps.filter((a) => !a.isLiveMode).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <span>Integrated Users</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {apps.reduce((sum, a) => sum + (a.totalUsers || 0), 0)}
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 border text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 transition p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Partner Apps Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-sky-500" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              {lang === 'bn' ? 'সংযুক্ত পার্টনার অ্যাপ তালিকা' : 'Registered Partner Applications'}
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {apps.length} {lang === 'bn' ? 'টি অ্যাপ' : 'apps total'}
          </span>
        </div>

        {apps.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Globe className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'কোনো মার্চেন্ট অ্যাপ পাওয়া যায়নি' : 'No partner applications found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'bn'
                ? 'প্রথম অ্যাপ তৈরি করতে উপরের "নতুন পার্টনার অ্যাপ যুক্ত করুন" বাটনে ক্লিক করুন।'
                : 'Click "Create Partner App" above to integrate your first external website.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">{lang === 'bn' ? 'অ্যাপ নাম ও তথ্য' : 'Application'}</th>
                  <th className="py-3 px-4">App ID</th>
                  <th className="py-3 px-4">{lang === 'bn' ? 'মোড' : 'Mode'}</th>
                  <th className="py-3 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-4">{lang === 'bn' ? 'ইউজার' : 'Users'}</th>
                  <th className="py-3 px-4">Webhook</th>
                  <th className="py-3 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{app.name}</div>
                      {app.description && (
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{app.description}</div>
                      )}
                      {app.allowedDomains && (
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          Domains: {app.allowedDomains}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                          {app.appId}
                        </span>
                        <button
                          onClick={() => handleCopy(app.appId, app.appId)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                          title="Copy App ID"
                        >
                          {copiedKey === app.appId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.isLiveMode ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          LIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          SANDBOX
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(app)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          app.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={app.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            app.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {app.totalUsers || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      {app.webhookUrl ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[140px]" title={app.webhookUrl}>
                            {app.webhookUrl}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCredentialsApp(app)}
                          className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 hover:bg-sky-100 rounded-lg text-xs font-semibold transition border border-sky-200 dark:border-sky-800/60"
                          title="View API Keys & Credentials"
                        >
                          Keys
                        </button>
                        {app.webhookUrl && (
                          <button
                            onClick={() => handleTestWebhook(app)}
                            disabled={testingWebhookId === app.id}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                            title="Ping Webhook"
                          >
                            {testingWebhookId === app.id ? 'Pinging...' : 'Ping'}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingApp(app)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Settings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(app)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Delete App"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Webhook Test Result Banner */}
      {webhookResult && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm ${
            webhookResult.dispatched && webhookResult.statusCode >= 200 && webhookResult.statusCode < 300
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>Webhook Test Ping Result ({webhookResult.url})</span>
            </div>
            <button onClick={() => setWebhookResult(null)} className="p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>Status: {webhookResult.dispatched ? 'Dispatched' : 'Failed'}</div>
            <div>HTTP Code: {webhookResult.statusCode || 'N/A'}</div>
            <div>Status Text: {webhookResult.statusText || webhookResult.error || 'OK'}</div>
          </div>
        </div>
      )}

      {/* Instant 1-Click Code Generator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {lang === 'bn' ? 'রেডিমেড ইন্টিগ্রেশন কোড জেনারেটর' : 'Instant Integration Code Generator'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'আপনার সিলেক্ট করা মার্চেন্ট অ্যাপ অনুযায়ী নিচের কোডটি কপি করে সাইটে বসান।'
                  : 'Select an app to dynamically populate code snippets with real App ID & Keys.'}
              </p>
            </div>
          </div>

          {apps.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-500">Target App:</span>
              <select
                value={selectedSnippetApp}
                onChange={(e) => setSelectedSnippetApp(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
              >
                {apps.map((a) => (
                  <option key={a.id} value={a.appId}>
                    {a.name} ({a.appId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Snippet Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { key: 'wordpress', label: 'WordPress / WooCommerce' },
            { key: 'nextjs', label: 'Next.js / React' },
            { key: 'laravel', label: 'PHP / Laravel' },
            { key: 'python', label: 'Python / Flask' },
            { key: 'html', label: 'Vanilla JS / HTML' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSnippetTab(tab.key as any)}
              className={`px-3 py-2 rounded-t-lg transition border-b-2 ${
                activeSnippetTab === tab.key
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-500/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Snippet Display */}
        <div className="relative">
          <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto max-h-[380px] border border-slate-800">
            {activeSnippetTab === 'wordpress' && (
              <pre className="whitespace-pre">{`// 1. In your WordPress child-theme functions.php
add_action('wp_footer', function() {
    if (!is_user_logged_in()) return;
    $current_user = wp_get_current_user();

    // Call SafnexBD Session Endpoint
    $response = wp_remote_post('https://safnexbd.com/api/v1/partner/auth/session', [
        'headers' => [
            'Content-Type' => 'application/json',
            'X-Safnex-App-Id' => '${snippetAppId}'
        ],
        'body' => json_encode([
            'partnerUserId' => (string) $current_user->ID,
            'name'          => $current_user->display_name,
            'email'         => $current_user->user_email
        ])
    ]);

    $data = json_decode(wp_remote_retrieve_body($response), true);
    $sessionToken = $data['sessionToken'] ?? '';
    ?>
    <script src="https://safnexbd.com/sdk/safnexbd-sdk.js"></script>
    <script>
      window.addEventListener('DOMContentLoaded', function() {
        SafnexBD.init({
          appId: '${snippetAppId}',
          sessionToken: '<?php echo esc_js($sessionToken); ?>',
          position: 'bottom-right'
        });
      });
    </script>
    <?php
});`}</pre>
            )}

            {activeSnippetTab === 'nextjs' && (
              <pre className="whitespace-pre">{`// Next.js App Router: app/components/SafnexWidget.tsx
'use client';
import { useEffect } from 'react';

export default function SafnexWidget({ sessionToken }: { sessionToken: string }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://safnexbd.com/sdk/safnexbd-sdk.js';
    script.async = true;
    script.onload = () => {
      (window as any).SafnexBD?.init({
        appId: '${snippetAppId}',
        sessionToken,
        position: 'bottom-right'
      });
    };
    document.body.appendChild(script);
  }, [sessionToken]);

  return null;
}`}</pre>
            )}

            {activeSnippetTab === 'laravel' && (
              <pre className="whitespace-pre">{`// Laravel Controller: app/Http/Controllers/SafnexController.php
namespace App\\Http\\Controllers;
use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Auth;

class SafnexController extends Controller
{
    public function getSessionToken()
    {
        $user = Auth::user();
        $response = Http::withHeaders([
            'X-Safnex-App-Id' => '${snippetAppId}',
        ])->post('https://safnexbd.com/api/v1/partner/auth/session', [
            'partnerUserId' => (string) $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
        ]);

        return response()->json($response->json());
    }
}`}</pre>
            )}

            {activeSnippetTab === 'python' && (
              <pre className="whitespace-pre">{`# Python Flask / FastAPI Integration
import requests

def get_safnex_session(user_id, name, email):
    headers = {
        'X-Safnex-App-Id': '${snippetAppId}',
        'Content-Type': 'application/json'
    }
    payload = {
        'partnerUserId': str(user_id),
        'name': name,
        'email': email
    }
    resp = requests.post('https://safnexbd.com/api/v1/partner/auth/session', json=payload, headers=headers)
    return resp.json()['sessionToken']`}</pre>
            )}

            {activeSnippetTab === 'html' && (
              <pre className="whitespace-pre">{`<!-- Plain HTML & Vanilla JS -->
<script src="https://safnexbd.com/sdk/safnexbd-sdk.js"></script>
<script>
  SafnexBD.init({
    appId: '${snippetAppId}',
    sessionToken: 'USER_SESSION_JWT_FETCHED_FROM_YOUR_SERVER',
    position: 'bottom-right',
    onReady: function() {
      console.log('SafnexBD SDK Ready');
    }
  });
</script>`}</pre>
            )}
          </div>

          <button
            onClick={() => {
              const codeEl = document.querySelector('pre');
              if (codeEl?.innerText) handleCopy(codeEl.innerText, 'code');
            }}
            className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            {copiedKey === 'code' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal: Create Partner App */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {lang === 'bn' ? 'নতুন মার্চেন্ট অ্যাপ তৈরি' : 'Register New Partner App'}
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'অ্যাপ্লিকেশন নাম *' : 'Application Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My WooCommerce Store"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. External fashion store integrating safe transactions"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'অনুমোদিত ডোমেন সমূহ' : 'Allowed Domains (CORS)'}
                </label>
                <input
                  type="text"
                  placeholder="https://myshop.com, https://app.myshop.com"
                  value={formData.allowedDomains}
                  onChange={(e) => setFormData({ ...formData, allowedDomains: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs"
                />
                <span className="text-[11px] text-slate-500">Comma-separated list of allowed origin URLs.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ওয়েবহুক URL' : 'Webhook URL'}
                </label>
                <input
                  type="url"
                  placeholder="https://myshop.com/api/safnex-webhook"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isLiveModeCheck"
                  checked={formData.isLiveMode}
                  onChange={(e) => setFormData({ ...formData, isLiveMode: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <label htmlFor="isLiveModeCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                  {lang === 'bn' ? 'লাইভ প্রোডাকশন মোড (Live Mode)' : 'Production Live Mode (Uncheck for Sandbox)'}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md"
                >
                  {lang === 'bn' ? 'অ্যাপ সংরক্ষণ করুন' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Manage Credentials */}
      {credentialsApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {credentialsApp.name} {lang === 'bn' ? 'এর ক্রেডেনশিয়ালস' : 'API Credentials'}
                </h3>
              </div>
              <button onClick={() => setCredentialsApp(null)} className="p-1 opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              {/* App ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Application ID (AppId)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentialsApp.appId}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono text-xs"
                  />
                  <button
                    onClick={() => handleCopy(credentialsApp.appId, 'appId')}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700"
                    title="Copy App ID"
                  >
                    {copiedKey === 'appId' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Public API Key (Client-Safe)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentialsApp.apiKey}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono text-xs"
                  />
                  <button
                    onClick={() => handleCopy(credentialsApp.apiKey, 'apiKey')}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700"
                    title="Copy API Key"
                  >
                    {copiedKey === 'apiKey' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-500">
                    Private API Secret Key (Keep Confidential!)
                  </label>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-sky-500 hover:underline flex items-center gap-1"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    readOnly
                    value={credentialsApp.apiSecret}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-amber-600 dark:text-amber-400 font-bold"
                  />
                  <button
                    onClick={() => handleCopy(credentialsApp.apiSecret, 'secret')}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700"
                    title="Copy Secret Key"
                  >
                    {copiedKey === 'secret' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Webhook Signing Secret</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={credentialsApp.webhookSecret || 'whsec_none'}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono text-xs"
                  />
                  <button
                    onClick={() => handleCopy(credentialsApp.webhookSecret || '', 'whsec')}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700"
                    title="Copy Webhook Secret"
                  >
                    {copiedKey === 'whsec' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Regenerate Secret Action */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleRegenerateSecret(credentialsApp.id)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  {lang === 'bn' ? 'নতুন সিক্রেট তৈরি করুন (Regenerate)' : 'Regenerate Secret Key'}
                </button>
                <button
                  type="button"
                  onClick={() => setCredentialsApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs"
                >
                  {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Partner App */}
      {editingApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {lang === 'bn' ? 'অ্যাপ এডিট করুন' : 'Edit Partner Application'}
              </h3>
              <button onClick={() => setEditingApp(null)} className="p-1 opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'অ্যাপ নাম' : 'Application Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editingApp.name}
                  onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিবরণ' : 'Description'}
                </label>
                <input
                  type="text"
                  value={editingApp.description || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'অনুমোদিত ডোমেন সমূহ' : 'Allowed Domains (CORS)'}
                </label>
                <input
                  type="text"
                  value={editingApp.allowedDomains || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, allowedDomains: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ওয়েবহুক URL' : 'Webhook URL'}
                </label>
                <input
                  type="url"
                  value={editingApp.webhookUrl || ''}
                  onChange={(e) => setEditingApp({ ...editingApp, webhookUrl: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingApp.isLiveMode}
                    onChange={(e) => setEditingApp({ ...editingApp, isLiveMode: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Live Production Mode</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingApp.isActive}
                    onChange={(e) => setEditingApp({ ...editingApp, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Active Status</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-md"
                >
                  {lang === 'bn' ? 'আপডেট সেভ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

