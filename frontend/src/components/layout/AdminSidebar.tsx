'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  ChevronLeft,
  Search,
  X,
  Sparkles,
  LayoutDashboard,
  Coins,
  MessageSquare,
  Package,
  Settings,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ChevronsUpDown,
  Home,
  LogOut,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { adminMenuRegistry, AdminMenuItem } from '@/config/adminMenuRegistry';

interface AdminSidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

interface CategoryMeta {
  key: string;
  labelEn: string;
  labelBn: string;
  icon: any;
}

const CATEGORY_DEFINITIONS: CategoryMeta[] = [
  {
    key: 'general',
    labelEn: 'Overview & Core',
    labelBn: 'ড্যাশবোর্ড ও ওভারভিউ',
    icon: LayoutDashboard,
  },
  {
    key: 'finance',
    labelEn: 'Finance & Escrow',
    labelBn: 'ফাইন্যান্স ও লেনদেন',
    icon: Coins,
  },
  {
    key: 'chat',
    labelEn: 'Support & Disputes',
    labelBn: 'চ্যাট, কল কিউ ও ডিসপুট',
    icon: MessageSquare,
  },
  {
    key: 'moderation',
    labelEn: 'Marketplace & Content',
    labelBn: 'মার্কেটপ্লেস ও কনটেন্ট',
    icon: Package,
  },
  {
    key: 'system',
    labelEn: 'System & Controls',
    labelBn: 'সিস্টেম ও কনফিগারেশন',
    icon: Settings,
  },
];

export const AdminSidebar = ({ onClose, isMobile = false }: AdminSidebarProps) => {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { user, isSuperAdmin, hasAdminPermission, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown section collapse state: key -> boolean (true = collapsed, false/undefined = expanded)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Toggle individual section dropdown
  const toggleSection = (catKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  // Toggle all sections at once
  const areAllCollapsed = useMemo(() => {
    return CATEGORY_DEFINITIONS.every((c) => !!collapsedSections[c.key]);
  }, [collapsedSections]);

  const handleToggleAllSections = () => {
    if (areAllCollapsed) {
      setCollapsedSections({}); // Expand all
    } else {
      const all: Record<string, boolean> = {};
      CATEGORY_DEFINITIONS.forEach((c) => {
        all[c.key] = true;
      });
      setCollapsedSections(all); // Collapse all
    }
  };

  // Filter menu links based on permissions
  const eligibleLinks = useMemo(() => {
    return adminMenuRegistry.filter((item) => {
      if (item.hideFromSidebar) {
        return false;
      }
      if (item.superAdminOnly) {
        return isSuperAdmin();
      }
      return hasAdminPermission(item.key);
    });
  }, [isSuperAdmin, hasAdminPermission]);

  // Apply search query filter
  const filteredLinks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return eligibleLinks;

    return eligibleLinks.filter((item) => {
      return (
        item.labelBn.toLowerCase().includes(q) ||
        item.labelEn.toLowerCase().includes(q) ||
        item.descriptionBn.toLowerCase().includes(q) ||
        item.descriptionEn.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q)
      );
    });
  }, [eligibleLinks, searchQuery]);

  // Group links by category
  const groupedCategories = useMemo(() => {
    return CATEGORY_DEFINITIONS.map((cat) => {
      const items = filteredLinks.filter((item) => {
        const itemCat = item.category || 'general';
        return itemCat === cat.key;
      });
      return {
        ...cat,
        items,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [filteredLinks]);

  return (
    <aside className="w-76 sm:w-80 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col h-full select-none shadow-2xl">
      {/* 1. FIXED TOP HEADER (BRANDING, SEARCH & ACCORDION TOGGLE) */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 space-y-3.5">
        {/* Branding & Mobile Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base text-white tracking-wide flex items-center gap-1.5">
                <span>SafnexBD Admin</span>
                {isSuperAdmin() && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    SUPER
                  </span>
                )}
              </div>
              <div className="text-xs text-amber-400/90 font-semibold tracking-wide">Control Center</div>
            </div>
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Search Box with Expand/Collapse Action */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'মেনু খুঁজুন...' : 'Search menus...'}
              className="w-full bg-slate-800/90 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700 focus:border-amber-500/80 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Collapse/Expand All Button */}
          {!searchQuery && (
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span className="font-medium text-slate-400">
                {groupedCategories.length} {lang === 'bn' ? 'টি বিভাগ' : 'sections'}
              </span>
              <button
                type="button"
                onClick={handleToggleAllSections}
                className="inline-flex items-center gap-1 text-amber-400/90 hover:text-amber-300 font-bold transition cursor-pointer"
              >
                <ChevronsUpDown className="w-3 h-3" />
                <span>
                  {areAllCollapsed
                    ? (lang === 'bn' ? 'সব বিভাগ খুলুন' : 'Expand all')
                    : (lang === 'bn' ? 'সব বিভাগ গুটিয়ে নিন' : 'Collapse all')}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. DEDICATED SCROLLABLE MENU BODY WITH SECTION DROPDOWNS */}
      <div
        className="flex-1 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/60 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full"
        style={{ scrollbarGutter: 'stable' }}
      >
        {filteredLinks.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2.5">
            <Search className="w-9 h-9 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">
              {lang === 'bn' ? 'কোনো মেনু পাওয়া যায়নি' : 'No menu item matches'}
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              {lang === 'bn' ? 'সার্চ ক্লিয়ার করুন' : 'Clear search filter'}
            </button>
          </div>
        ) : (
          groupedCategories.map((group) => {
            const GroupIcon = group.icon;
            const groupLabel = lang === 'bn' ? group.labelBn : group.labelEn;

            // Check if section is collapsed (forced expanded when search query is active)
            const isCollapsed = !searchQuery.trim() && !!collapsedSections[group.key];

            // Check if any link inside this section is currently active
            const hasActiveChild = group.items.some(
              (item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            );

            return (
              <div
                key={group.key}
                className="rounded-2xl border border-slate-800/80 bg-slate-850/40 overflow-hidden transition-colors"
              >
                {/* SECTION DROPDOWN BUTTON HEADER */}
                <button
                  type="button"
                  onClick={() => toggleSection(group.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    hasActiveChild
                      ? 'bg-slate-800/90 text-amber-400 border border-amber-500/25 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={
                    isCollapsed
                      ? (lang === 'bn' ? 'বিভাগ খুলতে ক্লিক করুন' : 'Click to expand section')
                      : (lang === 'bn' ? 'বিভাগ লুকাতে ক্লিক করুন' : 'Click to collapse section')
                  }
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1 rounded-lg ${
                        hasActiveChild
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <GroupIcon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <span className="truncate">{groupLabel}</span>
                    {hasActiveChild && isCollapsed && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"
                        title={lang === 'bn' ? 'এই বিভাগে সক্রিয় পেজ রয়েছে' : 'Active page in this section'}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold border border-slate-700/60">
                      {group.items.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isCollapsed
                          ? '-rotate-90 text-slate-500'
                          : 'rotate-0 text-amber-400'
                      }`}
                    />
                  </div>
                </button>

                {/* SECTION ITEMS (COLLAPSIBLE CONTENT) */}
                {!isCollapsed && (
                  <div className="p-1.5 space-y-1 transition-all duration-200 animate-in fade-in slide-in-from-top-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                      const label = lang === 'bn' ? item.labelBn : item.labelEn;

                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          onClick={() => onClose?.()}
                          className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500/25 via-amber-500/10 to-transparent text-amber-300 font-bold border-l-4 border-amber-400 shadow-xs'
                              : 'text-slate-200 hover:bg-slate-800/90 hover:text-white hover:pl-4'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon
                              className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-110 ${
                                isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                              }`}
                            />
                            <span className="truncate">{label}</span>
                          </div>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-xs shadow-amber-400/60" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. FIXED BOTTOM FOOTER (PERSISTENT AT BOTTOM) */}
      <div className="flex-shrink-0 p-3.5 border-t border-slate-800 bg-slate-900/95 backdrop-blur space-y-2.5">
        <Link
          href="/"
          onClick={() => onClose?.()}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 transition group shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <Home className="w-4.5 h-4.5 text-amber-400 transition-transform group-hover:scale-110" />
            <span>{lang === 'bn' ? 'হোম পেজে যান' : 'Go to Home Page'}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-70 group-hover:opacity-100" />
        </Link>

        {user && (
          <div className="flex items-center justify-between px-2 pt-0.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate font-bold text-white">{user.firstName || 'Admin'}</span>
            </div>
            <span className="text-[11px] text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md shrink-0">
              {isSuperAdmin() ? 'SUPER ADMIN' : 'STAFF'}
            </span>
          </div>
        )}

        {/* Logout Button */}
        <button
          type="button"
          onClick={() => {
            onClose?.();
            logout();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600/80 border border-rose-500/30 transition shadow-xs cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-rose-400 transition-transform group-hover:scale-110" />
            <span>{lang === 'bn' ? 'লগআউট করুন' : 'Logout'}</span>
          </div>
          <span className="text-[10px] text-rose-400/70 font-mono">ESC</span>
        </button>
      </div>
    </aside>
  );
};
