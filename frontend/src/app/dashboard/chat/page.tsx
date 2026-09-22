'use client';

import React, { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCheck,
  Plus,
  Search,
  Info,
  X,
  ArrowLeft,
  MoreVertical,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Upload,
  RefreshCw,
  Smile,
  AlertTriangle,
  User,
  Shield,
  ShieldAlert,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Users,
  RotateCcw,
  Bell,
  HelpCircle,
  Lock,
  AlertCircle,
  BookOpen,
  Scale,
  PhoneCall,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { trackEvent } from '@/lib/tracking';
import { getImageUrl, compressImage } from '@/lib/imageUtils';

// Helper to safely unwrap api.ts responses
function unwrap<T = any>(res: any): T {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data;
  }
  return res;
}

const bannerThemeStyles: Record<string, { bg: string; border: string; badge: string; text: string; link: string; iconBg: string }> = {
  amber: {
    bg: 'bg-amber-500/8 dark:bg-amber-950/20',
    border: 'border-amber-500/30 dark:border-amber-500/20',
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/20',
    text: 'text-amber-900 dark:text-amber-200',
    link: 'text-amber-700 dark:text-amber-400 hover:text-amber-800',
    iconBg: 'bg-amber-500/10 text-amber-600',
  },
  emerald: {
    bg: 'bg-emerald-500/8 dark:bg-emerald-950/20',
    border: 'border-emerald-500/30 dark:border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
    text: 'text-emerald-900 dark:text-emerald-200',
    link: 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
  },
  blue: {
    bg: 'bg-blue-500/8 dark:bg-blue-950/20',
    border: 'border-blue-500/30 dark:border-blue-500/20',
    badge: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/20',
    text: 'text-blue-900 dark:text-blue-200',
    link: 'text-blue-700 dark:text-blue-400 hover:text-blue-800',
    iconBg: 'bg-blue-500/10 text-blue-600',
  },
  purple: {
    bg: 'bg-purple-500/8 dark:bg-purple-950/20',
    border: 'border-purple-500/30 dark:border-purple-500/20',
    badge: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/20',
    text: 'text-purple-900 dark:text-purple-200',
    link: 'text-purple-700 dark:text-purple-400 hover:text-purple-800',
    iconBg: 'bg-purple-500/10 text-purple-600',
  },
  rose: {
    bg: 'bg-rose-500/8 dark:bg-rose-950/20',
    border: 'border-rose-500/30 dark:border-rose-500/20',
    badge: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/20',
    text: 'text-rose-900 dark:text-rose-200',
    link: 'text-rose-700 dark:text-rose-400 hover:text-rose-800',
    iconBg: 'bg-rose-500/10 text-rose-600',
  },
};

function MessengerChatContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('targetUserId');
  const productId = searchParams.get('productId');
  const conversationIdParam = searchParams.get('conversationId');
  const { user } = useAuthStore();
  const { lang, t } = useLanguage();
  const socket = getSocket();

  // Navigation states
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [activeHeaderTab, setActiveHeaderTab] = useState<'chat' | 'transaction' | 'rules' | 'admin_calling'>('chat');
  const [isUserListCollapsed, setIsUserListCollapsed] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Conversations & People
  const [conversations, setConversations] = useState<any[]>([]);
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0);
  }, [conversations]);
  const [suggestedPeople, setSuggestedPeople] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Chat stream
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isConvLocked, setIsConvLocked] = useState(false);
  const [convLockReason, setConvLockReason] = useState<string | null>(null);

  // AI Real-Time Safety Warnings & Smart Deal State
  const [safetyAlerts, setSafetyAlerts] = useState<any[]>([]);
  const [smartDealProposal, setSmartDealProposal] = useState<{
    title: string;
    amount: number;
    senderId?: string;
  } | null>(null);

  // Chat Safety Rules & Quick Message Templates State
  const [chatRulesConfig, setChatRulesConfig] = useState<any>({
    isEnabled: true,
    banner: {
      title: 'SafnexBD অফিসিয়াল সুরক্ষা ও লেনদেন গাইডলাইন',
      subtitle: 'প্রতারণা এড়াতে এবং আপনার লেনদেন শতভাগ নিরাপদ রাখতে নিচের নিয়মগুলো মনোযোগ দিয়ে পড়ুন:',
      theme: 'amber',
      badgeText: 'অফিসিয়াল সিকিউরিটি রুলস',
      rules: [
        {
          id: '1',
          icon: '🛡️',
          title: 'প্ল্যাটফর্মের বাইরে কোনো লেনদেন করবেন না',
          desc: 'ব্যক্তিগত বিকাশ/নগদ বা অফলাইনে লেনদেন করলে SafnexBD কোনো দায়ভার বহন করবে না।',
        },
        {
          id: '2',
          icon: '🔒',
          title: 'এসক্রো সিস্টেমে টাকা ১০০% নিরাপদ',
          desc: 'লেনদেনের টাকা প্ল্যাটফর্মের হোল্ডে সুরক্ষিত থাকে, কাজ বা পণ্য বুঝে পাওয়ার পরেই কেবল টাকা রিলিজ হবে।',
        },
        {
          id: '3',
          icon: '📦',
          title: 'কাজের প্রমাণ ও ডেলিভারি নিশ্চিত করুন',
          desc: 'সবকিছু সঠিকভাবে সম্পন্ন হলে পেমেন্ট রিলিজ করবেন, কোনো সমস্যা বা অমিল থাকলে সাথে সাথে ডিসপ্যুট ওপেন করুন।',
        },
        {
          id: '4',
          icon: '⚠️',
          title: 'গোপনীয় তথ্য কখনোই শেয়ার করবেন না',
          desc: 'আপনার অ্যাকাউন্ট পাসওয়ার্ড, পিন কোড, ওটিপি বা ব্যাংক সিকিউরিটি তথ্য কারো সাথে শেয়ার করবেন না।',
        },
      ],
    },
    templates: [
      {
        id: '1',
        target: 'ALL',
        icon: '👋',
        title: 'সালাম ও কুশল',
        text: 'আসসালামু আলাইকুম, কেমন আছেন? আপনার পণ্য বা সার্ভিস সম্পর্কে কিছু তথ্য জানতে চাচ্ছিলাম।',
      },
      {
        id: '2',
        target: 'BUYER',
        icon: '🛍️',
        title: 'স্টক যাচাই',
        text: 'পণ্যটি কি এখনো অ্যাভেইলেবল আছে? আমি কিনতে আগ্রহী।',
      },
      {
        id: '3',
        target: 'BUYER',
        icon: '💰',
        title: 'দাম আলোচনা',
        text: 'পণ্যটির শেষ বা ফিক্সড প্রাইস কত রাখা যাবে? কিছু ডিসকাউন্ট দেওয়া সম্ভব কি?',
      },
      {
        id: '4',
        target: 'BUYER',
        icon: '⏳',
        title: 'ডেলিভারি সময়',
        text: 'অর্ডার কনফার্ম করার পর কতক্ষণের মধ্যে ডেলিভারি বা কাজ হস্তান্তর করতে পারবেন?',
      },
      {
        id: '5',
        target: 'SELLER',
        icon: '✅',
        title: 'প্রোডাক্ট প্রস্তুত',
        text: 'জি, পণ্যটি সম্পূর্ণ প্রস্তুত আছে। আপনি এখনই এসক্রো পেমেন্ট রিকোয়েস্ট একসেপ্ট করতে পারেন।',
      },
      {
        id: '6',
        target: 'SELLER',
        icon: '💳',
        title: 'পেমেন্ট রিকোয়েস্ট',
        text: 'আমি চ্যাটে অফিসিয়াল পেমেন্ট রিকোয়েস্ট পাঠিয়েছি, অনুগ্রহ করে একসেপ্ট করে টাকা হোল্ডে রাখুন।',
      },
      {
        id: '7',
        target: 'SELLER',
        icon: '🚀',
        title: 'কাজ সম্পন্ন',
        text: 'আপনার কাজটি সফলভাবে সম্পন্ন হয়েছে এবং প্রয়োজনীয় ফাইল পাঠানো হয়েছে। অনুগ্রহ করে চেক করে পেমেন্ট রিলিজ করুন।',
      },
      {
        id: '8',
        target: 'ALL',
        icon: '🤝',
        title: 'ধন্যবাদ',
        text: 'আপনার চমৎকার সহযোগিতার জন্য ধন্যবাদ। আশা করি আবার লেনদেন হবে!',
      },
    ],
  });
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [templateAudienceFilter, setTemplateAudienceFilter] = useState<'ALL' | 'BUYER' | 'SELLER'>('ALL');
  const [showTemplatesBar, setShowTemplatesBar] = useState(true);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Wallet
  const [wallet, setWallet] = useState<{ availableBalance: number; holdBalance: number } | null>(null);

  // Modals & Popovers
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState<any>(null);
  const [profileModalDetails, setProfileModalDetails] = useState<any>(null);
  const [loadingProfileModal, setLoadingProfileModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (showProfileModal) {
      setProfileModalDetails(null);
      const identifier = showProfileModal.uniqueUserId || showProfileModal.id;
      if (identifier) {
        setLoadingProfileModal(true);
        api.get(`/users/profile/${identifier}`)
          .then((res: any) => setProfileModalDetails(res))
          .catch(() => setProfileModalDetails(null))
          .finally(() => setLoadingProfileModal(false));
      }
    }
  }, [showProfileModal]);
  const [showDisputeModal, setShowDisputeModal] = useState<any>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Form states
  const [payAmount, setPayAmount] = useState('');
  const [payCommission, setPayCommission] = useState(0);
  const [payReason, setPayReason] = useState('Service Payment');
  const [txCommissionSetting, setTxCommissionSetting] = useState<{
    rateType: 'PERCENTAGE' | 'FLAT';
    value: number;
    isActive: boolean;
    minFee?: number;
    maxFee?: number;
  } | null>(null);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('Service Payment');
  const [disputeReason, setDisputeReason] = useState('Service not delivered');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Load Wallet & Commission Settings
  // ---------------------------------------------------------------------------
  const fetchWallet = async () => {
    try {
      const res: any = await api.get('/wallet');
      const data = unwrap(res);
      if (data) {
        setWallet({
          availableBalance: Number(data.availableBalance || 0),
          holdBalance: Number(data.holdBalance || 0),
        });
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  };

  const fetchCommissionSettings = async () => {
    try {
      const res: any = await api.get('/commission/settings');
      const raw = unwrap(res);
      const commData = raw?.data || raw;
      if (commData?.transaction) {
        setTxCommissionSetting(commData.transaction);
      }
    } catch (err) {
      console.error('Failed to fetch transaction commission setting:', err);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchCommissionSettings();
  }, []);

  const txRateType = txCommissionSetting?.rateType || 'PERCENTAGE';
  const txRateVal = txCommissionSetting?.value !== undefined ? Number(txCommissionSetting.value) : 5;
  const isTxCommActive = txCommissionSetting ? txCommissionSetting.isActive !== false : true;
  const txMinFee = Number(txCommissionSetting?.minFee || 0);
  const txMaxFee = Number(txCommissionSetting?.maxFee || 0);

  const txCommLabel = !isTxCommActive || txRateVal === 0
    ? (lang === 'bn' ? 'ফ্রি' : 'Free')
    : txRateType === 'PERCENTAGE'
    ? `${txRateVal}%`
    : `৳${txRateVal}`;

  // ---------------------------------------------------------------------------
  // Calculate dynamic commission preview for Pay Request
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) {
      setPayCommission(0);
      return;
    }

    // Dynamic initial calculation using Transaction Commission from admin settings
    let est = 0;
    if (isTxCommActive && txRateVal > 0) {
      if (txRateType === 'PERCENTAGE') {
        est = (amountNum * txRateVal) / 100;
      } else {
        est = txRateVal;
      }
      if (txMinFee > 0 && est < txMinFee) est = txMinFee;
      if (txMaxFee > 0 && est > txMaxFee) est = txMaxFee;
    }
    est = Math.round(est * 100) / 100;
    setPayCommission(est);

    const timer = setTimeout(async () => {
      try {
        const res: any = await api.get(
          `/commission/calculate?amount=${amountNum}&type=TRANSACTION&transactionType=GENERAL_TRANSACTION`,
        );
        const raw = unwrap(res);
        const data = raw?.data || raw;
        if (data && data.commissionAmount !== undefined) {
          setPayCommission(Number(data.commissionAmount));
        }
      } catch {
        // Fallback to est
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [payAmount, txCommissionSetting, isTxCommActive, txRateVal, txRateType, txMinFee, txMaxFee]);

  // ---------------------------------------------------------------------------
  // Load Chat Safety Rules & Quick Message Templates
  // ---------------------------------------------------------------------------
  useEffect(() => {
    api.get('/chat/rules-and-templates')
      .then((res: any) => {
        const data = unwrap(res);
        if (data && typeof data === 'object') {
          setChatRulesConfig((prev: any) => ({
            ...prev,
            ...data,
            banner: { ...prev.banner, ...(data.banner || {}) },
            templates: Array.isArray(data.templates) ? data.templates : prev.templates,
          }));
        }
      })
      .catch((err) => console.error('Failed to load chat rules:', err));
  }, []);

  // ---------------------------------------------------------------------------
  // Load Conversations & People
  // ---------------------------------------------------------------------------
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res: any = await api.get('/chat/conversations');
      const data = unwrap(res);
      const convList = Array.isArray(data) ? data : (data?.conversations || []);

      // Deduplicate conversations so each user only appears once, strictly excluding deleted or inactive users
      const deduped: any[] = [];
      const seen = new Set<string>();
      for (const c of convList) {
        if (!c.otherUser?.id || c.otherUser?.deletedAt || c.otherUser?.isActive === false) continue;
        if (!seen.has(c.otherUser.id)) {
          seen.add(c.otherUser.id);
          deduped.push({
            ...c,
            unreadCount: Number(c.unreadCount || 0),
          });
        }
      }

      // Strictly sort conversations by latest message timestamp descending so the newest message is always on top
      deduped.sort((a, b) => {
        const timeA = Math.max(
          a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0,
          a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0,
          new Date(a.updatedAt || 0).getTime()
        );
        const timeB = Math.max(
          b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0,
          b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0,
          new Date(b.updatedAt || 0).getTime()
        );
        return timeB - timeA;
      });

      setConversations(deduped);

      // If active conversation was with a user that is no longer returned in conversations list, clear active conversation
      setActiveConversation((prev: any) => {
        if (prev?.conversationId && !deduped.some((c) => c.conversationId === prev.conversationId)) {
          return null;
        }
        return prev;
      });


      // Load registered users for People list
      try {
        const usersRes: any = await api.get('/users/search');
        const usersData = unwrap(usersRes);
        const usersList = Array.isArray(usersData) ? usersData : [];
        setSuggestedPeople(usersList.filter((u: any) => u.id !== user?.id));
      } catch (err) {
        console.error('Failed to load registered users:', err);
      }

      // 1. Auto-select if conversationId was supplied in URL
      if (conversationIdParam) {
        const found = deduped.find((c: any) => c.conversationId === conversationIdParam);
        if (found) {
          selectConversation(found);
          return;
        }
      }

      // 2. Auto-select if targetUserId was supplied in URL
      if (targetUserId) {
        const found = deduped.find(
          (c: any) => c.otherUser?.id === targetUserId || c.otherUser?.uniqueUserId === targetUserId,
        );
        if (found) {
          selectConversation(found);
        } else {
          try {
            const userRes: any = await api.get(`/users/profile/${targetUserId}`).catch(() => null);
            const u = unwrap(userRes);
            if (u && u.id) {
              const startRes: any = await api
                .post('/chat/conversations', {
                  targetUserId: u.id,
                  recipientId: u.id,
                })
                .catch(() => null);
              const convData = unwrap(startRes);
              if (convData) {
                const newConv = {
                  conversationId: convData.id || convData.conversationId,
                  otherUser: u,
                  lastMessage: null,
                  unreadCount: 0,
                  updatedAt: new Date().toISOString(),
                };
                setConversations((prev) => {
                  const filtered = prev.filter((p) => p.otherUser?.id !== u.id);
                  return [newConv, ...filtered];
                });
                selectConversation(newConv);
              }
            }
          } catch (e) {
            // Ignore target user lookup failure
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (
      !confirm(
        lang === 'bn'
          ? 'আপনি কি এই চ্যাটটি আপনার তালিকা থেকে মুছে ফেলতে চান?'
          : 'Do you want to remove this chat from your recent list?',
      )
    ) {
      return;
    }
    try {
      await api.delete(`/chat/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.conversationId !== convId));
      if (activeConversation?.conversationId === convId) {
        setActiveConversation(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [targetUserId, conversationIdParam]);

  // ---------------------------------------------------------------------------
  // Search People (Name, User ID, Phone, Email)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res: any = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
        const data = unwrap(res);
        const list = Array.isArray(data) ? data : (data?.users || []);
        setSearchResults(list);
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, user?.id]);

  // ---------------------------------------------------------------------------
  // Select Conversation
  // ---------------------------------------------------------------------------
  const selectConversation = async (conv: any) => {
    if (activeConversation?.conversationId) {
      socket.emit('leave:conversation', { conversationId: activeConversation.conversationId });
    }

    setActiveConversation(conv);
    // Instantly clear unread badge/highlight for this conversation in state
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
    setMobileView('chat');
    setSearchQuery('');
    setSearchResults([]);
    setShowOptionsDropdown(false);
    setSafetyAlerts([]);
    setSmartDealProposal(null);

    try {
      setLoadingMessages(true);
      const res: any = await api.get(`/chat/conversations/${conv.conversationId}/messages`);
      const data = unwrap(res);
      const msgList = Array.isArray(data) ? data : (data?.messages || []);
      setMessages(msgList);
      setIsConvLocked(Boolean(data?.isLocked || res?.isLocked));
      setConvLockReason(data?.lockReason || res?.lockReason || null);

      socket.emit('join:conversation', { conversationId: conv.conversationId, userId: user?.id });
      socket.emit('message:seen', { conversationId: conv.conversationId, userId: user?.id });
      api.post(`/chat/conversations/${conv.conversationId}/seen`).catch(() => null);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Start chat directly with user from search or people list (Guaranteed 1 chat per user)
  const startChatWithUser = async (targetUser: any) => {
    setShowProfileModal(null);
    try {
      // 1. Check if conversation already exists with this user
      const existingConv = conversations.find(
        (c) => c.otherUser?.id === targetUser.id || (targetUser.uniqueUserId && c.otherUser?.uniqueUserId === targetUser.uniqueUserId),
      );
      if (existingConv) {
        selectConversation(existingConv);
        return;
      }

      const res: any = await api.post('/chat/conversations', {
        targetUserId: targetUser.id,
        recipientId: targetUser.id,
      });
      const convData = unwrap(res);
      const conversationId = convData?.id || convData?.conversationId;

      const convObj = {
        conversationId,
        otherUser: targetUser,
        lastMessage: null,
      };

      setConversations((prev) => {
        const filtered = prev.filter(
          (c) => c.conversationId !== conversationId && c.otherUser?.id !== targetUser.id,
        );
        return [convObj, ...filtered];
      });

      selectConversation(convObj);
    } catch (err: any) {
      console.error('Failed to create conversation:', err);
      alert(err.response?.data?.message || err.message || 'Cannot start chat');
    }
  };

  // ---------------------------------------------------------------------------
  // Socket.IO Listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = (newMsg: any) => {
      const isCurrentActive = newMsg.conversationId === activeConversation?.conversationId;

      if (isCurrentActive) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        socket.emit('message:seen', {
          conversationId: activeConversation.conversationId,
          userId: user?.id,
        });
        api.post(`/chat/conversations/${activeConversation.conversationId}/seen`).catch(() => null);
      }

      // Float conversation to the very top (index 0) and update snippet & unreadCount
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.conversationId === newMsg.conversationId);
        const isFromSelf = newMsg.senderId === user?.id || newMsg.sender?.id === user?.id;

        let targetConv: any;
        let others: any[];

        if (existingIndex !== -1) {
          const old = prev[existingIndex];
          const newUnread = isCurrentActive || isFromSelf ? 0 : (Number(old.unreadCount || 0) + 1);

          targetConv = {
            ...old,
            lastMessage: newMsg,
            lastMessageAt: newMsg.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            unreadCount: newUnread,
          };
          others = prev.filter((_, idx) => idx !== existingIndex);
        } else {
          // If conversation wasn't in current list, create it and float to top
          const otherUser = !isFromSelf ? newMsg.sender : null;
          targetConv = {
            conversationId: newMsg.conversationId,
            otherUser: otherUser,
            lastMessage: newMsg,
            lastMessageAt: newMsg.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            unreadCount: isCurrentActive || isFromSelf ? 0 : 1,
          };
          others = prev;
        }

        // Move to the very top!
        return [targetConv, ...others];
      });
    };

    const handleTransactionUpdate = (data: any) => {
      if (data.conversationId === activeConversation?.conversationId) {
        // Refresh messages to reflect new transaction status & system message
        api
          .get(`/chat/conversations/${activeConversation.conversationId}/messages`)
          .then((res: any) => {
            const d = unwrap(res);
            setMessages(Array.isArray(d) ? d : (d?.messages || []));
          })
          .catch(console.error);
      }
      fetchWallet();
    };

    const handleTypingStart = (data: any) => {
      if (data.conversationId === activeConversation?.conversationId && data.userName !== user?.firstName) {
        setOtherUserTyping(true);
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.conversationId === activeConversation?.conversationId) {
        setOtherUserTyping(false);
      }
    };

    const handleLockStatus = (data: any) => {
      if (data?.conversationId === activeConversation?.conversationId) {
        setIsConvLocked(Boolean(data.isLocked));
        setConvLockReason(data.reason || null);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === data?.conversationId
            ? { ...c, isLocked: data.isLocked, lockReason: data.reason }
            : c,
        ),
      );
    };

    const handleAdminVisibilityChanged = () => {
      fetchConversations();
    };

    // 1. Online Presence Tracking
    socket.emit('users:get_online');

    const handleOnlineList = (list: string[]) => {
      if (Array.isArray(list)) {
        setOnlineUsers(new Set(list));
      }
    };

    const handleUserStatus = (data: { userId: string; status: 'ONLINE' | 'OFFLINE' }) => {
      if (!data?.userId) return;
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (data.status === 'ONLINE') {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    };

    // 2. Real-time Transaction Notifications Refresh
    const handleTransactionRefresh = () => {
      if (activeConversation?.conversationId) {
        api
          .get(`/chat/conversations/${activeConversation.conversationId}/messages`)
          .then((res: any) => {
            const d = unwrap(res);
            setMessages(Array.isArray(d) ? d : (d?.messages || []));
          })
          .catch(console.error);
      }
      fetchWallet();
      fetchConversations();
    };

    socket.on('users:online_list', handleOnlineList);
    socket.on('user:status', handleUserStatus);
    socket.on('notification:pay_request', handleTransactionRefresh);
    socket.on('notification:receive_request', handleTransactionRefresh);
    socket.on('notification:hold_approved', handleTransactionRefresh);
    socket.on('notification:release_request', handleTransactionRefresh);
    socket.on('notification:release_approve', handleTransactionRefresh);
    socket.on('notification:dispute', handleTransactionRefresh);

    const handleSafetyWarning = (data: any) => {
      if (data?.conversationId === activeConversation?.conversationId) {
        setSafetyAlerts((prev) => [
          ...prev,
          {
            id: data.messageId || String(Date.now()),
            warningText: data.warningText,
            category: data.category,
            riskScore: data.riskScore,
            reason: data.reason,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    };

    const handleDealProposal = (data: any) => {
      if (data?.conversationId === activeConversation?.conversationId) {
        setSmartDealProposal({
          title: data.title,
          amount: data.amount,
          senderId: data.senderId,
        });
      }
    };

    socket.on('message:receive', handleMessageReceive);
    socket.on('transaction:update', handleTransactionUpdate);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('chat:lock_status', handleLockStatus);
    socket.on('chat:admin_visibility_changed', handleAdminVisibilityChanged);
    socket.on('chat:safety_warning', handleSafetyWarning);
    socket.on('chat:deal_proposal', handleDealProposal);

    return () => {
      socket.off('users:online_list', handleOnlineList);
      socket.off('user:status', handleUserStatus);
      socket.off('notification:pay_request', handleTransactionRefresh);
      socket.off('notification:receive_request', handleTransactionRefresh);
      socket.off('notification:hold_approved', handleTransactionRefresh);
      socket.off('notification:release_request', handleTransactionRefresh);
      socket.off('notification:release_approve', handleTransactionRefresh);
      socket.off('notification:dispute', handleTransactionRefresh);

      socket.off('message:receive', handleMessageReceive);
      socket.off('transaction:update', handleTransactionUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('chat:lock_status', handleLockStatus);
      socket.off('chat:admin_visibility_changed', handleAdminVisibilityChanged);
      socket.off('chat:safety_warning', handleSafetyWarning);
      socket.off('chat:deal_proposal', handleDealProposal);
    };
  }, [socket, activeConversation, user?.id, user?.firstName]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  // ---------------------------------------------------------------------------
  // Typing Indicator
  // ---------------------------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!activeConversation?.conversationId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing:start', {
        conversationId: activeConversation.conversationId,
        userName: user?.firstName || 'User',
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing:stop', {
        conversationId: activeConversation.conversationId,
        userName: user?.firstName || 'User',
      });
    }, 1500);
  };

  // Helper: Convert File to Base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ---------------------------------------------------------------------------
  // Send Message (REST + Socket Broadcast)
  // ---------------------------------------------------------------------------
  const sendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !activeConversation?.conversationId) return;

    const contentToSend = messageInput.trim();
    const fileToSend = selectedFile;
    setMessageInput('');
    setSelectedFile(null);
    setFilePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowEmojiPicker(false);
    setShowPlusMenu(false);

    try {
      let attachmentPayload = null;

      if (fileToSend) {
        setUploadingAttachment(true);
        let base64Data: string;
        let fileName = fileToSend.name;

        if (fileToSend.type.startsWith('image/')) {
          const compressed = await compressImage(fileToSend, 1200, 1200, 0.85);
          base64Data = compressed.base64Data;
          fileName = compressed.fileName;
        } else {
          base64Data = await fileToBase64(fileToSend);
        }

        const uploadRes: any = await api.post('/uploads', {
          base64Data,
          fileName,
          folder: 'chat',
        });
        const uploadData = unwrap(uploadRes);
        const fileUrl = uploadData?.fileUrl || uploadData?.url;
        if (!fileUrl) {
          throw new Error('Upload failed: server did not return file URL');
        }

        attachmentPayload = [
          {
            fileUrl,
            fileType: fileToSend.type.startsWith('image/') ? 'IMAGE' : 'FILE',
            fileSize: fileToSend.size,
          },
        ];
      }

      const payload = {
        content:
          contentToSend ||
          (attachmentPayload
            ? attachmentPayload[0].fileType === 'IMAGE'
              ? 'Sent an image'
              : 'Sent an attachment'
            : ''),
        messageType: attachmentPayload ? attachmentPayload[0].fileType : 'TEXT',
        attachments: attachmentPayload,
      };

      // 1. Guaranteed database save via REST
      const res: any = await api.post(
        `/chat/conversations/${activeConversation.conversationId}/messages`,
        payload,
      );
      const savedMsg = unwrap(res);

      if (savedMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });

        // Update conversation in list, reset unreadCount to 0, and move to top
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.conversationId === activeConversation.conversationId
              ? {
                  ...c,
                  lastMessage: savedMsg,
                  lastMessageAt: savedMsg.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  unreadCount: 0,
                }
              : c,
          );
          const target = updated.find((c) => c.conversationId === activeConversation.conversationId);
          const others = updated.filter((c) => c.conversationId !== activeConversation.conversationId);
          return target ? [target, ...others] : updated;
        });
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err?.message || 'Failed to upload/send file.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  // ---------------------------------------------------------------------------
  // File / Photo Select
  // ---------------------------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    setShowPlusMenu(false);
  };

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // PAY MONEY (Instant Escrow Proposal / Hold)
  // ---------------------------------------------------------------------------
  const handleSendPayRequest = async () => {
    const amountNum = parseFloat(payAmount);
    if (!amountNum || amountNum <= 0) return;

    const totalNeeded = amountNum + payCommission;
    if (!wallet || wallet.availableBalance < totalNeeded) {
      alert(
        lang === 'bn'
          ? `অপর্যাপ্ত ব্যালেন্স: মোট প্রয়োজন ৳${totalNeeded.toLocaleString()} (মূল ৳${amountNum} + ${txCommLabel} কমিশন ৳${payCommission}), আপনার ব্যালেন্স ৳${wallet?.availableBalance || 0}`
          : `Insufficient balance. Required: ৳${totalNeeded} (Amount: ৳${amountNum} + ${txCommLabel} Commission: ৳${payCommission}), Available: ৳${wallet?.availableBalance || 0}`,
      );
      return;
    }

    setActionLoading(true);
    try {
      const res: any = await api.post('/transactions/pay-request', {
        receiverId: activeConversation.otherUser.id,
        amount: amountNum,
        notes: payReason.trim() || 'Service Payment',
        conversationId: activeConversation.conversationId,
      });
      const data = unwrap(res);

      setShowPayModal(false);
      setPayAmount('');
      setPayReason('Service Payment');

      // Track Meta Pixel & Analytics InitiateCheckout Event
      trackEvent('InitiateCheckout', {
        value: amountNum,
        currency: 'BDT',
        content_type: 'escrow_order',
      });

      // 1. Immediately append message to chat stream & update conversation list
      if (data?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.conversationId === activeConversation.conversationId
              ? { ...c, lastMessage: data.message, updatedAt: new Date().toISOString() }
              : c,
          );
          const target = updated.find((c) => c.conversationId === activeConversation.conversationId);
          const others = updated.filter((c) => c.conversationId !== activeConversation.conversationId);
          return target ? [target, ...others] : updated;
        });
      }

      // 2. Refresh wallet & messages in background
      fetchWallet();
      api
        .get(`/chat/conversations/${activeConversation.conversationId}/messages`)
        .then((msgRes: any) => {
          const msgData = unwrap(msgRes);
          const list = Array.isArray(msgData) ? msgData : (msgData?.messages || []);
          if (list.length > 0) setMessages(list);
        })
        .catch(console.error);

      socket.emit('transaction:update', {
        conversationId: activeConversation.conversationId,
        transaction: data?.transaction || data,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send pay request';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // REQUEST MONEY (Receiver Initiated - No sender balance required upfront)
  // ---------------------------------------------------------------------------
  const handleSendRequestMoney = async () => {
    const amountNum = parseFloat(requestAmount);
    if (!amountNum || amountNum <= 0) return;

    setActionLoading(true);
    try {
      const res: any = await api.post('/transactions/request-money', {
        targetId: activeConversation.otherUser.id,
        amount: amountNum,
        reason: requestReason.trim() || 'Service Payment',
        conversationId: activeConversation.conversationId,
      });
      const data = unwrap(res);

      setShowRequestModal(false);
      setRequestAmount('');
      setRequestReason('Service Payment');

      // 1. Immediately append message to chat stream & update conversation list
      if (data?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.conversationId === activeConversation.conversationId
              ? { ...c, lastMessage: data.message, updatedAt: new Date().toISOString() }
              : c,
          );
          const target = updated.find((c) => c.conversationId === activeConversation.conversationId);
          const others = updated.filter((c) => c.conversationId !== activeConversation.conversationId);
          return target ? [target, ...others] : updated;
        });
      }

      // 2. Refresh messages in background
      api
        .get(`/chat/conversations/${activeConversation.conversationId}/messages`)
        .then((msgRes: any) => {
          const msgData = unwrap(msgRes);
          const list = Array.isArray(msgData) ? msgData : (msgData?.messages || []);
          if (list.length > 0) setMessages(list);
        })
        .catch(console.error);

      socket.emit('transaction:update', {
        conversationId: activeConversation.conversationId,
        transaction: data?.transaction || data,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send money request';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // APPROVE REQUEST (Moves REQUESTED proposal to Escrow HOLD)
  // ---------------------------------------------------------------------------
  const handleApproveRequest = async (transactionId: string) => {
    if (
      !confirm(
        lang === 'bn'
          ? 'আপনি কি এই রিকোয়েস্ট অনুমোদন করে এসক্রো হোল্ডে লক করতে চান? প্রেরকের ব্যালেন্স থেকে টাকা কেটে সেফনেক্সবিডি সুরক্ষিত হোল্ডে জমা হবে।'
          : 'Approve and lock this payment in Escrow Hold? Money will be deducted from sender balance and safely held.',
      )
    )
      return;

    setActionLoading(true);
    try {
      const res: any = await api.patch(`/transactions/${transactionId}/pay-request/approve`);
      const data = unwrap(res);

      // Track Meta Pixel & Analytics InitiateCheckout Event
      trackEvent('InitiateCheckout', {
        value: Number(data?.amount || 0),
        currency: 'BDT',
        transaction_id: transactionId,
      });

      await fetchWallet();
      const msgRes: any = await api.get(`/chat/conversations/${activeConversation.conversationId}/messages`);
      const msgData = unwrap(msgRes);
      setMessages(Array.isArray(msgData) ? msgData : (msgData?.messages || []));

      socket.emit('transaction:update', {
        conversationId: activeConversation.conversationId,
        transaction: data,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Approval failed';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RELEASE PAYMENT (SENDER RELEASES HELD MONEY TO RECEIVER'S MAIN BALANCE)
  // ---------------------------------------------------------------------------
  const handleReleasePayRequest = async (transactionId: string) => {
    if (
      !confirm(
        lang === 'bn'
          ? 'আপনি কি নিশ্চিত যে এই টাকা রিলিজ করতে চান? টাকা সাথে সাথে রিসিভারের মূল ব্যালেন্সে যুক্ত হবে।'
          : "Are you sure you want to release this payment? Money will be transferred immediately to the receiver's Main Balance.",
      )
    )
      return;

    setActionLoading(true);
    try {
      const res: any = await api.patch(`/transactions/${transactionId}/pay-request/release`);
      const data = unwrap(res);

      // Track Meta Pixel & Analytics Purchase Event
      trackEvent('Purchase', {
        value: Number(data?.amount || 0),
        currency: 'BDT',
        transaction_id: transactionId,
      });

      await fetchWallet();
      const msgRes: any = await api.get(`/chat/conversations/${activeConversation.conversationId}/messages`);
      const msgData = unwrap(msgRes);
      setMessages(Array.isArray(msgData) ? msgData : (msgData?.messages || []));

      socket.emit('transaction:update', {
        conversationId: activeConversation.conversationId,
        transaction: data,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Release failed';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // REQUEST RELEASE (RECEIVER NOTIFIES SENDER TO RELEASE FUNDS)
  // ---------------------------------------------------------------------------
  const handleRequestRelease = async (transactionId: string) => {
    if (!transactionId) {
      alert(lang === 'bn' ? 'ট্রানজেকশন আইডি পাওয়া যায়নি।' : 'Transaction ID not found.');
      return;
    }

    setActionLoading(true);
    try {
      const res: any = await api.post(`/transactions/${transactionId}/pay-request/request-release`);
      const data = unwrap(res);

      const convId = activeConversation?.conversationId || activeConversation?.id;
      if (convId) {
        const msgRes: any = await api.get(`/chat/conversations/${convId}/messages`);
        const msgData = unwrap(msgRes);
        setMessages(Array.isArray(msgData) ? msgData : (msgData?.messages || []));

        if (socket) {
          socket.emit('transaction:update', {
            conversationId: convId,
            transaction: data,
          });
        }
      }

      // Switch to chat tab so user immediately sees the highlighted VIP Release Request card
      setActiveHeaderTab('chat');

      alert(
        lang === 'bn'
          ? '🔔 রিলিজের অনুরোধ ক্লায়েন্টের চ্যাটে পাঠানো হয়েছে!'
          : '🔔 Release request notification sent to the client in chat!',
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to send release request';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // WITHDRAW DISPUTE (RESTORES TO ESCROW HOLD)
  // ---------------------------------------------------------------------------
  const handleWithdrawDispute = async (transactionId: string) => {
    if (
      !confirm(
        lang === 'bn'
          ? 'আপনি কি ডিসপ্যুট প্রত্যাহার করতে চান? পেমেন্ট পুনরায় এসক্রো হোল্ডে ফিরে যাবে এবং আপনি তা রিলিজ করতে পারবেন।'
          : 'Are you sure you want to withdraw this dispute? Payment will return to Escrow Hold and you can release it.',
      )
    )
      return;

    setActionLoading(true);
    try {
      const res: any = await api.patch(`/transactions/${transactionId}/pay-request/withdraw-dispute`);
      const data = unwrap(res);

      await fetchWallet();
      const msgRes: any = await api.get(`/chat/conversations/${activeConversation.conversationId}/messages`);
      const msgData = unwrap(msgRes);
      setMessages(Array.isArray(msgData) ? msgData : (msgData?.messages || []));

      socket.emit('transaction:update', {
        conversationId: activeConversation.conversationId,
        transaction: data,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to withdraw dispute';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DECLINE / CANCEL PAY REQUEST
  // ---------------------------------------------------------------------------
  const handleDeclinePayRequest = async (transactionId: string) => {
    if (
      !confirm(
        lang === 'bn'
          ? 'আপনি কি নিশ্চিত যে এই রিকোয়েস্ট বাতিল/প্রত্যাখ্যান করতে চান?'
          : 'Are you sure you want to decline/cancel this transaction request?',
      )
    )
      return;

    setActionLoading(true);
    try {
      const res: any = await api.patch(`/transactions/${transactionId}/pay-request/decline`, {
        reason: 'Declined/Cancelled by user',
      });
      const data = unwrap(res);

      await fetchWallet();
      const msgRes: any = await api.get(`/chat/conversations/${activeConversation.conversationId}/messages`);
      const msgData = unwrap(msgRes);
      setMessages(Array.isArray(msgData) ? msgData : (msgData?.messages || []));

      socket.emit('transaction:update', {
        conversationId: activeConversation.conversationId,
        transaction: data,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Decline failed';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // DISPUTE PAY REQUEST
  // ---------------------------------------------------------------------------
  const handleSubmitDispute = async () => {
    if (!showDisputeModal?.transactionId) return;

    setActionLoading(true);
    try {
      let evidenceUrls: string[] = [];
      if (disputeEvidence.length > 0) {
        for (const file of disputeEvidence) {
          const base64Data = await fileToBase64(file);
          const uploadRes: any = await api.post('/uploads', {
            base64Data,
            fileName: file.name,
            folder: 'disputes',
          });
          const uploadData = unwrap(uploadRes);
          const fileUrl = uploadData?.fileUrl || uploadData?.url;
          if (fileUrl) evidenceUrls.push(fileUrl);
        }
      }

      const res: any = await api.post(`/transactions/${showDisputeModal.transactionId}/pay-request/dispute`, {
        reason: disputeReason,
        details: disputeDetails,
        evidenceUrls,
      });
      const data = unwrap(res);

      setShowDisputeModal(null);
      setDisputeDetails('');
      setDisputeEvidence([]);

      await fetchWallet();
      const msgRes: any = await api.get(`/chat/conversations/${activeConversation.conversationId}/messages`);
      const msgData = unwrap(msgRes);
      setMessages(Array.isArray(msgData) ? msgData : (msgData?.messages || []));

      socket.emit('transaction:update', {
        conversationId: activeConversation.conversationId,
        transaction: data?.transaction || data,
      });

      alert(
        lang === 'bn'
          ? 'ডিসপ্যুট সফলভাবে দাখিল করা হয়েছে এবং অ্যাডমিন কলিং কিউ (Calling Queue)-তে পাঠানো হয়েছে।'
          : 'Dispute submitted successfully and sent to Admin Calling Queue.',
      );
      setActiveHeaderTab('admin_calling');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to open dispute';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helper: Copy Tracking ID
  // ---------------------------------------------------------------------------
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // Helper: User Display Name
  // ---------------------------------------------------------------------------
  const getUserDisplayName = (u: any) => {
    if (!u) return 'User';
    if (u.fullName) return u.fullName;
    if (u.firstName) return `${u.firstName} ${u.lastName || ''}`.trim();
    return u.uniqueUserId || 'User';
  };

  // ---------------------------------------------------------------------------
  // Group Messages By Date
  // ---------------------------------------------------------------------------
  const groupedMessages = useMemo(() => {
    const groups: { [dateStr: string]: any[] } = {};
    messages.forEach((msg) => {
      const d = new Date(msg.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label = d.toLocaleDateString();
      if (d.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(msg);
    });
    return groups;
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Unique Transactions for Active Conversation (Ordered newest first)
  // ---------------------------------------------------------------------------
  const conversationTransactions = useMemo(() => {
    const map = new Map<string, any>();

    // 1. First pass: Register base transactions from PAY_REQUEST or RECEIVE_REQUEST
    messages.forEach((msg) => {
      const meta = msg.metadata || {};
      const txnId = meta.transactionId || meta.id || meta.referenceId;
      if (txnId && (msg.messageType === 'PAY_REQUEST' || msg.messageType === 'RECEIVE_REQUEST')) {
        map.set(txnId, {
          ...meta,
          transactionId: txnId,
          trackingNumber: meta.trackingNumber,
          messageId: msg.id,
          messageType: msg.messageType,
          createdAt: msg.createdAt,
          authorSenderId: msg.senderId || msg.sender?.id,
          senderId: meta.senderId,
          receiverId: meta.receiverId,
          status: meta.status || 'REQUESTED',
          amount: Number(meta.amount || 0),
          commission: Number(meta.commissionAmount || (Number(meta.amount || 0) * 0.05)),
          notes: meta.reason || meta.notes || msg.content,
        });
      }
    });

    // 2. Second pass: Apply real-time updates and status changes from SYSTEM messages
    messages.forEach((msg) => {
      const meta = msg.metadata || {};
      const txnId = meta.transactionId || meta.id || meta.referenceId;
      if (txnId) {
        const existing = map.get(txnId);
        if (existing) {
          if (meta.status) existing.status = meta.status;
          if (meta.trackingNumber && !existing.trackingNumber) existing.trackingNumber = meta.trackingNumber;
          if (meta.amount && !existing.amount) existing.amount = Number(meta.amount);
          if (meta.commissionAmount && !existing.commission) existing.commission = Number(meta.commissionAmount);
          if (meta.senderId && !existing.senderId) existing.senderId = meta.senderId;
          if (meta.receiverId && !existing.receiverId) existing.receiverId = meta.receiverId;
          if (meta.type === 'RELEASE_REQUEST') existing.hasReleaseRequest = true;
        } else if (meta.status || meta.amount) {
          // If the initial request message is paginated out, still register from the system message
          map.set(txnId, {
            ...meta,
            transactionId: txnId,
            trackingNumber: meta.trackingNumber,
            messageId: msg.id,
            messageType: msg.messageType,
            createdAt: msg.createdAt,
            status: meta.status || 'HOLD',
            amount: Number(meta.amount || 0),
            commission: Number(meta.commissionAmount || (Number(meta.amount || 0) * 0.05)),
          });
        }
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [messages]);

  const hasDispute = useMemo(() => {
    return conversationTransactions.some((t) => t.status === 'DISPUTED');
  }, [conversationTransactions]);

  const quickEmojis = ['👍', '❤️', '😊', '🔥', '🎉', '🤝', '💰', '💸', '✅', '🙏', '👏', '⭐'];

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* =========================================================================
          LEFT PANE: Messages & People Discovery (Messenger Style)
      ========================================================================= */}
      <div
        className={`flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full md:w-[280px] lg:w-[320px] xl:w-[360px] shrink-0 transition-all duration-200 ${
          isUserListCollapsed ? 'hidden' : (mobileView === 'chat' ? 'hidden md:flex' : 'flex')
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Messages</h1>
            {conversations.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                {conversations.length}
              </span>
            )}
            {totalUnreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-sky-600 text-white shadow-sm ring-2 ring-sky-400/25 animate-pulse">
                {totalUnreadCount} {lang === 'bn' ? 'নতুন' : 'new'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* User Available Balance Tag */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              <span>৳{wallet?.availableBalance?.toLocaleString() ?? '0'}</span>
            </div>

            {/* Collapse button for tablet & laptop */}
            <button
              type="button"
              onClick={() => setIsUserListCollapsed(true)}
              title={lang === 'bn' ? 'ইউজার তালিকা লুকান' : 'Hide User List'}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar (Messenger Style) */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, email or User ID..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-full placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-slate-800/90 border border-transparent focus:border-emerald-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          {/* SEARCH RESULTS VIEW */}
          {searchQuery.trim() ? (
            <div className="p-2">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {searching ? 'Searching people...' : `Found (${searchResults.length})`}
              </div>

              {searching ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" /> Searching users...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No users found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchResults.map((u) => {
                  const dName = getUserDisplayName(u);
                  const isSelf = u.id === user?.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        if (!isSelf) startChatWithUser(u);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors group ${
                        isSelf
                          ? 'opacity-80 cursor-default bg-slate-50 dark:bg-slate-800/40'
                          : 'hover:bg-emerald-50/70 dark:hover:bg-slate-800/70 cursor-pointer'
                      }`}
                    >
                      <div
                        className="relative shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProfileModal(u);
                        }}
                      >
                        {u.avatarUrl ? (
                          <img
                            src={getImageUrl(u.avatarUrl)}
                            alt={dName}
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-base border border-emerald-200 dark:border-emerald-800">
                            {dName.charAt(0)}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate">
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 transition-colors">
                              {dName}
                            </h3>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                                You
                              </span>
                            )}
                          </div>
                          {u.isVerified && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          ID: {u.uniqueUserId || 'TBD' + u.id.slice(0, 5).toUpperCase()}
                        </p>
                        {u.email && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans truncate">
                            ✉️ {u.email}
                          </p>
                        )}
                        {u.businessName && (
                          <span className="text-[11px] text-slate-400 truncate block">{u.businessName}</span>
                        )}
                      </div>

                      {!isSelf && (
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* RECENT CONVERSATIONS & PEOPLE DISCOVERY */
            <div>
              {conversations.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                    Recent Chats
                  </div>
                  {conversations.map((conv) => {
                    const other = conv.otherUser;
                    const dName = getUserDisplayName(other);
                    const isSelected = activeConversation?.conversationId === conv.conversationId;
                    const isUnread = Number(conv.unreadCount || 0) > 0 && !isSelected;
                    const lastMsg = conv.lastMessage;

                    let lastSnippet = 'No messages yet';
                    if (lastMsg) {
                      if (lastMsg.messageType === 'PAY_REQUEST') {
                        lastSnippet = `💸 Pay Request ৳${lastMsg.metadata?.amount || ''}`;
                      } else if (lastMsg.messageType === 'RECEIVE_REQUEST') {
                        lastSnippet = `💰 Request ৳${lastMsg.metadata?.amount || ''}`;
                      } else if (lastMsg.messageType === 'IMAGE') {
                        lastSnippet = '📷 Photo';
                      } else if (lastMsg.messageType === 'FILE') {
                        lastSnippet = '📎 File';
                      } else if (lastMsg.messageType === 'SYSTEM') {
                        lastSnippet = lastMsg.content?.split('\n')[0] || 'System update';
                      } else {
                        lastSnippet = lastMsg.content || '';
                      }
                    }

                    const timeStr = lastMsg?.createdAt
                      ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    return (
                      <div
                        key={conv.conversationId}
                        onClick={() => selectConversation(conv)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group relative ${
                          isSelected
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-l-4 border-emerald-600 dark:border-emerald-500 shadow-sm'
                            : isUnread
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-l-4 border-sky-600 dark:border-sky-500 shadow-[inset_0_1px_0_0_rgba(2,132,199,0.08)] ring-1 ring-sky-500/20 hover:bg-sky-100/70 dark:hover:bg-sky-900/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-4 border-transparent'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className="relative shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileModal(other);
                          }}
                        >
                          {other?.avatarUrl ? (
                            <img
                              src={getImageUrl(other.avatarUrl)}
                              alt={dName}
                              className={`w-12 h-12 rounded-full object-cover border transition-all ${
                                isUnread
                                  ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-400/30 shadow-sm'
                                  : 'border-slate-200 dark:border-slate-700'
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-base border transition-all ${
                                isUnread
                                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/30'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {dName.charAt(0)}
                            </div>
                          )}

                          {/* Pulsing glow indicator dot on avatar top-right if unread */}
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-10" title="New unread message">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border-2 border-white dark:border-slate-900 shadow-sm"></span>
                            </span>
                          )}

                          {/* Online indicator */}
                          <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                              onlineUsers.has(other?.id)
                                ? 'bg-emerald-500 ring-1 ring-emerald-400/50'
                                : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            title={onlineUsers.has(other?.id) ? 'Online' : 'Offline'}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                              <h4
                                className={`text-sm truncate transition-colors ${
                                  isSelected
                                    ? 'text-emerald-900 dark:text-emerald-200 font-bold'
                                    : isUnread
                                    ? 'text-slate-950 dark:text-white font-black tracking-tight'
                                    : 'text-slate-800 dark:text-slate-200 font-medium'
                                }`}
                              >
                                {dName}
                              </h4>
                              {isUnread && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
                                  {lang === 'bn' ? 'নতুন' : 'NEW'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {timeStr && (
                                <span
                                  className={`text-[11px] ml-1 transition-colors ${
                                    isUnread
                                      ? 'text-sky-600 dark:text-sky-400 font-bold'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {timeStr}
                                </span>
                              )}
                              <button
                                onClick={(e) => handleDeleteConversation(e, conv.conversationId)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 opacity-0 group-hover:opacity-100 transition"
                                title={lang === 'bn' ? 'চ্যাট মুছে ফেলুন' : 'Delete Chat'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs truncate transition-colors ${
                                isUnread
                                  ? 'text-slate-900 dark:text-slate-100 font-bold'
                                  : lastMsg?.messageType === 'PAY_REQUEST'
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {lastSnippet}
                            </p>

                            {/* Vibrant Unread Counter Badge */}
                            {isUnread && (
                              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-black rounded-full bg-sky-600 text-white shadow-sm ring-2 ring-sky-400/25 animate-pulse shrink-0">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            ID: {other?.uniqueUserId || 'TBD' + (other?.id?.slice(0, 5).toUpperCase() || '')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* PEOPLE / USERS DISCOVERY (Always visible so user can easily start a chat) */}
              <div className="mt-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Recent / People ({suggestedPeople.length})</span>
                </div>

                {loadingConversations ? (
                  <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" /> Loading people...
                  </div>
                ) : suggestedPeople.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    No other users registered yet.
                  </div>
                ) : (
                  suggestedPeople.map((u) => {
                    const dName = getUserDisplayName(u);
                    return (
                      <div
                        key={u.id}
                        onClick={() => startChatWithUser(u)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      >
                        {/* Avatar */}
                        <div
                          className="relative shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProfileModal(u);
                          }}
                        >
                          {u.avatarUrl ? (
                            <img
                              src={getImageUrl(u.avatarUrl)}
                              alt={dName}
                              className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-200 dark:border-emerald-800">
                              {dName.charAt(0)}
                            </div>
                          )}
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                              onlineUsers.has(u.id)
                                ? 'bg-emerald-500 ring-1 ring-emerald-400/50'
                                : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                            title={onlineUsers.has(u.id) ? 'Online' : 'Offline'}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 transition-colors">
                              {dName}
                            </h4>
                            {u.isVerified && <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-slate-400 truncate">
                              ID: {u.uniqueUserId || 'TBD' + u.id.slice(0, 5).toUpperCase()}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            {onlineUsers.has(u.id) ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold inline-flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Online
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 font-sans shrink-0">Offline</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startChatWithUser(u);
                          }}
                          className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Chat
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE: Messenger Chat Area
      ========================================================================= */}
      <div
        className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 h-full min-h-0 overflow-hidden ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back Button (Mobile) */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Expand User List Button (Tablet & Desktop, visible when user list is collapsed) */}
                {isUserListCollapsed && (
                  <button
                    type="button"
                    onClick={() => setIsUserListCollapsed(false)}
                    title={lang === 'bn' ? 'ইউজার তালিকা খুলুন' : 'Show User List'}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition-colors border border-slate-200 dark:border-slate-700 shrink-0 text-xs font-semibold"
                  >
                    <PanelLeftOpen className="w-4 h-4 text-emerald-500" />
                    <span className="hidden sm:inline">{lang === 'bn' ? 'চ্যাট তালিকা' : 'User List'}</span>
                  </button>
                )}

                {/* Counterpart Profile Trigger */}
                <div
                  onClick={() => setShowProfileModal(activeConversation.otherUser)}
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer group hover:opacity-90 transition-opacity min-w-0"
                >
                  <div className="relative shrink-0">
                    {activeConversation.otherUser?.avatarUrl ? (
                      <img
                        src={getImageUrl(activeConversation.otherUser.avatarUrl)}
                        alt={getUserDisplayName(activeConversation.otherUser)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm">
                        {getUserDisplayName(activeConversation.otherUser).charAt(0)}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                        onlineUsers.has(activeConversation.otherUser?.id)
                          ? 'bg-emerald-500 ring-1 ring-emerald-400/50'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      title={onlineUsers.has(activeConversation.otherUser?.id) ? 'Online' : 'Offline'}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-bold text-sm text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 transition-colors truncate">
                        {getUserDisplayName(activeConversation.otherUser)}
                      </h2>
                      {activeConversation.otherUser?.isVerified && (
                        <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate flex items-center gap-1.5">
                      <span>
                        {activeConversation.otherUser?.uniqueUserId ||
                          'TBD' + (activeConversation.otherUser?.id?.slice(0, 5).toUpperCase() || '')}
                      </span>
                      <span>•</span>
                      {onlineUsers.has(activeConversation.otherUser?.id) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-sans inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                          Offline
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Center / Right: 4 Header Navigation Tabs (Compact on md/lg, full text on xl) */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                  <button
                    onClick={() => setActiveHeaderTab('chat')}
                    title="Chat"
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeHeaderTab === 'chat'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Chat</span>
                  </button>

                  <button
                    onClick={() => setActiveHeaderTab('transaction')}
                    title="Transaction"
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeHeaderTab === 'transaction'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Transaction</span>
                    {conversationTransactions.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                        {conversationTransactions.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveHeaderTab('rules')}
                    title="Rules"
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeHeaderTab === 'rules'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Rules</span>
                  </button>

                  <button
                    onClick={() => setActiveHeaderTab('admin_calling')}
                    title="Admin Calling"
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                      activeHeaderTab === 'admin_calling'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden xl:inline">Admin Calling</span>
                    {hasDispute && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
                    )}
                  </button>
                </div>

                {/* 3 Dots Options Button (Mobile & Desktop) */}
                <div className="relative">
                  <button
                    onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    title="Menu & Options"
                    aria-label="Menu and options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {showOptionsDropdown && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowOptionsDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in slide-in-from-top-1">
                        {/* Navigation Options for Phone View */}
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {lang === 'bn' ? 'চ্যাট ও অপশন' : 'Chat & Sections'}
                        </div>

                        {/* 1. Chat */}
                        <button
                          onClick={() => {
                            setActiveHeaderTab('chat');
                            setShowOptionsDropdown(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between rounded-lg transition ${
                            activeHeaderTab === 'chat'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                            <span>Chat</span>
                          </div>
                          {activeHeaderTab === 'chat' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>

                        {/* 2. Transaction */}
                        <button
                          onClick={() => {
                            setActiveHeaderTab('transaction');
                            setShowOptionsDropdown(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between rounded-lg transition ${
                            activeHeaderTab === 'transaction'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Wallet className="w-4 h-4 text-emerald-500" />
                            <span>Transaction</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {conversationTransactions.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-bold">
                                {conversationTransactions.length}
                              </span>
                            )}
                            {activeHeaderTab === 'transaction' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        </button>

                        {/* 3. Rules */}
                        <button
                          onClick={() => {
                            setActiveHeaderTab('rules');
                            setShowOptionsDropdown(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between rounded-lg transition ${
                            activeHeaderTab === 'rules'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-sky-500" />
                            <span>Rules</span>
                          </div>
                          {activeHeaderTab === 'rules' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>

                        {/* 4. Admin Calling */}
                        <button
                          onClick={() => {
                            setActiveHeaderTab('admin_calling');
                            setShowOptionsDropdown(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between rounded-lg transition ${
                            activeHeaderTab === 'admin_calling'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                            <span>Admin Calling</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {hasDispute && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            )}
                            {activeHeaderTab === 'admin_calling' && <Check className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                        </button>

                        <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                        {/* Financial & Profile Actions */}
                        <button
                          onClick={() => {
                            setShowOptionsDropdown(false);
                            setShowPayModal(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5"
                        >
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          <span>{lang === 'bn' ? 'টাকা পাঠান (Pay Money)' : 'Pay Money'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowOptionsDropdown(false);
                            setShowRequestModal(true);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2.5"
                        >
                          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                          <span>{lang === 'bn' ? 'টাকা চান (Request Money)' : 'Request Money'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowOptionsDropdown(false);
                            setShowProfileModal(activeConversation.otherUser);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{lang === 'bn' ? 'প্রোফাইল পপআপ দেখুন' : 'View Profile Card'}</span>
                        </button>

                        <Link
                          href={`/users/${activeConversation.otherUser?.uniqueUserId || activeConversation.otherUser?.id}`}
                          onClick={() => setShowOptionsDropdown(false)}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center gap-2.5 transition"
                        >
                          <User className="w-4 h-4 text-sky-500" />
                          <span>{lang === 'bn' ? 'পাবলিক প্রোফাইল পেজ ↗' : 'Public Profile Page ↗'}</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* =========================================================================
                TAB 1: CHAT FEED & COMPOSER
            ========================================================================= */}
            {activeHeaderTab === 'chat' && (
              <>
                {/* Top Safety Awareness Banner */}
                {chatRulesConfig?.isEnabled && (
                  <div className="px-3 sm:px-4 pt-2.5 pb-1 shrink-0">
                    <div
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs ${
                        (bannerThemeStyles[chatRulesConfig.banner?.theme] || bannerThemeStyles.amber).bg
                      } ${
                        (bannerThemeStyles[chatRulesConfig.banner?.theme] || bannerThemeStyles.amber).border
                      }`}
                    >
                      {/* Clickable Header Bar */}
                      <div
                        onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                        className="px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-2 cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-base sm:text-lg shrink-0">🛡️</span>
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {chatRulesConfig.banner?.badgeText && (
                              <span
                                className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                  (bannerThemeStyles[chatRulesConfig.banner?.theme] || bannerThemeStyles.amber).badge
                                }`}
                              >
                                {chatRulesConfig.banner.badgeText}
                              </span>
                            )}
                            <span className="text-xs sm:text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {chatRulesConfig.banner?.title || 'SafnexBD অফিসিয়াল সুরক্ষা ও লেনদেন গাইডলাইন'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRulesExpanded(!isRulesExpanded);
                          }}
                          className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition shrink-0 ${
                            (bannerThemeStyles[chatRulesConfig.banner?.theme] || bannerThemeStyles.amber).link
                          }`}
                        >
                          <span className="hidden xs:inline">
                            {isRulesExpanded
                              ? (lang === 'bn' ? 'সংক্ষিপ্ত করুন' : 'Collapse')
                              : (lang === 'bn' ? 'নিয়মগুলো দেখুন' : 'View Rules')}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isRulesExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Expandable Body */}
                      {isRulesExpanded && (
                        <div className="px-3.5 pb-3 sm:pb-3.5 pt-1 border-t border-black/5 dark:border-white/5 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          {chatRulesConfig.banner?.subtitle && (
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {chatRulesConfig.banner.subtitle}
                            </p>
                          )}

                          {/* Rules Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
                            {(chatRulesConfig.banner?.rules || []).map((rule: any, idx: number) => (
                              <div
                                key={rule.id || idx}
                                className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-start gap-2.5"
                              >
                                <span className="text-lg sm:text-xl shrink-0 mt-0.5">{rule.icon || '🛡️'}</span>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                    {rule.title}
                                  </h5>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                    {rule.desc}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 🚨 AI Real-Time Safety Warning Banner */}
                {safetyAlerts.length > 0 && (
                  <div className="px-3 sm:px-4 pt-2 space-y-2">
                    {safetyAlerts.map((alert, idx) => (
                      <div
                        key={alert.id || idx}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-black text-amber-900 dark:text-amber-200">
                            {alert.warningText}
                          </p>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                            {lang === 'bn'
                              ? 'SafnexBD এসক্রো ছাড়া ব্যক্তিগত বিকাশ/নগদে লেনদেন করলে প্ল্যাটফর্ম কোনো সুরক্ষা প্রদান করতে পারবে না।'
                              : 'Transactions outside SafnexBD Escrow cannot be protected against fraud or scams.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSafetyAlerts((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 💡 AI Smart Deal Proposal Card */}
                {smartDealProposal && (
                  <div className="px-3 sm:px-4 pt-2">
                    <div className="p-3.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                            {lang === 'bn' ? '💡 এআই ডিল শনাক্ত করেছে:' : '💡 AI Deal Detected:'}{' '}
                            <span className="text-indigo-600 dark:text-indigo-400">{smartDealProposal.title}</span> — ৳{smartDealProposal.amount}
                          </p>
                          <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                            {lang === 'bn'
                              ? '১-ক্লিকে এখনই অফিসিয়াল সুরক্ষিত এসক্রো পেমেন্ট তৈরি করুন'
                              : 'Create official protected escrow payment in 1-click'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setPayAmount(String(smartDealProposal.amount));
                            setPayReason(smartDealProposal.title || '');
                            setShowPayModal(true);
                            setSmartDealProposal(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
                        >
                          {lang === 'bn' ? 'এসক্রো তৈরি করুন' : 'Create Escrow'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSmartDealProposal(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 min-h-0">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20 text-slate-400 text-sm gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" /> Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
                    <Smile className="w-7 h-7" />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Say hello!</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Send a message or tap the ＋ button to send or request money.
                  </p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateLabel, dateMsgs]) => (
                  <div key={dateLabel} className="space-y-3">
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-2">
                      <span className="px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/80 text-[11px] font-medium text-slate-600 dark:text-slate-400 shadow-sm">
                        {dateLabel}
                      </span>
                    </div>

                    {dateMsgs.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      // 1. IN-CHAT PAYMENT REQUEST CARD (💸 Pay Request)
                      if (msg.messageType === 'PAY_REQUEST') {
                        const meta = msg.metadata || {};
                        const isSender = meta.senderId === user?.id || (isMe && meta.receiverId !== user?.id);
                        const isReceiver = meta.receiverId === user?.id || (!isMe && meta.senderId !== user?.id);
                        const status = meta.status || 'REQUESTED';
                        const amount = Number(meta.amount || 0);
                        const trackingNumber = meta.trackingNumber || 'TXN-PENDING';
                        const senderDisplayName = meta.senderName || getUserDisplayName(msg.sender);
                        const senderUniqueId = meta.uniqueUserId || msg.sender?.uniqueUserId || 'User';

                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                              {/* Top Bar */}
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                  <span className="text-lg">💸</span>
                                  <span>SafnexBD Escrow Pay</span>
                                </div>

                                {/* Status Pill */}
                                {status === 'COMPLETED' || status === 'RELEASED' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Released
                                  </span>
                                ) : status === 'REJECTED' || status === 'REFUNDED' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> Cancelled
                                  </span>
                                ) : status === 'DISPUTED' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Under Dispute
                                  </span>
                                ) : status === 'HOLD' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Held in Escrow
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Proposal Requested
                                  </span>
                                )}
                              </div>

                              {/* Amount Display */}
                              <div className="text-center py-2">
                                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                  ৳{amount?.toLocaleString()}
                                </div>

                                {/* Headline Requested Copy */}
                                {status === 'REQUESTED' ? (
                                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                                    {isReceiver ? (
                                      <span>
                                        <strong>{senderDisplayName}</strong> আপনাকে <strong>৳{amount?.toLocaleString()}</strong> গ্রহন রিকোয়েস্ট করেছে
                                      </span>
                                    ) : (
                                      <span>
                                        আপনি <strong>{getUserDisplayName(activeConversation?.otherUser)}</strong> কে <strong>৳{amount?.toLocaleString()}</strong> গ্রহনের রিকোয়েস্ট পাঠিয়েছেন
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500 mt-1">
                                    {isSender
                                      ? `আপনি ${getUserDisplayName(activeConversation?.otherUser)} এর জন্য ৳${amount?.toLocaleString()} হোল্ডে রেখেছেন`
                                      : `${senderDisplayName} আপনার জন্য ৳${amount?.toLocaleString()} হোল্ডে জমা রেখেছেন`}
                                  </div>
                                )}
                              </div>

                              {/* Sender Details & Notes Box */}
                              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                                  <span>প্রেরক: <strong>{senderDisplayName}</strong></span>
                                  <span>ID: <strong>{senderUniqueId}</strong></span>
                                </div>
                                {meta.notes && (
                                  <div className="text-slate-700 dark:text-slate-300">
                                    <span className="text-slate-400 font-medium">নোট: </span>
                                    <span>&ldquo;{meta.notes}&rdquo;</span>
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg leading-relaxed border border-slate-200/40 dark:border-slate-700/40">
                                  🛡️ <strong>Admin Note:</strong> {meta.adminNote || 'SafnexBD এসক্রো সুরক্ষা: অনুমোদন করার পর টাকা হোল্ড ব্যালেন্সে যুক্ত হবে এবং কাজ সম্পন্ন হলে রিলিজ করা যাবে।'}
                                </div>
                              </div>

                              {/* Tracking ID with Copy */}
                              <div className="flex items-center justify-between mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500">
                                <span>TXN: {trackingNumber}</span>
                                <button
                                  onClick={() => copyToClipboard(trackingNumber)}
                                  className="hover:text-emerald-600 text-slate-400 transition-colors flex items-center gap-1"
                                >
                                  {copiedTracking ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              {/* PHASE 1: STATUS === 'REQUESTED' */}
                              {status === 'REQUESTED' && (
                                <div className="mt-4">
                                  {isReceiver ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => handleApproveRequest(meta.transactionId)}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                                      >
                                        <Check className="w-4 h-4" />
                                        <span>Approve (অনুমোদন)</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeclinePayRequest(meta.transactionId)}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-900 transition flex items-center justify-center gap-1.5"
                                      >
                                        <X className="w-4 h-4" />
                                        <span>Reject (বাতিল)</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="text-center text-xs text-amber-600 dark:text-amber-400 font-medium py-1">
                                        ⏳ রিসিভারের অনুমোদনের অপেক্ষায়...
                                      </div>
                                      <button
                                        onClick={() => handleDeclinePayRequest(meta.transactionId)}
                                        disabled={actionLoading}
                                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs transition flex items-center justify-center gap-1"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>রিকোয়েস্ট বাতিল করুন</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* PHASE 2: STATUS === 'HOLD' */}
                              {status === 'HOLD' && (
                                <div className="mt-4 space-y-2.5">
                                  {isSender ? (
                                    <>
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Sender Action 1: Release Money */}
                                        <button
                                          onClick={() => handleReleasePayRequest(meta.transactionId)}
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 ring-2 ring-emerald-400/30 active:scale-[0.98] cursor-pointer"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                          <span>💸 রিলিজ করুন</span>
                                        </button>

                                        {/* Sender Action 2: Dispute */}
                                        <button
                                          onClick={() =>
                                            setShowDisputeModal({
                                              transactionId: meta.transactionId,
                                              amount,
                                              trackingNumber,
                                            })
                                          }
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-300/60 dark:border-amber-700/60 transition flex items-center justify-center gap-1.5"
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>⚠ ডিসপ্যুট</span>
                                        </button>
                                      </div>

                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
                                        🔒 <strong>এসক্রো সুরক্ষা:</strong> সেন্ডার নিজে সরাসরি হোল্ড ব্যালেন্স ফেরত নিতে পারবেন না। রিফান্ডের প্রয়োজন হলে ডিসপ্যুট করুন—অ্যাডমিন চ্যাট ও কাজের প্রমাণাদি খতিয়ে দেখে রিফান্ড প্রদান করবেন।
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Receiver Action 1: Request Release */}
                                        <button
                                          onClick={() => handleRequestRelease(meta.transactionId)}
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                                        >
                                          <Bell className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                                          <span>🔔 রিলিজের অনুরোধ</span>
                                        </button>

                                        {/* Receiver Action 2: Dispute */}
                                        <button
                                          onClick={() =>
                                            setShowDisputeModal({
                                              transactionId: meta.transactionId,
                                              amount,
                                              trackingNumber,
                                            })
                                          }
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-300/60 dark:border-amber-700/60 transition flex items-center justify-center gap-1.5"
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>⚠ ডিসপ্যুট</span>
                                        </button>
                                      </div>

                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                                        কাজ সম্পন্ন হলে ক্লায়েন্ট রিলিজ করবেন। ক্লায়েন্ট রিলিজ করলেই মূল ব্যালেন্সে যোগ হবে।
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* PHASE 3: STATUS === 'DISPUTED' */}
                              {status === 'DISPUTED' && (
                                <div className="mt-4 space-y-2">
                                  {isSender && (
                                    <button
                                      onClick={() => handleWithdrawDispute(meta.transactionId)}
                                      disabled={actionLoading}
                                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                      <span>↩ ডিসপ্যুট প্রত্যাহার ও রিলিজ করুন</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setActiveHeaderTab('admin_calling')}
                                    className="w-full py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-300/60 transition flex items-center justify-center gap-1.5"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>অ্যাডমিন কলিং কিউ স্ট্যাটাস দেখুন</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // 2. IN-CHAT REQUEST MONEY CARD (💰 Request Money)
                      if (msg.messageType === 'RECEIVE_REQUEST') {
                        const meta = msg.metadata || {};
                        const amount = Number(meta.amount || 0);
                        const status = meta.status || 'REQUESTED';
                        const trackingNumber = meta.trackingNumber || 'TXN-PENDING';
                        const requesterDisplayName = meta.requesterName || getUserDisplayName(msg.sender);
                        const requesterUniqueId = meta.uniqueUserId || msg.sender?.uniqueUserId || 'User';
                        const isRequester = msg.senderId === user?.id || (meta.requesterId === user?.id);
                        const isPayer = !isRequester;

                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                              {/* Top Bar */}
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                                  <span className="text-lg">💰</span>
                                  <span>SafnexBD Money Request</span>
                                </div>

                                {/* Status Pill */}
                                {status === 'COMPLETED' || status === 'RELEASED' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Released
                                  </span>
                                ) : status === 'REJECTED' || status === 'REFUNDED' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> Cancelled
                                  </span>
                                ) : status === 'DISPUTED' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Under Dispute
                                  </span>
                                ) : status === 'HOLD' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Held in Escrow
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Payment Requested
                                  </span>
                                )}
                              </div>

                              <div className="text-center py-2">
                                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                                  ৳{amount?.toLocaleString()}
                                </div>

                                {/* Headline Announcement */}
                                {status === 'REQUESTED' ? (
                                  <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200/50 dark:border-blue-800/40">
                                    {isPayer ? (
                                      <span>
                                        <strong>{requesterDisplayName}</strong> আপনাকে <strong>৳{amount?.toLocaleString()}</strong> প্রদান রিকোয়েস্ট করেছে
                                      </span>
                                    ) : (
                                      <span>
                                        আপনি <strong>{getUserDisplayName(activeConversation?.otherUser)}</strong> এর কাছে <strong>৳{amount?.toLocaleString()}</strong> প্রদানের রিকোয়েস্ট পাঠিয়েছেন
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500 mt-1">
                                    {isPayer
                                      ? `আপনি ৳${amount?.toLocaleString()} টাকা এসক্রো হোল্ডে রেখেছেন`
                                      : `${requesterDisplayName} এর জন্য ৳${amount?.toLocaleString()} টাকা এসক্রো হোল্ডে লক আছে`}
                                  </div>
                                )}
                              </div>

                              {/* Details Box */}
                              <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                                  <span>রিকোয়েস্টার: <strong>{requesterDisplayName}</strong></span>
                                  <span>ID: <strong>{requesterUniqueId}</strong></span>
                                </div>
                                {(meta.reason || meta.notes) && (
                                  <div className="text-slate-700 dark:text-slate-300">
                                    <span className="text-slate-400 font-medium">নোট: </span>
                                    <span>&ldquo;{meta.reason || meta.notes}&rdquo;</span>
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg leading-relaxed border border-slate-200/40 dark:border-slate-700/40">
                                  🛡️ <strong>Admin Note:</strong> {meta.adminNote || 'প্রেরক অনুমোদন দিলে টাকা হোল্ডে সুরক্ষিত হবে এবং কাজ সন্তোষজনকভাবে শেষ হলে প্রেরক রিলিজ করবেন।'}
                                </div>
                              </div>

                              {/* Tracking ID with Copy */}
                              {trackingNumber !== 'TXN-PENDING' && (
                                <div className="flex items-center justify-between mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-500">
                                  <span>TXN: {trackingNumber}</span>
                                  <button
                                    onClick={() => copyToClipboard(trackingNumber)}
                                    className="hover:text-emerald-600 text-slate-400 transition-colors flex items-center gap-1"
                                  >
                                    {copiedTracking ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* PHASE 1: STATUS === 'REQUESTED' */}
                              {status === 'REQUESTED' && (
                                <div className="mt-4">
                                  {isPayer ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => handleApproveRequest(meta.transactionId)}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                                      >
                                        <Check className="w-4 h-4" />
                                        <span>Approve & Hold</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeclinePayRequest(meta.transactionId)}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                                      >
                                        <X className="w-4 h-4" />
                                        <span>Reject</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="text-center text-xs text-blue-600 dark:text-blue-400 font-medium py-1">
                                        ⏳ প্রেরকের অনুমোদনের অপেক্ষায়...
                                      </div>
                                      <button
                                        onClick={() => handleDeclinePayRequest(meta.transactionId)}
                                        disabled={actionLoading}
                                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs transition flex items-center justify-center gap-1"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                        <span>রিকোয়েস্ট বাতিল করুন</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* PHASE 2: STATUS === 'HOLD' */}
                              {status === 'HOLD' && (
                                <div className="mt-4 space-y-2.5">
                                  {isPayer ? (
                                    <>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          onClick={() => handleReleasePayRequest(meta.transactionId)}
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 ring-2 ring-emerald-400/30 active:scale-[0.98] cursor-pointer"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                          <span>💸 রিলিজ করুন</span>
                                        </button>

                                        <button
                                          onClick={() =>
                                            setShowDisputeModal({
                                              transactionId: meta.transactionId,
                                              amount,
                                              trackingNumber,
                                            })
                                          }
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-300/60 dark:border-amber-700/60 transition flex items-center justify-center gap-1.5"
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>⚠ ডিসপ্যুট</span>
                                        </button>
                                      </div>

                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl leading-relaxed border border-slate-200/50 dark:border-slate-700/50">
                                        🔒 <strong>এসক্রো সুরক্ষা:</strong> সেন্ডার নিজে সরাসরি হোল্ড ব্যালেন্স ফেরত নিতে পারবেন না। রিফান্ডের প্রয়োজন হলে ডিসপ্যুট করুন।
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button
                                          onClick={() => handleRequestRelease(meta.transactionId)}
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                                        >
                                          <Bell className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                                          <span>🔔 রিলিজের অনুরোধ</span>
                                        </button>

                                        <button
                                          onClick={() =>
                                            setShowDisputeModal({
                                              transactionId: meta.transactionId,
                                              amount,
                                              trackingNumber,
                                            })
                                          }
                                          disabled={actionLoading}
                                          className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-xs border border-amber-300/60 dark:border-amber-700/60 transition flex items-center justify-center gap-1.5"
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>⚠ ডিসপ্যুট</span>
                                        </button>
                                      </div>

                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                                        কাজ সম্পন্ন হলে ক্লায়েন্ট রিলিজ করবেন।
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* PHASE 3: STATUS === 'DISPUTED' */}
                              {status === 'DISPUTED' && (
                                <div className="mt-4 space-y-2">
                                  {isPayer && (
                                    <button
                                      onClick={() => handleWithdrawDispute(meta.transactionId)}
                                      disabled={actionLoading}
                                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                      <span>↩ ডিসপ্যুট প্রত্যাহার ও রিলিজ করুন</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setActiveHeaderTab('admin_calling')}
                                    className="w-full py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-300/60 transition flex items-center justify-center gap-1.5"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>অ্যাডমিন কলিং কিউ স্ট্যাটাস দেখুন</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // 3. SYSTEM NOTIFICATION MESSAGE (WITH SPECIAL HIGH-PRIORITY RELEASE REQUEST CARD)
                      if (msg.messageType === 'SYSTEM') {
                        const isReleaseRequest =
                          msg.metadata?.type === 'RELEASE_REQUEST' ||
                          msg.content?.includes('রিলিজের অনুরোধ') ||
                          msg.content?.includes('Release Request');

                        if (isReleaseRequest) {
                          const trxId = msg.metadata?.transactionId;
                          const trackingNum =
                            msg.metadata?.trackingNumber ||
                            msg.content?.match(/TRX:\s*([A-Za-z0-9_-]+)/)?.[1] ||
                            '';
                          const amountVal =
                            msg.metadata?.amount ??
                            msg.content?.match(/৳\s*([0-9,.]+)/)?.[1];
                          const isRequester = msg.senderId === user?.id;

                          return (
                            <div key={msg.id} className="flex justify-center my-3 px-2 sm:px-4">
                              <div className="w-full max-w-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/30 border-2 border-amber-500/60 dark:border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20 backdrop-blur-sm relative overflow-hidden">
                                {/* Ambient decorative glow */}
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

                                {/* Header Banner */}
                                <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="relative">
                                      <span className="flex h-3 w-3 absolute -top-0.5 -right-0.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                      </span>
                                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                                        <Bell className="w-4 h-4 animate-bounce" />
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300 tracking-tight flex items-center gap-1.5">
                                        <span>{lang === 'bn' ? '🔔 জরুরি পেমেন্ট রিলিজের অনুরোধ' : '🔔 Payment Release Request'}</span>
                                        <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                                          ACTION REQUIRED
                                        </span>
                                      </h4>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {lang === 'bn' ? 'সেলার কাজ সম্পন্ন করেছেন এবং ব্যালেন্স রিলিজের আবেদন জানিয়েছেন' : 'Seller marked work complete and requested payment release'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                                    {timeStr}
                                  </span>
                                </div>

                                {/* Amount & Trx Info */}
                                <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-3.5 sm:p-4 border border-amber-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      {lang === 'bn' ? 'অনুরোধকৃত রিলিজের পরিমাণ' : 'Requested Release Amount'}
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                                      <span>৳</span>
                                      <span>{amountVal ? Number(amountVal).toLocaleString() : '---'}</span>
                                    </div>
                                  </div>

                                  {trackingNum && (
                                    <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                                      <span className="text-[10px] text-slate-400 font-mono">TRX:</span>
                                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{trackingNum}</span>
                                      <button
                                        onClick={() => copyToClipboard(trackingNum)}
                                        title="Copy Transaction ID"
                                        className="p-1 text-slate-400 hover:text-emerald-500 transition"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Instructions & Actions */}
                                {isRequester ? (
                                  <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 font-medium">
                                    <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
                                    <span>
                                      {lang === 'bn'
                                        ? 'আপনি ক্লায়েন্টের কাছে পেমেন্ট রিলিজের অনুরোধ পাঠিয়েছেন। ক্লায়েন্ট কাজ যাচাই করে টাকা রিলিজ করার সাথে সাথে আপনার মূল ব্যালেন্সে যোগ হবে।'
                                        : 'You requested payment release. As soon as the client approves, funds will be released to your main wallet balance.'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-2.5">
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                      {lang === 'bn'
                                        ? 'অনুগ্রহ করে সেলারের প্রদানকৃত কাজ/পণ্য সঠিকভাবে যাচাই করুন। সব ঠিক থাকলে অবিলম্বে টাকা রিলিজ করুন। কোনো অমিল বা সমস্যা থাকলে ডিসপ্যুট ওপেন করতে পারেন।'
                                        : 'Please verify the completed work/goods delivered by the seller. If everything is satisfactory, release the payment now or open a dispute if needed.'}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                      {trxId ? (
                                        <button
                                          onClick={() => handleReleasePayRequest(trxId)}
                                          disabled={actionLoading}
                                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-400/30"
                                        >
                                          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                                          <span>{lang === 'bn' ? '💸 এখনই টাকা রিলিজ করুন' : '💸 Release Payment Now'}</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => setActiveHeaderTab('transaction')}
                                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                          <span>💸 ট্রানজেকশন থেকে রিলিজ করুন</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() =>
                                          setShowDisputeModal({
                                            transactionId: trxId || '',
                                            amount: Number(amountVal || 0),
                                            trackingNumber: trackingNum,
                                          })
                                        }
                                        disabled={actionLoading}
                                        className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                                      >
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <span>{lang === 'bn' ? '⚠️ সমস্যা হলে ডিসপ্যুট করুন' : '⚠️ Open Dispute If Issue'}</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <div className="max-w-md px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs text-center leading-relaxed font-sans shadow-sm whitespace-pre-line border border-slate-300/40 dark:border-slate-700/50">
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      // 3.5 OFFICIAL ADMIN INTERVENTION MESSAGE (🛡️ Official Notice)
                      if (msg.messageType === 'ADMIN_INTERVENTION' || msg.metadata?.isAdminNotice) {
                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <div className="w-full max-w-lg bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-slate-900/5 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-950 border-2 border-amber-500/50 dark:border-amber-500/40 rounded-2xl p-4 shadow-lg">
                              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20 mb-2.5">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                                  <span>{msg.metadata?.adminTitle || 'SafnexBD Authority Notice / অফিসিয়াল নোটিশ'}</span>
                                </div>
                                {msg.metadata?.adminName && (
                                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-mono text-amber-800 dark:text-amber-300 font-semibold">
                                    🛡️ {msg.metadata.adminName}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                                {msg.content}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800">
                                <span>🛡️ Verified Platform Supervision</span>
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 4. NORMAL CHAT BUBBLE (Messenger Style)
                      const isSelected = selectedMessageId === msg.id;
                      const fullDateStr = new Date(msg.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                      const fullTimeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <div className="shrink-0 mb-1">
                              {activeConversation.otherUser?.avatarUrl ? (
                                <img
                                  src={getImageUrl(activeConversation.otherUser.avatarUrl)}
                                  alt={getUserDisplayName(activeConversation.otherUser)}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                                  {getUserDisplayName(activeConversation.otherUser).charAt(0)}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col max-w-[82%] sm:max-w-[75%] md:max-w-[65%]">
                            <div
                              onClick={() => setSelectedMessageId((prev) => (prev === msg.id ? null : msg.id))}
                              className={`rounded-2xl px-4 py-2.5 text-sm shadow-xs leading-relaxed cursor-pointer transition-all select-none active:scale-[0.99] ${
                                isMe
                                  ? 'bg-emerald-600 text-white rounded-br-xs hover:bg-emerald-700'
                                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-100 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                              title={lang === 'bn' ? 'তারিখ ও সময় দেখতে ক্লিক করুন' : 'Click to view exact date & time'}
                            >
                              {/* Text content */}
                              {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                              {/* Attachments */}
                              {msg.attachments?.map((att: any, idx: number) => {
                                const isImage =
                                  att.fileType === 'IMAGE' ||
                                  att.fileType?.toLowerCase() === 'image' ||
                                  /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl || '');

                                if (isImage) {
                                  return (
                                    <div key={idx} className="mt-2 rounded-xl overflow-hidden cursor-pointer">
                                      <img
                                        src={getImageUrl(att.fileUrl)}
                                        alt="attachment"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxImage(getImageUrl(att.fileUrl));
                                        }}
                                        className="max-h-60 rounded-xl object-cover hover:opacity-95 transition-opacity"
                                      />
                                    </div>
                                  );
                                }
                                return (
                                  <a
                                    key={idx}
                                    href={getImageUrl(att.fileUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`mt-2 flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-colors ${
                                      isMe
                                        ? 'bg-emerald-700/50 border-emerald-500/40 text-white hover:bg-emerald-700'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
                                    <span className="truncate flex-1">Document Attachment</span>
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                  </a>
                                );
                              })}

                              {/* Timestamp & Read Receipt */}
                              <div
                                className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                  isMe ? 'text-emerald-100' : 'text-slate-400'
                                }`}
                              >
                                <span>{timeStr}</span>
                                {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />}
                              </div>
                            </div>

                            {/* Detailed Timestamp on Click */}
                            {isSelected && (
                              <div
                                className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5 shadow-2xs border ${
                                  isMe
                                    ? 'self-end bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                                    : 'self-start bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>
                                  {fullDateStr} {fullTimeStr}
                                </span>
                                {isMe && (
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    • {lang === 'bn' ? 'প্রেরিত' : 'Delivered'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {otherUserTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic py-1">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{getUserDisplayName(activeConversation.otherUser)} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Preview Strip */}
            {selectedFile && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {filePreview ? (
                    <img src={filePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 text-emerald-500" />
                  )}
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <span className="text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Composer (Messenger Style) */}
            <div className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 relative shrink-0">
              {/* PLUS BUTTON POPOVER MENU */}
              {showPlusMenu && (
                <div className="absolute bottom-16 left-3 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-30 space-y-1">
                  <button
                    onClick={() => {
                      setShowPlusMenu(false);
                      setShowPayModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <span>💸 Pay Money</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowPlusMenu(false);
                      setShowRequestModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <span>💰 Request Money</span>
                  </button>

                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span>📷 Photo</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <span>📎 File</span>
                  </button>
                </div>
              )}

              {/* EMOJI PICKER POPOVER */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-30 w-64">
                  <div className="grid grid-cols-6 gap-2">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessageInput((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-xl hover:scale-125 transition-transform p-1 text-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Message Templates Chips Bar */}
              {!isConvLocked && Array.isArray(chatRulesConfig?.templates) && chatRulesConfig.templates.length > 0 && (
                showTemplatesBar ? (
                  <div className="mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    {/* Filter Tabs & Close */}
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'কুইক মেসেজ:' : 'Quick Replies:'}</span>
                        </span>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                          {(['ALL', 'BUYER', 'SELLER'] as const).map((filter) => (
                            <button
                              key={filter}
                              type="button"
                              onClick={() => setTemplateAudienceFilter(filter)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                                templateAudienceFilter === filter
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              {filter === 'ALL'
                                ? (lang === 'bn' ? 'সব' : 'All')
                                : filter === 'BUYER'
                                ? (lang === 'bn' ? 'বায়ার' : 'Buyer')
                                : (lang === 'bn' ? 'সেলার' : 'Seller')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Minimize / Hide Button */}
                      <button
                        type="button"
                        onClick={() => setShowTemplatesBar(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
                        title={lang === 'bn' ? 'কুইক মেসেজ লুকান' : 'Hide Quick Replies'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Chips Horizontal Carousel */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none no-scrollbar">
                      {chatRulesConfig.templates
                        .filter(
                          (t: any) =>
                            templateAudienceFilter === 'ALL' ||
                            t.target === 'ALL' ||
                            t.target === templateAudienceFilter,
                        )
                        .map((t: any) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setMessageInput((prev) => (prev ? `${prev} ${t.text}` : t.text));
                              textInputRef.current?.focus();
                            }}
                            className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-slate-100 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-400/50 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition shrink-0 active:scale-95 shadow-2xs cursor-pointer"
                            title={t.text}
                          >
                            <span>{t.icon || '💬'}</span>
                            <span>{t.title}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  /* Collapsed trigger button */
                  <div className="mb-1 flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => setShowTemplatesBar(true)}
                      className="px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-full flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{lang === 'bn' ? '⚡ কুইক মেসেজ চিপস দেখান' : '⚡ Show Quick Replies'}</span>
                    </button>
                  </div>
                )
              )}

              {isConvLocked ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-400">
                  <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold">
                      {lang === 'bn'
                        ? '🔒 এই চ্যাটটি অ্যাডমিন সাময়িকভাবে বন্ধ বা লক করে রেখেছেন'
                        : '🔒 This conversation has been locked by Administrator'}
                    </p>
                    <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                      {convLockReason ||
                        (lang === 'bn'
                          ? 'বর্তমানে এই চ্যাটে নতুন মেসেজ পাঠানো বন্ধ রয়েছে। যেকোনো সহায়তার জন্য হেল্পলাইন বা ডিসপ্যুট ব্যবহার করুন।'
                          : 'Sending new messages is disabled. Please contact support or use admin calling queue.')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* ＋ Button */}
                  <button
                    type="button"
                    onClick={() => setShowPlusMenu(!showPlusMenu)}
                    className={`p-2.5 rounded-full transition-colors ${
                      showPlusMenu
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Hidden File Inputs */}
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Text Input */}
                  <input
                    ref={textInputRef}
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-full placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-slate-800/90 border border-transparent focus:border-emerald-500/30 transition-all"
                  />

                  {/* Send Button */}
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!messageInput.trim() && !selectedFile}
                    className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-all shrink-0 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* =========================================================================
            TAB 2: TRANSACTIONS LIST & ESCROW ACTIONS
        ========================================================================= */}
        {activeHeaderTab === 'transaction' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>চ্যাট ভিত্তিক লেনদেনসমূহ (Conversation Transactions)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    এই চ্যাটে প্রেরিত সমস্ত পে রিকোয়েস্ট, এসক্রো হোল্ড ও লেনদেনের ইতিহাস
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>💸 Pay Money</span>
                  </button>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>💰 Request Money</span>
                  </button>
                </div>
              </div>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">মোট লেনদেন</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {conversationTransactions.length}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 shadow-sm">
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>এসক্রো হোল্ড</span>
                  </div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-1 font-mono">
                    ৳{conversationTransactions
                      .filter((t) => t.status === 'HOLD')
                      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>মূল ব্যালেন্সে রিলিজ</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1 font-mono">
                    ৳{conversationTransactions
                      .filter((t) => t.status === 'RELEASED' || t.status === 'COMPLETED')
                      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 shadow-sm">
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>বিরোধপূর্ণ (Disputed)</span>
                  </div>
                  <div className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-1 font-mono">
                    ৳{conversationTransactions
                      .filter((t) => t.status === 'DISPUTED')
                      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              {conversationTransactions.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">কোনো লেনদেন পাওয়া যায়নি</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    এই চ্যাটে এখনও কোনো লেনদেন শুরু হয়নি। নিচের বাটনে ক্লিক করে টাকা পাঠানো বা চাওয়ার প্রস্তাব তৈরি করুন।
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setShowPayModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                    >
                      💸 Pay Money
                    </button>
                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                    >
                      💰 Request Money
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationTransactions.map((txn: any) => {
                    const targetTxnId = txn.transactionId || txn.id || txn.trackingNumber || txn.referenceId;
                    const status = txn.status || 'REQUESTED';
                    const amount = Number(txn.amount || 0);
                    const commission = Number(txn.commission || (amount * 0.05));
                    const trackingNumber = txn.trackingNumber || 'TXN-PENDING';

                    // SenderId in Escrow is ALWAYS the Payer/Buyer whose money was placed in Escrow Hold.
                    // ReceiverId in Escrow is ALWAYS the Receiver/Seller/Freelancer who delivers and gets paid.
                    let isPayer = false;
                    let isReceiver = false;

                    if (txn.receiverId && txn.receiverId === user?.id) {
                      isReceiver = true;
                      isPayer = false;
                    } else if (txn.senderId && txn.senderId === user?.id) {
                      isPayer = true;
                      isReceiver = false;
                    } else if (txn.initiatorRole === 'RECEIVER' || txn.messageType === 'RECEIVE_REQUEST') {
                      // In RECEIVE_REQUEST, the requester/author is the receiver (seller)
                      const isInitiator = (txn.authorSenderId && txn.authorSenderId === user?.id) || (txn.requesterId && txn.requesterId === user?.id);
                      isReceiver = isInitiator;
                      isPayer = !isInitiator;
                    } else {
                      // In PAY_REQUEST, the requester/author is the payer (buyer)
                      const isInitiator = (txn.authorSenderId && txn.authorSenderId === user?.id) || (txn.senderId && txn.senderId === user?.id);
                      isPayer = isInitiator;
                      isReceiver = !isInitiator;
                    }

                    // Who can approve REQUESTED:
                    // For RECEIVE_REQUEST, the Payer approves & locks funds into escrow.
                    // For PAY_REQUEST, the Receiver approves & accepts job.
                    const canApprove = (txn.messageType === 'RECEIVE_REQUEST' && isPayer) || (txn.messageType !== 'RECEIVE_REQUEST' && isReceiver);

                    return (
                      <div
                        key={targetTxnId || txn.messageId}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4"
                      >
                        {/* Top Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                              {trackingNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(trackingNumber)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                              title="Copy Tracking ID"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs text-slate-400">
                              • {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {status === 'REQUESTED' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> অপেক্ষমান (Requested)
                              </span>
                            )}
                            {status === 'HOLD' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" /> এসক্রো হোল্ডে সংরক্ষিত (In Hold)
                              </span>
                            )}
                            {(status === 'RELEASED' || status === 'COMPLETED') && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> মূল ব্যালেন্সে রিলিজ সম্পন্ন (Released)
                              </span>
                            )}
                            {status === 'DISPUTED' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> অ্যাডমিন কলিং কিউতে (Disputed)
                              </span>
                            )}
                            {(status === 'REJECTED' || status === 'CANCELLED') && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> বাতিল (Cancelled)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mid Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-slate-400">লেনদেনের পরিমাণ</span>
                            <div className="font-bold text-base font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                              ৳{amount.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-slate-400">কমিশন: ৳{commission.toLocaleString()}</span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-slate-400">আপনার ভূমিকা (Role)</span>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                              {isPayer ? 'টাকা প্রেরক (Sender / Buyer)' : 'টাকা প্রাপক (Receiver / Seller)'}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              ধরণ: {txn.messageType === 'PAY_REQUEST' ? 'পে রিকোয়েস্ট' : 'টাকা অনুরোধ'}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <span className="text-slate-400">কাজের নোট / বিবরণ</span>
                            <div className="font-semibold text-xs text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                              {txn.notes || txn.reason || 'Service Payment'}
                            </div>
                            {txn.adminNote && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block truncate">
                                অ্যাডমিন: {txn.adminNote}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contextual Actions in Card */}
                        <div className="pt-2">
                          {status === 'REQUESTED' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {canApprove ? (
                                <>
                                  <button
                                    onClick={() => handleApproveRequest(targetTxnId)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>অনুমোদন ও এসক্রো হোল্ড করুন (Approve & Hold)</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeclinePayRequest(targetTxnId)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 font-semibold text-xs transition flex items-center gap-1.5"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>প্রত্যাখ্যান (Reject)</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleDeclinePayRequest(targetTxnId)}
                                  disabled={actionLoading}
                                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>রিকোয়েস্ট বাতিল করুন (Cancel)</span>
                                </button>
                              )}
                            </div>
                          )}

                          {status === 'HOLD' && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Payer / Buyer Action: Release Money to Seller's Main Balance */}
                                {isPayer && (
                                  <button
                                    onClick={() => handleReleasePayRequest(targetTxnId)}
                                    disabled={actionLoading}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>💸 টাকা রিলিজ করুন (Release to Main Balance)</span>
                                  </button>
                                )}

                                {/* Receiver / Seller Action: Request Release from Client */}
                                {isReceiver && (
                                  <button
                                    onClick={() => handleRequestRelease(targetTxnId)}
                                    disabled={actionLoading}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                                  >
                                    <Bell className="w-4 h-4 text-slate-950 animate-bounce" />
                                    <span>🔔 রিলিজের অনুরোধ পাঠান (Request Release)</span>
                                  </button>
                                )}

                                {/* Fallback if roles somehow ambiguous: Show both so user is never blocked */}
                                {!isPayer && !isReceiver && (
                                  <>
                                    <button
                                      onClick={() => handleRequestRelease(targetTxnId)}
                                      disabled={actionLoading}
                                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
                                    >
                                      <Bell className="w-4 h-4" />
                                      <span>🔔 রিলিজের অনুরোধ পাঠান (Request Release)</span>
                                    </button>
                                    <button
                                      onClick={() => handleReleasePayRequest(targetTxnId)}
                                      disabled={actionLoading}
                                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>💸 টাকা রিলিজ করুন</span>
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => setShowDisputeModal({ ...txn, transactionId: targetTxnId })}
                                  disabled={actionLoading}
                                  className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 font-semibold text-xs transition flex items-center gap-1.5 border border-amber-200/60 dark:border-amber-800/40"
                                >
                                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                                  <span>⚠ ডিসপ্যুট (Dispute)</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                🔒 টাকা সেফনেক্সবিডি এসক্রো অ্যাকাউন্টে সুরক্ষিত আছে। প্রেরক নিজে সরাসরি ব্যালেন্স ফেরত নিতে পারবে না; রিফান্ডের জন্য অ্যাডমিন ডিসপ্যুট প্রয়োজন।
                              </p>
                            </div>
                          )}

                          {status === 'DISPUTED' && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {isPayer && (
                                  <button
                                    onClick={() => handleWithdrawDispute(targetTxnId)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>↩ ডিসপ্যুট প্রত্যাহার ও রিলিজ</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setActiveHeaderTab('admin_calling')}
                                  className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-300/60 transition flex items-center gap-1.5"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  <span>অ্যাডমিন কলিং কিউ স্ট্যাটাস দেখুন</span>
                                </button>
                              </div>
                              {txn.disputeReason && (
                                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                                  কারণ: {txn.disputeReason}
                                </p>
                              )}
                            </div>
                          )}

                          {(status === 'RELEASED' || status === 'COMPLETED') && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>লেনদেন সফলভাবে সম্পন্ন হয়েছে। মূল ব্যালেন্সে টাকা ট্রান্সফার সম্পন্ন।</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: SAFNEXBD ESCROW RULES & POLICIES
        ========================================================================= */}
        {activeHeaderTab === 'rules' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    SafnexBD নিরাপদ এসক্রো ও লেনদেন নীতিমালা
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    SafnexBD Escrow Safety Guidelines & Rules. উভয় পক্ষের আর্থিক সুরক্ষা এবং শতভাগ স্বচ্ছতা বজায় রাখার জন্য আমাদের নীতিমালা।
                  </p>
                </div>
              </div>

              {/* 4-Step Escrow Workflow */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  চার-ধাপের এসক্রো প্রক্রিয়া (4-Phase Escrow Process)
                </h4>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ১
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      লেনদেন প্রস্তাবনা (Requested Phase)
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      প্রেরক (Pay Request) বা প্রাপক (Request Money) যে কেউই প্রস্তাব পাঠাতে পারেন। এই ধাপে কারো অ্যাকাউন্ট থেকে টাকা কাটা হয় না। প্রাপক শর্তাবলী দেখে 'অনুমোদন (Approve)' করলে তবেই প্রেরকের ব্যালেন্স থেকে টাকা কেটে কোম্পানির এসক্রো হোল্ডে জমা হয়।
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ২
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      সুরক্ষিত হোল্ড ব্যালেন্স (Escrow Hold Phase)
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      টাকা হোল্ডে যাওয়ার পর প্রেরক বা প্রাপক কেউই সরাসরি নিজের মূল ব্যালেন্সে টাকা ফেরত নিতে পারবেন না। কাজ বা পণ্য শতভাগ বুঝিয়ে না দেওয়া পর্যন্ত টাকা কোম্পানির সুরক্ষিত অ্যাকাউন্টে লক থাকবে।
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ৩
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      মূল ব্যালেন্সে রিলিজ (Release Phase)
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      কাজ বা ডেলিভারি সঠিকভাবে সম্পন্ন হলে প্রেরক 'টাকা রিলিজ করুন' বাটনে চাপ দিলেই সাথে সাথে টাকা প্রাপকের মূল ব্যালেন্সে জমা হবে এবং প্রাপক তা উইথড্র করতে পারবেন। প্রাপক চাইলে প্রেরককে রিলিজের তাগাদা দিতে পারেন।
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ৪
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      বিরোধ নিষ্পত্তি ও অ্যাডমিন কলিং কিউ (Dispute & Admin Queue)
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      কাজে কোনো অসঙ্গতি বা অসততা দেখা দিলে যেকোনো পক্ষ 'ডিসপ্যুট' করতে পারেন। ডিসপ্যুট হওয়া মাত্র কেসটি অ্যাডমিন প্যানেল (<code className="text-emerald-600 font-mono">/admin/calling-queue</code>)-এ চলে যাবে। অ্যাডমিন চ্যাট রেকর্ড, স্ক্রিনশট ইত্যাদি যাচাই করে প্রেরককে রিফান্ড বা প্রাপককে রিলিজ অথবা হোল্ড সময় বাড়িয়ে ফয়সালা দেবেন।
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission & Fees */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>প্ল্যাটফর্ম কমিশন ও চার্জ (Fees & Commission)</span>
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  • প্রতিটি সফল লেনদেনে {txCommLabel} প্ল্যাটফর্ম ফি প্রযোজ্য, যা লেনদেন প্রস্তাব অনুমোদন করার সময় প্রেরকের অ্যাকাউন্ট থেকে কেটে নেওয়া হয়।
                  <br />
                  • প্রস্তাব প্রত্যাখ্যাত বা বাতিল হলে কোনো ফি কাটা হয় না।
                </p>
              </div>

              {/* Safety Warning */}
              <div className="bg-amber-50/70 dark:bg-amber-950/40 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>সতর্কবার্তা ও নিয়ম লঙ্ঘন (Security Warning)</span>
                </div>
                <p className="leading-relaxed">
                  ১. SafnexBD চ্যাটের বাইরে সরাসরি পার্সোনাল বিকাশ, নগদ বা ব্যাংকের মাধ্যমে লেনদেন করবেন না। বাইরের কোনো লেনদেনের প্রতারণার দায় সেফনেক্সবিডি বহন করবে না।
                  <br />
                  ২. সমস্ত কাজের ফাইল ও কথোপকথন এই চ্যাটেই রাখবেন। চ্যাট হিস্ট্রি অ্যাডমিন ডিসপ্যুট নিষ্পত্তির একমাত্র আইনি প্রমাণ হিসেবে গণ্য হয়।
                </p>
              </div>

              {/* Back to Chat Button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setActiveHeaderTab('chat')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  💬 চ্যাটে ফিরে যান (Back to Chat)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ADMIN CALLING QUEUE MONITOR & DISPUTE DESK
        ========================================================================= */}
        {activeHeaderTab === 'admin_calling' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Header */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Admin Calling Queue & Dispute Desk
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    অ্যাডমিন মধ্যস্থতা, বিরোধ নিষ্পত্তি ও সরাসরি কলিং কিউ মনিটর। অ্যাডমিন উভয় পক্ষের চ্যাট ও প্রমাণ পর্যালোচনা করে সিদ্ধান্ত প্রদান করেন।
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              {hasDispute ? (
                <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>সক্রিয় ডিসপ্যুট পর্যবেক্ষণ চলছে (Active Dispute Under Admin Review)</span>
                  </div>
                  <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                    এই চ্যাট থ্রেডের একটি লেনদেনে বিরোধের কারণে বিষয়টি বর্তমানে অ্যাডমিন প্যানেল কলিং কিউ (<code className="font-mono bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded">http://localhost:3000/admin/calling-queue</code>)-এ তালিকাভুক্ত রয়েছে। অ্যাডমিন টিম উভয় পক্ষের বার্তা ও কাজ পর্যালোচনা করছেন।
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>কোনো সক্রিয় বিরোধ নেই (No Active Disputes)</span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                    আপনার এই চ্যাটে বর্তমানে কোনো অমীমাংসিত অভিযোগ নেই। সমস্ত লেনদেন সেফনেক্সবিডি নিরাপদ এসক্রো কাঠামোর অধীনে স্বাভাবিকভাবে চলমান রয়েছে। কোনো সমস্যা হলে Transaction ট্যাব থেকে 'ডিসপ্যুট' করতে পারেন।
                  </p>
                </div>
              )}

              {/* Disputed Transactions Details */}
              {conversationTransactions
                .filter((t) => t.status === 'DISPUTED')
                .map((disputedTxn) => {
                  const isPayer = disputedTxn.senderId === user?.id || disputedTxn.sender?.id === user?.id;

                  return (
                    <div
                      key={disputedTxn.transactionId}
                      className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-rose-500/30 p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                          বিরোধপূর্ণ লেনদেন বিবরণী
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {disputedTxn.trackingNumber || 'TXN-PENDING'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-400">পরিমাণ (Amount)</span>
                          <div className="font-bold text-base font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                            ৳{Number(disputedTxn.amount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-400">বিরোধের কারণ (Reason)</span>
                          <div className="font-semibold text-xs text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                            {disputedTxn.disputeReason || 'Disputed'}
                          </div>
                        </div>
                      </div>

                      {disputedTxn.disputeDetails && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                          <span className="text-slate-400 block mb-1">প্রদত্ত বিস্তারিত অভিযোগ:</span>
                          <p className="text-slate-700 dark:text-slate-300 italic">
                            "{disputedTxn.disputeDetails}"
                          </p>
                        </div>
                      )}

                      {/* What happens next */}
                      <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span>অ্যাডমিন পরবর্তী পদক্ষেপসমূহ:</span>
                        </div>
                        <p className="leading-relaxed">
                          ১. অ্যাডমিন এই চ্যাটের বার্তা ও ফাইল অডিট করবেন।
                          <br />
                          ২. প্রয়োজনবোধে উভয় পক্ষকে সরাসরি ফোন বা কনফারেন্স কল করে বক্তব্য শুনবেন।
                          <br />
                          ৩. অ্যাডমিন চাইলে প্রেরকের মূল ব্যালেন্সে রিফান্ড, প্রাপককে রিলিজ বা হোল্ডের সময়সীমা বৃদ্ধি করতে পারেন।
                        </p>
                      </div>

                      {/* Withdrawal Button for Sender */}
                      {isPayer && (
                        <button
                          onClick={() => handleWithdrawDispute(disputedTxn.transactionId)}
                          disabled={actionLoading}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>↩ ডিসপ্যুট প্রত্যাহার ও রিলিজ করুন (Withdraw Dispute & Release)</span>
                        </button>
                      )}
                    </div>
                  );
                })}

              {/* How it works info */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>অ্যাডমিন কলিং ও মধ্যস্থতা ব্যবস্থার সুবিধা</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">📞 সরাসরি শুনানি</div>
                    <span>বিরোধ দেখা দিলে অ্যাডমিন প্যানেল থেকে উভয় পক্ষের সাথে সমন্বয় করা হয়।</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">⚖️ নিরপেক্ষ ফয়সালা</div>
                    <span>চ্যাট রেকর্ড ও প্রমাণের ভিত্তিতে নিরপেক্ষ সিদ্ধান্ত নেওয়া হয়।</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-1">🔒 জিরো ব্যালেন্স রিস্ক</div>
                    <span>বিরোধ নিষ্পত্তি না হওয়া পর্যন্ত অর্থ এসক্রো অ্যাকাউন্টে শতভাগ নিরাপদ থাকে।</span>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveHeaderTab('chat')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  💬 চ্যাটে ফিরে যান
                </button>
                <button
                  onClick={() => setActiveHeaderTab('transaction')}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
                >
                  💳 লেনদেন তালিকা দেখুন
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
            {isUserListCollapsed && (
              <button
                type="button"
                onClick={() => setIsUserListCollapsed(false)}
                className="mb-4 hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <PanelLeftOpen className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ইউজার তালিকা খুলুন' : 'Show User List'}</span>
              </button>
            )}
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
              <MessageSquare className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">SafnexBD Messenger</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
              Select someone from the People list or search for any user by name, phone, email or User ID to start
              chatting, sending money, or requesting payment.
            </p>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: Profile Preview Modal (Spec #4 & #19)
      ========================================================================= */}
      {showProfileModal && (() => {
        if (!loadingProfileModal && !profileModalDetails) {
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-center space-y-4 my-8 animate-in zoom-in-95">
                <button
                  onClick={() => setShowProfileModal(null)}
                  className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="py-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ব্যবহারকারী পাওয়া যায়নি' : 'User Not Found'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {lang === 'bn'
                      ? 'এই অ্যাকাউন্টটি মুছে ফেলা হয়েছে বা সিস্টেমে সক্রিয় নেই।'
                      : 'This account has been deleted or is no longer active on the platform.'}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const deletedId = showProfileModal?.id;
                        setShowProfileModal(null);
                        if (activeConversation?.otherUser?.id === deletedId) {
                          setActiveConversation(null);
                        }
                        fetchConversations();
                      }}
                      className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition shadow-sm"
                    >
                      {lang === 'bn' ? 'ঠিক আছে' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const u = profileModalDetails || showProfileModal;
        const displayName = getUserDisplayName(u);
        const headline = u.headline || showProfileModal.headline;
        const locationParts = [u.city, u.district, u.division].filter(Boolean);
        const locationText = locationParts.length > 0 ? locationParts.join(', ') : null;
        const skillsList = u.skills ? u.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-center space-y-4 my-8 animate-in zoom-in-95">
              <button
                onClick={() => setShowProfileModal(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Picture */}
              <div className="relative inline-block mx-auto">
                {u.avatarUrl ? (
                  <img
                    src={getImageUrl(u.avatarUrl)}
                    alt={displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center text-3xl border-4 border-slate-100 dark:border-slate-800 shadow-md">
                    {displayName.charAt(0)}
                  </div>
                )}
                {u.isVerified && (
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-sm" title="Verified User">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* Name & ID */}
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <span>{displayName}</span>
                  {u.isVerified && <Shield className="w-4 h-4 text-emerald-500" />}
                </h3>
                <p className="text-xs font-mono text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                  ID: {u.uniqueUserId || 'TBD' + u.id?.slice(0, 5).toUpperCase()}
                </p>

                {/* Rating & Location */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{u.averageRating ? Number(u.averageRating).toFixed(1) : '5.0'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({u.reviewsCount || 0} reviews)</span>
                  </span>

                  {locationText && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span>{locationText}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Headline */}
              {headline && (
                <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-200/70 dark:border-sky-800/60 text-xs font-bold text-sky-800 dark:text-sky-200 text-center">
                  {headline}
                </div>
              )}

              {/* Bio / About */}
              {u.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 text-left bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  {u.bio}
                </p>
              )}

              {/* Profession & Business */}
              {(u.profession || u.company || u.businessName) && (
                <div className="text-xs text-slate-600 dark:text-slate-300 text-left bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                  {u.profession && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span><strong>{u.profession}</strong> {u.company ? `@ ${u.company}` : ''}</span>
                    </div>
                  )}
                  {u.businessName && !u.profession && (
                    <div className="text-slate-500 dark:text-slate-400">
                      🏢 <strong>{u.businessName}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Skills preview */}
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {skillsList.slice(0, 5).map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 text-[10px] font-semibold border border-sky-100 dark:border-sky-900/40"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-2" />

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    startChatWithUser(u);
                    setShowProfileModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      startChatWithUser(u);
                      setShowPayModal(true);
                      setShowProfileModal(null);
                    }}
                    className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800/60"
                  >
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" /> Pay Money
                  </button>

                  <button
                    onClick={() => {
                      startChatWithUser(u);
                      setShowRequestModal(true);
                      setShowProfileModal(null);
                    }}
                    className="py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/60"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-blue-600" /> Request Money
                  </button>
                </div>

                <Link
                  href={`/users/${u.uniqueUserId || u.id}`}
                  onClick={() => setShowProfileModal(null)}
                  className="w-full py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold text-xs transition flex items-center justify-center gap-2 border border-sky-200 dark:border-sky-800"
                >
                  <User className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'সম্পূর্ণ প্রোফাইল ও রিভিউ দেখুন →' : 'View Full Profile & Reviews →'}</span>
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL 2: Send Money / Pay Request Modal
      ========================================================================= */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="text-emerald-500 text-xl">💸</span> {lang === 'bn' ? 'পে রিকোয়েস্ট পাঠান (Pay Request)' : 'Send Pay Request'}
            </h3>

            {/* Quick Switch Notice */}
            <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400">টাকা চেয়ে অনুরোধ করতে চান?</span>
              <button
                type="button"
                onClick={() => {
                  setShowPayModal(false);
                  setShowRequestModal(true);
                }}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                💰 টাকা অনুরোধ (Request Money)
              </button>
            </div>

            {/* Recipient info */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm">
                {getUserDisplayName(activeConversation?.otherUser).charAt(0)}
              </div>
              <div>
                <div className="text-xs text-slate-400">রিসিভার / প্রাপক</div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {getUserDisplayName(activeConversation?.otherUser)}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  ID: {activeConversation?.otherUser?.uniqueUserId || 'User'}
                </div>
              </div>
            </div>

            {/* Available Balance Box */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-xs mb-4">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">আপনার বর্তমান ব্যালেন্স (Available Balance)</span>
              <span className="font-bold text-emerald-900 dark:text-emerald-200 font-mono text-sm">
                ৳{wallet?.availableBalance?.toLocaleString() || '0.00'}
              </span>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  লেনদেনের পরিমাণ (Amount in ৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="৫০০"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Dynamic Commission Calculation Preview */}
                {parseFloat(payAmount) > 0 && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>লেনদেনের পরিমাণ:</span>
                      <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                        ৳{parseFloat(payAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>{lang === 'bn' ? `প্ল্যাটফর্ম কমিশন (${txCommLabel}):` : `Platform Commission (${txCommLabel}):`}</span>
                      <span className="font-semibold font-mono text-amber-600 dark:text-amber-400">
                        ৳{payCommission.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>মোট প্রয়োজনীয় ব্যালেন্স:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        ৳{(parseFloat(payAmount) + payCommission).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সেন্ডার নোট / কাজের বিবরণ (Sender Note)
                </label>
                <input
                  type="text"
                  value={payReason}
                  onChange={(e) => setPayReason(e.target.value)}
                  placeholder="যেমন: সার্ভিস বিল বা পণ্য ক্রয়"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Insufficient Balance warning */}
              {parseFloat(payAmount) > 0 &&
                parseFloat(payAmount) + payCommission > (wallet?.availableBalance || 0) && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                    ❌ <strong>অপর্যাপ্ত ব্যালেন্স:</strong> আপনার মোট ৳{(parseFloat(payAmount) + payCommission).toLocaleString()} টাকা প্রয়োজন (মূল ৳{parseFloat(payAmount).toLocaleString()} + কমিশন ৳{payCommission.toLocaleString()}), কিন্তু আপনার বর্তমান ব্যালেন্স ৳{wallet?.availableBalance?.toLocaleString() || 0}।
                  </div>
                )}
            </div>

            {/* Explanatory Note */}
            <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              💡 <strong>লেনদেনের সূচনা:</strong> Pay Request পাঠালে সাথে সাথে কোনো টাকা কাটা যাবে না। রিসিভার Approve করার সাথে সাথে প্রেরকের ব্যালেন্স থেকে মোট টাকা কেটে সেফনেক্সবিডি সুরক্ষিত এসক্রো হোল্ডে লক হবে।
            </div>

            {/* Submit */}
            <div className="mt-5">
              <button
                onClick={handleSendPayRequest}
                disabled={
                  !payAmount ||
                  parseFloat(payAmount) <= 0 ||
                  parseFloat(payAmount) + payCommission > (wallet?.availableBalance || 0) ||
                  actionLoading
                }
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {lang === 'bn' ? 'পে রিকোয়েস্ট পাঠান' : 'Send Pay Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Request Money Modal
      ========================================================================= */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRequestModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="text-blue-500 text-xl">💰</span> {lang === 'bn' ? 'টাকা রিকোয়েস্ট করুন (Request Money)' : 'Request Money'}
            </h3>

            {/* Quick Switch Notice */}
            <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400">নিজে টাকা পরিশোধ করতে চান?</span>
              <button
                type="button"
                onClick={() => {
                  setShowRequestModal(false);
                  setShowPayModal(true);
                }}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                💸 পে রিকোয়েস্ট পাঠান
              </button>
            </div>

            {/* Target info */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
                {getUserDisplayName(activeConversation?.otherUser).charAt(0)}
              </div>
              <div>
                <div className="text-xs text-slate-400">প্রেরক / যার কাছে রিকোয়েস্ট পাঠানো হচ্ছে</div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {getUserDisplayName(activeConversation?.otherUser)}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  ID: {activeConversation?.otherUser?.uniqueUserId || 'User'}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  প্রার্থিত পরিমাণ (Amount in ৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="৫০০"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  কাজের বিবরণ বা নোট (Receiver Note)
                </label>
                <input
                  type="text"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="যেমন: সার্ভিস পেমেন্ট বা প্রজেক্ট ফি"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40">
              ℹ️ টাকা রিকোয়েস্ট করার জন্য আপনার কোনো ব্যালেন্স লাগবে না। অপর পক্ষ কনফার্ম ও Approve করলে টাকা এসক্রো হোল্ডে আসবে।
            </div>

            <div className="mt-5">
              <button
                onClick={handleSendRequestMoney}
                disabled={!requestAmount || parseFloat(requestAmount) <= 0 || actionLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {lang === 'bn' ? 'রিকোয়েস্ট পাঠান' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: Dispute Modal (Routes directly to Admin Calling Queue)
      ========================================================================= */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDisputeModal(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5" /> {lang === 'bn' ? 'ডিসপ্যুট ওপেন করুন (Open Dispute)' : 'Open Dispute & Admin Call'}
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {lang === 'bn'
                ? 'এসক্রো সুরক্ষার কারণে সেন্ডার নিজে সরাসরি হোল্ড ব্যালেন্স মূল ব্যালেন্সে ফেরত নিতে পারেন না। ডিসপ্যুট সাবমিট করলে এটি সরাসরি অ্যাডমিন প্যানেল (Calling Queue)-তে যাবে। অ্যাডমিন চ্যাট ও কাজের প্রমাণাদি যাচাই করে সেন্ডারের মূল একাউন্টে টাকা রিফান্ড বা সমাধান করে দেবেন।'
                : 'Under Escrow protection, held funds cannot be refunded directly. Submitting a dispute routes this case to Admin Calling Queue for chat review and Admin-issued refund.'}
            </p>

            {/* Disputed Transaction details */}
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-xs mb-4 space-y-1">
              <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-mono">
                <span>লেনদেন নম্বর:</span>
                <span className="font-bold">{showDisputeModal.trackingNumber || 'TXN-PENDING'}</span>
              </div>
              <div className="flex items-center justify-between text-amber-900 dark:text-amber-200">
                <span>বিরোধপূর্ণ পরিমাণ:</span>
                <span className="font-bold font-mono text-sm">৳{Number(showDisputeModal.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ডিসপ্যুট কারণ (Dispute Reason) *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="Service not delivered">Service not delivered / কাজ সম্পন্ন করেনি</option>
                  <option value="Defective or incomplete work">Defective or incomplete work / কাজের মান সন্তোষজনক নয়</option>
                  <option value="Security or fraud suspicion">Security or fraud suspicion / প্রতারণার আশঙ্কা</option>
                  <option value="Incorrect amount">Incorrect amount / টাকার পরিমাণে অসঙ্গতি</option>
                  <option value="Seller or Buyer unreachable">Seller or Buyer unreachable / অপর পক্ষের কোনো সাড়া নেই</option>
                  <option value="Other">Other / অন্যান্য কারণ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  বিস্তারিত বিবরণ / অভিযোগ (Details / Explanation) *
                </label>
                <textarea
                  rows={3}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="বিরোধের কারণ ও অভিযোগের বিস্তারিত লিখুন যাতে অ্যাডমিন যাচাই করতে পারেন..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  প্রমাণাদি বা স্ক্রিনশট (Evidence Upload - Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setDisputeEvidence(Array.from(e.target.files || []))}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowDisputeModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleSubmitDispute}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                ডিসপ্যুট সাবমিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: Lightbox Image Zoom
      ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={lightboxImage} alt="Enlarged" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <MessengerChatContent />
    </Suspense>
  );
}
