'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Package,
  PlusCircle,
  Eye,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  UploadCloud,
  Loader2,
  Star,
  Plus,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Zap,
  Cpu,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { compressImage, getImageUrl } from '@/lib/imageUtils';
import RichTextEditor from '@/components/ui/RichTextEditor';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export default function MyProductsPage() {
  const { lang, t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editCanonicalUrl, setEditCanonicalUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStock, setEditStock] = useState<number>(0);
  const [editSku, setEditSku] = useState('');
  const [editDeliveryInfo, setEditDeliveryInfo] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editNewImageUrl, setEditNewImageUrl] = useState('');
  const [editImageMode, setEditImageMode] = useState<'file' | 'link'>('file');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [customNavItems, setCustomNavItems] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string>('');

  const loadProducts = () => {
    setLoading(true);
    setLoadError('');
    api.get('/products/my-products')
      .then((res: any) => {
        const data = unwrap(res);
        const list = Array.isArray(data)
          ? data
          : data?.items || data?.data || (Array.isArray(res) ? res : []);
        setProducts(list);
      })
      .catch((err: any) => {
        console.error('Failed to load products in dashboard:', err);
        const msg = err?.response?.data?.message || err?.message || 'Failed to load products';
        setLoadError(msg);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    // Load categories for edit modal
    api.get('/categories')
      .then((res: any) => {
        const data = unwrap(res);
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    // Load custom navbar items (e.g. /goods)
    api.get('/cms/menus/HEADER')
      .then((res: any) => {
        const data = unwrap(res);
        const items: any[] = data?.items || (Array.isArray(data) ? data : []);
        const standardUrls = ['/', '/products', '/digital-products', '/physical-products', '/money-exchange', '/users'];
        const customItems = items.filter((it) => it.url && !standardUrls.includes(it.url));
        setCustomNavItems(customItems);
      })
      .catch(() => {});
  }, []);

  // Instant 1-Click Active / Inactive Toggle
  const handleToggleStatus = async (product: any) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(product.id);

    try {
      await api.patch(`/products/${product.id}`, { status: nextStatus });
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
      );
      setSuccessMessage(
        lang === 'bn'
          ? `প্রোডাক্টটি সফলভাবে ${nextStatus === 'ACTIVE' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'} করা হয়েছে`
          : `Product marked as ${nextStatus.toLowerCase()}`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update product status');
    } finally {
      setTogglingId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setEditTitle(p.title || '');
    setEditCategoryId(p.categoryId || (categories[0]?.id || ''));
    setEditPrice(Number(p.price) || 0);
    setEditStatus(p.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
    setEditCanonicalUrl(p.canonicalUrl || (p.productType === 'PHYSICAL' ? '/physical-products' : '/digital-products'));
    setEditDescription(p.descriptionHtml || '');
    setEditStock(p.physicalMeta?.stock || 0);
    setEditSku(p.physicalMeta?.sku || '');
    setEditDeliveryInfo(p.physicalMeta?.deliveryInfo || '');
    setEditImages(
      p.images && p.images.length > 0
        ? p.images.map((img: any) => (typeof img === 'string' ? img : img.imageUrl))
        : []
    );
    setEditNewImageUrl('');
    setEditError('');
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingProduct(null);
    setEditError('');
  };

  // Upload Images inside Edit Modal
  const handleEditFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    setEditError('');

    const newUrls: string[] = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const { base64Data, fileName: cleanFileName } = await compressImage(file, 1200, 1200, 0.85, 'SafnexBD');
        const res: any = await api.post('/uploads', {
          base64Data,
          fileName: cleanFileName,
          folder: 'products',
        });
        const url = res?.fileUrl || res?.data?.fileUrl || res?.url;
        if (url) newUrls.push(url);
      } catch (err: any) {
        console.error('Image upload failed:', err);
        setEditError(lang === 'bn' ? `ছবি আপলোডে সমস্যা হয়েছে: ${file.name}` : `Failed to upload: ${file.name}`);
      }
    }

    if (newUrls.length > 0) {
      setEditImages((prev) => [...prev, ...newUrls]);
    }
    setUploadingImages(false);
  };

  const handleAddEditImageUrl = () => {
    const trimmed = editNewImageUrl.trim();
    if (!trimmed) return;
    setEditImages((prev) => [...prev, trimmed]);
    setEditNewImageUrl('');
  };

  const handleRemoveEditImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetMainEditImage = (index: number) => {
    if (index === 0) return;
    setEditImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
  };

  // Save Product Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingEdit(true);
    setEditError('');

    try {
      const payload: any = {
        title: editTitle.trim(),
        categoryId: editCategoryId,
        price: Number(editPrice),
        status: editStatus,
        canonicalUrl: editCanonicalUrl,
        descriptionHtml: editDescription,
        images: editImages.map((url, idx) => ({
          imageUrl: url,
          isMain: idx === 0,
          sortOrder: idx,
        })),
      };

      if (editingProduct.productType === 'PHYSICAL') {
        payload.physicalMeta = {
          stock: Number(editStock),
          sku: editSku.trim() || null,
          deliveryInfo: editDeliveryInfo.trim() || null,
        };
      }

      await api.patch(`/products/${editingProduct.id}`, payload);
      setSuccessMessage(
        lang === 'bn' ? 'প্রোডাক্ট তথ্য সফলভাবে আপডেট করা হয়েছে!' : 'Product updated successfully!'
      );
      setTimeout(() => setSuccessMessage(''), 4000);
      handleCloseEdit();
      loadProducts();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete / Deactivate
  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত এই প্রোডাক্টটি ডিলিট/ডিঅ্যাক্টিভেট করতে চান?' : 'Are you sure you want to deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setSuccessMessage(lang === 'bn' ? 'প্রোডাক্টটি ডিলিট করা হয়েছে' : 'Product deactivated');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return p.status === 'ACTIVE';
    if (statusFilter === 'INACTIVE') return p.status === 'INACTIVE';
    return true;
  });

  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const inactiveCount = products.filter((p) => p.status === 'INACTIVE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-500" />
            <span>{lang === 'bn' ? 'আমার আপলোডকৃত প্রোডাক্টসমূহ' : 'My Uploaded Products'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'প্রোডাক্ট সক্রিয়/নিষ্ক্রিয় করুন, তথ্য ও মূল্য এডিট করুন বা নতুন প্রোডাক্ট আপলোড করুন'
              : 'Toggle active/inactive status, update details & pricing, or upload new products'}
          </p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন প্রোডাক্ট আপলোড' : 'Add New Product'}</span>
        </Link>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between transition">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Load Error Alert */}
      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadProducts}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800 rounded-lg transition text-xs font-bold"
          >
            {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search || ''}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'নাম বা ক্যাটাগরি দিয়ে খুঁজুন...' : 'Search by title or category...'}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg transition ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? 'সকল' : 'All'} ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-500 text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'} ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
              statusFilter === 'INACTIVE'
                ? 'bg-slate-700 text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>{lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'} ({inactiveCount})</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-sky-500" />
          <p>{lang === 'bn' ? 'প্রোডাক্ট লোড হচ্ছে...' : 'Loading products...'}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {lang === 'bn' ? 'কোনো প্রোডাক্ট পাওয়া যায়নি' : 'No products found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'bn'
              ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো প্রোডাক্ট নেই। নতুন প্রোডাক্ট আপলোড করতে নিচের বাটনে ক্লিক করুন।'
              : 'No items match your query. Click below to add a new product.'}
          </p>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নতুন প্রোডাক্ট যোগ করুন' : 'Upload Product'}</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs sm:shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Type & Target</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Status (সক্রিয়/নিষ্ক্রিয়)</th>
                  <th className="p-3.5">Stock / Bids</th>
                  <th className="p-3.5 text-right">Actions (অ্যাকশন)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const rawImg = p.images?.[0]?.imageUrl || (p.images?.[0] ? p.images[0] : null);
                  const img = getImageUrl(rawImg) || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=150&q=80';
                  const isToggling = togglingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      {/* Product Thumbnail & Title */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <Link href={`/products/${p.slug}`} className="hover:opacity-80 transition flex-shrink-0">
                            <img
                              src={img}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                            />
                          </Link>
                          <div className="space-y-0.5 max-w-xs">
                            <div className="font-bold text-slate-900 dark:text-white truncate hover:text-sky-600 transition">
                              <Link href={`/products/${p.slug}`} title={p.title}>
                                {p.title}
                              </Link>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span>{p.category?.name || 'General'}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px]">ID: {p.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Canonical Page Destination */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.productType === 'PHYSICAL'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                                : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60'
                            }`}
                          >
                            {p.productType === 'PHYSICAL' ? <Cpu className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            <span>{p.productType}</span>
                          </span>

                          <div className="text-[10px] font-mono text-slate-400">
                            {p.canonicalUrl ? (
                              <Link
                                href={p.canonicalUrl}
                                target="_blank"
                                className="hover:text-sky-500 hover:underline inline-flex items-center gap-1 text-slate-500 dark:text-slate-400"
                                title={p.canonicalUrl}
                              >
                                <span>{p.canonicalUrl}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </Link>
                            ) : (
                              <span>{p.productType === 'PHYSICAL' ? '/physical-products' : '/digital-products'}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-3.5 font-extrabold text-slate-900 dark:text-white whitespace-nowrap text-sm">
                        ৳ {Number(p.price).toLocaleString()}
                      </td>

                      {/* 1-Click Interactive Status Toggle (Active / Inactive) */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isToggling ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                            <span>Updating...</span>
                          </div>
                        ) : p.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            title={lang === 'bn' ? 'ক্লিক করে নিষ্ক্রিয় (Inactive) করুন' : 'Click to deactivate'}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition group shadow-xs cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition" />
                            <span>{lang === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            title={lang === 'bn' ? 'ক্লিক করে সক্রিয় (Active) করুন' : 'Click to activate'}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition group shadow-xs cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full bg-slate-400 group-hover:scale-125 transition" />
                            <span>{lang === 'bn' ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</span>
                          </button>
                        )}
                      </td>

                      {/* Stock / Bid Status */}
                      <td className="p-3.5 whitespace-nowrap text-[11px]">
                        {p.productType === 'PHYSICAL' && p.physicalMeta && (
                          <div className="text-slate-600 dark:text-slate-300 font-semibold">
                            {lang === 'bn' ? 'স্টক:' : 'Stock:'} {p.physicalMeta.stock}
                          </div>
                        )}
                        {p.bids?.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            Bid Pos #{p.bids[0].targetPosition}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Regular</span>
                        )}
                      </td>

                      {/* Actions: View, Edit, Delete */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Public Link */}
                          <Link
                            href={`/products/${p.slug}`}
                            target="_blank"
                            title={lang === 'bn' ? 'প্রোডাক্ট পেজ দেখুন' : 'View live product'}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* 2. Edit / Update Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title={lang === 'bn' ? 'এডিট / তথ্য পরিবর্তন' : 'Edit / Update product'}
                            className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition flex items-center gap-1 font-bold text-xs"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span className="hidden md:inline text-[11px]">{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                          </button>

                          {/* 3. Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            title={lang === 'bn' ? 'প্রোডাক্ট মুছুন' : 'Delete product'}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
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

          {/* Mobile Card List View (Phones & Small Screens) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.map((p) => {
              const rawImg = p.images?.[0]?.imageUrl || (p.images?.[0] ? p.images[0] : null);
              const img = getImageUrl(rawImg) || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=150&q=80';
              const isToggling = togglingId === p.id;

              return (
                <div key={p.id} className="p-3.5 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  {/* Top: Thumbnail, Title, Price, Type */}
                  <div className="flex items-start gap-3">
                    <Link href={`/products/${p.slug}`} className="flex-shrink-0">
                      <img
                        src={img}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${p.slug}`}
                          className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 hover:text-sky-600 transition"
                        >
                          {p.title}
                        </Link>
                        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          ৳ {Number(p.price).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="truncate">{p.category?.name || 'General'}</span>
                        <span>•</span>
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-bold ${
                            p.productType === 'PHYSICAL'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {p.productType === 'PHYSICAL' ? <Cpu className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
                          <span>{p.productType}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Stock & Status Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <div className="text-slate-500 dark:text-slate-400">
                      {p.productType === 'PHYSICAL' && p.physicalMeta && (
                        <span>
                          {lang === 'bn' ? 'স্টক:' : 'Stock:'}{' '}
                          <strong className="text-slate-800 dark:text-slate-200">{p.physicalMeta.stock}</strong>
                        </span>
                      )}
                      {p.bids?.length > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                          Bid #{p.bids[0].targetPosition}
                        </span>
                      )}
                    </div>

                    {/* 1-Click Interactive Status Toggle */}
                    <div>
                      {isToggling ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                          <span>Updating...</span>
                        </div>
                      ) : p.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <Link
                      href={`/products/${p.slug}`}
                      target="_blank"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'দেখুন' : 'View'}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 font-bold text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'প্রোডাক্ট তথ্য সম্পাদনা (Edit Product)' : 'Edit Product Information'}</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  ID: {editingProduct.id} • {editingProduct.productType}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'প্রোডাক্টের শিরোনাম (Title) *' : 'Product Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={editTitle || ''}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              {/* Category, Price & Status in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={editCategoryId || ''}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মূল্য (৳)' : 'Price (৳) *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editPrice ?? 0}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'স্ট্যাটাস (Status)' : 'Status'}
                  </label>
                  <select
                    value={editStatus || 'ACTIVE'}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      editStatus === 'ACTIVE'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    <option value="ACTIVE">{lang === 'bn' ? '✅ সক্রিয় (ACTIVE)' : '✅ Active'}</option>
                    <option value="INACTIVE">{lang === 'bn' ? '⏸️ নিষ্ক্রিয় (INACTIVE)' : '⏸️ Inactive'}</option>
                  </select>
                </div>
              </div>

              {/* Destination URL */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'ডিসপ্লে পেজ / রুট (Page Destination)' : 'Target Page Route'}
                </label>
                <select
                  value={editCanonicalUrl || ''}
                  onChange={(e) => setEditCanonicalUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                >
                  <option value="/digital-products">⚡ /digital-products (ডিজিটাল প্রোডাক্টস)</option>
                  <option value="/physical-products">📦 /physical-products (ফিজিক্যাল গ্যাজেটস)</option>
                  <option value="/money-exchange">💱 /money-exchange (মানি এক্সচেঞ্জ)</option>
                  <option value="/digital-products?type=downloadable">💾 /digital-products?type=downloadable (ডাউনলোডযোগ্য)</option>
                  {/* Dynamic Custom Navbar Pages */}
                  {customNavItems.map((item) => (
                    <option key={item.id} value={item.url}>
                      🛍️ {item.url} ({item.title})
                    </option>
                  ))}
                  {/* If product has a custom canonicalUrl not in standard or customNavItems */}
                  {editCanonicalUrl &&
                    !['/digital-products', '/physical-products', '/money-exchange', '/digital-products?type=downloadable'].includes(editCanonicalUrl) &&
                    !customNavItems.some((it) => it.url === editCanonicalUrl) && (
                      <option value={editCanonicalUrl}>🔗 {editCanonicalUrl} (Custom Page)</option>
                    )}
                </select>
              </div>

              {/* Physical Product Specifics */}
              {editingProduct.productType === 'PHYSICAL' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        {lang === 'bn' ? 'স্টক সংখ্যা' : 'Stock Quantity'}
                      </label>
                      <input
                        type="number"
                        value={editStock ?? 0}
                        onChange={(e) => setEditStock(parseInt(e.target.value, 10) || 0)}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                        {lang === 'bn' ? 'মডেল / এসকেইউ' : 'SKU / Model'}
                      </label>
                      <input
                        type="text"
                        value={editSku || ''}
                        onChange={(e) => setEditSku(e.target.value)}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                      {lang === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery & Courier Information'}
                    </label>
                    <input
                      type="text"
                      value={editDeliveryInfo || ''}
                      onChange={(e) => setEditDeliveryInfo(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Images Management inside Edit Modal */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'প্রোডাক্ট ছবি ম্যানেজমেন্ট' : 'Product Images Management'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditImageMode('file')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        editImageMode === 'file' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {lang === 'bn' ? 'ছবি আপলোড' : 'Upload File'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditImageMode('link')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        editImageMode === 'link' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {lang === 'bn' ? 'ইমেজ লিঙ্ক' : 'Paste Link'}
                    </button>
                  </div>
                </div>

                {/* Upload or Link Input */}
                {editImageMode === 'file' ? (
                  <div
                    key="edit-file-dropzone"
                    onClick={() => editFileInputRef.current?.click()}
                    className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 bg-slate-50/60 dark:bg-slate-800/40 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1"
                  >
                    <input
                      key="edit-file-input"
                      ref={editFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) handleEditFileUpload(e.target.files);
                        if (editFileInputRef.current) {
                          editFileInputRef.current.value = '';
                        }
                      }}
                      className="hidden"
                    />
                    {uploadingImages ? (
                      <div className="flex items-center gap-2 text-sky-600 font-bold">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ছবি আপলোড হচ্ছে...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-sky-500" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {lang === 'bn' ? 'ক্লিক করে নতুন ছবি যোগ করুন' : 'Click to add more images'}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div key="edit-link-container" className="flex gap-2">
                    <input
                      key="edit-url-input"
                      type="url"
                      value={editNewImageUrl || ''}
                      onChange={(e) => setEditNewImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddEditImageUrl}
                      className="px-3 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Thumbnail list */}
                {editImages.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {editImages.map((url, idx) => (
                      <div
                        key={idx}
                        className={`relative group w-20 h-20 rounded-xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 flex-shrink-0 ${
                          idx === 0 ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />

                        {idx === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-sky-600 text-white text-[8px] font-bold">
                            কভার
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveEditImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetMainEditImage(idx)}
                            className="absolute bottom-1 inset-x-1 py-0.5 bg-slate-900/90 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition text-center"
                          >
                            Set Cover
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <RichTextEditor
                  label={lang === 'bn' ? 'বিস্তারিত বিবরণ' : 'Description'}
                  value={editDescription}
                  onChange={(html) => setEditDescription(html)}
                  placeholder={lang === 'bn' ? 'প্রোডাক্ট বিবরণী লিখুন...' : 'Write product description...'}
                  minHeight="220px"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition hover:bg-slate-200"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={savingEdit || uploadingImages}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'আপডেট সংরক্ষণ করুন' : 'Save Updates'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
