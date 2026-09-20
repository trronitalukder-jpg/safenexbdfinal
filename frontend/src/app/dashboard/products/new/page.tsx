'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ArrowLeft,
  Plus,
  Trash2,
  ShieldCheck,
  Download,
  Cpu,
  Globe,
  Tag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Coins,
  Check,
  UploadCloud,
  Image as ImageIcon,
  Star,
  Upload,
  Link as LinkIcon,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { compressImage, getImageUrl } from '@/lib/imageUtils';
import RichTextEditor from '@/components/ui/RichTextEditor';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

type DestinationOption = 'digital_product' | 'physical_products' | 'money_exchange' | 'downloadable' | 'custom_navbar';

function NewProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get('fromAdmin') === 'true';
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Basic Information
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(1000);
  const [descriptionHtml, setDescriptionHtml] = useState('');

  // Primary Destination Selection (All Products is ALWAYS auto-selected)
  const targetRouteParam = searchParams.get('targetRoute') || searchParams.get('destination') || '';
  const initialDest: DestinationOption =
    targetRouteParam.startsWith('/') || targetRouteParam === 'custom_navbar'
      ? 'custom_navbar'
      : ['digital_product', 'physical_products', 'money_exchange', 'downloadable'].includes(targetRouteParam)
      ? (targetRouteParam as DestinationOption)
      : 'digital_product';

  const [destination, setDestination] = useState<DestinationOption>(initialDest);
  const [customNavItems, setCustomNavItems] = useState<any[]>([]);
  const [customRoute, setCustomRoute] = useState<string>(
    targetRouteParam.startsWith('/') ? targetRouteParam : '/goods'
  );
  const [customProductType, setCustomProductType] = useState<'PHYSICAL' | 'DIGITAL_DOWNLOAD'>('PHYSICAL');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Images Management - Start clean without hardcoded dummy photos
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'file' | 'link'>('file');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Physical Specifics
  const [stock, setStock] = useState<number>(10);
  const [sku, setSku] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('Home delivery available nationwide via Steadfast/RedX (24-72 hrs)');

  // Digital Specifics (Account / Credentials)
  const [digitalAccessInfo, setDigitalAccessInfo] = useState(
    'Instant credentials and verification will be delivered through SafnexBD Escrow Chat.'
  );

  // Downloadable Specifics (File / Resource)
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Money Exchange Specifics
  const [exchangeNote, setExchangeNote] = useState(
    'P2P Escrow Exchange: Sender and receiver funds are locked in SafnexBD escrow until payment confirmation.'
  );

  // SEO Specifics
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [tagInput, setTagInput] = useState('');

  // State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'seo'>('basic');

  // Load Categories & Custom Navbar Menus
  useEffect(() => {
    api.get('/categories')
      .then((res: any) => {
        const data = unwrap(res);
        setCategories(Array.isArray(data) ? data : []);
        if (data?.length > 0) setCategoryId(data[0].id);
      })
      .catch(() => {});

    api.get('/cms/menus/HEADER')
      .then((res: any) => {
        const data = unwrap(res);
        const items: any[] = data?.items || (Array.isArray(data) ? data : []);
        const standardUrls = ['/', '/products', '/digital-products', '/physical-products', '/money-exchange', '/users'];
        const customItems = items.filter((it) => it.url && !standardUrls.includes(it.url));
        setCustomNavItems(customItems);

        // If targetRoute matches custom items or is specified in URL query
        if (targetRouteParam) {
          const match = customItems.find((ci) => ci.url === targetRouteParam || ci.url === `/${targetRouteParam}`);
          if (match) {
            setDestination('custom_navbar');
            setCustomRoute(match.url);
          } else if (targetRouteParam.startsWith('/')) {
            setDestination('custom_navbar');
            setCustomRoute(targetRouteParam);
          }
        } else if (customItems.length > 0 && !destination) {
          setCustomRoute(customItems[0].url);
        }
      })
      .catch(() => {});
  }, [targetRouteParam]);

  // Handle Multi-file Upload from Local Device
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    setError('');

    const newUploadedUrls: string[] = [];
    const fileArray = Array.from(files);
    const total = fileArray.length;

    for (let i = 0; i < total; i++) {
      const file = fileArray[i];
      if (!file.type.startsWith('image/')) {
        continue;
      }

      setUploadProgress(
        lang === 'bn'
          ? `ছবি প্রসেস ও আপলোড হচ্ছে (${i + 1}/${total}): ${file.name}...`
          : `Processing & uploading (${i + 1}/${total}): ${file.name}...`
      );

      try {
        // Compress image and apply SafnexBD watermark client-side
        const { base64Data, fileName: cleanFileName } = await compressImage(file, 1200, 1200, 0.85, 'SafnexBD');

        // Upload to backend /uploads
        const res: any = await api.post('/uploads', {
          base64Data,
          fileName: cleanFileName,
          folder: 'products',
        });

        const uploadedUrl = res?.fileUrl || res?.data?.fileUrl || res?.url;
        if (uploadedUrl) {
          newUploadedUrls.push(uploadedUrl);
        }
      } catch (err: any) {
        console.error('Image upload error:', file.name, err);
        setError(
          lang === 'bn'
            ? `ছবি আপলোডে ব্যর্থ: ${file.name} (${err.message || 'Error'})`
            : `Failed to upload image: ${file.name}`
        );
      }
    }

    if (newUploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...newUploadedUrls]);
    }

    setUploadingImages(false);
    setUploadProgress('');
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Add Image via URL/Link
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setError(lang === 'bn' ? 'সঠিক ইমেজ লিংক দিন (যেমন: https://...)' : 'Please enter a valid image URL');
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      copy.unshift(selected);
      return copy;
    });
  };

  // Add SEO Keyword Tag
  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || tagInput).trim();
    if (!val) return;
    const currentTags = metaKeywords ? metaKeywords.split(',').map((t) => t.trim()).filter(Boolean) : [];
    if (!currentTags.includes(val)) {
      currentTags.push(val);
      setMetaKeywords(currentTags.join(', '));
    }
    if (!tagToAdd) setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = metaKeywords
      ? metaKeywords.split(',').map((t) => t.trim()).filter((t) => t !== tagToRemove && Boolean(t))
      : [];
    setMetaKeywords(currentTags.join(', '));
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const previewSlug = generateSlug(title || 'product-name');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (images.length === 0) {
      setError(
        lang === 'bn'
          ? 'অনুগ্রহ করে অন্তত ১টি প্রোডাক্ট ছবি আপলোড করুন অথবা লিংক দিন'
          : 'Please upload or provide at least 1 product image'
      );
      return;
    }

    setLoading(true);

    try {
      // Map destination to productType and canonicalUrl
      let productType: 'PHYSICAL' | 'DIGITAL_DOWNLOAD' = 'DIGITAL_DOWNLOAD';
      let canonicalUrl = '/digital-products';

      if (destination === 'physical_products') {
        productType = 'PHYSICAL';
        canonicalUrl = '/physical-products';
      } else if (destination === 'digital_product') {
        productType = 'DIGITAL_DOWNLOAD';
        canonicalUrl = '/digital-products';
      } else if (destination === 'money_exchange') {
        productType = 'DIGITAL_DOWNLOAD';
        canonicalUrl = '/money-exchange';
      } else if (destination === 'downloadable') {
        productType = 'DIGITAL_DOWNLOAD';
        canonicalUrl = '/digital-products?type=downloadable';
      } else if (destination === 'custom_navbar') {
        productType = customProductType;
        const normalized = customRoute.trim().startsWith('/') ? customRoute.trim() : `/${customRoute.trim()}`;
        canonicalUrl = normalized;
      }

      const payload: any = {
        title: title.trim(),
        categoryId,
        productType,
        price: Number(price),
        descriptionHtml: descriptionHtml || `<p>${title}</p>`,
        images: images.map((url, idx) => ({
          imageUrl: url,
          isMain: idx === 0,
          sortOrder: idx,
        })),
        metaTitle: metaTitle.trim() || title.trim(),
        metaDescription: metaDescription.trim() || (descriptionHtml ? descriptionHtml.substring(0, 160) : title.trim()),
        metaKeywords: metaKeywords.trim() || null,
        canonicalUrl,
      };

      if (destination === 'physical_products' || (destination === 'custom_navbar' && customProductType === 'PHYSICAL')) {
        payload.physicalMeta = {
          stock: Number(stock),
          sku: sku.trim() || null,
          deliveryInfo: deliveryInfo.trim() || null,
        };
      } else if (destination === 'downloadable') {
        payload.digitalFile = {
          fileName: fileName.trim() || 'downloadable-resource.zip',
          fileUrl: fileUrl.trim() || 'https://example.com/file.zip',
        };
      } else if (destination === 'money_exchange') {
        payload.digitalFile = {
          fileName: 'p2p-escrow-agreement.txt',
          fileUrl: 'https://safnexbd.com/money-exchange',
        };
      } else {
        // digital_product or custom_navbar with DIGITAL_DOWNLOAD
        payload.digitalFile = {
          fileName: 'account-access-details.txt',
          fileUrl: 'https://safnexbd.com/escrow-chat-delivery',
        };
      }

      await api.post('/products', payload);
      router.push(fromAdmin ? '/admin/products' : '/dashboard/products');
    } catch (err: any) {
      setError(err.message || 'Failed to upload product');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={fromAdmin ? '/admin/products' : '/dashboard/products'}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-500" />
              <span>{lang === 'bn' ? 'নতুন প্রোডাক্ট আপলোড' : 'Upload New Product'}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'পণ্য বিবরণী, ডিসপ্লে পেজ নির্বাচন, মাল্টিপল ছবি আপলোড এবং এসইও (SEO) মেটা ট্যাগ'
                : 'List products with auto marketplace inclusion, category page selection, image uploads and SEO'}
            </p>
          </div>
        </div>

        {/* Tab Toggle between Product Info and SEO Settings */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/70 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'basic'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? '১. প্রোডাক্ট বিবরণী' : '1. Product Details'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition ${
              activeTab === 'seo'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? '২. এসইও (SEO) সেটিংস' : '2. SEO Settings'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* TAB 1: BASIC INFORMATION & CATEGORY/PAGE SELECTION */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* DESTINATION SELECTION CONTAINER */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div>
                <label className="block font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  {lang === 'bn' ? 'প্রোডাক্টের ক্যাটাগরি ও ডিসপ্লে পেজ নির্বাচন *' : 'Product Category & Display Destination *'}
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'প্রতিটি প্রোডাক্ট স্বয়ংক্রিয়ভাবে মূল মার্কেটপ্লেসে যুক্ত হবে। সাথে নিচের ৪টি অপশন থেকে যেকোনো একটি নির্দিষ্ট পেজ নির্বাচন করুন:'
                    : 'Every product is automatically included in All Products. Pick 1 specific page destination below:'}
                </p>
              </div>

              {/* 1. ALL PRODUCTS AUTO-SELECTED BADGE (LOCKED / ALWAYS ACTIVE) */}
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border-2 border-sky-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {lang === 'bn' ? 'সকল প্রোডাক্ট মার্কেটপ্লেস (All Products Page)' : 'All Products Marketplace'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500 text-white font-mono text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{lang === 'bn' ? 'অটো সিলেক্টেড' : 'Auto Selected'}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      {lang === 'bn'
                        ? 'আপনার আপলোড করা প্রতিটি প্রোডাক্ট সরাসরি /products পেজে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।'
                        : 'Your product is permanently visible on the main /products marketplace for all buyers.'}
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-[10px] font-bold font-mono">
                  /products
                </span>
              </div>

              {/* 2. THE 4 SELECTABLE CATEGORY DESTINATIONS (USER CHOOSES 1) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span>{lang === 'bn' ? 'নির্দিষ্ট ক্যাটাগরি নির্বাচন করুন (যেকোনো ১টি সিলেক্ট করুন):' : 'Select Target Category (Choose 1):'}</span>
                  <span className="text-sky-600 dark:text-sky-400 font-mono text-[10px]">1 Required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Choice 1: Digital Product */}
                  <button
                    type="button"
                    onClick={() => setDestination('digital_product')}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                      destination === 'digital_product'
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/25 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      {destination === 'digital_product' ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">/digital-products</span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {lang === 'bn' ? '⚡ ডিজিটাল প্রোডাক্ট (Digital Product)' : '⚡ Digital Product'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {lang === 'bn'
                          ? 'গেমিং অ্যাকাউন্ট, ওটিটি সাবস্ক্রিপশন, ডিজিটাল লাইসেন্স কি ও ইনস্ট্যান্ট চ্যাট ডেলিভারি'
                          : 'Gaming accounts, licenses, OTT access & instant escrow chat handover'}
                      </div>
                    </div>
                  </button>

                  {/* Choice 2: Physical Products */}
                  <button
                    type="button"
                    onClick={() => setDestination('physical_products')}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                      destination === 'physical_products'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/25 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Cpu className="w-5 h-5" />
                      </div>
                      {destination === 'physical_products' ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">/physical-products</span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {lang === 'bn' ? '📦 ফিজিক্যাল প্রোডাক্টস (Physical Products)' : '📦 Physical Products'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {lang === 'bn'
                          ? 'গ্যাজেট, ইলেকট্রনিক্স, মোবাইল বা যেকোনো পণ্য যা কুরিয়ারে ডেলিভারি ও স্টক ট্র্যাকিং হয়'
                          : 'Gadgets, electronics, fashion & parcel goods with courier tracking'}
                      </div>
                    </div>
                  </button>

                  {/* Choice 3: Money Exchange */}
                  <button
                    type="button"
                    onClick={() => setDestination('money_exchange')}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                      destination === 'money_exchange'
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/25 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Coins className="w-5 h-5" />
                      </div>
                      {destination === 'money_exchange' ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">/money-exchange</span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {lang === 'bn' ? '💱 মানি এক্সচেঞ্জ (Money Exchange)' : '💱 Money Exchange'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {lang === 'bn'
                          ? 'পিয়ার-টু-পিয়ার কারেন্সি এক্সচেঞ্জ, ক্রিপ্টো (USDT), পেওনিয়ার, বিকাশ বা ওয়াইজ ডিল'
                          : 'P2P Currency exchange deals, USDT, Wise, Payoneer & local bank escrow'}
                      </div>
                    </div>
                  </button>

                  {/* Choice 4: Downloadable */}
                  <button
                    type="button"
                    onClick={() => setDestination('downloadable')}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                      destination === 'downloadable'
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/25 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                        <Download className="w-5 h-5" />
                      </div>
                      {destination === 'downloadable' ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">/digital-products</span>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {lang === 'bn' ? '💾 ডাউনলোডযোগ্য (Downloadable)' : '💾 Downloadable'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {lang === 'bn'
                          ? 'সফটওয়্যার, স্ক্রিপ্ট, ইবুক, টেমপ্লেট বা জিপ ফাইল ডাউনলোড প্যাকেজ'
                          : 'Downloadable zip resources, scripts, ebooks, themes and digital packages'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Dynamic Custom Navbar Pages Section */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn'
                          ? 'কাস্টম ন্যাভবার পেজসমূহ (Custom Navbar Pages):'
                          : 'Custom Navbar Pages:'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className="text-sky-600 dark:text-sky-400 hover:underline text-[10px] font-semibold"
                    >
                      {showCustomInput
                        ? (lang === 'bn' ? 'লুকান' : 'Hide')
                        : (lang === 'bn' ? '+ অন্য কোনো পেজ রুট লিখুন' : '+ Type Custom Route')}
                    </button>
                  </div>

                  {/* Render Any Custom Menus Found in Header Navigation (e.g. /goods) */}
                  {customNavItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customNavItems.map((item) => {
                        const isSelected = destination === 'custom_navbar' && customRoute === item.url;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setDestination('custom_navbar');
                              setCustomRoute(item.url);
                            }}
                            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                              isSelected
                                ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/25 shadow-sm'
                                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-sky-300 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                              {isSelected ? (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Selected</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">{item.url}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>🛍️ {item.title}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {lang === 'bn'
                                  ? `পণ্যটি ${item.url} পেজে এবং All Products এ শো করবে`
                                  : `Displays on ${item.url} page & All Products`}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Optional Custom Route Direct Input */}
                  {(showCustomInput || customNavItems.length === 0) && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'কাস্টম পেজ রুট লিখুন (যেমন: /goods বা /gadgets):' : 'Enter Custom Page Route (e.g. /goods):'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customRoute}
                          onChange={(e) => {
                            setCustomRoute(e.target.value);
                            setDestination('custom_navbar');
                          }}
                          placeholder="/goods"
                          className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setDestination('custom_navbar')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                            destination === 'custom_navbar'
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {lang === 'bn' ? 'সিলেক্ট করুন' : 'Select'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* When Custom Navbar Destination is active: Choose Delivery Type */}
                  {destination === 'custom_navbar' && (
                    <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-sky-600" />
                          <span>
                            {lang === 'bn' ? 'টার্গেট পেজ রুট নিশ্চিত হয়েছে:' : 'Target Route Active:'}{' '}
                            <span className="font-mono text-sky-600">{customRoute}</span>
                          </span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                          + All Products
                        </span>
                      </div>

                      <div className="pt-2 border-t border-sky-200/50 dark:border-sky-800/50">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          {lang === 'bn'
                            ? `"${customRoute}" পেজে এই পণ্যটির ধরন নির্বাচন করুন:`
                            : `Select Product Delivery Type for "${customRoute}":`}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomProductType('PHYSICAL')}
                            className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-2 ${
                              customProductType === 'PHYSICAL'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Cpu className="w-4 h-4" />
                            <span>{lang === 'bn' ? '📦 ফিজিক্যাল পণ্য (কুরিয়ার)' : '📦 Physical Goods'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomProductType('DIGITAL_DOWNLOAD')}
                            className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-2 ${
                              customProductType === 'DIGITAL_DOWNLOAD'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Zap className="w-4 h-4" />
                            <span>{lang === 'bn' ? '⚡ ডিজিটাল / ভার্চুয়াল' : '⚡ Digital / Virtual'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PRODUCT CORE FIELDS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'প্রোডাক্ট বা অফারের নাম / শিরোনাম (Title) *' : 'Product / Offer Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTitle(val);
                    if (!metaTitle) setMetaTitle(val);
                  }}
                  placeholder={
                    destination === 'money_exchange'
                      ? 'e.g. 100 USD Payoneer to bKash Instant Escrow Exchange'
                      : destination === 'downloadable'
                      ? 'e.g. Full Multi-Vendor Marketplace Script v4.2 with Escrow (Zip)'
                      : destination === 'physical_products'
                      ? 'e.g. Smart Wireless Surveillance Camera 1080P HD'
                      : 'e.g. Verified PUBG Mobile Conqueror Account with 5000 UC'
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ক্যাটাগরি (Category) *' : 'Category *'}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মূল্য বা রেট (Price ৳) *' : 'Price / Exchange Rate (৳) *'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Physical Specifics */}
              {(destination === 'physical_products' || (destination === 'custom_navbar' && customProductType === 'PHYSICAL')) && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/60 border border-emerald-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-xs text-emerald-950 dark:text-white flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Physical Gadget & Delivery Settings</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                        {lang === 'bn' ? 'স্টক সংখ্যা (Stock)' : 'Stock Quantity'}
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                        {lang === 'bn' ? 'মডেল / এসকেইউ (SKU)' : 'Model / SKU Code'}
                      </label>
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="e.g. CAM-PRO-1080"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                      {lang === 'bn' ? 'ডেলিভারি মাধ্যম ও সময়সীমা' : 'Delivery & Courier Information'}
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo}
                      onChange={(e) => setDeliveryInfo(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Digital Product Specifics */}
              {(destination === 'digital_product' || (destination === 'custom_navbar' && customProductType === 'DIGITAL_DOWNLOAD')) && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/60 border border-indigo-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-xs text-indigo-950 dark:text-white flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Digital Account Delivery Protocol</span>
                  </h3>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      {lang === 'bn' ? 'অ্যাকাউন্ট ডেলিভারি পদ্ধতি ও ইন্সট্রাকশন' : 'Account Handover Instructions'}
                    </label>
                    <textarea
                      rows={2}
                      value={digitalAccessInfo}
                      onChange={(e) => setDigitalAccessInfo(e.target.value)}
                      placeholder="অর্ডার নিশ্চিত হওয়ার পর এসক্রো চ্যাটে ক্রেডেনশিয়াল ও ওটিপি শেয়ার করা হবে..."
                      className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Downloadable File Specifics */}
              {destination === 'downloadable' && (
                <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-slate-800/60 border border-teal-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-xs text-teal-950 dark:text-white flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-teal-500" />
                    <span>Downloadable File & Storage Link</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        {lang === 'bn' ? 'ফাইলের নাম (File Name)' : 'File Name'}
                      </label>
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="e.g. source-code-v2.zip"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                        {lang === 'bn' ? 'ডাউনলোড লিঙ্ক (Google Drive / Mega)' : 'Direct Download URL'}
                      </label>
                      <input
                        type="text"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Money Exchange Specifics */}
              {destination === 'money_exchange' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-xs text-amber-950 dark:text-white flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>Money Exchange & Escrow Details</span>
                  </h3>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      {lang === 'bn' ? 'এক্সচেঞ্জ পেয়ার ও এসক্রো নির্দেশনা' : 'Exchange Pair Terms & Settlement Note'}
                    </label>
                    <textarea
                      rows={2}
                      value={exchangeNote}
                      onChange={(e) => setExchangeNote(e.target.value)}
                      placeholder="যেমন: Payoneer USD দিলে সাথে সাথে বিকাশ/ব্যাংকে টাকা পাবেন। সকল লেনদেন এসক্রো সুরক্ষায় হবে।"
                      className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* PRODUCT IMAGES: DUAL UPLOAD MODE (DIRECT FILE UPLOAD OR URL LINK) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-sky-500" />
                      <span>{lang === 'bn' ? 'প্রোডাক্ট ছবি আপলোড (এক বা একাধিক ছবি) *' : 'Product Images (Single or Multiple) *'}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {lang === 'bn'
                        ? 'কম্পিউটার/মোবাইল থেকে সরাসরি ছবি আপলোড করুন অথবা অনলাইন ইমেজ লিঙ্ক পেস্ট করুন।'
                        : 'Upload multiple photos directly from your device or paste external image URLs.'}
                    </p>
                  </div>

                  {/* Mode switch: File Upload vs URL */}
                  <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('file')}
                      className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                        imageInputMode === 'file'
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ফাইল আপলোড' : 'File Upload'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('link')}
                      className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                        imageInputMode === 'link'
                          ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'ইমেজ লিঙ্ক' : 'Image Link'}</span>
                    </button>
                  </div>
                </div>

                {/* 1. File Upload Dropzone */}
                {imageInputMode === 'file' && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
                      isDragging
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-500/20'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-sky-400 hover:bg-sky-50/40 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files);
                          e.target.value = ''; // Reset input
                        }
                      }}
                      className="hidden"
                    />

                    {uploadingImages ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{uploadProgress}</span>
                        <span className="text-[10px] text-slate-400">
                          {lang === 'bn' ? 'অনুগ্রহ করে অপেক্ষা করুন...' : 'Please wait...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            {lang === 'bn'
                              ? 'এক বা একাধিক ছবি সিলেক্ট করতে ক্লিক করুন অথবা টেনে আনুন (Drag & Drop)'
                              : 'Click to browse or drag & drop one or multiple images'}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            PNG, JPG, WEBP, GIF (স্বয়ংক্রিয়ভাবে অপ্টিমাইজড ও কম্প্রেস হবে)
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'ছবি ব্রাউজ করুন' : 'Browse Files'}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* 2. URL Input Mode */}
                {imageInputMode === 'link' && (
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {lang === 'bn' ? 'অনলাইন ছবির লিঙ্ক পেস্ট করুন (HTTPS):' : 'Paste Online Image Link (HTTPS):'}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="url"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageUrl();
                            }
                          }}
                          placeholder="https://example.com/product-image.jpg"
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        />
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'লিঙ্ক যোগ করুন' : 'Add Link'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Uploaded Images Grid Gallery */}
                {images.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {lang === 'bn'
                          ? `সংযুক্ত ছবি সমূহ (${images.length} টি) — প্রথম ছবিটি কভার ফটো হিসেবে থাকবে`
                          : `Attached Photos (${images.length}) — First photo is the main cover`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setImages([])}
                        className="text-rose-500 hover:underline text-[10px] font-semibold"
                      >
                        {lang === 'bn' ? 'সব ছবি মুছুন' : 'Clear all'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {images.map((img, i) => (
                        <div
                          key={i}
                          className={`relative group rounded-2xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 shadow-sm transition aspect-square flex flex-col justify-between ${
                            i === 0
                              ? 'border-sky-500 ring-2 ring-sky-500/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt=""
                            className="w-full h-full object-cover"
                          />

                          {/* Top Badges */}
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                            {i === 0 ? (
                              <span className="px-2 py-0.5 rounded-lg bg-sky-600 text-white text-[9px] font-extrabold flex items-center gap-1 shadow-sm">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>কভার</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold font-mono">
                                #{i + 1}
                              </span>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition shadow-sm"
                            title={lang === 'bn' ? 'ছবি মুছুন' : 'Delete photo'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Set As Cover Button (for non-primary images) */}
                          {i > 0 && (
                            <div className="absolute bottom-1.5 inset-x-1.5 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(i)}
                                className="w-full py-1 rounded-lg bg-slate-900/90 hover:bg-sky-600 text-white text-[10px] font-bold transition flex items-center justify-center gap-1 backdrop-blur"
                              >
                                <Star className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'কভার করুন' : 'Make Cover'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'এখনও কোনো ছবি যোগ করা হয়নি। সুন্দর আকর্ষক ১টি বা একাধিক ছবি আপলোড করলে ক্রেতাদের আস্থা বাড়ে।'
                        : 'No photos uploaded yet. Uploading 1 or more clear photos attracts more buyers.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Description with Full Rich Text & Formatting Preservation */}
              <div>
                <RichTextEditor
                  label={lang === 'bn' ? 'বিস্তারিত বিবরণী (Full Description)' : 'Detailed Product Description'}
                  required
                  value={descriptionHtml}
                  onChange={(html) => setDescriptionHtml(html)}
                  placeholder={
                    lang === 'bn'
                      ? 'এখানে বিস্তারিত বিবরণী লিখুন বা পেস্ট করুন (বোল্ড, লিস্ট, হেডিং, ইত্যাদি কপি-পেস্ট করলেও হুবহু থাকবে)...'
                      : 'Write or paste clear specifications, features, exchange terms, or warranty policy...'
                  }
                  minHeight="280px"
                />
              </div>
            </div>

            {/* Quick Button to proceed to SEO */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-sky-50 dark:bg-slate-800/50 border border-sky-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {lang === 'bn'
                    ? 'গুগল সার্চে র‍্যাংক করার জন্য এসইও (SEO) মেটা ট্যাগ যুক্ত করতে চান?'
                    : 'Configure SEO tags and live Google preview for this product?'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition text-xs flex items-center gap-1"
              >
                <span>{lang === 'bn' ? 'এসইও সেটিংস খুলুন' : 'Open SEO Settings'}</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED SEO META SETTINGS & GOOGLE PREVIEW */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            {/* Live Google Search Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    {lang === 'bn' ? 'গুগল সার্চ লাইভ প্রিভিউ (Google Search Preview)' : 'Google Search Snippet Preview'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Live Snippet</span>
              </div>

              {/* Google Result Card Simulation */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                {/* URL Breadcrumb */}
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-sans">
                  <span>https://safnexbd.com</span>
                  <span>›</span>
                  <span>products</span>
                  <span>›</span>
                  <span className="text-slate-400 dark:text-slate-500">{previewSlug}</span>
                </div>

                {/* Blue Title Link */}
                <div className="text-base font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                  {metaTitle || title || 'Product Title — SafnexBD Safe Escrow'}
                </div>

                {/* Description Snippet */}
                <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {metaDescription ||
                    (descriptionHtml ? descriptionHtml.replace(/<[^>]*>?/gm, '').substring(0, 150) : null) ||
                    'Buy securely on SafnexBD with 100% verified escrow protection, instant dispute mediation, and verified seller guarantee.'}
                </div>
              </div>
            </div>

            {/* SEO Inputs Container */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'এসইও মেটা টাইটেল (SEO Meta Title)' : 'SEO Meta Title'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {metaTitle.length}/60 {lang === 'bn' ? 'অক্ষর' : 'chars'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="e.g. Buy Verified PUBG Mobile Account | Instant Escrow Delivery"
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setMetaTitle(title)}
                    className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold text-[11px] whitespace-nowrap"
                  >
                    {lang === 'bn' ? 'টাইটেল কপি করুন' : 'Copy Title'}
                  </button>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'এসইও মেটা বিবরণ (SEO Meta Description)' : 'SEO Meta Description'}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {metaDescription.length}/160 {lang === 'bn' ? 'অক্ষর' : 'chars'}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="সার্চ ইঞ্জিনে আকর্ষক বিবরণ লিখুন যা ক্লিক বাড়াতে সাহায্য করবে..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Meta Keywords & Tag Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'এসইও মেটা কিওয়ার্ড ও ট্যাগস (Keywords / Tags)' : 'SEO Keywords / Tags'}
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="ট্যাগ লিখে এন্টার চাপুন (যেমন: pubg, escrow, p2p)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition"
                  >
                    {lang === 'bn' ? 'ট্যাগ যোগ করুন' : 'Add Tag'}
                  </button>
                </div>

                {/* Displayed Tag Pills */}
                {metaKeywords && (
                  <div className="flex flex-wrap gap-1.5 pt-1 mb-3">
                    {metaKeywords
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-[11px] font-semibold"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                {/* Quick Tag Recommendations */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1.5">
                    {lang === 'bn' ? 'দ্রুত এসইও ট্যাগ সাজেশন (ক্লিক করে যোগ করুন):' : 'Suggested SEO Tags (Click to add):'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Verified Escrow',
                      '100% Safe',
                      'Instant Delivery',
                      'Best Price BD',
                      'Original Warranty',
                      'Fast Support',
                    ].map((suggested) => (
                      <button
                        key={suggested}
                        type="button"
                        onClick={() => handleAddTag(suggested)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-600 dark:text-slate-400 hover:text-sky-600 border border-slate-200 dark:border-slate-700 text-[10px] transition"
                      >
                        + {suggested}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation back to basic */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>←</span>
                <span>{lang === 'bn' ? 'প্রোডাক্ট বিবরণীতে ফিরে যান' : 'Back to Product Details'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {lang === 'bn'
                ? 'প্রোডাক্টটি সফলভাবে পাবলিশ হলে সকল ক্রেতারা এটি ব্রাউজ করতে পারবে।'
                : 'Your product will be live instantly with SafnexBD escrow protection.'}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImages}
            className="px-8 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-lg shadow-sky-600/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>{loading ? (lang === 'bn' ? 'পাবলিশ হচ্ছে...' : 'Publishing...') : (lang === 'bn' ? 'প্রোডাক্ট পাবলিশ করুন' : 'Publish Product')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading product form...</div>}>
      <NewProductForm />
    </Suspense>
  );
}
