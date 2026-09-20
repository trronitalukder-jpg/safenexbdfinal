'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Compass,
  Link2,
  ExternalLink,
  Navigation,
  Search,
  CheckCircle2,
  Check,
  X,
  CornerDownRight,
  FolderPlus,
  Eye,
  Globe,
  Sparkles,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export interface CmsPageItem {
  id: string;
  title: string;
  slug: string;
  contentHtml: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMenuItem {
  id: string;
  menuId: string;
  parentId?: string | null;
  title: string;
  url: string;
  icon?: string | null;
  sortOrder: number;
  isExternal: boolean;
  isActive: boolean;
  createdAt?: string;
  children?: AdminMenuItem[];
}

export default function AdminPagesAndMenusPage() {
  const { lang } = useLanguage();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pages' | 'navbar_menus'>('pages');

  // Common Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // -------------------------------------------------------------
  // 1. CMS PAGES STATE & HANDLERS
  // -------------------------------------------------------------
  const [pages, setPages] = useState<CmsPageItem[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [pageStatusFilter, setPageStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Page Modal State
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPageItem | null>(null);
  const [pageFormData, setPageFormData] = useState({
    title: '',
    slug: '',
    contentHtml: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: true,
    autoAddToMenu: false,
  });

  // Page Delete State
  const [deletingPage, setDeletingPage] = useState<CmsPageItem | null>(null);
  const [isSubmittingPage, setIsSubmittingPage] = useState(false);

  // Fetch all CMS pages
  const fetchPages = useCallback(async () => {
    setLoadingPages(true);
    try {
      const res = await api.get('/cms/admin/pages');
      const data = unwrap(res);
      setPages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load pages:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to load pages', 'error');
    } finally {
      setLoadingPages(false);
    }
  }, []);

  // -------------------------------------------------------------
  // 2. NAVBAR MENU STATE & HANDLERS
  // -------------------------------------------------------------
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [menuStatusFilter, setMenuStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Menu Modal State
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<AdminMenuItem | null>(null);
  const [menuFormData, setMenuFormData] = useState({
    parentId: '',
    title: '',
    url: '',
    icon: '',
    sortOrder: 0,
    isExternal: false,
    isActive: true,
  });

  // Menu Delete State
  const [deletingMenuItem, setDeletingMenuItem] = useState<AdminMenuItem | null>(null);
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);
  const [isResettingMenu, setIsResettingMenu] = useState(false);

  // Fetch Navbar Menu
  const fetchNavbarMenu = useCallback(async () => {
    setLoadingMenu(true);
    try {
      const res = await api.get('/cms/admin/menus/HEADER');
      const data = unwrap(res);
      if (data?.items && Array.isArray(data.items)) {
        setMenuItems(data.items);
      } else if (Array.isArray(data)) {
        setMenuItems(data);
      } else {
        setMenuItems([]);
      }
    } catch (err: any) {
      console.error('Failed to load navbar menu:', err);
      try {
        const pubRes = await api.get('/cms/menus/HEADER');
        const pubData = unwrap(pubRes);
        if (pubData?.items && Array.isArray(pubData.items)) {
          setMenuItems(pubData.items);
        }
      } catch (e: any) {
        showToast(err.message || 'Failed to load navbar menu', 'error');
      }
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
    fetchNavbarMenu();
  }, [fetchPages, fetchNavbarMenu]);

  // -------------------------------------------------------------
  // PAGE ACTIONS
  // -------------------------------------------------------------
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOpenCreatePage = () => {
    setEditingPage(null);
    setPageFormData({
      title: '',
      slug: '',
      contentHtml: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: true,
      autoAddToMenu: false,
    });
    setPageModalOpen(true);
  };

  const handleOpenEditPage = (item: CmsPageItem) => {
    setEditingPage(item);
    setPageFormData({
      title: item.title,
      slug: item.slug,
      contentHtml: item.contentHtml || '',
      metaTitle: item.metaTitle || '',
      metaDescription: item.metaDescription || '',
      isPublished: item.isPublished !== false,
      autoAddToMenu: false,
    });
    setPageModalOpen(true);
  };

  const applyPageTemplate = (type: 'about' | 'privacy' | 'terms' | 'contact' | 'faq' | 'dispute') => {
    if (type === 'about') {
      setPageFormData((prev) => ({
        ...prev,
        title: prev.title || 'About Us',
        slug: prev.slug || 'about-us',
        metaTitle: 'About SafnexBD - Escrow Marketplace',
        contentHtml: `<h2>About SafnexBD</h2>\n<p>SafnexBD is Bangladesh's premier verified escrow trading marketplace, designed to guarantee 100% security for buying and selling digital accounts, services, and physical products.</p>\n<h3>Our Core Mission</h3>\n<p>To eliminate scams, build trust in peer-to-peer commerce, and empower entrepreneurs with secure transaction custody.</p>\n<h3>Why SafnexBD?</h3>\n<ul>\n  <li>Zero-fraud Escrow Protection on every deal.</li>\n  <li>Instant automated and manual settlement support.</li>\n  <li>24/7 Dispute Resolution Team.</li>\n</ul>`,
      }));
    } else if (type === 'privacy') {
      setPageFormData((prev) => ({
        ...prev,
        title: prev.title || 'Privacy Policy',
        slug: prev.slug || 'privacy-policy',
        metaTitle: 'Privacy Policy - SafnexBD',
        contentHtml: `<h2>Privacy Policy</h2>\n<p>Your privacy is of utmost importance to us. This Privacy Policy explains how SafnexBD collects, protects, and utilizes your personal information.</p>\n<h3>Information We Collect</h3>\n<p>We collect essential information required to verify identity and process transactions, including phone numbers, emails, and transaction logs.</p>\n<h3>Data Security</h3>\n<p>All sensitive information and payment hashes are encrypted using modern cryptographic standards.</p>`,
      }));
    } else if (type === 'terms') {
      setPageFormData((prev) => ({
        ...prev,
        title: prev.title || 'Terms and Conditions',
        slug: prev.slug || 'terms-conditions',
        metaTitle: 'Terms & Conditions - SafnexBD',
        contentHtml: `<h2>Terms and Conditions</h2>\n<p>By registering or transacting on SafnexBD, you agree to adhere to our strict safety and escrow guidelines.</p>\n<h3>Escrow Protocol</h3>\n<p>Funds remain held in safe escrow until the buyer confirms satisfactory receipt of goods or services.</p>\n<h3>Dispute Rules</h3>\n<p>In case of dispute, our administrative arbitration team reviews transaction logs and evidence before disbursing funds.</p>`,
      }));
    } else if (type === 'contact') {
      setPageFormData((prev) => ({
        ...prev,
        title: prev.title || 'Contact and Support',
        slug: prev.slug || 'contact-us',
        metaTitle: 'Contact Us - SafnexBD Support',
        contentHtml: `<h2>Contact Us</h2>\n<p>Have questions, require assistance, or need urgent escrow dispute review? Contact our dedicated support team.</p>\n<ul>\n  <li><strong>Helpline:</strong> +880 1700-000000 (10 AM - 12 AM)</li>\n  <li><strong>Email:</strong> support@safnexbd.com</li>\n  <li><strong>Live Chat:</strong> Available inside your user dashboard 24/7</li>\n</ul>`,
      }));
    } else if (type === 'faq') {
      setPageFormData((prev) => ({
        ...prev,
        title: prev.title || 'Frequently Asked Questions',
        slug: prev.slug || 'faq',
        metaTitle: 'FAQ - SafnexBD Help Center',
        contentHtml: `<h2>Frequently Asked Questions</h2>\n<h3>How does Escrow work on SafnexBD?</h3>\n<p>When you purchase an item, your money is securely held by SafnexBD. The seller only receives payment after you confirm receipt and inspect the item.</p>\n<h3>What are the recharge and withdrawal fees?</h3>\n<p>Transparent commission fees apply as configured in our platform policies without any hidden charges.</p>`,
      }));
    } else if (type === 'dispute') {
      setPageFormData((prev) => ({
        ...prev,
        title: prev.title || 'Dispute Policy (বিরোধ নিষ্পত্তি নীতিমালা)',
        slug: prev.slug || 'dispute-policy',
        metaTitle: 'Dispute Policy - SafnexBD Escrow Safety',
        contentHtml: `<h2>SafnexBD বিরোধ নিষ্পত্তি নীতিমালা (Dispute Policy)</h2>\n<p>SafnexBD-তে প্রতিটি লেনদেনে ক্রেতা ও বিক্রেতার শতভাগ আর্থিক নিরাপত্তা নিশ্চিত করতে আমাদের নিজস্ব এসক্রো প্রটোকল এবং নিরপেক্ষ বিরোধ নিষ্পত্তি টিম কাজ করে।</p>\n<h3>১. কখন বিরোধ দায়ের করবেন?</h3>\n<ul>\n  <li>ভুল পণ্য বা বিক্রেতার প্রতিশ্রুতির সাথে অমিল থাকলে।</li>\n  <li>ডিজিটাল পণ্যের এক্সেস বা ক্রেডেনশিয়াল ত্রুটিপূর্ণ হলে।</li>\n  <li>নির্ধারিত সময়ের মধ্যে পণ্য হস্তান্তর না হলে।</li>\n</ul>\n<h3>২. সময়সীমা ও রায়</h3>\n<p>পণ্য ডেলিভারির সর্বোচ্চ ২৪ ঘণ্টার মধ্যে বিরোধ দায়ের করতে হবে। অ্যাডমিন টিম উভয় পক্ষের প্রমাণাদি যাচাই করে ২৪-৪৮ ঘণ্টার মধ্যে ন্যায়সঙ্গত সিদ্ধান্ত গ্রহণ করবে।</p>`,
      }));
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageFormData.title.trim() || !pageFormData.slug.trim()) {
      showToast('Title and Slug are required', 'error');
      return;
    }

    setIsSubmittingPage(true);
    try {
      const payload: any = {
        title: pageFormData.title.trim(),
        slug: generateSlug(pageFormData.slug),
        contentHtml: pageFormData.contentHtml ? pageFormData.contentHtml.trim() : '',
        metaTitle: pageFormData.metaTitle?.trim() || null,
        metaDescription: pageFormData.metaDescription?.trim() || null,
        isPublished: Boolean(pageFormData.isPublished),
      };

      if (editingPage) {
        payload.id = editingPage.id;
      }

      await api.post('/cms/admin/pages', payload);

      // Auto add to navbar menu if checked
      if (pageFormData.autoAddToMenu) {
        try {
          await api.post('/cms/admin/menu-items', {
            location: 'HEADER',
            title: pageFormData.title,
            url: `/page/${payload.slug}`,
            sortOrder: menuItems.length,
            isExternal: false,
            isActive: true,
          });
          await fetchNavbarMenu();
        } catch (menuErr) {
          console.error('Failed to auto-add to menu:', menuErr);
        }
      }

      showToast(
        editingPage
          ? lang === 'bn'
            ? 'পেজটি সফলভাবে আপডেট করা হয়েছে!'
            : 'Page updated successfully!'
          : lang === 'bn'
          ? 'নতুন পেজ সফলভাবে তৈরি করা হয়েছে!'
          : 'New page created successfully!',
        'success'
      );

      setPageModalOpen(false);
      await fetchPages();
    } catch (err: any) {
      console.error('Failed to save page:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to save page', 'error');
    } finally {
      setIsSubmittingPage(false);
    }
  };

  const handleTogglePagePublished = async (item: CmsPageItem) => {
    try {
      const nextStatus = !item.isPublished;
      await api.post('/cms/admin/pages', {
        id: item.id,
        title: item.title,
        slug: item.slug,
        contentHtml: item.contentHtml,
        isPublished: nextStatus,
      });
      showToast(
        lang === 'bn'
          ? `পেজ "${item.title}" ${nextStatus ? 'প্রকাশিত (Published)' : 'ড্রাফট (Draft)'} করা হয়েছে`
          : `Page "${item.title}" set to ${nextStatus ? 'Published' : 'Draft'}`,
        'success'
      );
      await fetchPages();
    } catch (err: any) {
      showToast(err.message || 'Failed to update page status', 'error');
    }
  };

  const handleDeletePage = async () => {
    if (!deletingPage) return;
    setIsSubmittingPage(true);
    try {
      await api.delete(`/cms/admin/pages/${deletingPage.id}`);
      showToast(
        lang === 'bn' ? 'পেজটি সফলভাবে মুছে ফেলা হয়েছে!' : 'Page deleted successfully!',
        'success'
      );
      setDeletingPage(null);
      await fetchPages();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete page', 'error');
    } finally {
      setIsSubmittingPage(false);
    }
  };

  // -------------------------------------------------------------
  // NAVBAR MENU ACTIONS
  // -------------------------------------------------------------
  const handleOpenCreateMenuItem = (parentPresetId: string = '', presetUrl: string = '', presetTitle: string = '') => {
    setEditingMenuItem(null);
    const highestSort = menuItems.length > 0
      ? Math.max(...menuItems.map((m) => m.sortOrder || 0)) + 1
      : 0;

    setMenuFormData({
      parentId: parentPresetId,
      title: presetTitle,
      url: presetUrl,
      icon: '',
      sortOrder: parentPresetId ? 0 : highestSort,
      isExternal: false,
      isActive: true,
    });
    setMenuModalOpen(true);
  };

  const handleOpenEditMenuItem = (item: AdminMenuItem) => {
    setEditingMenuItem(item);
    setMenuFormData({
      parentId: item.parentId || '',
      title: item.title || '',
      url: item.url || '',
      icon: item.icon || '',
      sortOrder: item.sortOrder || 0,
      isExternal: Boolean(item.isExternal),
      isActive: item.isActive !== false,
    });
    setMenuModalOpen(true);
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuFormData.title.trim() || !menuFormData.url.trim()) {
      showToast('Title and URL are required', 'error');
      return;
    }

    setIsSubmittingMenu(true);
    try {
      if (editingMenuItem) {
        await api.patch(`/cms/admin/menu-items/${editingMenuItem.id}`, {
          ...menuFormData,
          sortOrder: Number(menuFormData.sortOrder) || 0,
        });
        showToast(
          lang === 'bn' ? 'মেনু আইটেম সফলভাবে আপডেট করা হয়েছে' : 'Menu item updated successfully',
          'success'
        );
      } else {
        await api.post('/cms/admin/menu-items', {
          location: 'HEADER',
          ...menuFormData,
          sortOrder: Number(menuFormData.sortOrder) || 0,
        });
        showToast(
          lang === 'bn' ? 'নতুন মেনু আইটেম তৈরি করা হয়েছে' : 'Menu item created successfully',
          'success'
        );
      }
      setMenuModalOpen(false);
      await fetchNavbarMenu();
    } catch (err: any) {
      console.error('Failed to save menu item:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to save menu item', 'error');
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  const handleToggleMenuStatus = async (item: AdminMenuItem) => {
    try {
      const nextStatus = !item.isActive;
      await api.patch(`/cms/admin/menu-items/${item.id}`, {
        isActive: nextStatus,
      });
      showToast(
        lang === 'bn'
          ? `মেনু "${item.title}" ${nextStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`
          : `Menu "${item.title}" set to ${nextStatus ? 'active' : 'inactive'}`,
        'success'
      );
      await fetchNavbarMenu();
    } catch (err: any) {
      showToast(err.message || 'Failed to update menu status', 'error');
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!deletingMenuItem) return;
    setIsSubmittingMenu(true);
    try {
      await api.delete(`/cms/admin/menu-items/${deletingMenuItem.id}`);
      showToast(
        lang === 'bn' ? 'মেনু আইটেম সফলভাবে মুছে ফেলা হয়েছে' : 'Menu item deleted successfully',
        'success'
      );
      setDeletingMenuItem(null);
      await fetchNavbarMenu();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to delete menu item', 'error');
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  const handleResetDefaultMenu = async () => {
    if (!confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে ডিফল্ট ন্যাভবার মেনু রিস্টোর করতে চান?' : 'Are you sure you want to reset navbar to default menus?')) {
      return;
    }
    setIsResettingMenu(true);
    try {
      await api.post('/cms/admin/menus/HEADER/reset');
      showToast(
        lang === 'bn' ? 'ডিফল্ট ন্যাভবার মেনু সফলভাবে রিস্টোর করা হয়েছে!' : 'Default navbar menus restored successfully!',
        'success'
      );
      await fetchNavbarMenu();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset default menu', 'error');
    } finally {
      setIsResettingMenu(false);
    }
  };

  // -------------------------------------------------------------
  // FILTERING & STATS
  // -------------------------------------------------------------
  const filteredPages = pages.filter((p) => {
    const q = pageSearchQuery.toLowerCase();
    const matchesSearch = !pageSearchQuery || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesStatus =
      pageStatusFilter === 'ALL' ||
      (pageStatusFilter === 'PUBLISHED' && p.isPublished) ||
      (pageStatusFilter === 'DRAFT' && !p.isPublished);
    return matchesSearch && matchesStatus;
  });

  const totalPages = pages.length;
  const publishedPagesCount = pages.filter((p) => p.isPublished).length;
  const draftPagesCount = pages.filter((p) => !p.isPublished).length;

  const totalNavMainMenus = menuItems.length;
  const totalNavSubMenus = menuItems.reduce((acc, m) => acc + (m.children?.length || 0), 0);
  const totalNavActiveItems = menuItems.reduce(
    (acc, m) => acc + (m.isActive ? 1 : 0) + (m.children?.filter((c) => c.isActive).length || 0),
    0
  );

  const filteredMenuItems = menuItems.filter((m) => {
    const q = menuSearchQuery.toLowerCase();
    const parentMatches = m.title.toLowerCase().includes(q) || m.url.toLowerCase().includes(q);
    const childMatches = m.children?.some(
      (c) => c.title.toLowerCase().includes(q) || c.url.toLowerCase().includes(q)
    );
    const matchesSearch = !menuSearchQuery || parentMatches || childMatches;

    const matchesStatus =
      menuStatusFilter === 'ALL' ||
      (menuStatusFilter === 'ACTIVE' && m.isActive) ||
      (menuStatusFilter === 'INACTIVE' && !m.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
              : 'bg-rose-950/90 text-rose-300 border-rose-700/60'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                activeTab === 'pages'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400'
              }`}
            >
              {activeTab === 'pages' ? <FileText className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'pages'
                  ? lang === 'bn'
                    ? 'কাস্টম পেজ তৈরি ও ম্যানেজমেন্ট'
                    : 'Custom Pages & CMS Management'
                  : lang === 'bn'
                  ? 'ন্যাভবার মেনু ও সাব-মেনু ম্যানেজমেন্ট'
                  : 'Navbar Menu & Sub-menu Management'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {activeTab === 'pages'
                  ? lang === 'bn'
                    ? 'নতুন পেজ তৈরি করুন (About Us, Privacy Policy, Terms, Contact) এবং লাইভ পাবলিশ করুন'
                    : 'Create and publish custom CMS pages with rich content and direct routes'
                  : lang === 'bn'
                  ? 'ওয়েবসাইটের ন্যাভবারে প্রদর্শিত সকল মূল মেনু ও সাব-মেনু তৈরি, এডিট ও ডিলিট করুন'
                  : 'Manage header navigation links, nested sub-menus, and external URLs'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pages' ? (
            <>
              <button
                onClick={fetchPages}
                disabled={loadingPages}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold shadow-sm transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPages ? 'animate-spin text-emerald-500' : ''}`} />
                <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
              </button>

              <button
                onClick={handleOpenCreatePage}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নতুন পেজ তৈরি করুন' : 'Create New Page'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleResetDefaultMenu}
                disabled={isResettingMenu}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/50 text-xs font-semibold shadow-sm transition"
                title="Restore default header items"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResettingMenu ? 'animate-spin text-amber-500' : ''}`} />
                <span>{lang === 'bn' ? 'ডিফল্ট রিস্টোর' : 'Reset Defaults'}</span>
              </button>

              <button
                onClick={fetchNavbarMenu}
                disabled={loadingMenu}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 text-xs font-semibold shadow-sm transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMenu ? 'animate-spin text-sky-500' : ''}`} />
                <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
              </button>

              <button
                onClick={() => handleOpenCreateMenuItem('')}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-sky-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নতুন মেনু তৈরি' : 'Create Menu Item'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'pages'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{lang === 'bn' ? 'কাস্টম পেজ ম্যানেজমেন্ট' : 'Custom Pages'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'pages' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalPages} Pages
          </span>
        </button>

        <button
          onClick={() => setActiveTab('navbar_menus')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'navbar_menus'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{lang === 'bn' ? 'ন্যাভবার মেনু ও সাব-মেনু' : 'Navbar Menus & Sub-menus'}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'navbar_menus' ? 'bg-slate-950 text-sky-300' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalNavMainMenus + totalNavSubMenus} Links
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. PAGES TAB                                                              */}
      {/* ========================================================================= */}
      {activeTab === 'pages' && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'মোট তৈরি করা পেজ' : 'Total Pages'}
                </div>
                <div className="text-xl font-black text-white mt-1">{totalPages}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'প্রকাশিত পেজ' : 'Published Pages'}
                </div>
                <div className="text-xl font-black text-emerald-400 mt-1">{publishedPagesCount}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'খসড়া / ড্রাফট' : 'Draft Pages'}
                </div>
                <div className="text-xl font-black text-amber-400 mt-1">{draftPagesCount}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Edit2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'পাবলিক রুট ফরম্যাট' : 'Public Route'}
                </div>
                <div className="text-xs font-mono font-bold text-sky-400 mt-1">/page/[slug]</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Link2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search & Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3">
            <div className="flex flex-1 items-center gap-2.5 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={pageSearchQuery}
                  onChange={(e) => setPageSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'পেজের শিরোনাম বা স্লাগ (slug) দিয়ে খুঁজুন...'
                      : 'Search page title or slug...'
                  }
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={pageStatusFilter}
                onChange={(e: any) => setPageStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">{lang === 'bn' ? 'সকল পেজ' : 'All Pages'}</option>
                <option value="PUBLISHED">{lang === 'bn' ? 'শুধু প্রকাশিত (Published)' : 'Published'}</option>
                <option value="DRAFT">{lang === 'bn' ? 'শুধু ড্রাফট (Draft)' : 'Draft'}</option>
              </select>
            </div>

            <button
              onClick={handleOpenCreatePage}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নতুন পেজ তৈরি' : 'Create Page'}</span>
            </button>
          </div>

          {/* Pages List */}
          {loadingPages ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>{lang === 'bn' ? 'পেজ লোড হচ্ছে...' : 'Loading pages...'}</span>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">
                {pageSearchQuery
                  ? lang === 'bn'
                    ? 'কোনো পেজ পাওয়া যায়নি'
                    : 'No matching pages found'
                  : lang === 'bn'
                  ? 'কোনো কাস্টম পেজ তৈরি করা নেই'
                  : 'No custom pages created yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'bn'
                  ? 'About Us, Privacy Policy, Terms & Conditions বা Contact Us পেজ তৈরি করুন এবং সরাসরি ন্যাভবারে যুক্ত করুন।'
                  : 'Create About Us, Privacy Policy, Terms & Conditions or custom landing pages with rich content.'}
              </p>
              <button
                onClick={handleOpenCreatePage}
                className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition"
              >
                {lang === 'bn' ? '+ নতুন পেজ তৈরি করুন' : '+ Create First Page'}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold">
                      <th className="py-3 px-4">{lang === 'bn' ? 'পেজের শিরোনাম' : 'Page Title'}</th>
                      <th className="py-3 px-4">{lang === 'bn' ? 'স্লাগ / পাবলিক রুট' : 'Slug / Route'}</th>
                      <th className="py-3 px-4">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th className="py-3 px-4">{lang === 'bn' ? 'আপডেট' : 'Last Updated'}</th>
                      <th className="py-3 px-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPages.map((page) => (
                      <tr key={page.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{page.title}</span>
                          </div>
                          {page.metaTitle && (
                            <div className="text-[10px] text-slate-500 mt-0.5">{page.metaTitle}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-sky-400 text-xs">
                            <Link2 className="w-3 h-3 text-slate-500" />
                            <span>/page/{page.slug}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleTogglePagePublished(page)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 ${
                              page.isPublished
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                                : 'bg-amber-950/80 text-amber-300 border-amber-700/50 hover:bg-amber-900/60'
                            }`}
                            title="Click to toggle status"
                          >
                            {page.isPublished ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>{lang === 'bn' ? 'প্রকাশিত' : 'Published'}</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3 text-amber-400" />
                                <span>{lang === 'bn' ? 'ড্রাফট' : 'Draft'}</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {page.updatedAt
                            ? new Date(page.updatedAt).toLocaleDateString()
                            : page.createdAt
                            ? new Date(page.createdAt).toLocaleDateString()
                            : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Live view button */}
                            <Link
                              href={`/page/${page.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white text-sky-400 transition"
                              title="View Live Page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            {/* Add to navbar button */}
                            <button
                              onClick={() => {
                                handleOpenCreateMenuItem('', `/page/${page.slug}`, page.title);
                                setActiveTab('navbar_menus');
                              }}
                              className="px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold transition flex items-center gap-1"
                              title="Add to Navbar Menu"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{lang === 'bn' ? 'ন্যাভে যোগ' : 'Add to Nav'}</span>
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => handleOpenEditPage(page)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="Edit Page"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => setDeletingPage(page)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white transition"
                              title="Delete Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. NAVBAR MENUS TAB                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'navbar_menus' && (
        <div className="space-y-5">
          {/* Navbar KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'শীর্ষ মূল মেনু' : 'Main Menu Items'}
                </div>
                <div className="text-xl font-black text-white mt-1">{totalNavMainMenus}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Compass className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'মোট সাব-মেনু' : 'Sub-menu Items'}
                </div>
                <div className="text-xl font-black text-sky-400 mt-1">{totalNavSubMenus}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CornerDownRight className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'সক্রিয় ন্যাভ আইটেম' : 'Active Nav Links'}
                </div>
                <div className="text-xl font-black text-emerald-400 mt-1">{totalNavActiveItems}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  {lang === 'bn' ? 'মেনু লোকেশন' : 'Menu Location'}
                </div>
                <div className="text-xs font-bold text-white mt-1">MAIN HEADER</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Navigation className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3">
            <div className="flex flex-1 items-center gap-2.5 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'মেনুর নাম বা লিঙ্ক দিয়ে খুঁজুন...'
                      : 'Search menu title or link URL...'
                  }
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={menuStatusFilter}
                onChange={(e: any) => setMenuStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">{lang === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
                <option value="ACTIVE">{lang === 'bn' ? 'শুধু সক্রিয়' : 'Active Only'}</option>
                <option value="INACTIVE">{lang === 'bn' ? 'শুধু নিষ্ক্রিয়' : 'Inactive Only'}</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenCreateMenuItem('')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 transition whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মূল মেনু যোগ করুন' : 'Add Main Menu'}</span>
            </button>
          </div>

          {/* Menus List */}
          {loadingMenu ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span>{lang === 'bn' ? 'মেনু আইটেম লোড হচ্ছে...' : 'Loading navbar menu items...'}</span>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
              <Compass className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">
                {menuSearchQuery
                  ? lang === 'bn'
                    ? 'কোনো মেনু আইটেম পাওয়া যায়নি'
                    : 'No matching menu items found'
                  : lang === 'bn'
                  ? 'কোনো মেনু আইটেম কনফিগার করা নেই'
                  : 'No navbar menus found'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => handleOpenCreateMenuItem('')}
                  className="px-4 py-2 bg-sky-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-sky-400 transition"
                >
                  {lang === 'bn' ? '+ নতুন মেনু তৈরি করুন' : '+ Create Menu Item'}
                </button>
                <button
                  onClick={handleResetDefaultMenu}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                >
                  {lang === 'bn' ? 'ডিফল্ট রিস্টোর' : 'Restore Defaults'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMenuItems.map((item) => {
                const subItems = item.children || [];
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden transition-all hover:border-slate-700/80 shadow-lg"
                  >
                    {/* Main Menu Item Header Row */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                          #{item.sortOrder}
                        </span>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-white">
                              {item.title}
                            </span>

                            <span className="font-mono text-[11px] text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              {item.url}
                            </span>

                            {item.isExternal && (
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" />
                                {lang === 'bn' ? 'নতুন ট্যাব' : 'New Tab'}
                              </span>
                            )}

                            <span className="text-[10px] bg-slate-800/80 border border-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                              {subItems.length > 0
                                ? `${subItems.length} ${lang === 'bn' ? 'টি সাব-মেনু' : 'Sub-menus'}`
                                : lang === 'bn' ? 'সাব-মেনু নেই' : 'No Sub-menus'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Status Toggle Switch */}
                        <button
                          onClick={() => handleToggleMenuStatus(item)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 ${
                            item.isActive
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                              : 'bg-rose-950/80 text-rose-300 border-rose-700/50 hover:bg-rose-900/60'
                          }`}
                          title="Click to toggle active status"
                        >
                          {item.isActive ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{lang === 'bn' ? 'সক্রিয়' : 'Active'}</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-rose-400" />
                              <span>{lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</span>
                            </>
                          )}
                        </button>

                        {/* Add Sub-menu button */}
                        <button
                          onClick={() => handleOpenCreateMenuItem(item.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-bold transition"
                          title="Add Sub-menu"
                        >
                          <FolderPlus className="w-3 h-3" />
                          <span>{lang === 'bn' ? '+ সাব-মেনু' : '+ Sub-menu'}</span>
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEditMenuItem(item)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => setDeletingMenuItem(item)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white border border-slate-700/60 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-menus Nested Section */}
                    {subItems.length > 0 ? (
                      <div className="bg-slate-950/60 border-t border-slate-800/80 p-3 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1.5">
                          <CornerDownRight className="w-3 h-3 text-sky-400" />
                          <span>
                            {item.title} - {lang === 'bn' ? 'সাব-মেনু সমূহ' : 'Sub-menu Items'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {subItems.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/70 hover:border-slate-700 transition ml-3 sm:ml-6"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-lg bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center">
                                  #{sub.sortOrder}
                                </span>
                                <span className="font-bold text-xs text-white">{sub.title}</span>
                                <span className="font-mono text-[10px] text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded">
                                  {sub.url}
                                </span>
                                {sub.isExternal && (
                                  <span className="text-[9px] text-slate-400">↗ New Tab</span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button
                                  onClick={() => handleToggleMenuStatus(sub)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                                    sub.isActive
                                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40'
                                      : 'bg-rose-950/70 text-rose-300 border-rose-800/40'
                                  }`}
                                >
                                  {sub.isActive ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive')}
                                </button>

                                <button
                                  onClick={() => handleOpenEditMenuItem(sub)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                  title="Edit Sub-menu"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={() => setDeletingMenuItem(sub)}
                                  className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white transition"
                                  title="Delete Sub-menu"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950/30 border-t border-slate-800/40 px-4 py-2 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>
                          {lang === 'bn'
                            ? 'এই মেনুর অধীনে কোনো সাব-মেনু নেই'
                            : 'No sub-menus under this item'}
                        </span>
                        <button
                          onClick={() => handleOpenCreateMenuItem(item.id)}
                          className="text-sky-400 hover:text-sky-300 font-semibold"
                        >
                          {lang === 'bn' ? '+ সাব-মেনু যোগ করুন' : '+ Add Sub-menu'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CREATE & EDIT PAGE MODAL                                               */}
      {/* ========================================================================= */}
      {pageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingPage
                      ? lang === 'bn'
                        ? 'পেজ সম্পাদনা করুন'
                        : 'Edit Custom Page'
                      : lang === 'bn'
                      ? 'নতুন কাস্টম পেজ তৈরি করুন'
                      : 'Create New Custom Page'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'bn'
                      ? 'পাবলিক রুট /page/[slug] হিসেবে লাইভ থাকবে'
                      : 'Live URL will be available at /page/[slug]'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPageModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Template Presets */}
            {!editingPage && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'bn' ? 'দ্রুত শুরু করার টেমপ্লেট (ক্লিক করুন):' : 'Starter Templates (Click to apply):'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPageTemplate('about')}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 text-[11px] font-semibold transition"
                  >
                    🏢 About Us
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPageTemplate('privacy')}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 text-[11px] font-semibold transition"
                  >
                    🔒 Privacy Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPageTemplate('terms')}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 text-[11px] font-semibold transition"
                  >
                    📜 Terms & Conditions
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPageTemplate('contact')}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 text-[11px] font-semibold transition"
                  >
                    📞 Contact & Support
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPageTemplate('faq')}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 text-[11px] font-semibold transition"
                  >
                    ❓ FAQ Help
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPageTemplate('dispute')}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-700/50 text-[11px] font-semibold transition"
                  >
                    ⚖️ Dispute Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageFormData((prev) => ({ ...prev, contentHtml: '' }))}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-700/50 text-[11px] font-semibold transition"
                  >
                    🧹 {lang === 'bn' ? 'ফাঁকা পেজ (কন্টেন্ট মুছুন)' : 'Blank Page (Clear Content)'}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSavePage} className="space-y-3.5 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'bn' ? 'পেজের শিরোনাম / নাম *' : 'Page Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={pageFormData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPageFormData((prev) => ({
                        ...prev,
                        title: val,
                        slug: !editingPage && (!prev.slug || prev.slug === generateSlug(prev.title))
                          ? generateSlug(val)
                          : prev.slug,
                      }));
                    }}
                    placeholder="e.g. About Us, Return Policy"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইউআরএল স্লাগ (Slug) *' : 'URL Slug *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-[11px]">/page/</span>
                    <input
                      type="text"
                      required
                      value={pageFormData.slug}
                      onChange={(e) =>
                        setPageFormData({ ...pageFormData, slug: generateSlug(e.target.value) })
                      }
                      placeholder="about-us"
                      className="w-full pl-16 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Content HTML / Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300">
                    {lang === 'bn'
                      ? 'পেজের কন্টেন্ট / বিবরণী (ঐচ্ছিক - ফাঁকা রাখতে পারেন)'
                      : 'Page Content / HTML (Optional - leave blank for clean page)'}
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {lang === 'bn' ? '✨ ফাঁকা পেজ তৈরি করতে এটি খালি রাখুন' : '✨ Leave empty for a clean blank page'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={pageFormData.contentHtml}
                  onChange={(e) => setPageFormData({ ...pageFormData, contentHtml: e.target.value })}
                  placeholder={
                    lang === 'bn'
                      ? 'প্রয়োজন না হলে এটি ফাঁকা রাখুন। ফাঁকা রাখলে কোনো ওভারভিউ বক্স বা টেক্সট শো করবে না, একদম ফ্রেশ ফাঁকা পেজ হিসেবে তৈরি হবে।'
                      : 'Optional. Leave blank to create a clean empty page without any text or guidelines box.'
                  }
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* SEO Meta Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">
                    {lang === 'bn' ? 'মেটা টাইটেল (SEO Title)' : 'Meta Title'}
                  </label>
                  <input
                    type="text"
                    value={pageFormData.metaTitle}
                    onChange={(e) => setPageFormData({ ...pageFormData, metaTitle: e.target.value })}
                    placeholder="SEO Page Title"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">
                    {lang === 'bn' ? 'মেটা বিবরণ (Meta Description)' : 'Meta Description'}
                  </label>
                  <input
                    type="text"
                    value={pageFormData.metaDescription}
                    onChange={(e) => setPageFormData({ ...pageFormData, metaDescription: e.target.value })}
                    placeholder="Short SEO summary..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Options: Published & Auto Add to Menu */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pageFormData.isPublished}
                    onChange={(e) => setPageFormData({ ...pageFormData, isPublished: e.target.checked })}
                    className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-0 w-4 h-4"
                  />
                  <span className="text-slate-200 font-semibold">
                    {lang === 'bn'
                      ? 'পেজটি লাইভ প্রকাশিত রাখুন (Published)'
                      : 'Publish page live (viewable to public)'}
                  </span>
                </label>

                {!editingPage && (
                  <label className="flex items-center gap-2.5 cursor-pointer border-t border-slate-800/80 pt-2">
                    <input
                      type="checkbox"
                      checked={pageFormData.autoAddToMenu}
                      onChange={(e) => setPageFormData({ ...pageFormData, autoAddToMenu: e.target.checked })}
                      className="rounded border-slate-800 bg-slate-900 text-sky-500 focus:ring-0 w-4 h-4"
                    />
                    <span className="text-sky-300 font-semibold">
                      {lang === 'bn'
                        ? 'পেজ তৈরির সাথে সাথে শীর্ষ ন্যাভবার মেনুতেও লিংক যোগ করুন'
                        : 'Automatically add this page link to the Navbar Menu'}
                    </span>
                  </label>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPageModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPage}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                >
                  {isSubmittingPage && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {editingPage
                      ? lang === 'bn'
                        ? 'আপডেট করুন'
                        : 'Update Page'
                      : lang === 'bn'
                      ? 'পেজ সংরক্ষণ ও তৈরি করুন'
                      : 'Create & Save Page'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DELETE PAGE MODAL                                                      */}
      {/* ========================================================================= */}
      {deletingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {lang === 'bn' ? 'পেজ ডিলিট নিশ্চিত করুন' : 'Confirm Delete Page'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {deletingPage.title} (/page/{deletingPage.slug})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-2">
              <p>
                {lang === 'bn'
                  ? `আপনি কি নিশ্চিত যে আপনি "${deletingPage.title}" পেজটি স্থায়ীভাবে ডিলিট করতে চান?`
                  : `Are you sure you want to permanently delete page "${deletingPage.title}"?`}
              </p>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? '* ডিলিট করলে পাবলিকলি এই পেজ আর পাওয়া যাবে না (404 দেখাবে)।'
                  : '* Once deleted, visitors to this URL will see a 404 page.'}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPage(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeletePage}
                disabled={isSubmittingPage}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                {isSubmittingPage && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE & EDIT NAVBAR MENU / SUB-MENU MODAL                             */}
      {/* ========================================================================= */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingMenuItem
                      ? lang === 'bn'
                        ? 'মেনু আইটেম সম্পাদনা করুন'
                        : 'Edit Menu Item'
                      : menuFormData.parentId
                      ? lang === 'bn'
                        ? 'নতুন সাব-মেনু তৈরি করুন'
                        : 'Create New Sub-menu'
                      : lang === 'bn'
                      ? 'নতুন মূল মেনু তৈরি করুন'
                      : 'Create Main Menu Item'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {menuFormData.parentId
                      ? `Parent: ${
                          menuItems.find((m) => m.id === menuFormData.parentId)?.title ||
                          'Main Menu Item'
                        }`
                      : lang === 'bn'
                      ? 'শীর্ষ ন্যাভবারে প্রদর্শিত লিংক কনফিগার করুন'
                      : 'Configure header navigation link and nested sub-menus'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMenuModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs">
              {/* Parent Selection */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {lang === 'bn' ? 'মূল মেনু নির্বাচন (Parent Menu)' : 'Parent Menu'}
                </label>
                <select
                  value={menuFormData.parentId}
                  onChange={(e) =>
                    setMenuFormData({ ...menuFormData, parentId: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">
                    {lang === 'bn'
                      ? 'None (শীর্ষ মূল মেনু হিসেবে থাকবে)'
                      : 'None (Top-level Main Menu)'}
                  </option>
                  {menuItems
                    .filter(
                      (m) =>
                        !m.parentId &&
                        (!editingMenuItem || m.id !== editingMenuItem.id)
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.url})
                      </option>
                    ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {lang === 'bn'
                    ? 'সাব-মেনু তৈরি করতে কোনো মূল মেনু নির্বাচন করুন, অথবা মূল মেনুর জন্য খালি রাখুন।'
                    : 'Select a parent to make this a nested sub-menu, or leave empty for a main header item.'}
                </span>
              </div>

              {/* Title & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'bn' ? 'মেনুর নাম / শিরোনাম *' : 'Menu Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={menuFormData.title}
                    onChange={(e) =>
                      setMenuFormData({ ...menuFormData, title: e.target.value })
                    }
                    placeholder="e.g. Products, Offers, Blog"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'bn' ? 'টার্গেট লিঙ্ক / URL *' : 'Target URL *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={menuFormData.url}
                    onChange={(e) =>
                      setMenuFormData({ ...menuFormData, url: e.target.value })
                    }
                    placeholder="e.g. /products, /page/about-us or https://..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Quick URL Presets including created CMS pages */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'জনপ্রিয় লিঙ্ক প্রিসেট (ক্লিক করে বসান):' : 'Quick Link Presets (Click to insert):'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Home', url: '/' },
                    { label: 'Products', url: '/products' },
                    { label: 'Digital', url: '/digital-products' },
                    { label: 'Physical', url: '/physical-products' },
                    { label: 'Exchange', url: '/money-exchange' },
                    { label: 'Transactions', url: '/transactions' },
                    { label: 'Users', url: '/users' },
                    { label: 'Dispute Policy', url: '/dispute-policy' },
                  ].map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() =>
                        setMenuFormData({
                          ...menuFormData,
                          url: preset.url,
                          title: menuFormData.title || preset.label,
                        })
                      }
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-sky-900/40 text-slate-300 hover:text-sky-300 border border-slate-700/50 text-[10px] font-mono transition"
                    >
                      {preset.url}
                    </button>
                  ))}

                  {/* Created CMS pages pills: offer both direct /{slug} and /page/{slug} */}
                  {pages.map((p) => (
                    <div key={p.id} className="inline-flex rounded-lg overflow-hidden border border-emerald-800/60 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuFormData({
                            ...menuFormData,
                            url: `/${p.slug}`,
                            title: menuFormData.title || p.title,
                          })
                        }
                        className="px-2 py-0.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 transition"
                        title={lang === 'bn' ? `সরাসরি রুট: /${p.slug}` : `Direct route: /${p.slug}`}
                      >
                        📄 /{p.slug}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMenuFormData({
                            ...menuFormData,
                            url: `/page/${p.slug}`,
                            title: menuFormData.title || p.title,
                          })
                        }
                        className="px-1.5 py-0.5 bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-400 border-l border-emerald-800/60 text-[9px] transition"
                        title={lang === 'bn' ? `/page রুট: /page/${p.slug}` : `/page route: /page/${p.slug}`}
                      >
                        /page
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sort Order & External Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'bn' ? 'সিরিয়াল নম্বর (Sort Order)' : 'Sort Order'}
                  </label>
                  <input
                    type="number"
                    value={menuFormData.sortOrder}
                    onChange={(e) =>
                      setMenuFormData({
                        ...menuFormData,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {lang === 'bn' ? 'ছোট নম্বর আগে দেখাবে (0, 1, 2...)' : 'Lower number appears first'}
                  </span>
                </div>

                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuFormData.isExternal}
                      onChange={(e) =>
                        setMenuFormData({ ...menuFormData, isExternal: e.target.checked })
                      }
                      className="rounded border-slate-800 bg-slate-950 text-sky-600 focus:ring-0 w-4 h-4"
                    />
                    <span className="text-slate-300 font-semibold text-xs">
                      {lang === 'bn' ? 'নতুন ট্যাবে খুলবে (target="_blank")' : 'Open in New Tab'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuFormData.isActive}
                      onChange={(e) =>
                        setMenuFormData({ ...menuFormData, isActive: e.target.checked })
                      }
                      className="rounded border-slate-800 bg-slate-950 text-sky-600 focus:ring-0 w-4 h-4"
                    />
                    <span className="text-slate-300 font-semibold text-xs">
                      {lang === 'bn' ? 'সক্রিয় রাখুন (Active on Navbar)' : 'Active on Navbar'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMenu}
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-1.5"
                >
                  {isSubmittingMenu && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {editingMenuItem
                      ? lang === 'bn'
                        ? 'আপডেট করুন'
                        : 'Update Menu Item'
                      : lang === 'bn'
                      ? 'তৈরি করুন'
                      : 'Create Menu Item'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DELETE NAVBAR MENU / SUB-MENU MODAL                                     */}
      {/* ========================================================================= */}
      {deletingMenuItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-800 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {lang === 'bn' ? 'মেনু ডিলিট নিশ্চিত করুন' : 'Confirm Delete Menu Item'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {deletingMenuItem.title} ({deletingMenuItem.url})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-2">
              <p>
                {lang === 'bn'
                  ? `আপনি কি নিশ্চিত যে আপনি "${deletingMenuItem.title}" মেনু আইটেমটি ডিলিট করতে চান?`
                  : `Are you sure you want to delete menu item "${deletingMenuItem.title}"?`}
              </p>

              {deletingMenuItem.children && deletingMenuItem.children.length > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] font-semibold">
                  ⚠️ সতর্কতা: এই মূল মেনুর অধীনে থাকা{' '}
                  <span className="font-bold text-white">{deletingMenuItem.children.length}</span> টি
                  সাব-মেনুও সাথে সাথে মুছে যাবে!
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMenuItem(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteMenuItem}
                disabled={isSubmittingMenu}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                {isSubmittingMenu && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
