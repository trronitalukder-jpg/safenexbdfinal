'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Headset,
  Send,
  Search,
  ShieldCheck,
  Power,
  Settings,
  RefreshCw,
  UserPlus,
  X,
  MessageSquare,
  Phone,
  Mail,
  Paperclip,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { getImageUrl, compressImage } from '@/lib/imageUtils';

export interface QuickReplyItem {
  id: string;
  title: string;
  text: string;
}

const DEFAULT_QUICK_REPLIES: QuickReplyItem[] = [
  {
    id: 'qr-greeting',
    title: '👋 শুভেচ্ছা ও সহায়তা',
    text: 'আসসালামু আলাইকুম {First Name} {Last Name}, SafnexBD Admin সাপোর্টে আপনাকে স্বাগতম! বলুন আপনাকে কীভাবে সাহায্য করতে পারি?',
  },
  {
    id: 'qr-recharge',
    title: '💳 রিচার্জ গাইড',
    text: 'প্রিয় {First Name}, আপনার ওয়ালেটে রিচার্জ করতে ড্যাশবোর্ডের Wallet অপশন থেকে Recharge বাটনে ক্লিক করুন, পেমেন্ট মেথড সিলেক্ট করে সঠিক Transaction ID ও স্ক্রিনশট জমা দিন। ৫–১৫ মিনিটের মধ্যে ব্যালেন্স যুক্ত হয়ে যাবে ইনশাআল্লাহ।',
  },
  {
    id: 'qr-withdraw',
    title: '💸 উইথড্র আপডেট',
    text: 'প্রিয় {First Name}, আপনার উইথড্র রিকোয়েস্টটি আমাদের টিম যাচাই করছে। সাধারণত খুব দ্রুত পেমেন্ট সম্পন্ন করা হয়। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন, ধন্যবাদ।',
  },
  {
    id: 'qr-microjob',
    title: '💼 মাইক্রো জব গাইড',
    text: 'প্রিয় {First Name}, মাইক্রো জব থেকে আয় করতে জবের নির্দেশনা মনোযোগ দিয়ে পড়ে কাজ সম্পন্ন করুন এবং সঠিক স্ক্রিনশট/প্রুফ জমা দিন। আপনি চাইলে নিজের কাজের জন্যও নতুন জব পোস্ট করতে পারেন!',
  },
  {
    id: 'qr-escrow',
    title: '🔒 এসক্রো লেনদেন',
    text: 'প্রিয় {First Name}, যেকোনো কেনাবেচায় ১০০% নিরাপত্তার জন্য SafnexBD Escrow Service ব্যবহার করুন। কাজ বা পণ্য বুঝে পাওয়ার পরই কেবল পেমেন্ট রিলিজ হবে।',
  },
  {
    id: 'qr-affiliate',
    title: '🎁 ২০% অ্যাফিলিয়েট বোনাস',
    text: 'প্রিয় {First Name}, আপনার রেফারেল লিংক বন্ধুদের সাথে শেয়ার করুন! আপনার রেফারে কেউ যুক্ত হয়ে যেকোনো লেনদেন বা কাজ করলেই প্ল্যাটফর্ম চার্জের ২০% আজীবন কমিশন আপনার মেইন ব্যালেন্সে অটোমেটিক যোগ হবে।',
  },
  {
    id: 'qr-proof',
    title: '📸 স্ক্রিনশট / তথ্য দিন',
    text: 'প্রিয় {First Name}, আপনার বিষয়টি দ্রুত সমাধানের জন্য অনুগ্রহ করে সংশ্লিষ্ট স্ক্রিনশট অথবা Transaction ID / বিস্তারিত তথ্য এখানে পাঠান।',
  },
  {
    id: 'qr-resolved',
    title: '✅ সমস্যা সমাধান হয়েছে',
    text: 'প্রিয় {First Name}, আপনার বিষয়টি সফলভাবে সমাধান করা হয়েছে। অনুগ্রহ করে আপনার ড্যাশবোর্ড রিফ্রেশ করে চেক করুন। SafnexBD-এর সাথে থাকার জন্য ধন্যবাদ!',
  },
];

function unwrap<T = any>(res: any): T {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data;
  }
  return res;
}

export default function AdminSupportChatPage() {
  const { lang } = useLanguage();
  const { user: currentAdmin } = useAuthStore();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [adminLiveCount, setAdminLiveCount] = useState(0);

  const [activeTab, setActiveTab] = useState<'ADMIN_SUPPORT' | 'ADMIN_LIVE_CHAT'>('ADMIN_SUPPORT');
  const [searchQuery, setSearchQuery] = useState('');
  const [inlineMatchedUsers, setInlineMatchedUsers] = useState<any[]>([]);
  const [searchingInlineUsers, setSearchingInlineUsers] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Admin Chat Master Settings (ON/OFF + Customizable Welcome Message + Quick Replies)
  const [adminChatEnabled, setAdminChatEnabled] = useState(true);
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeTemplate, setWelcomeTemplate] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReplyItem[]>(DEFAULT_QUICK_REPLIES);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Custom Quick Replies Manager Modal
  const [showQuickRepliesModal, setShowQuickRepliesModal] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [customReplyTitle, setCustomReplyTitle] = useState('');
  const [customReplyText, setCustomReplyText] = useState('');
  const [savingQuickReplies, setSavingQuickReplies] = useState(false);

  // Start New Chat with User Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 80);
  };

  // Extract the regular user participant from a conversation
  const getTargetUser = (conv: any) => {
    if (!conv) return null;
    if (conv.targetUser) return conv.targetUser;
    const list = Array.isArray(conv.participants)
      ? conv.participants
      : [conv.user1, conv.user2].filter(Boolean);
    const nonAdmin = list.find(
      (p: any) =>
        p &&
        p.id !== currentAdmin?.id &&
        p.uniqueUserId !== 'SafnexBD_Admin' &&
        !p.roles?.includes('SUPER_ADMIN') &&
        !p.roles?.includes('ADMIN'),
    );
    return nonAdmin || conv.user1 || conv.user2 || list[0] || null;
  };

  const fetchSettings = async () => {
    try {
      const res: any = await api.get('/chat/admin/settings');
      const data = unwrap(res);
      if (data) {
        setAdminChatEnabled(data.isEnabled !== false);
        setWelcomeEnabled(data.welcomeMessageEnabled !== false);
        setWelcomeTemplate(data.welcomeMessageTemplate || '');
        if (Array.isArray(data.quickReplies) && data.quickReplies.length > 0) {
          setQuickReplies(data.quickReplies);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const params = new URLSearchParams({
        filter: activeTab,
        limit: '50',
      });
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      const res: any = await api.get(`/chat/admin/conversations?${params.toString()}`);
      const data = unwrap(res);
      const list = data?.conversations || (Array.isArray(data) ? data : []);
      setConversations(list);
      if (data?.stats) {
        setAdminLiveCount(Number(data.stats.adminLiveChatCount ?? data.stats.liveChatCount ?? 0));
      }

      if (selectedConv) {
        const updated = list.find((c: any) => c.id === selectedConv.id);
        if (updated) {
          setSelectedConv((prev: any) => ({ ...prev, ...updated }));
        }
      } else if (list.length > 0 && !silent) {
        handleSelectConversation(list[0], false);
      }
    } catch (err) {
      console.error('Failed to fetch Admin Support conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Search users directly in sidebar when searchQuery is typed
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setInlineMatchedUsers([]);
      return;
    }
    let cancelled = false;
    setSearchingInlineUsers(true);
    api
      .get(`/chat/admin/search-users?q=${encodeURIComponent(q)}`)
      .then((res: any) => {
        if (cancelled) return;
        const data = unwrap(res);
        setInlineMatchedUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setInlineMatchedUsers([]);
      })
      .finally(() => {
        if (!cancelled) setSearchingInlineUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const handleSelectConversation = async (conv: any, openMobile = true) => {
    setSelectedConv(conv);
    if (openMobile) {
      setMobileShowChat(true);
    }
    setLoadingMessages(true);
    try {
      const res: any = await api.get(`/chat/conversations/${conv.id}/messages`);
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : data?.messages || [];
      setMessages(list);
      scrollToBottom('auto');
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => fetchConversations(true), 10000);
    return () => clearInterval(interval);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (selectedConv?.id) {
      socket.emit('join:conversation', { conversationId: selectedConv.id });
    }

    const handleReceive = (newMsg: any) => {
      if (selectedConv?.id && newMsg?.conversationId === selectedConv.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom('smooth');
      }
      fetchConversations(true);
    };

    const handleLiveStatus = (payload: any) => {
      if (!payload?.conversationId) return;
      const isLiveVal = Boolean(payload.isLive ?? payload.isLiveChat);
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === payload.conversationId ? { ...c, isLiveChat: isLiveVal } : c,
        );
        if (activeTab === 'ADMIN_LIVE_CHAT' && !isLiveVal) {
          return updated.filter((c) => c.id !== payload.conversationId);
        }
        return updated;
      });
      if (selectedConv?.id === payload.conversationId) {
        setSelectedConv((prev: any) => (prev ? { ...prev, isLiveChat: isLiveVal } : prev));
      }
      fetchConversations(true);
    };

    socket.on('message:receive', handleReceive);
    socket.on('admin:chat_message', handleReceive);
    socket.on('chat:live_status', handleLiveStatus);

    return () => {
      socket.off('message:receive', handleReceive);
      socket.off('admin:chat_message', handleReceive);
      socket.off('chat:live_status', handleLiveStatus);
    };
  }, [selectedConv?.id, activeTab]);

  const handleToggleMasterAdminChat = async () => {
    const nextState = !adminChatEnabled;
    setSavingSettings(true);
    try {
      await api.patch('/chat/admin/settings', { isEnabled: nextState });
      setAdminChatEnabled(nextState);
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle Admin Chat');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSettingsModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.patch('/chat/admin/settings', {
        isEnabled: adminChatEnabled,
        welcomeMessageEnabled: welcomeEnabled,
        welcomeMessageTemplate: welcomeTemplate,
      });
      setShowSettingsModal(false);
      alert(
        lang === 'bn'
          ? 'অ্যাডমিন চ্যাট ও স্বাগতম মেসেজ সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'
          : 'Admin Chat & Welcome Message settings saved!',
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleLiveStatus = async (convId: string, nextLive: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/chat/admin/conversations/${convId}/live-status`, { isLive: nextLive });
      setConversations((prev) => {
        const updated = prev.map((c) => (c.id === convId ? { ...c, isLiveChat: nextLive } : c));
        if (activeTab === 'ADMIN_LIVE_CHAT' && !nextLive) {
          return updated.filter((c) => c.id !== convId);
        }
        return updated;
      });
      if (selectedConv?.id === convId) {
        setSelectedConv((prev: any) => (prev ? { ...prev, isLiveChat: nextLive } : prev));
      }
      fetchConversations(true);
      window.dispatchEvent(new Event('admin-sidebar-counts-refresh'));
    } catch (err: any) {
      alert(err?.message || 'Failed to update live status');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConv?.id || sending) return;

    const text = messageInput.trim();
    setMessageInput('');
    setSending(true);
    try {
      const res: any = await api.post(`/chat/admin/conversations/${selectedConv.id}/message`, {
        content: text,
        messageType: 'TEXT',
        isAdminNotice: false,
      });
      const saved = unwrap(res);
      if (saved) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
        scrollToBottom('smooth');
      }
      fetchConversations(true);
      window.dispatchEvent(new Event('admin-sidebar-counts-refresh'));
    } catch (err: any) {
      alert(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSearchUsersModal = async (q: string) => {
    setUserSearchInput(q);
    setSearchingUsers(true);
    try {
      const res: any = await api.get(`/chat/admin/search-users?q=${encodeURIComponent(q.trim())}`);
      const data = unwrap(res);
      setSearchedUsers(Array.isArray(data) ? data : []);
    } catch {
      setSearchedUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const openNewChatModal = () => {
    setShowNewChatModal(true);
    handleSearchUsersModal('');
  };

  const handleStartChatWithUser = async (userObj: any) => {
    const targetUserId = typeof userObj === 'string' ? userObj : userObj?.id;
    if (!targetUserId) return;
    try {
      const res: any = await api.post('/chat/admin/support-conversation', { targetUserId });
      const conv = unwrap(res);
      setShowNewChatModal(false);
      setUserSearchInput('');
      setSearchQuery('');
      const convId = conv?.conversationId || conv?.id;
      await fetchConversations(false);
      if (convId) {
        handleSelectConversation({
          ...conv,
          id: convId,
          targetUser: typeof userObj === 'object' ? userObj : undefined,
        });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to open Admin Chat with user');
    }
  };

  const activeTargetUser = selectedConv ? getTargetUser(selectedConv) : null;

  const formatReplyForUser = (rawText: string) => {
    const fName = activeTargetUser?.firstName || 'User';
    const lName = activeTargetUser?.lastName || '';
    return rawText
      .replace(/\{First Name\}/gi, fName)
      .replace(/\{Last Name\}/gi, lName)
      .replace(/\s+\n/g, '\n')
      .trim();
  };

  const handleInsertQuickReply = (item: QuickReplyItem) => {
    const formatted = formatReplyForUser(item.text);
    setMessageInput(formatted);
  };

  const handleDirectSendQuickReply = async (item: QuickReplyItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedConv?.id || sending) return;
    const formatted = formatReplyForUser(item.text);
    if (!formatted) return;

    setSending(true);
    try {
      const res: any = await api.post(`/chat/admin/conversations/${selectedConv.id}/message`, {
        content: formatted,
        messageType: 'TEXT',
        isAdminNotice: false,
      });
      const saved = unwrap(res);
      if (saved) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
        scrollToBottom('smooth');
      }
      fetchConversations(true);
      window.dispatchEvent(new Event('admin-sidebar-counts-refresh'));
    } catch (err: any) {
      alert(err?.message || 'Failed to send quick reply');
    } finally {
      setSending(false);
    }
  };

  const persistQuickReplies = async (nextList: QuickReplyItem[]) => {
    setSavingQuickReplies(true);
    try {
      await api.patch('/chat/admin/settings', { quickReplies: nextList });
      setQuickReplies(nextList);
    } catch (err: any) {
      alert(err?.message || 'Failed to save custom messages');
    } finally {
      setSavingQuickReplies(false);
    }
  };

  const handleAddOrUpdateQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = customReplyTitle.trim();
    const text = customReplyText.trim();
    if (!title || !text) return;

    let nextList: QuickReplyItem[];
    if (editingReplyId) {
      nextList = quickReplies.map((r) =>
        r.id === editingReplyId ? { ...r, title, text } : r,
      );
    } else {
      nextList = [
        ...quickReplies,
        {
          id: `qr-${Date.now()}`,
          title,
          text,
        },
      ];
    }

    await persistQuickReplies(nextList);
    setEditingReplyId(null);
    setCustomReplyTitle('');
    setCustomReplyText('');
  };

  const handleStartEditQuickReply = (item: QuickReplyItem) => {
    setEditingReplyId(item.id);
    setCustomReplyTitle(item.title);
    setCustomReplyText(item.text);
  };

  const handleDeleteQuickReply = async (id: string) => {
    const nextList = quickReplies.filter((r) => r.id !== id);
    await persistQuickReplies(nextList);
    if (editingReplyId === id) {
      setEditingReplyId(null);
      setCustomReplyTitle('');
      setCustomReplyText('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4.5rem)] sm:h-[calc(100vh-5rem)] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
      {/* Top Bar: Title + Master ON/OFF Toggle + Custom Messages + Welcome Message Settings + Start Chat */}
      <div className="flex-shrink-0 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 relative shrink-0">
            <Headset className="w-4 h-4 sm:w-5 sm:h-5" />
            {adminLiveCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {lang === 'bn' ? 'অ্যাডমিন চ্যাট' : 'SafnexBD Admin Chat'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                SafnexBD Admin
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'অ্যাডমিন বা স্টাফ যেই মেসেজ দিক, ইউজারের কাছে শুধুমাত্র "SafnexBD Admin" নাম দেখাবে'
                : 'All admin & staff replies appear to users as "SafnexBD Admin"'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* New Chat with Any User Button */}
          <button
            type="button"
            onClick={openNewChatModal}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{lang === 'bn' ? 'ইউজার খুঁজুন' : 'Find User'}</span>
          </button>

          {/* Custom Quick Replies Manager Button */}
          <button
            type="button"
            onClick={() => {
              setEditingReplyId(null);
              setCustomReplyTitle('');
              setCustomReplyText('');
              setShowQuickRepliesModal(true);
            }}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{lang === 'bn' ? 'কাস্টম মেসেজ' : 'Custom Messages'}</span>
          </button>

          {/* Master Admin Chat ON / OFF Switch */}
          <button
            type="button"
            disabled={savingSettings}
            onClick={handleToggleMasterAdminChat}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center gap-1.5 border transition cursor-pointer ${
              adminChatEnabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
            }`}
          >
            <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>
              {adminChatEnabled
                ? lang === 'bn'
                  ? 'চ্যাট: ON'
                  : 'Chat: ON'
                : lang === 'bn'
                  ? 'চ্যাট: OFF'
                  : 'Chat: OFF'}
            </span>
          </button>

          {/* Customize Welcome Message Button */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{lang === 'bn' ? 'স্বাগতম মেসেজ' : 'Welcome Msg'}</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchConversations(false)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: Conversation List & Direct User Search */}
        <div
          className={`${
            mobileShowChat ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-80 xl:w-96 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex-col min-h-0 shrink-0`}
        >
          {/* Filter Tabs + Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-950 border border-slate-300/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN_SUPPORT')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'ADMIN_SUPPORT'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'bn' ? 'সকল অ্যাডমিন চ্যাট' : 'All Admin Chats'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN_LIVE_CHAT')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'ADMIN_LIVE_CHAT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : adminLiveCount > 0
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    adminLiveCount > 0
                      ? 'bg-rose-500 animate-ping'
                      : activeTab === 'ADMIN_LIVE_CHAT'
                      ? 'bg-white'
                      : 'bg-slate-400'
                  }`}
                />
                <span>
                  {lang === 'bn'
                    ? `লাইভ চ্যাট (${adminLiveCount})`
                    : `Live Chat (${adminLiveCount})`}
                </span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'ইউজার আইডি, নাম, ফোন বা ইমেইল লিখে খুঁজুন...'
                    : 'Search by User ID, Name, Phone or Email...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations + Matched Users Scroll List */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200/70 dark:divide-slate-800/60 custom-scrollbar">
            {/* If admin is searching, show direct matched users so admin can start chat with ANY user */}
            {searchQuery.trim() && (
              <div className="p-2.5 bg-sky-500/5 border-b border-sky-500/20">
                <div className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 px-1.5 mb-1.5 flex items-center justify-between">
                  <span>
                    {lang === 'bn'
                      ? 'খুঁজে পাওয়া ইউজার (ক্লিক করে চ্যাট শুরু করুন)'
                      : 'Matched Users (Click to Chat)'}
                  </span>
                  {searchingInlineUsers && <RefreshCw className="w-3 h-3 animate-spin" />}
                </div>
                {inlineMatchedUsers.length === 0 && !searchingInlineUsers ? (
                  <p className="text-[11px] text-slate-400 px-1.5 py-1">
                    {lang === 'bn'
                      ? 'এই নামে/আইডিতে কোনো ইউজার পাওয়া যায়নি'
                      : 'No user found matching this query'}
                  </p>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {inlineMatchedUsers.map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => handleStartChatWithUser(u)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-sky-500/15 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 cursor-pointer transition"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-[10px] font-mono text-sky-600 dark:text-sky-400 truncate">
                            @{u.uniqueUserId} {u.phone ? `• ${u.phone}` : ''}
                          </p>
                          {u.email && (
                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                          )}
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-bold shrink-0">
                          {lang === 'bn' ? 'চ্যাট' : 'Chat'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading conversations...'}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                <p>
                  {activeTab === 'ADMIN_LIVE_CHAT'
                    ? lang === 'bn'
                      ? 'বর্তমানে কোনো ইউজার অ্যাডমিন লাইভ চ্যাটে নেই।'
                      : 'No active live chat users right now.'
                    : lang === 'bn'
                    ? 'কোনো চ্যাট পাওয়া যায়নি। উপরে সার্চ বক্সে ইউজারের নাম, আইডি, ফোন বা ইমেইল লিখে চ্যাট শুরু করুন।'
                    : 'No conversations found. Search any user above to start chatting.'}
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const target = getTargetUser(conv);
                const isSelected = selectedConv?.id === conv.id;
                const isLive = Boolean(conv.isLiveChat);

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv, true)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-sky-500/15 border-l-4 border-l-sky-500'
                        : isLive
                        ? 'bg-rose-500/5 hover:bg-rose-500/10 border-l-4 border-l-rose-500'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* User Avatar: ONLY blinks red when isLive === true */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden ${
                          isLive
                            ? 'ring-2 ring-rose-500 animate-pulse shadow-lg shadow-rose-500/40 bg-rose-600'
                            : 'bg-sky-600 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {target?.avatarUrl ? (
                          <img
                            src={getImageUrl(target.avatarUrl)}
                            alt={target.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{target?.firstName?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      {isLive && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {target
                            ? `${target.firstName || ''} ${target.lastName || ''}`.trim() ||
                              target.uniqueUserId
                            : 'User'}
                        </span>
                        {isLive && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleLiveStatus(conv.id, false, e)}
                            className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white text-[9px] font-black border border-rose-500/40 transition shrink-0 cursor-pointer"
                            title="Turn off Live Chat status"
                          >
                            Live Off
                          </button>
                        )}
                      </div>
                      {target?.uniqueUserId && (
                        <p className="text-[10px] font-mono text-sky-600 dark:text-sky-400 truncate">
                          @{target.uniqueUserId} {target.phone ? `• ${target.phone}` : ''}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Workspace */}
        <div
          className={`${
            mobileShowChat ? 'flex' : 'hidden lg:flex'
          } flex-1 flex-col min-w-0 min-h-0 bg-white dark:bg-slate-950`}
        >
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <Headset className="w-12 h-12 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn'
                  ? 'বাম পাশ থেকে যেকোনো ইউজার সিলেক্ট করুন অথবা সার্চ করুন'
                  : 'Select or search a user conversation from the left'}
              </h3>
              <p className="text-xs max-w-md text-slate-500">
                {lang === 'bn'
                  ? 'এখান থেকে আপনি বা যেকোনো স্টাফ মেসেজ পাঠালে ইউজারের কাছে আপনার ব্যক্তিগত নাম দেখাবে না, শুধুমাত্র "SafnexBD Admin" দেখাবে।'
                  : 'Messages sent here by any admin or staff member will appear to the user as "SafnexBD Admin".'}
              </p>
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileShowChat(false)}
                    className="lg:hidden p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-500 transition shrink-0"
                    title={lang === 'bn' ? 'তালিকায় ফিরুন' : 'Back to List'}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 ${
                      selectedConv.isLiveChat
                        ? 'ring-2 ring-rose-500 animate-pulse bg-rose-600'
                        : 'bg-sky-600'
                    }`}
                  >
                    {activeTargetUser?.avatarUrl ? (
                      <img
                        src={getImageUrl(activeTargetUser.avatarUrl)}
                        alt={activeTargetUser.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{activeTargetUser?.firstName?.charAt(0) || 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {activeTargetUser
                          ? `${activeTargetUser.firstName || ''} ${activeTargetUser.lastName || ''}`.trim()
                          : 'User'}
                      </h2>
                      {activeTargetUser?.uniqueUserId && (
                        <span className="text-[10px] sm:text-[11px] font-mono text-sky-600 dark:text-sky-400">
                          (@{activeTargetUser.uniqueUserId})
                        </span>
                      )}
                      {activeTargetUser?.phone && (
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                          • {activeTargetUser.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold truncate">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span className="truncate">
                        {lang === 'bn'
                          ? 'ইউজারের কাছে পরিচয়: SafnexBD Admin'
                          : 'Visible as: SafnexBD Admin'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedConv.isLiveChat && (
                    <button
                      type="button"
                      onClick={() => handleToggleLiveStatus(selectedConv.id, false)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 text-[11px] sm:text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'bn' ? '🔴 লাইভ অফ' : '🔴 Live Off'}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar bg-slate-50/50 dark:bg-slate-950">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    {lang === 'bn' ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    {lang === 'bn'
                      ? 'এখনও কোনো মেসেজ নেই। নিচে মেসেজ লিখে চ্যাট শুরু করুন।'
                      : 'No messages yet. Send a message below to start chatting.'}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromUser =
                      activeTargetUser && msg.senderId === activeTargetUser.id;
                    const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                            isFromUser
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                              : 'bg-sky-600 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-80">
                            <span className="font-bold">
                              {isFromUser
                                ? `${activeTargetUser?.firstName || 'User'} ${activeTargetUser?.lastName || ''}`
                                : '🛡️ SafnexBD Admin'}
                            </span>
                            <span>
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>

                          {attachments.length > 0 && (
                            <div className="space-y-2 mb-2">
                              {attachments.map((att: any, i: number) => {
                                const url = getImageUrl(att.fileUrl);
                                const isImg =
                                  att.fileType === 'IMAGE' ||
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileUrl || '');
                                if (isImg) {
                                  return (
                                    <a key={i} href={url} target="_blank" rel="noreferrer">
                                      <img
                                        src={url}
                                        alt="Attachment"
                                        className="max-h-60 rounded-xl object-contain border border-black/10"
                                      />
                                    </a>
                                  );
                                }
                                return (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 underline text-xs font-bold"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Attachment</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Custom Messages Bar */}
              <div className="px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1 min-w-0 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">
                      {lang === 'bn'
                        ? 'রেডি কাস্টম মেসেজ:'
                        : 'Quick Custom Messages:'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReplyId(null);
                      setCustomReplyTitle('');
                      setCustomReplyText('');
                      setShowQuickRepliesModal(true);
                    }}
                    className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>
                      {lang === 'bn' ? '+ কাস্টম মেসেজ' : '+ Add Custom'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                  {quickReplies.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleInsertQuickReply(item)}
                      title={formatReplyForUser(item.text)}
                      className="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-white dark:bg-slate-950 hover:bg-sky-500/10 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-2xs shrink-0"
                    >
                      <span className="truncate max-w-[150px] sm:max-w-[190px]">{item.title}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDirectSendQuickReply(item, e)}
                        disabled={sending}
                        title={
                          lang === 'bn'
                            ? 'সরাসরি এই মেসেজটি পাঠান'
                            : 'Send this message immediately'
                        }
                        className="p-1 rounded-lg bg-sky-500/15 hover:bg-sky-600 text-sky-600 dark:text-sky-400 hover:text-white transition cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-1.5 sm:gap-2 w-full max-w-full overflow-hidden shrink-0"
              >
                <textarea
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={
                    lang === 'bn'
                      ? 'SafnexBD Admin হিসেবে মেসেজ লিখুন...'
                      : 'Reply as SafnexBD Admin...'
                  }
                  className="flex-1 min-w-0 w-full max-h-32 min-h-[44px] px-3 sm:px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="px-3.5 sm:px-5 h-[44px] rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Modal 1: Customize Auto Welcome Message & Admin Chat Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-500" />
                <span>
                  {lang === 'bn'
                    ? 'অ্যাডমিন চ্যাট ও অটো স্বাগতম মেসেজ সেটিংস'
                    : 'Admin Chat & Auto Welcome Message Settings'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettingsModal} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'অ্যাডমিন চ্যাট চালু রাখুন (Master Switch)'
                      : 'Enable Admin Chat for Users'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'অফ রাখলে ইউজাররা অ্যাডমিন চ্যাটে মেসেজ পাঠাতে পারবে না'
                      : 'When OFF, users cannot send messages in Admin Chat'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adminChatEnabled}
                  onChange={(e) => setAdminChatEnabled(e.target.checked)}
                  className="w-5 h-5 accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'নতুন রেজিস্ট্রেশনে অটো ওয়েলকাম মেসেজ পাঠান'
                      : 'Send Auto Welcome Message on New Registration'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'নতুন ইউজার রেজিস্ট্রেশন করলেই সাথে সাথে SafnexBD Admin থেকে মেসেজ যাবে'
                      : 'Automatically sends welcome message when a new user registers'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={welcomeEnabled}
                  onChange={(e) => setWelcomeEnabled(e.target.checked)}
                  className="w-5 h-5 accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {lang === 'bn'
                    ? 'ওয়েলকাম মেসেজ টেমপ্লেট ({First Name} এবং {Last Name} অটোমেটিক বসবে):'
                    : 'Welcome Message Template (Supports {First Name} and {Last Name}):'}
                </label>
                <textarea
                  rows={12}
                  value={welcomeTemplate}
                  onChange={(e) => setWelcomeTemplate(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
                >
                  {savingSettings
                    ? lang === 'bn'
                      ? 'সেভ হচ্ছে...'
                      : 'Saving...'
                    : lang === 'bn'
                      ? 'সেভ করুন'
                      : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Search User by ID, Name, Phone, or Email & Start Admin Chat */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-500" />
                <span>
                  {lang === 'bn'
                    ? 'ইউজার খুঁজুন ও SafnexBD Admin হিসেবে চ্যাট করুন'
                    : 'Find User & Start Admin Chat'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={userSearchInput}
                onChange={(e) => handleSearchUsersModal(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'ইউজারের নাম, ইউজার আইডি, ফোন বা ইমেইল লিখুন...'
                    : 'Enter user name, ID, phone or email...'
                }
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar">
              {searchingUsers ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {lang === 'bn' ? 'ইউজার খোঁজা হচ্ছে...' : 'Searching users...'}
                </div>
              ) : searchedUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {lang === 'bn' ? 'কোনো ইউজার পাওয়া যায়নি' : 'No matching users found'}
                </div>
              ) : (
                searchedUsers.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartChatWithUser(u)}
                    className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[10px] font-mono text-sky-600 dark:text-sky-400 truncate">
                        @{u.uniqueUserId} {u.phone ? `• ${u.phone}` : ''}
                      </p>
                      {u.email && (
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      )}
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold shrink-0">
                      {lang === 'bn' ? 'চ্যাট করুন' : 'Chat'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Custom Quick Replies Manager (Add / Edit / Delete Customizable Messages) */}
      {showQuickRepliesModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>
                    {lang === 'bn'
                      ? 'কাস্টম কুইক রিপ্লাই মেসেজ ম্যানেজার'
                      : 'Custom Quick Reply Messages Manager'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'নতুন কাস্টম মেসেজ তৈরি করুন বা আগের মেসেজ এডিট/ডিলিট করুন। মেসেজে {First Name} ও {Last Name} লিখলে ইউজারের নাম অটোমেটিক বসে যাবে।'
                    : 'Create, edit, or delete custom quick replies. Use {First Name} and {Last Name} for dynamic user names.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickRepliesModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add / Edit Form */}
            <form
              onSubmit={handleAddOrUpdateQuickReply}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  {editingReplyId
                    ? lang === 'bn'
                      ? '✏️ কাস্টম মেসেজ এডিট করুন'
                      : '✏️ Edit Custom Message'
                    : lang === 'bn'
                      ? '➕ নতুন কাস্টম মেসেজ যোগ করুন'
                      : '➕ Add New Custom Message'}
                </h4>
                {editingReplyId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReplyId(null);
                      setCustomReplyTitle('');
                      setCustomReplyText('');
                    }}
                    className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'এডিট বাতিল করুন' : 'Cancel Edit'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'bn'
                      ? 'বাটনের সংক্ষিপ্ত নাম (যেমন: 💳 রিচার্জ গাইড / 📞 কল সাপোর্ট):'
                      : 'Short Button Title (e.g. 💳 Recharge Guide):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customReplyTitle}
                    onChange={(e) => setCustomReplyTitle(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'যেমন: 🎉 স্পেশাল অফার / 📌 কেওয়াইসি ভেরিফিকেশন'
                        : 'e.g. 📌 Verification Help'
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'bn'
                        ? 'কাস্টম মেসেজ টেক্সট:'
                        : 'Custom Message Text:'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomReplyText((prev) => `${prev} {First Name}`.trimStart())
                        }
                        className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-mono font-bold hover:bg-sky-500/25 cursor-pointer"
                      >
                        + {'{First Name}'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomReplyText((prev) => `${prev} {Last Name}`.trimStart())
                        }
                        className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-mono font-bold hover:bg-sky-500/25 cursor-pointer"
                      >
                        + {'{Last Name}'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={customReplyText}
                    onChange={(e) => setCustomReplyText(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'প্রিয় {First Name}, আপনার মেসেজটি এখানে লিখুন...'
                        : 'Dear {First Name}, write your custom reply template here...'
                    }
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingQuickReplies || !customReplyTitle.trim() || !customReplyText.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {savingQuickReplies
                      ? lang === 'bn'
                        ? 'সেভ হচ্ছে...'
                        : 'Saving...'
                      : editingReplyId
                        ? lang === 'bn'
                          ? 'আপডেট ও সেভ করুন'
                          : 'Update Custom Message'
                        : lang === 'bn'
                          ? 'কাস্টম মেসেজ যুক্ত করুন'
                          : 'Add Custom Message'}
                  </span>
                </button>
              </div>
            </form>

            {/* Saved Custom Messages List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">
                  {lang === 'bn'
                    ? `সংরক্ষিত কাস্টম মেসেজ সমূহ (${quickReplies.length}টি)`
                    : `Saved Custom Messages (${quickReplies.length})`}
                </h4>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {quickReplies.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditQuickReply(item)}
                        className="p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 transition cursor-pointer"
                        title={lang === 'bn' ? 'এডিট করুন' : 'Edit'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuickReply(item.id)}
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                        title={lang === 'bn' ? 'ডিলিট করুন' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

