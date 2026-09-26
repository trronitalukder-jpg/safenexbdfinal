'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Wallet,
  User,
  LogOut,
  Moon,
  Sun,
  Globe,
  Menu as MenuIcon,
  X,
  PlusCircle,
  MessageSquare,
  Package,
  Layers,
  ChevronDown,
  Sparkles,
  BookOpen,
  Home,
  Cpu,
  Coins,
  Users,
  Scale,
  Info,
  Store,
  Briefcase,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, refreshMe, isAdmin } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { settings } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [navMenus, setNavMenus] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mobileExpandedMenuId, setMobileExpandedMenuId] = useState<string | null>(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(true);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    refreshMe();
    api.get('/categories/tree')
      .then((res: any) => {
        const data = res && res.data !== undefined ? res.data : res;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => setCategories([]));

    api.get('/cms/menus/HEADER')
      .then((res: any) => {
        const data = res && res.data !== undefined ? res.data : res;
        if (data?.items && Array.isArray(data.items)) {
          setNavMenus(data.items.filter((item: any) => item.isActive !== false));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Notice / Announcement Banner if enabled */}
      {settings.footer.noticeBarEnabled && settings.footer.noticeBarText && (
        <div className="bg-gradient-to-r from-amber-600 via-sky-600 to-indigo-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-200" />
          <span>{settings.footer.noticeBarText}</span>
        </div>
      )}

      {/* Top Banner / Trust Bar */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 text-xs py-1 px-4 text-center flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-1.5 mx-auto md:mx-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('trust_safety_title')}</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-slate-400">
          {settings.footer.supportPhone && (
            <a
              href={`tel:${settings.footer.supportPhone.replace(/\s+/g, '')}`}
              className="hover:text-white transition"
            >
              {lang === 'bn'
                ? `সাপোর্ট: ${settings.footer.supportPhone}`
                : `Support: ${settings.footer.supportPhone}`}
            </a>
          )}
          <span>{lang === 'bn' ? '২৪/৭ এসক্রো মধ্যস্থতা' : '24/7 Escrow Protection'}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1650px] w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
            {(settings.general.logoType === 'IMAGE_URL' || settings.general.logoType === 'IMAGE_UPLOAD') &&
            (settings.general.logoLightUrl || settings.general.logoDarkUrl) ? (
              <img
                src={getImageUrl(
                  theme === 'dark' && settings.general.logoDarkUrl
                    ? settings.general.logoDarkUrl
                    : settings.general.logoLightUrl || settings.general.logoDarkUrl
                )}
                alt={settings.general.siteName || 'Logo'}
                className="h-8 sm:h-10 w-auto max-w-[125px] sm:max-w-[170px] object-contain"
              />
            ) : settings.general.logoType === 'TEXT' ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div
                    className="text-lg sm:text-2xl font-black tracking-tight truncate"
                    style={{ color: settings.general.logoAccent || undefined }}
                  >
                    {settings.general.logoText || settings.general.siteName || 'SafnexBD'}
                  </div>
                  <p className="hidden md:block text-xs text-slate-700 dark:text-slate-300 font-medium tracking-wide truncate">
                    {settings.general.siteTagline || t('site_tagline')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                    Safnex<span className="text-sky-500">BD</span>
                  </div>
                  <p className="hidden md:block text-xs text-slate-700 dark:text-slate-300 font-medium tracking-wide truncate">
                    {settings.general.siteTagline || t('site_tagline')}
                  </p>
                </div>
              </div>
            )}
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full border border-transparent focus:border-sky-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </form>

          {/* Right Controls: Theme, Lang, Wallet, Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 ml-auto md:ml-0">
            {/* Micro Jobs Link Button (Desktop Header) */}
            {settings.microJob?.enabled !== false && (
              <Link
                href="/micro-jobs"
                title={lang === 'bn' ? 'মাইক্রো জব (কাজ ও আয়)' : 'Micro Jobs (Work & Earn)'}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-slate-950 transition shadow-xs flex-shrink-0"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'মাইক্রো জব' : 'Micro Jobs'}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-amber-500 text-white leading-none">
                  HOT
                </span>
              </Link>
            )}

            {/* Guides Link Button (Desktop) */}
            <Link
              href="/guides"
              title={lang === 'bn' ? 'ব্যবহারবিধি ও ভিডিও নির্দেশিকা' : 'Guides & Video Instructions'}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 transition shadow-xs flex-shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'গাইডস' : 'Guides'}</span>
            </Link>

            {/* Scammer & Trust Checker Button (Hidden on mobile header to prevent overflow) */}
            {settings?.system?.scammerCheckerEnabled !== false && (
              <Link
                href="/check"
                title={lang === 'bn' ? 'স্ক্যামার ও ট্রাস্ট চেকার' : 'Scammer & Trust Checker'}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-slate-950 transition shadow-xs flex-shrink-0"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{lang === 'bn' ? 'স্ক্যামার চেকার' : 'Trust Check'}</span>
              </Link>
            )}

            {/* Language Switch (Desktop) */}
            <button
              onClick={toggleLang}
              title="Toggle Language"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex-shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Theme Toggle (Desktop) */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className="hidden md:flex p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex-shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Desktop User Menu Dropdown */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={getImageUrl(user.avatarUrl)}
                        alt={user.firstName}
                        className="w-8 h-8 rounded-full object-cover border border-sky-500/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                        {user.firstName ? user.firstName.charAt(0) : 'U'}
                      </div>
                    )}
                    <div className="text-left text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{user.firstName}</div>
                      <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">{user.uniqueUserId}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                      <div
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in"
                      >
                        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2.5">
                            {user.avatarUrl ? (
                              <img
                                src={getImageUrl(user.avatarUrl)}
                                alt={user.firstName}
                                className="w-9 h-9 rounded-full object-cover border border-sky-500/30 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {user.firstName ? user.firstName.charAt(0) : 'U'}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.firstName} {user.lastName}</p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-mono font-medium truncate">@{user.uniqueUserId}</p>
                                {isAdmin() && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Admin</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="py-1">
                          {/* If Admin: Admin Panel */}
                          {isAdmin() && (
                            <Link
                              href="/admin"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-500" />
                              <span>{t('admin_panel')}</span>
                            </Link>
                          )}

                          {/* User Panel (Only for regular users) */}
                          {!isAdmin() && (
                            <Link
                              href="/dashboard"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                            >
                              <Layers className="w-4 h-4 text-sky-500" />
                              <span>{lang === 'bn' ? 'ইউজার প্যানেল' : 'User Panel'}</span>
                            </Link>
                          )}

                          {/* Dispute Resolution Policy */}
                          <Link
                            href="/dispute-policy"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                          >
                            <Scale className="w-4 h-4 text-indigo-500" />
                            <span>{lang === 'bn' ? 'বিরোধ নিষ্পত্তি নীতি' : 'Dispute Resolution Policy'}</span>
                          </Link>

                          {/* About SafnexBD */}
                          <Link
                            href="/about-us"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                          >
                            <Info className="w-4 h-4 text-sky-500" />
                            <span>{lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About SafnexBD'}</span>
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                          <button
                            onClick={() => {
                              logout();
                              setUserDropdownOpen(false);
                              router.push('/login');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t('logout')}</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile Header Controls: Search, Auth/User Panel, Hamburger */}
            <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
              {/* Mobile Search Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen);
                  if (mobileMenuOpen) setMobileMenuOpen(false);
                }}
                className={`p-2 sm:p-2.5 rounded-xl transition flex-shrink-0 border shadow-xs active:scale-95 ${
                  mobileSearchOpen
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label="Search"
                title={lang === 'bn' ? 'অনুসন্ধান' : 'Search'}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Mobile User Panel / Auth Controls */}
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 shadow-xs hover:bg-sky-100 transition active:scale-95 flex-shrink-0"
                  title={lang === 'bn' ? 'ইউজার প্যানেল' : 'User Panel'}
                >
                  {user.avatarUrl ? (
                    <img
                      src={getImageUrl(user.avatarUrl)}
                      alt={user.firstName}
                      className="w-6 h-6 rounded-full object-cover border border-sky-500/50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {user.firstName ? user.firstName.charAt(0) : 'U'}
                    </div>
                  )}
                  <span className="text-[11px] font-bold hidden xs:inline">{lang === 'bn' ? 'প্যানেল' : 'Panel'}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/login"
                    className="px-2 sm:px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 transition"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    className="px-2 sm:px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Menu Button (Always visible on mobile on the far right) */}
              <button
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  if (mobileSearchOpen) setMobileSearchOpen(false);
                }}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex-shrink-0 border border-slate-200 dark:border-slate-700/80 shadow-xs active:scale-95"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 text-rose-500" /> : <MenuIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 animate-in slide-in-from-top-1 duration-150">
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setMobileSearchOpen(false);
              }}
              className="relative flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  autoFocus
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:outline-none transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex-shrink-0"
              >
                {lang === 'bn' ? 'খুঁজুন' : 'Search'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Navigation Links Bar */}
      <nav className="hidden md:block bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-sm">
        <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-11">
          {/* Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-600"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('featured_categories')}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {catDropdownOpen && (
              <div
                onMouseLeave={() => setCatDropdownOpen(false)}
                className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50"
              >
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.slug}`}
                    onClick={() => setCatDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200"
                  >
                    <span>{c.name}</span>
                    {c.children?.length > 0 && <span className="text-[10px] text-slate-400">({c.children.length})</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Menus or Fallback */}
          {navMenus.length > 0 ? (
            <>
              {navMenus.map((item) => {
                const activeChildren = (item.children || []).filter((c: any) => c.isActive !== false);
                const hasChildren = activeChildren.length > 0;

                if (hasChildren) {
                  return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => setOpenMenuId(item.id)}
                      onMouseLeave={() => setOpenMenuId(null)}
                    >
                      <div className="flex items-center gap-1">
                        <Link
                          href={item.url}
                          target={item.isExternal ? '_blank' : undefined}
                          className="font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition py-1"
                        >
                          {item.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          className="text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 p-0.5"
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform ${openMenuId === item.id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {openMenuId === item.id && (
                        <div className="absolute left-0 mt-1 min-w-[190px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                          {activeChildren.map((sub: any) => (
                            <Link
                              key={sub.id}
                              href={sub.url}
                              target={sub.isExternal ? '_blank' : undefined}
                              onClick={() => setOpenMenuId(null)}
                              className="flex items-center justify-between px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition"
                            >
                              <span>{sub.title}</span>
                              {sub.isExternal && <span className="text-[10px] text-slate-400">↗</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.isExternal ? '_blank' : undefined}
                    className="font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition py-1"
                  >
                    {item.title}
                  </Link>
                );
              })}
              {settings.microJob?.enabled !== false && (
                <Link
                  href="/micro-jobs"
                  className="font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'bn' ? 'মাইক্রো জব' : 'Micro Jobs'}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-extrabold bg-amber-500 text-white">
                    HOT
                  </span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/shop" className="font-semibold text-slate-800 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 transition flex items-center gap-1">
                <span>{lang === 'bn' ? 'শপ (SHOP)' : 'SHOP'}</span>
              </Link>
              <Link href="/digital-products" className="font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition">
                {t('digital_products')}
              </Link>
              <Link href="/physical-products" className="font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition">
                {t('physical_products')}
              </Link>
              <Link href="/money-exchange" className="font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition">
                {t('money_exchange')}
              </Link>
              <Link href="/transactions" className="font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition">
                {t('safe_transactions')}
              </Link>
              {settings.microJob?.enabled !== false && (
                <Link
                  href="/micro-jobs"
                  className="font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'bn' ? 'মাইক্রো জব' : 'Micro Jobs'}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Hot
                  </span>
                </Link>
              )}
              <Link href="/users" className="font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition">
                {t('users')}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[calc(100vh-4.5rem)] overflow-y-auto overscroll-contain px-4 pt-3 pb-24 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* Top Section: Language Switch & Dark/Light Toggle + Search */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              {/* Language Switch */}
              <button
                type="button"
                onClick={toggleLang}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-sky-500 transition shadow-xs active:scale-98"
              >
                <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>{lang === 'bn' ? 'বাংলা (BN)' : 'English (EN)'}</span>
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 hover:border-sky-500 transition shadow-xs active:scale-98"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'bn' ? 'লাইট মোড' : 'Light Mode'}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-600" />
                    <span>{lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Search Bar */}
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setMobileMenuOpen(false);
              }}
              className="relative"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:border-sky-500 focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            </form>
          </div>

          {/* CMS Dynamic Menus (If configured by Admin) */}
          {navMenus.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-1">
              <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider px-2 mb-1">
                {lang === 'bn' ? 'কাস্টম মেনু' : 'Custom Menus'}
              </div>
              {navMenus.map((item) => {
                const activeChildren = (item.children || []).filter((c: any) => c.isActive !== false);
                const hasChildren = activeChildren.length > 0;
                const isExpanded = mobileExpandedMenuId === item.id;

                if (hasChildren) {
                  return (
                    <div key={item.id} className="rounded-xl overflow-hidden bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setMobileExpandedMenuId(isExpanded ? null : item.id)}
                        className="w-full flex items-center justify-between py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                      >
                        <span>{item.title}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-sky-500' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-2 pt-1 space-y-1 border-t border-slate-100 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60">
                          <Link
                            href={item.url}
                            target={item.isExternal ? '_blank' : undefined}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block py-1.5 px-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            {lang === 'bn' ? `${item.title} দেখুন` : `View ${item.title}`}
                          </Link>
                          {activeChildren.map((sub: any) => (
                            <Link
                              key={sub.id}
                              href={sub.url}
                              target={sub.isExternal ? '_blank' : undefined}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center justify-between py-1.5 px-2 text-xs text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition"
                            >
                              <span>{sub.title}</span>
                              {sub.isExternal && <span className="text-[10px] text-slate-400">↗</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.isExternal ? '_blank' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
                  >
                    <span>{item.title}</span>
                    {item.isExternal && <span className="text-[10px] text-slate-400">↗</span>}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Primary Navigation Menu */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
              {lang === 'bn' ? 'সকল সার্ভিস ও নেভিগেশন' : 'All Services & Navigation'}
            </div>

            {/* Home */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <Home className="w-4 h-4 text-sky-500" />
              <span>{t('home')}</span>
            </Link>

            {/* Shop (SHOP) */}
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold transition border border-amber-500/20"
            >
              <Store className="w-4 h-4 text-amber-500" />
              <span>{lang === 'bn' ? 'শপ (SHOP)' : 'SHOP'}</span>
            </Link>

            {/* Popular Categories (Dynamic Accordion with Subcategories) */}
            <div className="rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                className="w-full flex items-center justify-between py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>{t('featured_categories')}</span>
                  {categories.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                      {categories.length}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    mobileCategoriesOpen ? 'rotate-180 text-indigo-500' : ''
                  }`}
                />
              </button>

              {mobileCategoriesOpen && (
                <div className="px-3 pb-2.5 pt-1 space-y-1 border-t border-slate-100 dark:border-slate-800/60">
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <div key={c.id} className="space-y-0.5">
                        <Link
                          href={`/products?category=${c.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 transition"
                        >
                          <span>{c.name}</span>
                          {c.children?.length > 0 && (
                            <span className="text-[10px] text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.5 rounded-full">
                              {c.children.length}
                            </span>
                          )}
                        </Link>
                        {c.children?.length > 0 && (
                          <div className="pl-4 space-y-0.5 border-l border-slate-200 dark:border-slate-700 ml-3 my-0.5">
                            {c.children.map((sub: any) => (
                              <Link
                                key={sub.id}
                                href={`/products?category=${sub.slug}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-1 px-2.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                              >
                                • {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-400">
                      {lang === 'bn' ? 'কোনো ক্যাটাগরি পাওয়া যায়নি' : 'No categories found'}
                    </div>
                  )}
                  <Link
                    href="/shop"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline pt-1 border-t border-slate-100 dark:border-slate-800 mt-1"
                  >
                    {lang === 'bn' ? 'সব ক্যাটাগরি ও প্রোডাক্ট দেখুন →' : 'View All Categories & Products →'}
                  </Link>
                </div>
              )}
            </div>

            {/* Digital Products */}
            <Link
              href="/digital-products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <Cpu className="w-4 h-4 text-violet-500" />
              <span>{t('digital_products')}</span>
            </Link>

            {/* Physical Products */}
            <Link
              href="/physical-products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <Package className="w-4 h-4 text-amber-500" />
              <span>{t('physical_products')}</span>
            </Link>

            {/* Money Exchange */}
            <Link
              href="/money-exchange"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <Coins className="w-4 h-4 text-emerald-500" />
              <span>{t('money_exchange')}</span>
            </Link>

            {/* Safe Transactions */}
            <Link
              href="/transactions"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <span>{t('safe_transactions')}</span>
            </Link>

            {/* Micro Jobs */}
            {settings.microJob?.enabled !== false && (
              <Link
                href="/micro-jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold transition border border-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'মাইক্রো জব (কাজ ও আয়)' : 'Micro Jobs (Work & Earn)'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-black">
                  HOT
                </span>
              </Link>
            )}

            {/* Scammer & Trust Checker (Mobile Drawer) */}
            {settings?.system?.scammerCheckerEnabled !== false && (
              <Link
                href="/check"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between py-2 px-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold transition border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>{lang === 'bn' ? 'স্ক্যামার ও ট্রাস্ট চেকার' : 'Scammer & Trust Checker'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-black">
                  NEW
                </span>
              </Link>
            )}

            {/* Users */}
            <Link
              href="/users"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span>{t('users')}</span>
            </Link>

            {/* Guides (Highlighted) */}
            <Link
              href="/guides"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 text-xs sm:text-sm font-bold transition hover:bg-sky-100 dark:hover:bg-sky-900/50 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" />
                <span>{lang === 'bn' ? 'নির্দেশিকা ও টিউটোরিয়াল' : 'Guides & Tutorials'}</span>
              </div>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950">
                {lang === 'bn' ? 'গাইড' : 'HELP'}
              </span>
            </Link>

          </div>

          {/* Bottom Section: User Dashboard & Account Area */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2">
              {lang === 'bn' ? 'অ্যাকাউন্ট ও প্যানেল' : 'Account & Panels'}
            </div>

            {user ? (
              <div className="space-y-2">
                {/* User Info Card */}
                <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img
                        src={getImageUrl(user.avatarUrl)}
                        alt={user.firstName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-sky-500 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                        {user.firstName ? user.firstName.charAt(0) : 'U'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-sky-600 dark:text-sky-400 font-mono font-medium truncate">
                          @{user.uniqueUserId}
                        </span>
                        {isAdmin() && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Admin</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Action Items */}
                <div className="space-y-1">
                  {/* If Admin: Admin Panel */}
                  {isAdmin() && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs sm:text-sm transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>{t('admin_panel')}</span>
                    </Link>
                  )}

                  {/* User Panel (Only for regular users) */}
                  {!isAdmin() && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium transition"
                    >
                      <Layers className="w-4 h-4 text-sky-500" />
                      <span>{lang === 'bn' ? 'ইউজার প্যানেল' : 'User Panel'}</span>
                    </Link>
                  )}

                  {/* Dispute Resolution Policy */}
                  <Link
                    href="/dispute-policy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium transition"
                  >
                    <Scale className="w-4 h-4 text-indigo-500" />
                    <span>{lang === 'bn' ? 'বিরোধ নিষ্পত্তি নীতি' : 'Dispute Resolution Policy'}</span>
                  </Link>

                  {/* About SafnexBD */}
                  <Link
                    href="/about-us"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium transition"
                  >
                    <Info className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About SafnexBD'}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-3 py-2.5 px-3 text-rose-600 dark:text-rose-400 font-semibold text-xs sm:text-sm rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition text-center"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition text-center"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

