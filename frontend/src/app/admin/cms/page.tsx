'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import {
  MessageSquare,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Send,
  User,
  Phone,
  Copy,
  Check,
  Coins,
  FileText,
  BadgeAlert,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  SlidersHorizontal,
  Info,
  Lock,
  Unlock,
  Power,
  X,
} from 'lucide-react';

interface ParticipantUser {
  id: string;
  uniqueUserId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

interface LinkedTransaction {
  id: string;
  trackingNumber: string;
  amount: number;
  totalRequired?: number;
  status: string;
  transactionType: string;
  workStartTime?: string | null;
  workExpectedDuration?: string | null;
  sender: ParticipantUser;
  receiver: ParticipantUser;
  dispute?: any;
}

interface ConversationItem {
  id: string;
  type: string;
  updatedAt: string;
  createdAt: string;
  participantCount: number;
  user1: ParticipantUser | null;
  user2: ParticipantUser | null;
  lastMessage: {
    id: string;
    content: string;
    messageType: string;
    createdAt: string;
    sender: {
      id: string;
      uniqueUserId: string;
      firstName: string;
      lastName: string;
    };
    metadata?: any;
  } | null;
  totalMessages: number;
  activeTransaction: LinkedTransaction | null;
  dealStatus: string | null;
  dealAmount: number;
  trackingNumber: string | null;
  hasDispute: boolean;
  isLiveChat?: boolean;
  liveChatAt?: string | null;
  isLocked?: boolean;
  lockedReason?: string | null;
  lockedBy?: string | null;
  lockedAt?: string | null;
  allTransactions?: Array<{
    id: string;
    trackingNumber: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

interface PlatformStats {
  totalConversations: number;
  activeEscrowDeals: number;
  totalEscrowHeld: number;
  activeDisputes: number;
  pendingRequests: number;
  liveChatCount?: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  metadata?: any;
  createdAt: string;
  sender?: {
    id: string;
    uniqueUserId: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  attachments?: Array<{
    fileUrl: string;
    fileType: string;
    fileSize?: number;
  }>;
}

export default function AdminLiveChatPage() {
  const { lang } = useLanguage();
  const { user: currentUser } = useAuthStore();

  // Telemetry & conversation state
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false); // Collapsible stats to give huge vertical room
  const [isFocusMode, setIsFocusMode] = useState(false); // Fullscreen / Expanded chat view mode
  const [stats, setStats] = useState<PlatformStats>({
    totalConversations: 0,
    activeEscrowDeals: 0,
    totalEscrowHeld: 0,
    activeDisputes: 0,
    pendingRequests: 0,
    liveChatCount: 0,
  });
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE_CHAT' | 'ACTIVE_ESCROW' | 'REQUESTS' | 'DISPUTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inside Chat Room State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNoticeMode, setIsNoticeMode] = useState(false); // Default to normal chat so Admin/Staff can chat smoothly as SafnexBD Admin
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Super Admin Visibility & Conversation Lock States
  const [isSuperAdminVisible, setIsSuperAdminVisible] = useState(false);
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [lockingLoading, setLockingLoading] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockReasonInput, setLockReasonInput] = useState('');

  // Live Chat Status & Admin Chat Settings State
  const [togglingLiveId, setTogglingLiveId] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [savingAdminChatSettings, setSavingAdminChatSettings] = useState(false);
  const [adminChatSettings, setAdminChatSettings] = useState({
    isEnabled: true,
    welcomeMessageEnabled: true,
    welcomeMessageTemplate: '',
  });

  // Refs to prevent duplicate messages and race conditions
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);
  const selectedConvIdRef = useRef<string | null>(null);

  // Keep selectedConvIdRef synced
  useEffect(() => {
    selectedConvIdRef.current = selectedConv?.id || null;
  }, [selectedConv?.id]);

  // Safe helper to append messages with strict deduplication
  const addMessageSafely = (newMsg: ChatMessage) => {
    if (!newMsg || !newMsg.id) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) {
        return prev;
      }
      return [...prev, newMsg];
    });
  };

  // Deduplicated messages for bulletproof rendering
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    const result: ChatMessage[] = [];
    for (const m of messages) {
      if (!m?.id) {
        result.push(m);
        continue;
      }
      if (!seen.has(m.id)) {
        seen.add(m.id);
        result.push(m);
      }
    }
    return result;
  }, [messages]);

  // 1. Fetch conversations & telemetry from backend
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res: any = await api.get('/chat/admin/conversations', {
        params: {
          filter: activeFilter,
          search: searchQuery || undefined,
        },
      });

      const payload = res?.conversations
        ? res
        : res?.data?.conversations
        ? res.data
        : res?.data?.data || res?.data || res;

      if (payload) {
        if (payload.isSuperAdminChatVisible !== undefined) {
          setIsSuperAdminVisible(Boolean(payload.isSuperAdminChatVisible));
        }
        if (payload.adminChatSettings) {
          setAdminChatSettings({
            isEnabled: payload.adminChatSettings.isEnabled !== false,
            welcomeMessageEnabled: payload.adminChatSettings.welcomeMessageEnabled !== false,
            welcomeMessageTemplate: payload.adminChatSettings.welcomeMessageTemplate || '',
          });
        }
        setStats(
          payload.stats || {
            totalConversations: 0,
            activeEscrowDeals: 0,
            totalEscrowHeld: 0,
            activeDisputes: 0,
            pendingRequests: 0,
            liveChatCount: 0,
          }
        );
        setConversations(payload.conversations || []);

        // If selected conversation was open, update its snapshot
        if (selectedConv) {
          const updated = (payload.conversations || []).find(
            (c: ConversationItem) => c.id === selectedConv.id
          );
          if (updated) setSelectedConv(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to load admin conversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Load messages when a conversation is selected
  const loadMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const res: any = await api.get(`/chat/conversations/${convId}/messages`, {
        params: { limit: 100 },
      });
      const rawMsgs = Array.isArray(res?.messages)
        ? res.messages
        : Array.isArray(res?.data?.messages)
        ? res.data.messages
        : Array.isArray(res)
        ? res
        : res?.data || [];

      // Deduplicate loaded messages by id
      const uniqueFetched: ChatMessage[] = [];
      const seenIds = new Set<string>();
      for (const m of rawMsgs) {
        if (m?.id && !seenIds.has(m.id)) {
          seenIds.add(m.id);
          uniqueFetched.push(m);
        } else if (!m?.id) {
          uniqueFetched.push(m);
        }
      }
      setMessages(uniqueFetched);
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // 3. Socket real-time integration (Single global listener to avoid duplicates)
  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setSocketConnected(socket.connected);

    const handleMessageReceive = (newMsg: ChatMessage) => {
      if (!newMsg || !newMsg.id) return;

      // Only add to messages if it belongs to the currently active conversation
      if (selectedConvIdRef.current && newMsg.conversationId === selectedConvIdRef.current) {
        addMessageSafely(newMsg);
      }

      // Refresh conversations list & live chat counts silently
      fetchConversations(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('admin-sidebar-counts-refresh'));
      }
    };

    const handleLiveStatus = (data: { conversationId: string; isLive: boolean; liveChatCount?: number }) => {
      if (!data || !data.conversationId) return;
      if (typeof data.liveChatCount === 'number') {
        setStats((prev) => ({ ...prev, liveChatCount: data.liveChatCount }));
      }
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === data.conversationId ? { ...c, isLiveChat: data.isLive } : c,
        );
        return activeFilter === 'LIVE_CHAT' && !data.isLive
          ? updated.filter((c) => c.id !== data.conversationId)
          : updated;
      });
      setSelectedConv((prev) =>
        prev && prev.id === data.conversationId ? { ...prev, isLiveChat: data.isLive } : prev,
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('admin-sidebar-counts-refresh'));
      }
    };

    const handleLockStatus = (data: { conversationId: string; isLocked: boolean; reason?: string; lockedBy?: string; lockedAt?: string }) => {
      if (!data || !data.conversationId) return;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === data.conversationId
            ? { ...c, isLocked: data.isLocked, lockedReason: data.reason, lockedBy: data.lockedBy, lockedAt: data.lockedAt }
            : c,
        ),
      );

      setSelectedConv((prev) => {
        if (prev && prev.id === data.conversationId) {
          return { ...prev, isLocked: data.isLocked, lockedReason: data.reason, lockedBy: data.lockedBy, lockedAt: data.lockedAt };
        }
        return prev;
      });
    };

    socket.on('message:receive', handleMessageReceive);
    socket.on('chat:live_status', handleLiveStatus);
    socket.on('chat:lock_status', handleLockStatus);

    return () => {
      socket.off('message:receive', handleMessageReceive);
      socket.off('chat:live_status', handleLiveStatus);
      socket.off('chat:lock_status', handleLockStatus);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [activeFilter]);

  // Handler: Toggle Live Chat Status (Turn OFF/ON red blink & remove from LIVE_CHAT tab)
  const handleToggleLiveChatStatus = async (convId: string, isLive: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTogglingLiveId(convId);
    try {
      const res: any = await api.patch(`/chat/admin/conversations/${convId}/live-status`, {
        isLive,
      });
      const data = res?.data || res;
      if (typeof data?.liveChatCount === 'number') {
        setStats((prev) => ({ ...prev, liveChatCount: data.liveChatCount }));
      }
      setConversations((prev) => {
        const updated = prev.map((c) => (c.id === convId ? { ...c, isLiveChat: isLive } : c));
        return activeFilter === 'LIVE_CHAT' && !isLive
          ? updated.filter((c) => c.id !== convId)
          : updated;
      });
      setSelectedConv((prev) => (prev && prev.id === convId ? { ...prev, isLiveChat: isLive } : prev));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('admin-sidebar-counts-refresh'));
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update live chat status');
    } finally {
      setTogglingLiveId(null);
    }
  };

  // Handler: Save Admin Chat & Welcome Message Settings
  const handleSaveAdminChatSettings = async (customPatch?: Partial<typeof adminChatSettings>) => {
    setSavingAdminChatSettings(true);
    try {
      const payloadToSave = customPatch ? { ...adminChatSettings, ...customPatch } : adminChatSettings;
      const res: any = await api.patch('/chat/admin/settings', payloadToSave);
      const data = res?.data || res;
      if (data) {
        setAdminChatSettings({
          isEnabled: data.isEnabled !== false,
          welcomeMessageEnabled: data.welcomeMessageEnabled !== false,
          welcomeMessageTemplate: data.welcomeMessageTemplate || payloadToSave.welcomeMessageTemplate,
        });
      }
      if (!customPatch) {
        setSettingsModalOpen(false);
        alert(lang === 'bn' ? 'অ্যাডমিন চ্যাট ও ওয়েলকাম মেসেজ সেটিংস সংরক্ষিত হয়েছে!' : 'Admin Chat settings saved!');
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save Admin Chat settings');
    } finally {
      setSavingAdminChatSettings(false);
    }
  };

  // Handler: Toggle Super Admin Chat Visibility
  const handleToggleSuperAdminVisibility = async () => {
    setVisibilityLoading(true);
    try {
      const next = !isSuperAdminVisible;
      const res: any = await api.post('/chat/admin/visibility', { isVisible: next });
      const visible = res?.isVisible ?? res?.data?.isVisible ?? next;
      setIsSuperAdminVisible(visible);
    } catch (err: any) {
      console.error('Failed to update Super Admin visibility:', err);
      alert(err.response?.data?.message || 'Failed to update visibility');
    } finally {
      setVisibilityLoading(false);
    }
  };

  // Handler: Toggle Conversation Lock (Chat ON / OFF)
  const handleToggleConversationLock = async (forceUnlock = false) => {
    if (!selectedConv) return;
    setLockingLoading(true);
    try {
      const nextLockState = forceUnlock ? false : !selectedConv.isLocked;
      const res: any = await api.patch(`/chat/admin/conversations/${selectedConv.id}/toggle-lock`, {
        isLocked: nextLockState,
        reason: nextLockState
          ? (lockReasonInput.trim() || 'এই চ্যাটটি অ্যাডমিন সাময়িকভাবে বন্ধ বা লক করে রেখেছেন।')
          : undefined,
      });

      const updated = res?.data || res;
      setSelectedConv((prev) => (prev ? { ...prev, isLocked: updated.isLocked, lockedReason: updated.reason } : null));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id ? { ...c, isLocked: updated.isLocked, lockedReason: updated.reason } : c,
        ),
      );
      setLockModalOpen(false);
      setLockReasonInput('');
    } catch (err: any) {
      console.error('Failed to toggle chat lock:', err);
      alert(err.response?.data?.message || 'Failed to update chat lock');
    } finally {
      setLockingLoading(false);
    }
  };

  // Join/Leave socket room when selected conversation changes
  useEffect(() => {
    if (!selectedConv?.id) return;

    const socket = getSocket();
    socket.emit('join:conversation', { conversationId: selectedConv.id });
    loadMessages(selectedConv.id);

    return () => {
      socket.emit('leave:conversation', { conversationId: selectedConv.id });
    };
  }, [selectedConv?.id]);

  // Scroll to bottom smoothly when messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uniqueMessages.length, messagesLoading]);

  // 4. Send Message Handler (Bulletproof deduplication & double-submit protection)
  const handleSendAdminMessage = async (customText?: string) => {
    const text = (customText !== undefined ? customText : adminInput).trim();
    if (!text || !selectedConv || isSubmittingRef.current) return;

    // Lock submission immediately
    isSubmittingRef.current = true;
    setIsSending(true);
    const pendingText = text;
    setAdminInput(''); // Instantly clear input so user cannot press enter twice

    try {
      const res: any = await api.post(`/chat/admin/conversations/${selectedConv.id}/message`, {
        content: pendingText,
        messageType: isNoticeMode ? 'ADMIN_INTERVENTION' : 'TEXT',
        isAdminNotice: isNoticeMode,
        adminTitle: isNoticeMode
          ? (lang === 'bn' ? '🛡️ সেফনেক্সবিডি অফিসিয়াল অ্যাডমিন নোটিশ' : '🛡️ SafnexBD Official Admin Notice')
          : undefined,
      });

      const newMsg = res?.id ? res : (res?.data?.id ? res.data : res?.data?.data || res);
      if (newMsg?.id) {
        addMessageSafely(newMsg);
      }
    } catch (err: any) {
      // Restore input text if request failed
      setAdminInput(pendingText);
      alert(err.response?.data?.message || 'Failed to send admin message');
    } finally {
      isSubmittingRef.current = false;
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Helper: Display names
  const getUserName = (u?: ParticipantUser | null) => {
    if (!u) return lang === 'bn' ? 'অজানা ইউজার' : 'Unknown User';
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.uniqueUserId;
  };

  // Fast response templates for admins
  const quickTemplates = [
    {
      titleBn: '⚠️ অফ-প্ল্যাটফর্ম সতর্কতা',
      titleEn: '⚠️ Off-Platform Warning',
      text: lang === 'bn'
        ? '⚠️ সতর্কতা: প্ল্যাটফর্মের বাইরে (যেমন WhatsApp/Telegram বা সরাসরি ব্যাংকে) লেনদেন করা কঠোরভাবে নিষিদ্ধ। এসক্রো সুরক্ষার বাইরে লেনদেনে সেফনেক্সবিডি কোনো দায়ভার গ্রহণ করবে না।'
        : '⚠️ Warning: Transacting outside SafnexBD (e.g. WhatsApp, Telegram, or direct bank) is strictly prohibited and forfeits escrow safety protection.',
    },
    {
      titleBn: '🛡️ এসক্রো পর্যবেক্ষণ নোটিশ',
      titleEn: '🛡️ Escrow Monitoring',
      text: lang === 'bn'
        ? '🛡️ অ্যাডমিন নোটিশ: এই লেনদেনটি সেফনেক্সবিডি এসক্রো সিস্টেম দ্বারা রিয়েল-টাইমে পর্যবেক্ষণ করা হচ্ছে। উভয় পক্ষকে প্ল্যাটফর্মের নিয়ম মেনে কাজ সম্পন্ন করার পরামর্শ দেওয়া হচ্ছে।'
        : '🛡️ Admin Notice: This escrow deal is being actively supervised by SafnexBD Security. Please conduct all transactions strictly per marketplace guidelines.',
    },
    {
      titleBn: '✅ কাজ ও রিলিজ নির্দেশনা',
      titleEn: '✅ Proof & Release',
      text: lang === 'bn'
        ? '✅ বিক্রেতাকে কাজের প্রমাণাদি চ্যাটে জমা দেওয়ার জন্য বলা হচ্ছে। ক্রেতা প্রমাণ যাচাই করে সন্তুষ্ট হলে অবিলম্বে ফান্ড রিলিজ প্রদান করবেন।'
        : '✅ The seller is requested to upload deliverables/proof in this chat. The buyer should verify and promptly release the escrow balance.',
    },
    {
      titleBn: '📞 ডিসপ্যুট সহায়তা',
      titleEn: '📞 Dispute Assistance',
      text: lang === 'bn'
        ? '📞 ডিসপ্যুট সংক্রান্ত সহায়তা: কোনো পক্ষ অসন্তুষ্ট হলে অ্যাডমিন আর্বিট্রেশনের মাধ্যমে চ্যাট হিস্ট্রি ও প্রুফ যাচাই করে ২৪ ঘণ্টার মধ্যে চূড়ান্ত সিদ্ধান্ত দেওয়া হবে।'
        : '📞 Dispute Support: If either party cannot reach agreement, SafnexBD Admin will arbitrate based on chat proof within 24 hours.',
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Top Header Bar & Control Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 relative">
            <MessageSquare className="w-5 h-5" />
            {(stats.liveChatCount || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>{lang === 'bn' ? 'লাইভ চ্যাট ও এসক্রো সুপারভিশন' : 'Live Chat & Escrow Supervision'}</span>
              <button
                type="button"
                onClick={() => setActiveFilter('LIVE_CHAT')}
                className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-black transition cursor-pointer ${
                  (stats.liveChatCount || 0) > 0
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    (stats.liveChatCount || 0) > 0 ? 'bg-white animate-ping' : 'bg-slate-400'
                  }`}
                />
                <span>
                  {lang === 'bn'
                    ? `লাইভ চ্যাট: ${stats.liveChatCount || 0} জন`
                    : `Live Chat: ${stats.liveChatCount || 0}`}
                </span>
              </button>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'রিয়েল-টাইমে ইউজারদের এসক্রো ও ডিল চ্যাট পর্যবেক্ষণ করুন এবং প্রশাসনিক নোটিশ দিন।'
                : 'Supervise live user-to-user escrow negotiations in real-time and post official notices.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">

          {/* Super Admin Chat Presence Switch */}
          {currentUser?.roles?.includes('SUPER_ADMIN') && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSuperAdminVisible ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                  {lang === 'bn' ? 'সার্চ ভিজিবিলিটি:' : 'Search Visible:'}
                </span>
              </div>

              <button
                type="button"
                disabled={visibilityLoading}
                onClick={handleToggleSuperAdminVisibility}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-xs ${
                  isSuperAdminVisible
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-500 hover:bg-slate-600 text-white'
                }`}
              >
                <Power className="w-2.5 h-2.5" />
                <span>{isSuperAdminVisible ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}

          {/* Socket status pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {socketConnected
                ? lang === 'bn' ? 'লাইভ সকেট' : 'Live Socket'
                : lang === 'bn' ? 'কানেক্টিং...' : 'Connecting...'}
            </span>
          </div>

          {/* Toggle Platform Stats Button */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showStats
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
            title={showStats ? 'Hide Statistics' : 'Show Platform Statistics'}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {showStats
                ? (lang === 'bn' ? 'পরিসংখ্যান লুকান' : 'Hide Stats')
                : (lang === 'bn' ? 'পরিসংখ্যান' : 'Stats')}
            </span>
            {showStats ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Toggle Fullscreen / Focus Mode Button */}
          {selectedConv && (
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs ${
                isFocusMode
                  ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                  : 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-600'
              }`}
              title={isFocusMode ? 'Switch to Dual Split View' : 'Maximize Chat Area for Maximum Reading Space'}
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সাধারণ ভিউ' : 'Split View'}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'চ্যাট বড় করুন' : 'Expand Chat'}</span>
                </>
              )}
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={() => fetchConversations()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible 5-Metric Platform Telemetry Strip */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 transition-all animate-in fade-in duration-200">
          {/* Metric 1: Total Conversations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500">
                {lang === 'bn' ? 'মোট চ্যাট রুম' : 'Total Chats'}
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {stats.totalConversations}
              </div>
            </div>
          </div>

          {/* Metric 2: Active Escrow Deals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500">
                {lang === 'bn' ? 'চলমান এসক্রো ডিল' : 'Escrow Deals'}
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {stats.activeEscrowDeals}
              </div>
            </div>
          </div>

          {/* Metric 3: Total Escrow Held */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 rounded-2xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                {lang === 'bn' ? 'মোট এসক্রো হোল্ড' : 'Escrow Held'}
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                ৳{stats.totalEscrowHeld.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Metric 4: Active Disputes */}
          <div className="bg-white dark:bg-slate-900 border border-rose-500/20 bg-rose-50/20 dark:bg-rose-950/10 rounded-2xl p-3 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
                {lang === 'bn' ? 'অ্যাক্টিভ ডিসপ্যুট' : 'Disputes'}
              </div>
              <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                {stats.activeDisputes}
              </div>
            </div>
          </div>

          {/* Metric 5: Pending Requests */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500">
                {lang === 'bn' ? 'পেন্ডিং রিকোয়েস্ট' : 'Pending Requests'}
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {stats.pendingRequests}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Spacious Supervisor Workspace */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${
          showStats
            ? 'h-[calc(100vh-250px)] min-h-[580px]'
            : 'h-[calc(100vh-160px)] min-h-[660px]'
        }`}
      >
        {/* =========================================================================
            LEFT PANE: Live Conversation Feeds & Search (Hidden in Focus Mode)
        ========================================================================= */}
        <div
          className={`${
            isFocusMode
              ? 'hidden'
              : 'lg:col-span-5 xl:col-span-4 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden'
          }`}
        >
          {/* Search & Filters */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  lang === 'bn'
                    ? 'চ্যাটিং মেসেজ, নাম, ফোন, আইডি বা TXN...'
                    : 'Search chat messages, user, phone, ID, TXN...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills - Wrapped cleanly so all 5 tabs are always visible on Desktop & Mobile */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {[
                { key: 'ALL', labelBn: 'সব (All)', labelEn: 'All' },
                {
                  key: 'LIVE_CHAT',
                  labelBn: `🔴 লাইভ চ্যাট (${stats.liveChatCount || 0})`,
                  labelEn: `🔴 Live Chat (${stats.liveChatCount || 0})`,
                },
                { key: 'ACTIVE_ESCROW', labelBn: '🔒 এসক্রো', labelEn: '🔒 Escrow' },
                { key: 'REQUESTS', labelBn: '💸 রিকোয়েস্ট', labelEn: '💸 Request' },
                { key: 'DISPUTED', labelBn: '⚠️ ডিসপ্যুট', labelEn: '⚠️ Dispute' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key as any)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition text-[11px] cursor-pointer ${
                    activeFilter === f.key
                      ? f.key === 'LIVE_CHAT'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                      : f.key === 'LIVE_CHAT' && (stats.liveChatCount || 0) > 0
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {lang === 'bn' ? f.labelBn : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>{lang === 'bn' ? 'চ্যাট লোড হচ্ছে...' : 'Loading conversations...'}</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {activeFilter === 'LIVE_CHAT'
                  ? (lang === 'bn' ? 'বর্তমানে কেউ লাইভ চ্যাট করছে না' : 'No active live chat users right now')
                  : (lang === 'bn' ? 'কোনো চ্যাট পাওয়া যায়নি' : 'No conversations found')}
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const buyer = conv.user1;
                const seller = conv.user2;
                const isLive = Boolean(conv.isLiveChat);

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 dark:bg-amber-500/15 border-l-4 border-l-amber-500'
                        : isLive
                        ? 'bg-rose-500/5 hover:bg-rose-500/10 border-l-4 border-l-rose-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Participants & Status */}
                    <div className="flex items-center justify-between mb-1 gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex -space-x-1.5 shrink-0">
                          <div
                            className={`w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border flex items-center justify-center text-[10px] font-bold ${
                              isLive
                                ? 'ring-2 ring-rose-500 border-rose-500 animate-pulse text-rose-600 dark:text-rose-300'
                                : 'border-white dark:border-slate-900'
                            }`}
                          >
                            {buyer?.firstName?.[0] || 'B'}
                          </div>
                          <div
                            className={`w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border flex items-center justify-center text-[10px] font-bold ${
                              isLive
                                ? 'ring-2 ring-rose-500 border-rose-500 animate-pulse'
                                : 'border-white dark:border-slate-900'
                            }`}
                          >
                            {seller?.firstName?.[0] || 'S'}
                          </div>
                          {isLive && (
                            <span
                              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900 animate-ping"
                              title="সক্রিয় লাইভ চ্যাট (Live Chatting)"
                            />
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                          <span>{getUserName(buyer)}</span>
                          <span className="text-slate-400 font-normal mx-1">↔</span>
                          <span>{getUserName(seller)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Live Chat OFF quick button */}
                        {isLive && (
                          <button
                            type="button"
                            disabled={togglingLiveId === conv.id}
                            onClick={(e) => handleToggleLiveChatStatus(conv.id, false, e)}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center gap-0.5 shadow-2xs transition"
                            title="লাইভ চ্যাট অফ করুন (লাইভ চ্যাট লিস্ট থেকে সরে যাবে ও লাল ব্লিংক বন্ধ হবে)"
                          >
                            <Power className="w-2.5 h-2.5" />
                            <span>Live Off</span>
                          </button>
                        )}

                        {/* Escrow Status Pill */}
                        {conv.dealStatus ? (
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              conv.dealStatus === 'HOLD'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                                : conv.dealStatus === 'WORKING'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                                : conv.dealStatus === 'DISPUTED'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse'
                                : conv.dealStatus === 'REQUESTED'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                          >
                            {conv.dealStatus === 'HOLD' && '🔒 '}
                            {conv.dealStatus === 'DISPUTED' && '⚠️ '}
                            {conv.dealStatus}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono">
                            CHAT
                          </span>
                        )}

                        {conv.isLocked && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-0.5 shrink-0">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{lang === 'bn' ? 'লক' : 'Locked'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Amount & Tracking */}
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      {conv.dealAmount > 0 ? (
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ৳{conv.dealAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No deal</span>
                      )}

                      {conv.trackingNumber && (
                        <span className="font-mono text-[9px] text-slate-400 truncate max-w-[100px]">
                          {conv.trackingNumber}
                        </span>
                      )}
                    </div>

                    {/* Last message preview */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <p className="truncate max-w-[180px]">
                        {conv.lastMessage?.messageType === 'ADMIN_INTERVENTION' ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            🛡️ Admin Notice
                          </span>
                        ) : conv.lastMessage?.messageType === 'PAY_REQUEST' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            💸 Pay Request
                          </span>
                        ) : (
                          conv.lastMessage?.content || 'No messages yet'
                        )}
                      </p>

                      <span className="text-[9px] text-slate-400 shrink-0">
                        {conv.lastMessage?.createdAt
                          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANE: Live Chat Inspector & Intervention Command Center
            (Expands to full width col-span-12 in Focus Mode, or 8-9 cols in Split Mode)
        ========================================================================= */}
        <div
          className={`${
            isFocusMode
              ? 'col-span-12'
              : 'lg:col-span-7 xl:col-span-8'
          } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col overflow-hidden`}
        >
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {lang === 'bn' ? 'লাইভ চ্যাট সুপারভিশন সেন্টার' : 'Live Chat Supervision Center'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                {lang === 'bn'
                  ? 'বামের তালিকা থেকে যে কোনো ইউজারের চ্যাট সিলেক্ট করে সম্পূর্ণ স্ক্রিনে বার্তাগুলো পড়ুন, এসক্রো ব্যালেন্স পর্যবেক্ষণ করুন এবং সরাসরি অফিশিয়াল অ্যাডমিন নোটিশ প্রদান করুন।'
                  : 'Select any active conversation from the list to inspect buyer and seller dialogue, verify escrow funds, and deliver authoritative admin instructions.'}
              </p>
            </div>
          ) : (
            <>
              {/* Room Header: Participants & Action Buttons */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
                {/* Left: Exit Focus Mode button if in focus mode, plus Participant Cards */}
                <div className="flex items-center gap-3">
                  {isFocusMode && (
                    <button
                      onClick={() => setIsFocusMode(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
                      title="Exit Fullscreen Chat"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'bn' ? 'তালিকা' : 'List'}</span>
                    </button>
                  )}

                  {/* Buyer Avatar & Info */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs border shrink-0 ${
                        selectedConv.isLiveChat
                          ? 'ring-2 ring-rose-500 border-rose-500 animate-pulse'
                          : 'border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {selectedConv.user1?.firstName?.[0] || 'B'}
                      {selectedConv.isLiveChat && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{getUserName(selectedConv.user1)}</span>
                        <span className="text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          Buyer
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{selectedConv.user1?.phone || selectedConv.user1?.uniqueUserId}</span>
                        <Link
                          href={`/admin/users?search=${selectedConv.user1?.uniqueUserId}`}
                          target="_blank"
                          className="text-amber-600 hover:underline flex items-center gap-0.5 text-[10px] font-semibold"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <span className="text-slate-400 font-black px-1">↔</span>

                  {/* Seller Avatar & Info */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border shrink-0 ${
                        selectedConv.isLiveChat
                          ? 'ring-2 ring-rose-500 border-rose-500 animate-pulse'
                          : 'border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {selectedConv.user2?.firstName?.[0] || 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{getUserName(selectedConv.user2)}</span>
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          Seller
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{selectedConv.user2?.phone || selectedConv.user2?.uniqueUserId}</span>
                        <Link
                          href={`/admin/users?search=${selectedConv.user2?.uniqueUserId}`}
                          target="_blank"
                          className="text-amber-600 hover:underline flex items-center gap-0.5 text-[10px] font-semibold"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Chat Off/On, Lock/Unlock Chat, Expand/Focus toggle & reload */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Live Chat Status Toggle Button */}
                  {selectedConv.isLiveChat ? (
                    <button
                      type="button"
                      disabled={togglingLiveId === selectedConv.id}
                      onClick={() => handleToggleLiveChatStatus(selectedConv.id, false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                      title="লাইভ চ্যাট অফ করুন (লাইভ চ্যাট ট্যাব থেকে ইউজার সরে যাবে ও প্রোফাইল লাল ব্লিংক বন্ধ হবে)"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? '🔴 লাইভ চ্যাট অফ করুন' : '🔴 Turn Live Chat OFF'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={togglingLiveId === selectedConv.id}
                      onClick={() => handleToggleLiveChatStatus(selectedConv.id, true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
                      title="এই চ্যাটটি লাইভ চ্যাট তালিকায় যুক্ত করুন"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'লাইভ অন' : 'Mark Live'}</span>
                    </button>
                  )}

                  {/* Chat ON/OFF (Lock/Unlock) Toggle Button */}
                  {selectedConv.isLocked ? (
                    <button
                      onClick={() => handleToggleConversationLock(true)}
                      disabled={lockingLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                      title={lang === 'bn' ? 'চ্যাট পুনরায় চালু ও আনলক করুন' : 'Unlock and enable chat'}
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'চ্যাট চালু করুন (Unlock)' : 'Unlock Chat'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setLockModalOpen(true)}
                      disabled={lockingLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                      title={lang === 'bn' ? 'এই চ্যাটটি সাময়িকভাবে বন্ধ বা লক করুন' : 'Lock conversation'}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'চ্যাট বন্ধ করুন (Lock)' : 'Lock Chat'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                    title={isFocusMode ? 'Restore Split View' : 'Maximize Chat Area'}
                  >
                    {isFocusMode ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{lang === 'bn' ? 'সাধারণ ভিউ' : 'Split View'}</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{lang === 'bn' ? 'পূর্ণস্ক্রিন' : 'Expand'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => loadMessages(selectedConv.id)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition"
                    title="Reload Room Messages"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${messagesLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Conversation Locked Alert Strip */}
              {selectedConv.isLocked && (
                <div className="px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>{lang === 'bn' ? 'চ্যাট সাময়িকভাবে বন্ধ বা লক করা আছে:' : 'Chat is currently Locked:'}</strong>{' '}
                      {selectedConv.lockedReason || (lang === 'bn' ? 'অ্যাডমিন এই চ্যাটটি সাময়িক বন্ধ রেখেছেন।' : 'Locked by Administrator')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleConversationLock(true)}
                    disabled={lockingLoading}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition shrink-0 flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'এখনই আনলক করুন' : 'Unlock Now'}</span>
                  </button>
                </div>
              )}

              {/* Escrow & Deal Supervision Strip */}
              {selectedConv.activeTransaction ? (
                <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-slate-100 dark:from-emerald-950/30 dark:via-blue-950/20 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-bold">TXN:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedConv.activeTransaction.trackingNumber}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedConv.activeTransaction!.trackingNumber)}
                        className="p-1 hover:text-emerald-600 transition"
                        title="Copy Tracking Number"
                      >
                        {copiedTracking ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </div>

                    <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                      ৳{selectedConv.activeTransaction.amount.toLocaleString()}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        selectedConv.activeTransaction.status === 'HOLD'
                          ? 'bg-blue-600 text-white'
                          : selectedConv.activeTransaction.status === 'WORKING'
                          ? 'bg-purple-600 text-white'
                          : selectedConv.activeTransaction.status === 'DISPUTED'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : selectedConv.activeTransaction.status === 'REQUESTED'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {selectedConv.activeTransaction.status === 'HOLD' && '🔒 '}
                      {selectedConv.activeTransaction.status === 'DISPUTED' && '⚠️ '}
                      {selectedConv.activeTransaction.status === 'HOLD'
                        ? 'ESCROW HELD (লক)'
                        : selectedConv.activeTransaction.status === 'WORKING'
                        ? 'WORKING (কাজ চলছে)'
                        : selectedConv.activeTransaction.status === 'DISPUTED'
                        ? 'DISPUTED (বিরোধ)'
                        : selectedConv.activeTransaction.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/transactions?search=${selectedConv.activeTransaction.trackingNumber}`}
                      target="_blank"
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition"
                    >
                      <span>Ledger</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {selectedConv.hasDispute && (
                      <Link
                        href="/admin/calling-queue"
                        className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>Dispute</span>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] flex items-center justify-between">
                  <span>
                    {lang === 'bn'
                      ? 'কোনো সক্রিয় এসক্রো লেনদেন শুরু হয়নি। ইউজাররা সাধারণ আলোচনা করছেন।'
                      : 'Direct conversation. No active escrow contract locked currently.'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Room: {selectedConv.id.slice(0, 8)}
                  </span>
                </div>
              )}

              {/* Spacious Message Feed Area (Comfortable font & roomy bubbles) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/30">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <RefreshCw className="w-7 h-7 animate-spin text-amber-500" />
                    <span className="text-xs text-slate-400 font-medium">
                      {lang === 'bn' ? 'মেসেজগুলো লোড হচ্ছে...' : 'Loading conversation history...'}
                    </span>
                  </div>
                ) : uniqueMessages.length === 0 ? (
                  <div className="text-center py-20 text-xs text-slate-400">
                    {lang === 'bn' ? 'এই রুমে এখনও কোনো বার্তা নেই' : 'No messages found in this room'}
                  </div>
                ) : (
                  uniqueMessages.map((msg) => {
                    const isBuyer = msg.senderId === selectedConv.user1?.id;
                    const isSeller = msg.senderId === selectedConv.user2?.id;
                    const isAdmin = !isBuyer && !isSeller;
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // 1. OFFICIAL ADMIN INTERVENTION CARD (High visual hierarchy)
                    if (msg.messageType === 'ADMIN_INTERVENTION' || msg.metadata?.isAdminNotice) {
                      return (
                        <div key={msg.id} className="flex justify-center my-4">
                          <div className="w-full max-w-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-amber-950/20 dark:from-amber-950/50 dark:via-slate-900 dark:to-slate-950 border-2 border-amber-500/60 dark:border-amber-500/50 rounded-2xl p-5 shadow-lg">
                            <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/30 mb-3">
                              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                                <span>{msg.metadata?.adminTitle || 'SafnexBD Authority Notice'}</span>
                              </div>
                              <span className="text-xs bg-amber-500/25 px-2.5 py-0.5 rounded-full font-mono text-amber-900 dark:text-amber-300 font-black">
                                🛡️ SafnexBD Admin
                              </span>
                            </div>
                            <p className="text-sm sm:text-[14.5px] text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
                              {msg.content}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-amber-500/20">
                              <span>Official Platform Authority Notice</span>
                              <span className="font-mono">{timeStr}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 2. IN-CHAT PAY REQUEST
                    if (msg.messageType === 'PAY_REQUEST') {
                      const meta = msg.metadata || {};
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-md">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                              <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center gap-1.5">
                                <span>💸</span>
                                <span>Escrow Pay Request</span>
                              </span>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                                {meta.status || 'REQUESTED'}
                              </span>
                            </div>
                            <div className="text-center py-2">
                              <div className="text-3xl font-black text-slate-900 dark:text-white">
                                ৳{Number(meta.amount || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Sender: <strong>{meta.senderName || msg.sender?.uniqueUserId}</strong>
                              </div>
                            </div>
                            {meta.notes && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl mt-2">
                                Note: &ldquo;{meta.notes}&rdquo;
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 font-mono">
                              <span>TXN: {meta.trackingNumber || 'PENDING'}</span>
                              <span>{timeStr}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 3. IN-CHAT RECEIVE REQUEST
                    if (msg.messageType === 'RECEIVE_REQUEST') {
                      const meta = msg.metadata || {};
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-blue-500/50 rounded-2xl p-4 shadow-md">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                              <span className="text-blue-600 dark:text-blue-400 font-black text-xs flex items-center gap-1.5">
                                <span>💰</span>
                                <span>Money Request</span>
                              </span>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold uppercase">
                                {meta.status || 'REQUESTED'}
                              </span>
                            </div>
                            <div className="text-center py-2">
                              <div className="text-3xl font-black text-slate-900 dark:text-white">
                                ৳{Number(meta.amount || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Requester: <strong>{meta.requesterName || msg.sender?.uniqueUserId}</strong>
                              </div>
                            </div>
                            {meta.notes && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl mt-2">
                                Note: &ldquo;{meta.notes}&rdquo;
                              </div>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 font-mono">
                              <span>TXN: {meta.trackingNumber || 'PENDING'}</span>
                              <span>{timeStr}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 4. REGULAR CHAT MESSAGE (Buyer, Seller, or General Admin)
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isBuyer
                            ? 'items-start'
                            : isSeller
                            ? 'items-end'
                            : 'items-center'
                        }`}
                      >
                        {/* Sender Label & Role Badge */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 px-1">
                          {isBuyer ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {getUserName(selectedConv.user1)}
                              </span>
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-1.5 py-0.2 rounded font-semibold">
                                Buyer
                              </span>
                            </div>
                          ) : isSeller ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-semibold">
                                Seller
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {getUserName(selectedConv.user2)}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>SafnexBD Admin</span>
                            </div>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm leading-relaxed shadow-xs ${
                            isBuyer
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-xs'
                              : isSeller
                              ? 'bg-emerald-600 text-white rounded-tr-xs shadow-emerald-600/10'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm sm:text-[14px]">
                            {msg.content}
                          </p>

                          {/* Image attachments if any */}
                          {msg.attachments?.map((att, idx) => (
                            <div key={idx} className="mt-2 rounded-xl overflow-hidden border border-black/10">
                              <img
                                src={getImageUrl(att.fileUrl)}
                                alt="attachment"
                                className="max-h-72 w-auto rounded-xl object-cover"
                              />
                            </div>
                          ))}

                          <div
                            className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
                              isSeller ? 'text-emerald-200' : 'text-slate-400'
                            }`}
                          >
                            <span>{timeStr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Admin Intervention Templates Strip */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'bn' ? 'টেমপ্লেট:' : 'Templates:'}</span>
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  {quickTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAdminInput(tpl.text)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap transition shadow-2xs"
                    >
                      {lang === 'bn' ? tpl.titleBn : tpl.titleEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Message Composer (Spacious & Clean) */}
              <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                {/* Toggle Notice Mode vs General Mode */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNoticeMode(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                        !isNoticeMode
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'SafnexBD Admin চ্যাট' : 'SafnexBD Admin Chat'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNoticeMode(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isNoticeMode
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'অফিসিয়াল অ্যাডমিন নোটিশ' : 'Official Admin Notice'}</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    {isNoticeMode
                      ? (lang === 'bn' ? '🛡️ নোটিশ উভয় ইউজারের স্ক্রিনে হাইলাইট হবে' : '🛡️ Broadcasts as high-authority banner')
                      : (lang === 'bn' ? '💬 ইউজারদের কাছে আপনার নাম গোপন থেকে "SafnexBD Admin" দেখাবে' : '💬 Users always see sender as "SafnexBD Admin"')}
                  </span>
                </div>

                {/* Textarea & Send Button */}
                <div className="flex items-end gap-2.5">
                  <textarea
                    rows={2}
                    value={adminInput}
                    onChange={(e) => setAdminInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleSendAdminMessage();
                      }
                    }}
                    placeholder={
                      isNoticeMode
                        ? (lang === 'bn' ? 'উভয় পক্ষকে সতর্ক বা প্রশাসনিক নির্দেশনা দিতে বার্তা লিখুন (Enter চাপলে সেন্ড হবে)...' : 'Write official authority notice to both parties (Press Enter to send)...')
                        : (lang === 'bn' ? 'SafnexBD Admin হিসেবে ইউজারের সাথে চ্যাট করুন (Enter চাপলে সেন্ড হবে)...' : 'Type a message as SafnexBD Admin (Press Enter to send)...')
                    }
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none text-slate-900 dark:text-white leading-relaxed"
                  />

                  <button
                    type="button"
                    disabled={isSending || !adminInput.trim()}
                    onClick={() => handleSendAdminMessage()}
                    className={`h-12 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition shrink-0 ${
                      isNoticeMode
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 disabled:opacity-50'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 disabled:opacity-50'
                    }`}
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADMIN CHAT & AUTO WELCOME MESSAGE SETTINGS                         */}
      {/* ========================================================================= */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                  <span>অ্যাডমিন চ্যাট ও অটো ওয়েলকাম মেসেজ সেটিংস</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ইউজার প্যানেলের &ldquo;Admin Chat&rdquo; নিয়ন্ত্রণ এবং নতুন রেজিস্ট্রেশনে স্বয়ংক্রিয় স্বাগতম বার্তা কাস্টমাইজ করুন।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Toggle 1: Admin Chat Master Switch */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    ১. অ্যাডমিন চ্যাট (Admin Chat Master Switch)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    এটি OFF রাখলে ইউজার প্যানেলের &ldquo;Admin Chat&rdquo; অপশন থেকে কোনো ইউজার মেসেজ পাঠাতে পারবে না।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAdminChatSettings((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))
                  }
                  className={`px-4 py-2 rounded-xl font-black text-xs transition ${
                    adminChatSettings.isEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {adminChatSettings.isEnabled ? 'চালু আছে (ON)' : 'বন্ধ আছে (OFF)'}
                </button>
              </div>

              {/* Toggle 2: Auto Welcome Message on Registration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    ২. নতুন রেজিস্ট্রেশনে অটো ওয়েলকাম মেসেজ (Auto Welcome Message)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    অ্যাডমিন চ্যাট ON থাকলে নতুন ইউজার রেজিস্ট্রেশন করার সাথে সাথে তার চ্যাটে স্বয়ংক্রিয়ভাবে স্বাগতম মেসেজ যাবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAdminChatSettings((prev) => ({
                      ...prev,
                      welcomeMessageEnabled: !prev.welcomeMessageEnabled,
                    }))
                  }
                  className={`px-4 py-2 rounded-xl font-black text-xs transition ${
                    adminChatSettings.welcomeMessageEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {adminChatSettings.welcomeMessageEnabled ? 'চালু আছে (ON)' : 'বন্ধ আছে (OFF)'}
                </button>
              </div>

              {/* Welcome Message Template Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    স্বাগতম মেসেজ টেমপ্লেট (Welcome Message Customize):
                  </label>
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
                    Variables: {'{First Name}'}, {'{Last Name}'}
                  </span>
                </div>
                <textarea
                  rows={12}
                  value={adminChatSettings.welcomeMessageTemplate}
                  onChange={(e) =>
                    setAdminChatSettings((prev) => ({
                      ...prev,
                      welcomeMessageTemplate: e.target.value,
                    }))
                  }
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={savingAdminChatSettings}
                onClick={() => handleSaveAdminChatSettings()}
                className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {savingAdminChatSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>সেটিংস সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Reason Dialog Modal */}
      {lockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                <Lock className="w-5 h-5" />
                <h3 className="text-base text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'চ্যাট বন্ধ / সাময়িক লক করুন' : 'Lock Conversation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'চ্যাট লক করলে উভয় ব্যবহারকারী নতুন কোনো বার্তা পাঠাতে পারবেন না। অ্যাডমিন যেকোনো সময় নোটিশ দিতে এবং পুনরায় চালু করতে পারবেন।'
                : 'When locked, participants will not be able to send new messages in this chat. You can unlock anytime.'}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'লক করার কারণ (ঐচ্ছিক):' : 'Lock Reason (Optional):'}
              </label>
              <input
                type="text"
                value={lockReasonInput}
                onChange={(e) => setLockReasonInput(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: ডিসপ্যুট পর্যালোচনাধীন / অ্যাডমিন রিভিউ চলছে' : 'e.g. Under dispute review'}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['ডিসপ্যুট পর্যালোচনাধীন', 'অ্যাডমিন ভেরিফিকেশন চলছে', 'নিয়ম লঙ্ঘনের কারণে স্থগিত'].map((presetReason) => (
                  <button
                    key={presetReason}
                    type="button"
                    onClick={() => setLockReasonInput(presetReason)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    + {presetReason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={lockingLoading}
                onClick={() => handleToggleConversationLock(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{lockingLoading ? 'প্রসেসিং...' : (lang === 'bn' ? 'চ্যাট লক করুন' : 'Confirm Lock')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
