'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  Tag,
  ShieldCheck,
  User,
  Plus,
  Filter,
  Check,
  X,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Zap,
  Globe,
  DollarSign,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/context/LanguageContext';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function AdminProductsPage() {
  const { lang } = useLanguage();

  // Products & Pagination
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    active: 0,
    inactive: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [cmsPages, setCmsPages] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-Approve Setting
  const [autoApprove, setAutoApprove] = useState<boolean>(true);
  const [savingSetting, setSavingSetting] = useState(false);

  // Action Loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Route Change Modal
  const [routeModalProduct, setRouteModalProduct] = useState<any | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [customRouteInput, setCustomRouteInput] = useState<string>('');
  const [savingRoute, setSavingRoute] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalProduct, setDeleteModalProduct] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Auto-Approve Settings
  const loadSettings = useCallback(async () => {
    try {
      const res = await api.get('/admin/products/settings');
      const data = unwrap(res);
      if (data && data.autoApprove !== undefined) {
        setAutoApprove(Boolean(data.autoApprove));
      }
    } catch (err) {
      console.error('Failed to load auto-approve settings:', err);
    }
  }, []);

  // Toggle Auto-Approve Setting
  const handleToggleAutoApprove = async () => {
    setSavingSetting(true);
    const nextVal = !autoApprove;
    try {
      await api.patch('/admin/products/settings', { autoApprove: nextVal });
      setAutoApprove(nextVal);
      showToast(
        nextVal
          ? (lang === 'bn' ? 'অটো-অ্যাপ্রুভাল চালু করা হয়েছে! নতুন প্রোডাক্ট সরাসরি অ্যাক্টিভ হবে।' : 'Auto-approval enabled! New products will be active immediately.')
          : (lang === 'bn' ? 'অটো-অ্যাপ্রুভাল বন্ধ করা হয়েছে! নতুন প্রোডাক্ট পেন্ডিং থাকবে এবং অ্যাডমিন অনুমোদন লাগবে।' : 'Auto-approval disabled! New products will require admin approval.')
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update auto-approve setting', 'error');
    } finally {
      setSavingSetting(false);
    }
  };

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 25,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (routeFilter !== 'ALL') params.canonicalUrl = routeFilter;
      if (categoryFilter !== 'ALL') params.categoryId = categoryFilter;

      const res = await api.get('/admin/products', { params });
      const data = unwrap(res);

      setProducts(data?.items || []);
      if (data?.meta) setMeta(data.meta);
      if (data?.counts) setCounts(data.counts);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      showToast(err.message || 'Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, routeFilter, categoryFilter]);

  // Load auxiliary data (Categories & CMS Pages)
  useEffect(() => {
    loadSettings();

    api.get('/categories')
      .then((res: any) => {
        const data = unwrap(res);
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    api.get('/cms/pages')
      .then((res: any) => {
        const data = unwrap(res);
        setCmsPages(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [loadSettings]);

  // Trigger product fetch on filter/page change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Approve Product
  const handleApprove = async (product: any) => {
    setActionLoadingId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/status`, { status: 'ACTIVE' });
      showToast(lang === 'bn' ? `"${product.title}" পণ্যটি সফলভাবে অনুমোদন করা হয়েছে!` : `Product "${product.title}" approved!`);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve product', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Product
  const handleReject = async (product: any) => {
    setActionLoadingId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/status`, { status: 'REJECTED' });
      showToast(lang === 'bn' ? `"${product.title}" পণ্যটি রিজেক্ট করা হয়েছে।` : `Product "${product.title}" rejected.`);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject product', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Toggle Active/Inactive
  const handleToggleStatus = async (product: any) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setActionLoadingId(product.id);
    try {
      await api.patch(`/admin/products/${product.id}/status`, { status: nextStatus });
      showToast(
        nextStatus === 'ACTIVE'
          ? (lang === 'bn' ? `"${product.title}" এখন অ্যাক্টিভ!` : `Product activated!`)
          : (lang === 'bn' ? `"${product.title}" নিষ্ক্রিয় (Inactive) করা হয়েছে।` : `Product deactivated.`)
      );
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update product status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Route Changer Modal
  const handleOpenRouteModal = (product: any) => {
    setRouteModalProduct(product);
    const curr = product.canonicalUrl || '';
    setSelectedRoute(curr);
    setCustomRouteInput(curr);
  };

  // Save Route
  const handleSaveRoute = async () => {
    if (!routeModalProduct) return;
    setSavingRoute(true);
    const targetUrl = customRouteInput.trim() || selectedRoute.trim() || null;

    try {
      await api.patch(`/admin/products/${routeModalProduct.id}/route`, {
        canonicalUrl: targetUrl,
      });
      showToast(
        lang === 'bn'
          ? `পণ্যটির টার্গেট রুট পরিবর্তন করা হয়েছে (${targetUrl || 'অল প্রোডাক্টস ডিফল্ট'})`
          : `Product destination route updated to ${targetUrl || 'All Products default'}`
      );
      setRouteModalProduct(null);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to update route', 'error');
    } finally {
      setSavingRoute(false);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalProduct) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${deleteModalProduct.id}`);
      showToast(lang === 'bn' ? 'প্রোডাক্টটি সফলভাবে ডিলিট/নিষ্ক্রিয় করা হয়েছে।' : 'Product deleted successfully.');
      setDeleteModalProduct(null);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getRouteLabel = (url: string | null) => {
    if (!url) return { text: lang === 'bn' ? 'অল প্রোডাক্টস (ডিফল্ট)' : 'All Products (Default)', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    if (url === '/goods') return { text: '📦 /goods', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
    if (url === '/physical-products') return { text: '🛍️ /physical-products', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    if (url === '/digital-products') return { text: '⚡ /digital-products', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    if (url === '/money-exchange') return { text: '🔄 /money-exchange', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { text: `🔗 ${url}`, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border text-sm font-semibold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-600/50'
              : 'bg-rose-950 text-rose-200 border-rose-600/50'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Package className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {lang === 'bn' ? 'প্রোডাক্টস ম্যানেজমেন্ট' : 'Products Management'}
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'ইউজারদের আপলোড করা পণ্য অনুমোদন, রুট ও দৃশ্যমানতা নিয়ন্ত্রণ করুন'
              : 'Review user uploads, approve/reject listings, fix routes, and manage visibility'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-Approve Toggle Card */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 px-4 py-2 rounded-xl shadow-sm">
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'bn' ? 'অটো-অ্যাপ্রুভাল' : 'Auto-Approve'}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {autoApprove
                  ? (lang === 'bn' ? 'নতুন পণ্য সরাসরি সক্রিয়' : 'New uploads auto-published')
                  : (lang === 'bn' ? 'পেন্ডিং অনুমোদন লাগবে' : 'Requires admin approval')}
              </div>
            </div>

            <button
              type="button"
              disabled={savingSetting}
              onClick={handleToggleAutoApprove}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoApprove ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoApprove ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Upload New Product Button */}
          <Link
            href="/dashboard/products/new?fromAdmin=true"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'bn' ? '+ নতুন প্রোডাক্ট আপলোড' : '+ Upload Product'}</span>
          </Link>

          {/* Refresh Button */}
          <button
            onClick={loadProducts}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            statusFilter === 'ALL'
              ? 'bg-slate-850 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-400">{lang === 'bn' ? 'মোট প্রোডাক্ট' : 'Total Products'}</div>
          <div className="text-2xl font-black text-white mt-1">{counts.total}</div>
        </div>

        <div
          onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            statusFilter === 'PENDING'
              ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>{lang === 'bn' ? 'পেন্ডিং অনুমোদন' : 'Pending Approval'}</span>
            {counts.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{counts.pending}</div>
        </div>

        <div
          onClick={() => { setStatusFilter('ACTIVE'); setCurrentPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-emerald-400 font-semibold">{lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{counts.active}</div>
        </div>

        <div
          onClick={() => { setStatusFilter('INACTIVE'); setCurrentPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            statusFilter === 'INACTIVE'
              ? 'bg-slate-800 border-slate-600 shadow-md'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-400 font-semibold">{lang === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</div>
          <div className="text-2xl font-black text-slate-300 mt-1">{counts.inactive}</div>
        </div>

        <div
          onClick={() => { setStatusFilter('REJECTED'); setCurrentPage(1); }}
          className={`cursor-pointer p-4 rounded-xl border transition ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-rose-400 font-semibold">{lang === 'bn' ? 'প্রত্যাখ্যাত (Rejected)' : 'Rejected'}</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{counts.rejected}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'নাম, সেলার আইডি, ইমেইল খুঁজুন...' : 'Search title, seller, ID...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">{lang === 'bn' ? 'সব স্ট্যাটাস (All Status)' : 'All Statuses'}</option>
              <option value="PENDING">{lang === 'bn' ? '⏳ পেন্ডিং অনুমোদন (Pending)' : 'Pending Approval'}</option>
              <option value="ACTIVE">{lang === 'bn' ? '✅ সক্রিয় (Active)' : 'Active'}</option>
              <option value="INACTIVE">{lang === 'bn' ? '⏸️ নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
              <option value="REJECTED">{lang === 'bn' ? '❌ প্রত্যাখ্যাত (Rejected)' : 'Rejected'}</option>
            </select>
          </div>

          {/* Route Filter Dropdown */}
          <div>
            <select
              value={routeFilter}
              onChange={(e) => { setRouteFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">{lang === 'bn' ? 'সব রুট / টার্গেট পেজ' : 'All Target Routes'}</option>
              <option value="/goods">📦 /goods</option>
              <option value="/physical-products">🛍️ /physical-products</option>
              <option value="/digital-products">⚡ /digital-products</option>
              <option value="/money-exchange">🔄 /money-exchange</option>
              {cmsPages.map((page) => (
                <option key={page.id} value={`/page/${page.slug}`}>
                  📄 /page/{page.slug} ({page.title})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">{lang === 'bn' ? 'সব ক্যাটাগরি (All Categories)' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 font-semibold mr-1">{lang === 'bn' ? 'কুইক ফিল্টার:' : 'Filter:'}</span>
          {[
            { key: 'ALL', label: lang === 'bn' ? 'সব পণ্য' : 'All', count: counts.total },
            { key: 'PENDING', label: lang === 'bn' ? 'পেন্ডিং' : 'Pending', count: counts.pending, alert: counts.pending > 0 },
            { key: 'ACTIVE', label: lang === 'bn' ? 'সক্রিয়' : 'Active', count: counts.active },
            { key: 'INACTIVE', label: lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive', count: counts.inactive },
            { key: 'REJECTED', label: lang === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected', count: counts.rejected },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.key
                    ? 'bg-slate-950/20 text-slate-950 font-bold'
                    : tab.alert
                    ? 'bg-amber-500/20 text-amber-400 font-bold'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-slate-400">{lang === 'bn' ? 'প্রোডাক্ট লোড হচ্ছে...' : 'Loading products...'}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              {lang === 'bn' ? 'কোন প্রোডাক্ট পাওয়া যায়নি' : 'No products found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {lang === 'bn'
                ? 'বর্তমান ফিল্টারের সাথে মিলে এমন কোন পণ্য নেই। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
                : 'No products match your current search or filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'পণ্য' : 'Product'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'সেলার (আপলোডার)' : 'Seller'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'মূল্য ও ক্যাটাগরি' : 'Price & Category'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'টার্গেট রুট / পেজ' : 'Target Route'}</th>
                  <th className="py-3.5 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {products.map((product) => {
                  const mainImage = product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80';
                  const routeInfo = getRouteLabel(product.canonicalUrl);
                  const isActionBusy = actionLoadingId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-slate-850/50 transition">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(mainImage)}
                            alt={product.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0 bg-slate-950"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <Link
                              href={`/products/${product.slug}`}
                              target="_blank"
                              className="font-bold text-white hover:text-amber-400 transition truncate block flex items-center gap-1 group"
                              title={product.title}
                            >
                              <span className="truncate">{product.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 flex-shrink-0" />
                            </Link>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                                {product.productType === 'DIGITAL_DOWNLOAD' ? 'Digital' : 'Physical'}
                              </span>
                              <span>•</span>
                              <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seller Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white flex items-center gap-1">
                            <span>{product.seller?.firstName} {product.seller?.lastName}</span>
                            {product.seller?.isVerified && (
                              <span title="Verified Seller">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-400/90 font-mono">
                            @{product.seller?.uniqueUserId || 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {product.seller?.email || product.seller?.phone}
                          </div>
                        </div>
                      </td>

                      {/* Price & Category */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-amber-400">
                            ৳{Number(product.price).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {product.category?.name || 'General'}
                          </div>
                        </div>
                      </td>

                      {/* Target Route / Page Badge & Edit */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${routeInfo.color}`}>
                            <span>{routeInfo.text}</span>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenRouteModal(product)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
                            >
                              <Compass className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'রুট পরিবর্তন করুন' : 'Change Route'}</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {product.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'পেন্ডিং অনুমোদন' : 'Pending Approval'}</span>
                          </span>
                        )}
                        {product.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</span>
                          </span>
                        )}
                        {product.status === 'INACTIVE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-medium">
                            <XCircle className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</span>
                          </span>
                        )}
                        {product.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                            <X className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If PENDING: Show Approve & Reject Buttons */}
                          {product.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                disabled={isActionBusy}
                                onClick={() => handleApprove(product)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm"
                                title={lang === 'bn' ? 'অনুমোদন করুন' : 'Approve Product'}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'অনুমোদন' : 'Approve'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isActionBusy}
                                onClick={() => handleReject(product)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/40 text-xs flex items-center gap-1 transition"
                                title={lang === 'bn' ? 'রিজেক্ট করুন' : 'Reject Product'}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'রিজেক্ট' : 'Reject'}</span>
                              </button>
                            </>
                          )}

                          {/* If ACTIVE or INACTIVE: Toggle Status Switch */}
                          {(product.status === 'ACTIVE' || product.status === 'INACTIVE') && (
                            <button
                              type="button"
                              disabled={isActionBusy}
                              onClick={() => handleToggleStatus(product)}
                              className={`px-2.5 py-1.5 rounded-lg font-medium text-xs transition border ${
                                product.status === 'ACTIVE'
                                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-700'
                                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-600 hover:text-white'
                              }`}
                              title={
                                product.status === 'ACTIVE'
                                  ? (lang === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Deactivate')
                                  : (lang === 'bn' ? 'সক্রিয় করুন' : 'Activate')
                              }
                            >
                              {product.status === 'ACTIVE'
                                ? (lang === 'bn' ? 'ডিঅ্যাক্টিভ' : 'Deactivate')
                                : (lang === 'bn' ? 'অ্যাক্টিভ' : 'Activate')}
                            </button>
                          )}

                          {/* External Preview Link */}
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
                            title={lang === 'bn' ? 'প্রোডাক্ট পেজ দেখুন' : 'View Product Page'}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteModalProduct(product)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700 transition"
                            title={lang === 'bn' ? 'ডিলিট করুন' : 'Delete Product'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              {lang === 'bn'
                ? `মোট ${meta.total} টির মধ্যে পেজ ${meta.page} / ${meta.totalPages}`
                : `Page ${meta.page} of ${meta.totalPages} (Total ${meta.total} products)`}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-white transition border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= meta.totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-white transition border border-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ----------------- Route Changer Modal ----------------- */}
      {routeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">
                  {lang === 'bn' ? 'প্রোডাক্টের টার্গেট রুট ঠিক করুন' : 'Change Product Destination Route'}
                </h3>
              </div>
              <button
                onClick={() => setRouteModalProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] text-slate-400">{lang === 'bn' ? 'নির্বাচিত পণ্য:' : 'Selected Product:'}</div>
                <div className="font-bold text-white text-sm truncate mt-0.5">{routeModalProduct.title}</div>
                <div className="text-amber-400/90 text-[11px] mt-1 font-mono">
                  {lang === 'bn' ? 'বর্তমান রুট:' : 'Current Route:'} {routeModalProduct.canonicalUrl || (lang === 'bn' ? 'অল প্রোডাক্টস (ডিফল্ট)' : 'All Products (Default)')}
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div>
                <label className="block font-semibold text-slate-300 mb-2">
                  {lang === 'bn' ? '১. দ্রুত পেজ সিলেক্ট করুন:' : '1. Quick Select Destination Page:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: lang === 'bn' ? '🌐 অল প্রোডাক্টস (ডিফল্ট)' : '🌐 All Products (Default)', value: '' },
                    { label: '📦 /goods', value: '/goods' },
                    { label: '🛍️ /physical-products', value: '/physical-products' },
                    { label: '⚡ /digital-products', value: '/digital-products' },
                    { label: '🔄 /money-exchange', value: '/money-exchange' },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        setSelectedRoute(preset.value);
                        setCustomRouteInput(preset.value);
                      }}
                      className={`p-2.5 rounded-xl border text-left font-medium transition ${
                        customRouteInput === preset.value
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic CMS Pages */}
              {cmsPages.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-2">
                    {lang === 'bn' ? '২. অথবা সিএমএস পেজ সিলেক্ট করুন:' : '2. Or Select CMS Page:'}
                  </label>
                  <select
                    value={customRouteInput}
                    onChange={(e) => {
                      setSelectedRoute(e.target.value);
                      setCustomRouteInput(e.target.value);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">{lang === 'bn' ? '-- সিএমএস পেজ বেছে নিন --' : '-- Choose CMS Page --'}</option>
                    {cmsPages.map((page) => (
                      <option key={page.id} value={`/page/${page.slug}`}>
                        /page/{page.slug} ({page.title})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Route Input */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  {lang === 'bn' ? '৩. অথবা কাস্টম রুট টাইপ করুন (যেমন: /goods বা /page/xyz):' : '3. Or Custom Route String:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customRouteInput}
                    onChange={(e) => setCustomRouteInput(e.target.value)}
                    placeholder="/your-custom-page"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === 'bn'
                    ? '* ফাঁকা রাখলে পণ্যটি শুধু অল প্রোডাক্টস পেজে দেখাবে। রুট দিলে সেই পেজেও পণ্যটি প্রদর্শিত হবে।'
                    : '* Leaving empty shows product only on All Products. Giving a route displays it on that dedicated page as well.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRouteModalProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={savingRoute}
                onClick={handleSaveRoute}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
              >
                {savingRoute ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{lang === 'bn' ? 'রুট সংরক্ষণ করুন' : 'Save Route'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- Delete Confirmation Modal ----------------- */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-white">
                  {lang === 'bn' ? 'প্রোডাক্ট ডিলিট নিশ্চিতকরণ' : 'Confirm Delete Product'}
                </h3>
                <p className="text-xs text-slate-400">{lang === 'bn' ? 'এই পণ্যটি ডিলিট করতে চান?' : 'Are you sure you want to delete this?'}</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-white">{deleteModalProduct.title}</span>
              <div className="text-[11px] text-slate-500 mt-1">
                ID: {deleteModalProduct.id} • Seller: @{deleteModalProduct.seller?.uniqueUserId}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                {lang === 'bn' ? 'না, বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
