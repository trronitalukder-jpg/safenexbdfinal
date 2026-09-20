import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'bn' | 'en';

export const translations: Record<string, { bn: string; en: string }> = {
  // Navigation & Branding
  site_name: { bn: 'SafnexBD', en: 'SafnexBD' },
  site_tagline: { bn: 'নিরাপদ ট্রানজ্যাকশন মার্কেটপ্লেস', en: 'Safe Transaction Marketplace' },
  home: { bn: 'হোম', en: 'Home' },
  marketplace: { bn: 'মার্কেটপ্লেস', en: 'Marketplace' },
  products: { bn: 'প্রোডাক্টস', en: 'Products' },
  digital_products: { bn: 'ডিজিটাল প্রোডাক্টস', en: 'Digital Products' },
  physical_products: { bn: 'ফিজিক্যাল গ্যাজেট', en: 'Physical Goods' },
  money_exchange: { bn: 'মানি এক্সচেঞ্জ', en: 'Money Exchange' },
  safe_transactions: { bn: 'নিরাপদ লেনদেন', en: 'Safe Transactions' },
  transactions_hub: { bn: 'নিরাপদ লেনদেন হাব', en: 'Safe Transactions Hub' },
  users: { bn: 'ইউজার খুঁজুন', en: 'Find Users' },
  top_users: { bn: 'শীর্ষ ইউজার ও সেলার', en: 'Top Users & Sellers' },
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  my_dashboard: { bn: 'আমার ড্যাশবোর্ড', en: 'My Dashboard' },
  admin_panel: { bn: 'অ্যাডমিন প্যানেল', en: 'Admin Panel' },
  login: { bn: 'লগইন', en: 'Login' },
  register: { bn: 'রেজিস্ট্রেশন', en: 'Register' },
  logout: { bn: 'লগআউট', en: 'Logout' },
  guides: { bn: 'গাইডস ও নির্দেশিকা', en: 'Guides & Tutorials' },
  dispute_policy: { bn: 'বিরোধ নিষ্পত্তি নীতিমালা', en: 'Dispute & Refund Policy' },
  search_placeholder: { bn: 'প্রোডাক্ট বা সার্ভিস সার্চ করুন...', en: 'Search products or services...' },
  popular_categories: { bn: 'জনপ্রিয় ক্যাটাগরি', en: 'Popular Categories' },
  all: { bn: 'সকল', en: 'All' },
  all_categories: { bn: 'সব ক্যাটাগরি', en: 'All Categories' },

  // Wallet
  balance: { bn: 'ব্যালেন্স', en: 'Balance' },
  available_balance: { bn: 'অ্যাভেইলেবল ব্যালেন্স', en: 'Available Balance' },
  hold_balance: { bn: 'হোল্ড ব্যালেন্স', en: 'Hold Balance' },
  recharge: { bn: 'রিচার্জ', en: 'Recharge' },
  withdraw: { bn: 'উত্তোলন', en: 'Withdraw' },
  wallet_ledger: { bn: 'ওয়ালেট লেজার', en: 'Wallet Ledger' },
  wallet_history: { bn: 'ওয়ালেট ও হিস্ট্রি', en: 'Wallet & History' },
  bdt_symbol: { bn: '৳', en: '৳' },

  // Actions & Buttons
  chat: { bn: 'চ্যাট', en: 'Chat' },
  chat_with_seller: { bn: 'চ্যাট করুন', en: 'Chat Now' },
  bid: { bn: 'বিড করুন', en: 'Place Bid' },
  pay_request: { bn: 'পে রিকোয়েস্ট', en: 'Pay Request' },
  receive_request: { bn: 'রিসিভ রিকোয়েস্ট', en: 'Receive Request' },
  approve: { bn: 'অনুমোদন করুন', en: 'Approve' },
  reject: { bn: 'বাতিল করুন', en: 'Reject' },
  save: { bn: 'সংরক্ষণ করুন', en: 'Save' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },
  view_all: { bn: 'সবগুলো', en: 'View All' },
  learn_more: { bn: 'বিস্তারিত দেখুন', en: 'View Details' },
  my_products: { bn: 'আমার প্রোডাক্টসমূহ', en: 'My Products' },
  post_ad: { bn: 'নতুন বিজ্ঞাপন দিন', en: 'Post New Ad' },
  my_bids: { bn: 'আমার বিডস ও পজিশন', en: 'My Bids & Ranking' },
  my_disputes: { bn: 'আমার ডিসপ্যুট ক্লেইমস', en: 'My Dispute Claims' },
  messages: { bn: 'মেসেজ ও লাইভ চ্যাট', en: 'Messages & Live Chat' },

  // Settings & Theme
  settings: { bn: 'সেটিংস ও নিরাপত্তা', en: 'Settings & Security' },
  dark_mode: { bn: 'ডার্ক মোড', en: 'Dark Mode' },
  light_mode: { bn: 'লাইট মোড', en: 'Light Mode' },
  language: { bn: 'ভাষা (Language)', en: 'Language' },
  current_lang_badge: { bn: 'বাংলা', en: 'English' },
  customer_support: { bn: '২৪/৭ কাস্টমার সাপোর্ট', en: '24/7 Customer Support' },

  // Escrow & Home
  escrow_banner_title: { bn: '১০০% নিরাপদ এসক্রো প্ল্যাটফর্ম', en: '100% Secure Escrow Platform' },
  hero_title_fallback: { bn: 'নিরাপদ লেনদেন ও আধুনিক মার্কেটপ্লেস', en: 'Safe Transaction Marketplace & Escrow' },
  hero_sub_fallback: {
    bn: 'পণ্য বা সার্ভিস বুঝে পেয়ে টাকা ছাড়ুন। টাকা থাকবে সুরক্ষিত Hold ব্যালেন্সে। কোনো প্রতারণার সুযোগ নেই।',
    en: 'Pay with peace of mind. Funds stay locked in Escrow Hold balance until delivery is confirmed.',
  },
  escrow_protection_title: { bn: 'এসক্রো লেনদেন সুরক্ষা', en: 'Escrow Protection Flow' },
  step_1_title: { bn: 'চ্যাটে কথা বলে অফার ঠিক করুন', en: 'Chat & Agree on Price' },
  step_1_desc: { bn: 'সরাসরি চ্যাটে Pay বা Receive রিকোয়েস্ট পাঠান', en: 'Direct one-to-one negotiation' },
  step_2_title: { bn: 'টাকা থাকবে Hold ব্যালেন্সে', en: 'Funds Secured in Hold Balance' },
  step_2_desc: { bn: 'কাজ চলাকালীন সেলার বা বায়ার কেউ টাকা তুলতে পারবে না', en: 'Locked safely under system escrow' },
  step_3_title: { bn: 'কাজ শেষ হলে নিশ্চিত করে রিলিজ', en: 'Approve Work & Release Money' },
  step_3_desc: { bn: 'কোনো বিরোধ হলে Call Admin দিয়ে ২৪/৭ সাপোর্ট নিন', en: 'Dispute mediation available 24/7' },
  zero_fraud_guarantee: { bn: 'জিরো ফ্রড গ্যারান্টি ও সেন্ট্রালাইজড লেজার', en: 'Zero Fraud Guarantee & Centralized Ledger' },
  welcome_guest: { bn: 'SafnexBD তে স্বাগতম', en: 'Welcome to SafnexBD' },
  welcome_guest_sub: {
    bn: '১০০% নিরাপদ এস্ক্রো কেনাবেচা, বিজ্ঞাপন দেওয়া ও মেসেজিং শুরু করতে অ্যাকাউন্টে প্রবেশ করুন।',
    en: 'Log in to start 100% secure escrow transactions, posting ads, and messaging.',
  },
  deals_count: { bn: 'সম্পন্ন ডিল', en: 'Deals' },
  products_count: { bn: 'সক্রিয় প্রোডাক্ট', en: 'Products' },
};

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => Promise<void>;
  toggleLang: () => Promise<void>;
  loadLang: () => Promise<void>;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: 'bn', // Default to Bengali

  setLang: async (newLang: Language) => {
    set({ lang: newLang });
    try {
      await AsyncStorage.setItem('safnexbd_mobile_lang', newLang);
    } catch {}
  },

  toggleLang: async () => {
    const nextLang = get().lang === 'bn' ? 'en' : 'bn';
    set({ lang: nextLang });
    try {
      await AsyncStorage.setItem('safnexbd_mobile_lang', nextLang);
    } catch {}
  },

  loadLang: async () => {
    try {
      const stored = await AsyncStorage.getItem('safnexbd_mobile_lang');
      if (stored === 'bn' || stored === 'en') {
        set({ lang: stored });
      }
    } catch {}
  },

  t: (key: string): string => {
    const currentLang = get().lang;
    if (translations[key] && translations[key][currentLang]) {
      return translations[key][currentLang];
    }
    return key;
  },
}));

