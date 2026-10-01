'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle,
  X,
  Send,
  Headset,
  ArrowLeft,
  ExternalLink,
  PictureInPicture2,
  Wallet,
  Briefcase,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Maximize2,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getImageUrl } from '@/lib/imageUtils';

function unwrap<T = any>(res: any): T {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data;
  }
  return res;
}

export default function FloatingChatBubble() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { lang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'admin' | 'quick'>('chats');
  const [conversations, setConversations] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isInsideFullChatPage =
    pathname === '/dashboard/chat' ||
    pathname === '/dashboard/admin-chat' ||
    pathname?.startsWith('/admin/admin-chat') ||
    pathname?.startsWith('/admin/cms');

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (Number(c.unreadCount) || 0),
    0,
  );

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const fetchConversations = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const res: any = await api.get('/chat/conversations');
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : data?.conversations || [];
      const deduped: any[] = [];
      const seen = new Set<string>();
      for (const c of list) {
        if (!c.otherUser?.id || c.otherUser?.deletedAt || c.otherUser?.isActive === false) continue;
        if (!seen.has(c.otherUser.id)) {
          seen.add(c.otherUser.id);
          deduped.push({
            ...c,
            unreadCount: Number(c.unreadCount || 0),
          });
        }
      }
      setConversations(deduped);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = getSocket();
    if (!socket) return;

    const handleReceive = (msg: any) => {
      if (selectedConv?.conversationId && msg?.conversationId === selectedConv.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
      fetchConversations();
    };

    socket.on('message:receive', handleReceive);
    return () => {
      socket.off('message:receive', handleReceive);
    };
  }, [isAuthenticated, user?.id, selectedConv?.conversationId]);

  const openConversation = async (conv: any) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const convId = conv.conversationId || conv.id;
      const res: any = await api.get(`/chat/conversations/${convId}/messages`);
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : data?.messages || [];
      setMessages(list);
      scrollToBottom();
      await api.patch(`/chat/conversations/${convId}/read`).catch(() => {});
      fetchConversations();
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const openAdminSupportInBubble = async () => {
    setActiveTab('admin');
    setLoadingMessages(true);
    try {
      const res: any = await api.post('/chat/admin/support-conversation', {});
      const conv = unwrap(res);
      const convId = conv?.conversationId || conv?.id;
      if (convId) {
        const formattedConv = {
          ...conv,
          conversationId: convId,
          otherUser: conv?.otherUser || {
            firstName: 'SafnexBD',
            lastName: 'Admin',
            uniqueUserId: 'SafnexBD_Admin',
          },
        };
        setSelectedConv(formattedConv);
        const msgRes: any = await api.get(`/chat/conversations/${convId}/messages`);
        const msgData = unwrap(msgRes);
        setMessages(Array.isArray(msgData) ? msgData : msgData?.messages || []);
        scrollToBottom();
      }
    } catch {
      // fallback
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const convId = selectedConv?.conversationId || selectedConv?.id;
    if (!messageInput.trim() || !convId || sending) return;
    const text = messageInput.trim();
    setMessageInput('');
    setSending(true);
    try {
      const res: any = await api.post(`/chat/conversations/${convId}/messages`, {
        content: text,
        messageType: 'TEXT',
      });
      const saved = unwrap(res);
      if (saved) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
        scrollToBottom();
      }
      fetchConversations();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  // Pop-out Always-on-Top Mini Messenger Window (stays visible even outside the main browser tab!)
  const handlePopoutFloatingWindow = async () => {
    const targetUrl =
      selectedConv?.conversationId
        ? `${window.location.origin}/dashboard/chat?conversationId=${selectedConv.conversationId}`
        : `${window.location.origin}/dashboard/chat`;

    try {
      const anyWin = window as any;
      if (anyWin.documentPictureInPicture) {
        const pipWindow = await anyWin.documentPictureInPicture.requestWindow({
          width: 400,
          height: 620,
        });
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.height = '100vh';
        pipWindow.document.body.style.overflow = 'hidden';
        const iframe = pipWindow.document.createElement('iframe');
        iframe.src = targetUrl;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        pipWindow.document.body.appendChild(iframe);
        setIsOpen(false);
        return;
      }
    } catch {
      // fallback to compact popup window below
    }

    window.open(
      targetUrl,
      'SafnexBD_Messenger_Bubble',
      'popup=yes,width=400,height=640,right=20,bottom=20,resizable=yes,scrollbars=yes',
    );
    setIsOpen(false);
  };

  if (!isAuthenticated || !user) return null;

  // When on full chat page, show a compact "Pop-out Floating Chat" button in top-right/bottom-right
  if (isInsideFullChatPage) {
    return (
      <div className="fixed bottom-4 right-4 z-40 hidden md:block">
        <button
          type="button"
          onClick={handlePopoutFloatingWindow}
          className="px-3.5 py-2 rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white text-xs font-extrabold shadow-xl flex items-center gap-2 border border-white/20 cursor-pointer transition hover:scale-105"
          title={
            lang === 'bn'
              ? 'ওয়েবসাইট থেকে বের হলেও স্ক্রিনে মেসেঞ্জার বাবল ভাসিয়ে রাখুন'
              : 'Keep chat floating on screen even outside the browser tab'
          }
        >
          <PictureInPicture2 className="w-4 h-4" />
          <span>
            {lang === 'bn' ? '📌 ভাসমান চ্যাট উইন্ডো (Pop-out)' : '📌 Pop-out Chat Bubble'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end">
      {/* Expanded Mini Messenger Window */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2rem)] sm:w-[370px] h-[520px] max-h-[78vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Top Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {selectedConv ? (
                <button
                  type="button"
                  onClick={() => setSelectedConv(null)}
                  className="p-1 rounded-lg hover:bg-white/20 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <MessageCircle className="w-5 h-5 shrink-0" />
              )}
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black truncate">
                  {selectedConv
                    ? `${selectedConv.otherUser?.firstName || ''} ${selectedConv.otherUser?.lastName || ''}`.trim() ||
                      selectedConv.otherUser?.uniqueUserId ||
                      'Chat'
                    : lang === 'bn'
                      ? 'SafnexBD মেসেঞ্জার বাবল'
                      : 'SafnexBD Messenger'}
                </h3>
                <p className="text-[10px] text-white/80 truncate">
                  {selectedConv
                    ? `@${selectedConv.otherUser?.uniqueUserId || 'user'}`
                    : lang === 'bn'
                      ? 'চ্যাট, ডিলস ও কুইক অ্যাকশন'
                      : 'Chat, Deals & Quick Actions'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Pop-out Always-on-Top Button */}
              <button
                type="button"
                onClick={handlePopoutFloatingWindow}
                title={
                  lang === 'bn'
                    ? 'ব্রাউজার থেকে বের হলেও স্ক্রিনে ভাসিয়ে রাখুন (Pop-out)'
                    : 'Keep floating outside browser tab (Pop-out)'
                }
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Open Full Chat Page */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(
                    selectedConv?.conversationId
                      ? `/dashboard/chat?conversationId=${selectedConv.conversationId}`
                      : '/dashboard/chat',
                  );
                }}
                title={lang === 'bn' ? 'ফুল স্ক্রিন চ্যাটে যান' : 'Open Full Chat'}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Minimize Bubble */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs (when not inside a specific conversation) */}
          {!selectedConv && (
            <div className="grid grid-cols-3 gap-1 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('chats')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                  activeTab === 'chats'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                💬 {lang === 'bn' ? 'চ্যাট লিস্ট' : 'Chats'}
              </button>
              <button
                type="button"
                onClick={openAdminSupportInBubble}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                🛡️ {lang === 'bn' ? 'অ্যাডমিন চ্যাট' : 'Admin Chat'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quick')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                  activeTab === 'quick'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ⚡ {lang === 'bn' ? 'কুইক মেনু' : 'Quick Hub'}
              </button>
            </div>
          )}

          {/* Body Content */}
          {selectedConv ? (
            /* Active Mini Chat Thread */
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    {lang === 'bn' ? 'মেসেজ লোড হচ্ছে...' : 'Loading messages...'}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    {lang === 'bn'
                      ? 'এখনও কোনো মেসেজ নেই। নিচে মেসেজ লিখে পাঠান।'
                      : 'No messages yet. Say hello below!'}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                            isMine
                              ? 'bg-sky-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={lang === 'bn' ? 'মেসেজ লিখুন...' : 'Type a message...'}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : activeTab === 'quick' ? (
            /* Quick Actions Hub inside Bubble */
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-slate-950">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                {lang === 'bn'
                  ? 'চ্যাট বাবল থেকেই এক ক্লিকে সব কাজ করুন:'
                  : 'Quick actions right from your chat bubble:'}
              </p>

              <button
                type="button"
                onClick={handlePopoutFloatingWindow}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-sky-500/15 to-emerald-500/15 hover:from-sky-500/25 hover:to-emerald-500/25 border border-sky-500/30 flex items-center justify-between text-left transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <PictureInPicture2 className="w-5 h-5 text-sky-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      {lang === 'bn'
                        ? '📌 ব্রাউজারের বাইরে চ্যাট ভাসিয়ে রাখুন'
                        : '📌 Always-on-Top Pop-out Chat'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {lang === 'bn'
                        ? 'অন্য ওয়েবসাইট বা অ্যাপে গেলেও চ্যাট উইন্ডো স্ক্রিনে ভেসে থাকবে'
                        : 'Stays on screen even when browsing other tabs or apps'}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-sky-500 shrink-0" />
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/dashboard/chat"
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 flex flex-col gap-1 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'এসক্রো ও ডিল চ্যাট' : 'Escrow & Deals'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'নিরাপদ লেনদেন করুন' : 'Safe P2P Deals'}
                  </span>
                </Link>

                <Link
                  href="/dashboard/wallet"
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 flex flex-col gap-1 transition"
                >
                  <Wallet className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'ওয়ালেট ও রিচার্জ' : 'Wallet & Recharge'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'ব্যালেন্স ও উইথড্র' : 'Deposit & Withdraw'}
                  </span>
                </Link>

                <Link
                  href="/micro-jobs"
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 flex flex-col gap-1 transition"
                >
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'মাইক্রো জবস' : 'Micro-Jobs'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'কাজ করে আয় করুন' : 'Earn from tasks'}
                  </span>
                </Link>

                <Link
                  href="/dashboard/admin-chat"
                  onClick={() => setIsOpen(false)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 flex flex-col gap-1 transition"
                >
                  <Headset className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'অ্যাডমিন হেল্পডেস্ক' : 'Admin Support'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {lang === 'bn' ? '২৪/৭ লাইভ সাপোর্ট' : '24/7 Live Help'}
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            /* Recent Conversations List (10 + See More +10) */
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <MessageCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' ? 'এখনও কোনো চ্যাট শুরু হয়নি।' : 'No recent chats yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={openAdminSupportInBubble}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold cursor-pointer"
                  >
                    {lang === 'bn' ? '🛡️ SafnexBD Admin-এর সাথে চ্যাট করুন' : 'Chat with SafnexBD Admin'}
                  </button>
                </div>
              ) : (
                <>
                  {conversations.slice(0, visibleCount).map((conv) => {
                    const other = conv.otherUser;
                    const name =
                      `${other?.firstName || ''} ${other?.lastName || ''}`.trim() ||
                      other?.uniqueUserId ||
                      'User';
                    const unread = Number(conv.unreadCount || 0);

                    return (
                      <div
                        key={conv.conversationId}
                        onClick={() => openConversation(conv)}
                        className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                      >
                        <div className="relative shrink-0">
                          {other?.avatarUrl ? (
                            <img
                              src={getImageUrl(other.avatarUrl)}
                              alt={name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center">
                              {name.charAt(0)}
                            </div>
                          )}
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {conv.lastMessage?.content || 'Tap to open chat'}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {conversations.length > visibleCount && (
                    <div className="p-2.5">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + 10)}
                        className="w-full py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'bn'
                            ? `আরও ১০ জন দেখুন (See More)`
                            : `See 10 More Chats`}
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Circular Messenger Bubble Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 via-indigo-600 to-emerald-500 text-white shadow-2xl shadow-sky-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-white dark:border-slate-800"
        title={lang === 'bn' ? 'মেসেঞ্জার চ্যাট বাবল' : 'Messenger Chat Bubble'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-7 h-7" />
        )}

        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-bounce">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}
