'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, { bn: string; en: string }> = {
  // Navigation & Header
  site_name: { bn: 'SafnexBD', en: 'SafnexBD' },
  site_tagline: { bn: 'নিরাপদ ট্রানজ্যাকশন মার্কেটপ্লেস', en: 'Safe Transaction Marketplace' },
  home: { bn: 'হোম', en: 'Home' },
  products: { bn: 'প্রোডাক্টস', en: 'Products' },
  digital_products: { bn: 'ডিজিটাল প্রোডাক্ট', en: 'Digital Products' },
  physical_products: { bn: 'ফিজিক্যাল গ্যাজেট', en: 'Physical Goods' },
  money_exchange: { bn: 'মানি এক্সচেঞ্জ', en: 'Money Exchange' },
  safe_transactions: { bn: 'নিরাপদ লেনদেন', en: 'Safe Transactions' },
  users: { bn: 'ইউজার খুঁজুন', en: 'Find Users' },
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  admin_panel: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel' },
  login: { bn: 'লগইন', en: 'Login' },
  register: { bn: 'রেজিস্ট্রেশন', en: 'Register' },
  logout: { bn: 'লগআউট', en: 'Logout' },
  guides: { bn: 'নির্দেশিকা ও টিউটোরিয়াল', en: 'Guides' },
  search_placeholder: { bn: 'প্রোডাক্ট, সার্ভিস বা ইউজার খুঁজুন...', en: 'Search products, services, users...' },

  // Wallet
  available_balance: { bn: 'অ্যাভেইলেবল ব্যালেন্স', en: 'Available Balance' },
  hold_balance: { bn: 'হোল্ড ব্যালেন্স', en: 'Hold Balance' },
  recharge: { bn: 'রিচার্জ', en: 'Recharge' },
  withdraw: { bn: 'উইথড্র', en: 'Withdraw' },
  wallet_ledger: { bn: 'ওয়ালেট লেজার', en: 'Wallet Ledger' },
  bdt_symbol: { bn: '৳', en: '৳' },

  // Actions & Buttons
  chat: { bn: 'চ্যাট করুন', en: 'Chat with Seller' },
  bid: { bn: 'বিড করুন', en: 'Place Bid' },
  pay_request: { bn: 'পে রিকোয়েস্ট', en: 'Pay Request' },
  receive_request: { bn: 'রিসিভ রিকোয়েস্ট', en: 'Receive Request' },
  approve: { bn: 'অনুমোদন করুন', en: 'Approve' },
  reject: { bn: 'বাতিল করুন', en: 'Reject' },
  work_time: { bn: 'কাজের সময় নির্ধারণ', en: 'Set Work Time' },
  work_done: { bn: 'কাজ সম্পন্ন হয়েছে', en: 'Submit Work Done' },
  call_admin: { bn: 'কল অ্যাডমিন (Dispute)', en: 'Call Admin (Dispute)' },
  save: { bn: 'সংরক্ষণ করুন', en: 'Save' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },

  // Sections
  how_it_works_title: { bn: 'নিরাপদ ট্রানজ্যাকশন কিভাবে কাজ করে?', en: 'How Safe Transaction Works?' },
  trust_safety_title: { bn: '১০০% নিরাপদ ও সুরক্ষিত এসক্রো মধ্যস্থতা', en: '100% Safe & Secure Escrow Mediation' },
  featured_categories: { bn: 'জনপ্রিয় ক্যাটাগরি', en: 'Popular Categories' },
  latest_products: { bn: 'সাম্প্রতিক প্রোডাক্ট ও সার্ভিস', en: 'Latest Products & Services' },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'bn',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('bn');

  useEffect(() => {
    const saved = (localStorage.getItem('safnexbd_lang') || localStorage.getItem('safnexbd_lang')) as Language;
    if (saved && (saved === 'bn' || saved === 'en')) {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('safnexbd_lang', newLang);
  };

  const toggleLang = () => {
    const newLang = lang === 'bn' ? 'en' : 'bn';
    handleSetLang(newLang);
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

