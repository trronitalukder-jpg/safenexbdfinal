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
  Lock,
  Unlock,
  UserPlus,
  X,
  MessageSquare,
  CheckCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/useAuthStore';
import { getImageUrl } from '@/lib/imageUtils';

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
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [activeTab, setActiveTab] = useState<'ADMIN_SUPPORT' | 'LIVE_CHAT'>('ADMIN_SUPPORT');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Admin Chat Master Settings (ON/OFF + Customizable Welcome Message)
  const [adminChatEnabled, setAdminChatEnabled] = useState(true);
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [welcomeTemplate, setWelcomeTemplate] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

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

  const fetchSettings = async () => {
    try {
      const res: any = await api.get('/chat/admin/settings');
      const data = unwrap(res);
      if (data) {
        setAdminChatEnabled(data.isEnabled !== false);
        setWelcomeEnabled(data.welcomeMessageEnabled !== false);
        setWelcomeTemplate(data.welcomeMessageTemplate || '');
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

      if (selectedConv) {
        const updated = list.find((c: any) => c.id === selectedConv.id);
        if (updated) {
          setSelectedConv((prev: any) => ({ ...prev, ...updated }));
        }
      } else if (list.length > 0 && !silent) {
        handleSelectConversation(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch Admin Support conversations:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  const handleSelectConversation = async (conv: any) => {
    setSelectedConv(conv);
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
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === payload.conversationId ? { ...c, isLiveChat: payload.isLiveChat } : c,
        );
        if (activeTab === 'LIVE_CHAT' && !payload.isLiveChat) {
          return updated.filter((c) => c.id !== payload.conversationId);
        }
        return updated;
      });
      if (selectedConv?.id === payload.conversationId) {
        setSelectedConv((prev: any) => (prev ? { ...prev, isLiveChat: payload.isLiveChat } : prev));
      }
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
        if (activeTab === 'LIVE_CHAT' && !nextLive) {
          return updated.filter((c) => c.id !== convId);
        }
        return updated;
      });
      if (selectedConv?.id === convId) {
        setSelectedConv((prev: any) => (prev ? { ...prev, isLiveChat: nextLive } : prev));
      }
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
    } catch (err: any) {
      alert(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setUserSearchInput(q);
    if (q.trim().length < 2) {
      setSearchedUsers([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res: any = await api.get(`/users/search?q=${encodeURIComponent(q.trim())}`);
      const data = unwrap(res);
      setSearchedUsers(Array.isArray(data) ? data : data?.users || []);
    } catch {
      setSearchedUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleStartChatWithUser = async (targetUserId: string) => {
    try {
      const res: any = await api.post('/chat/admin/support-conversation', { targetUserId });
      const conv = unwrap(res);
      setShowNewChatModal(false);
      setUserSearchInput('');
      setSearchedUsers([]);
      await fetchConversations(false);
      if (conv?.id || conv?.conversationId) {
        handleSelectConversation({ ...conv, id: conv.id || conv.conversationId });
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to open Admin Chat with user');
    }
  };

  // Extract the regular user participant from a conversation
  const getTargetUser = (conv: any) => {
    if (!conv?.participants || !Array.isArray(conv.participants)) return null;
    const nonAdmin = conv.participants.find(
      (p: any) =>
        p?.id !== currentAdmin?.id &&
        p?.uniqueUserId !== 'SafnexBD_Admin' &&
        !p?.roles?.includes('SUPER_ADMIN'),
    );
    return nonAdmin || conv.participants[0] || null;
  };

  const activeTargetUser = selectedConv ? getTargetUser(selectedConv) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Bar: Title + Master ON/OFF Toggle + Welcome Message Settings + Start Chat */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white">
                {lang === 'bn' ? 'অ্যাডমিন চ্যাট (SafnexBD Admin)' : 'SafnexBD Admin Chat'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/15 text-sky-400 border border-sky-500/30">
                IDENTITY MASKED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'অ্যাডমিন বা স্টাফ যেই মেসেজ দিক, ইউজারের কাছে শুধুমাত্র "SafnexBD Admin" নাম দেখাবে'
                : 'All admin & staff replies appear to users as "SafnexBD Admin"'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Chat with Any User Button */}
          <button
            type="button"
            onClick={() => setShowNewChatModal(true)}
            className="px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ইউজার খুঁজুন ও চ্যাট করুন' : 'Message a User'}</span>
          </button>

          {/* Master Admin Chat ON / OFF Switch */}
          <button
            type="button"
            disabled={savingSettings}
            onClick={handleToggleMasterAdminChat}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition cursor-pointer ${
              adminChatEnabled
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {adminChatEnabled
                ? lang === 'bn'
                  ? 'অ্যাডমিন চ্যাট: চালু (ON)'
                  : 'Admin Chat: ON'
                : lang === 'bn'
                  ? 'অ্যাডমিন চ্যাট: বন্ধ (OFF)'
                  : 'Admin Chat: OFF'}
            </span>
          </button>

          {/* Customize Welcome Message Button */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>{lang === 'bn' ? 'স্বাগতম মেসেজ কাস্টমাইজ' : 'Welcome Message'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar: Conversation List */}
        <div className="w-80 sm:w-96 border-r border-slate-800 bg-slate-900/60 flex flex-col min-h-0 shrink-0">
          {/* Filter Tabs + Search */}
          <div className="p-3 border-b border-slate-800 space-y-2.5">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('ADMIN_SUPPORT')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'ADMIN_SUPPORT'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'bn' ? 'সকল অ্যাডমিন চ্যাট' : 'All Admin Chats'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('LIVE_CHAT')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'LIVE_CHAT'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span>{lang === 'bn' ? 'লাইভ চ্যাট' : 'Live Chat'}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'bn' ? 'ইউজারের নাম, আইডি বা ফোন খুঁজুন...' : 'Search user name, ID, phone...'
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-500">
                {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading conversations...'}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                <p>
                  {lang === 'bn'
                    ? 'কোনো চ্যাট পাওয়া যায়নি। উপরে "ইউজার খুঁজুন ও চ্যাট করুন" বাটনে ক্লিক করে চ্যাট শুরু করতে পারেন।'
                    : 'No conversations found.'}
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
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-sky-500/15 border-l-4 border-l-sky-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* User Avatar with Red Blink when Live Chatting */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden ${
                          isLive
                            ? 'ring-2 ring-rose-500 animate-pulse shadow-lg shadow-rose-500/40 bg-rose-600'
                            : 'bg-slate-800 border border-slate-700'
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
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-ping" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-white truncate">
                          {target ? `${target.firstName || ''} ${target.lastName || ''}` : 'User'}
                        </span>
                        {isLive && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleLiveStatus(conv.id, false, e)}
                            className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-[9px] font-black border border-rose-500/40 transition shrink-0"
                            title="Turn off Live Chat status"
                          >
                            Live Off
                          </button>
                        )}
                      </div>
                      {target?.uniqueUserId && (
                        <p className="text-[10px] font-mono text-sky-400 truncate">
                          @{target.uniqueUserId}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 truncate mt-1">
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
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <Headset className="w-12 h-12 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-300">
                {lang === 'bn'
                  ? 'বাম পাশ থেকে যেকোনো ইউজার সিলেক্ট করুন'
                  : 'Select a user conversation from the left'}
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
              <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 ${
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
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-white truncate">
                        {activeTargetUser
                          ? `${activeTargetUser.firstName || ''} ${activeTargetUser.lastName || ''}`
                          : 'User'}
                      </h2>
                      {activeTargetUser?.uniqueUserId && (
                        <span className="text-[11px] font-mono text-sky-400">
                          (@{activeTargetUser.uniqueUserId})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn'
                          ? 'ইউজারের কাছে আপনার পরিচয়: SafnexBD Admin'
                          : 'Visible to user as: SafnexBD Admin'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConv.isLiveChat && (
                    <button
                      type="button"
                      onClick={() => handleToggleLiveStatus(selectedConv.id, false)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'bn' ? '🔴 লাইভ চ্যাট অফ করুন' : '🔴 Turn Off Live Chat'}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    {lang === 'bn' ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    {lang === 'bn' ? 'এখনও কোনো মেসেজ নেই।' : 'No messages yet.'}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromUser =
                      activeTargetUser && msg.senderId === activeTargetUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                            isFromUser
                              ? 'bg-slate-800 text-slate-100 border border-slate-700'
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

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-slate-900 border-t border-slate-800 flex items-end gap-2"
              >
                <textarea
                  rows={1}
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
                  className="flex-1 max-h-32 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="px-5 h-[44px] rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400" />
                <span>
                  {lang === 'bn'
                    ? 'অ্যাডমিন চ্যাট ও অটো স্বাগতম মেসেজ সেটিংস'
                    : 'Admin Chat & Auto Welcome Message Settings'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettingsModal} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">
                    {lang === 'bn'
                      ? 'অ্যাডমিন চ্যাট চালু রাখুন (Master Switch)'
                      : 'Enable Admin Chat for Users'}
                  </p>
                  <p className="text-[11px] text-slate-400">
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

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="text-xs font-bold text-white">
                    {lang === 'bn'
                      ? 'নতুন রেজিস্ট্রেশনে অটো ওয়েলকাম মেসেজ পাঠান'
                      : 'Send Auto Welcome Message on New Registration'}
                  </p>
                  <p className="text-[11px] text-slate-400">
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
                <label className="text-xs font-bold text-slate-300 block">
                  {lang === 'bn'
                    ? 'ওয়েলকাম মেসেজ টেমপ্লেট ({First Name} এবং {Last Name} অটোমেটিক বসবে):'
                    : 'Welcome Message Template (Supports {First Name} and {Last Name}):'}
                </label>
                <textarea
                  rows={12}
                  value={welcomeTemplate}
                  onChange={(e) => setWelcomeTemplate(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
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

      {/* Modal 2: Search User & Start Admin Chat */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                <span>
                  {lang === 'bn'
                    ? 'ইউজার খুঁজুন ও SafnexBD Admin হিসেবে চ্যাট শুরু করুন'
                    : 'Start Admin Chat with User'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={userSearchInput}
              onChange={(e) => handleSearchUsers(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'ইউজারের নাম, ইউজার আইডি বা মোবাইল নম্বর লিখুন...'
                  : 'Enter user name, ID or phone...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
            />

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
              {searchingUsers ? (
                <div className="p-4 text-center text-xs text-slate-500">Searching...</div>
              ) : searchedUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  {lang === 'bn'
                    ? 'কমপক্ষে ২টি অক্ষর লিখে ইউজার খুঁজুন'
                    : 'Type at least 2 characters to search'}
                </div>
              ) : (
                searchedUsers.map((u: any) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartChatWithUser(u.id)}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-800/60 rounded-xl cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[10px] font-mono text-sky-400">@{u.uniqueUserId}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-bold">
                      {lang === 'bn' ? 'চ্যাট করুন' : 'Chat'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
