'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Headset,
  Send,
  Paperclip,
  ShieldCheck,
  Lock,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  X,
  CheckCheck,
  BookOpen,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getImageUrl, compressImage } from '@/lib/imageUtils';

function unwrap<T = any>(res: any): T {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return res.data;
  }
  return res;
}

// Helper to render simple Markdown (**bold**, ### headings) in chat bubbles
function renderFormattedContent(text: string, isOwn: boolean) {
  if (!text) return null;
  const lines = text.split('\n');

  const formatInlineBold = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong
            key={idx}
            className={isOwn ? 'font-extrabold text-white' : 'font-extrabold text-slate-900 dark:text-white'}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5 leading-relaxed break-words">
      {lines.map((rawLine, index) => {
        const line = rawLine.trimEnd();
        if (!line) {
          return <div key={index} className="h-1.5" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4
              key={index}
              className={`text-sm sm:text-base font-black pt-1.5 pb-0.5 border-b ${
                isOwn
                  ? 'text-white border-white/20'
                  : 'text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-700/70'
              }`}
            >
              {formatInlineBold(line.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        return (
          <p key={index} className="text-[13px] sm:text-sm whitespace-pre-wrap">
            {formatInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const { lang } = useLanguage();

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAdminChatEnabled, setIsAdminChatEnabled] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 80);
  };

  const loadAdminSupportChat = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const convRes: any = await api.get('/chat/support/conversation');
      const convData = unwrap(convRes);
      if (convData) {
        const convId = convData.conversationId || convData.id;
        setConversation({ ...convData, id: convId });
        setIsAdminChatEnabled(convData.isAdminChatEnabled !== false);
        setIsLocked(Boolean(convData.isLocked));

        if (convId) {
          const msgRes: any = await api.get(`/chat/conversations/${convId}/messages`);
          const msgData = unwrap(msgRes);
          const list = Array.isArray(msgData) ? msgData : msgData?.messages || [];
          setMessages(list);
          if (!silent) scrollToBottom('auto');
        }
      }
    } catch (err) {
      console.error('Failed to load Admin Support Chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminSupportChat();
    const interval = setInterval(() => {
      loadAdminSupportChat(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const convId = conversation?.id || conversation?.conversationId;
    if (!convId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('join:conversation', { conversationId: convId });

    const handleReceiveMessage = (newMsg: any) => {
      if (newMsg?.conversationId === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom('smooth');
      }
    };

    const handleLockStatus = (data: any) => {
      if (data?.conversationId === convId) {
        setIsLocked(Boolean(data.isLocked));
      }
    };

    const handleAdminSettings = (data: any) => {
      if (data && typeof data.isAdminChatEnabled === 'boolean') {
        setIsAdminChatEnabled(data.isAdminChatEnabled);
      }
    };

    socket.on('message:receive', handleReceiveMessage);
    socket.on('chat:lock_status', handleLockStatus);
    socket.on('chat:admin_settings', handleAdminSettings);

    return () => {
      socket.off('message:receive', handleReceiveMessage);
      socket.off('chat:lock_status', handleLockStatus);
      socket.off('chat:admin_settings', handleAdminSettings);
    };
  }, [conversation?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const convId = conversation?.id || conversation?.conversationId;
    if ((!messageInput.trim() && !selectedFile) || !convId || sending) return;
    if (!isAdminChatEnabled || isLocked) return;

    const textToSend = messageInput.trim();
    const fileToSend = selectedFile;
    setMessageInput('');
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setSending(true);
    try {
      let attachmentPayload = null;
      if (fileToSend) {
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
          throw new Error('Upload failed');
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
          textToSend ||
          (attachmentPayload
            ? attachmentPayload[0].fileType === 'IMAGE'
              ? 'Sent an image'
              : 'Sent an attachment'
            : ''),
        messageType: attachmentPayload ? attachmentPayload[0].fileType : 'TEXT',
        attachments: attachmentPayload,
      };

      const res: any = await api.post(`/chat/conversations/${convId}/messages`, payload);
      const savedMsg = unwrap(res);
      if (savedMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
        scrollToBottom('smooth');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send message';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSending(false);
    }
  };

  const canSendMessage = isAdminChatEnabled && !isLocked;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Top Official SafnexBD Admin Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Headset className="w-6 h-6" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                canSendMessage ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                SafnexBD Admin
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-sky-500" />
                {lang === 'bn' ? 'অফিসিয়াল সাপোর্ট' : 'Official Support'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {canSendMessage
                ? lang === 'bn'
                  ? 'সরাসরি SafnexBD অ্যাডমিন ও সাপোর্ট টিমের সাথে কথা বলুন'
                  : 'Chat directly with the SafnexBD Admin & Support Team'
                : lang === 'bn'
                  ? 'অ্যাডমিন চ্যাট বর্তমানে সাময়িকভাবে বন্ধ রয়েছে'
                  : 'Admin Chat is currently offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/guides"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-500" />
            <span>{lang === 'bn' ? 'গাইডস ও টিউটোরিয়াল' : 'Guides & Tutorials'}</span>
          </Link>
          <button
            type="button"
            onClick={() => loadAdminSupportChat(false)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span>{lang === 'bn' ? 'অ্যাডমিন চ্যাট লোড হচ্ছে...' : 'Loading Admin Chat...'}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="max-w-lg mx-auto my-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center shadow-sm space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center mx-auto">
              <Headset className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'SafnexBD অ্যাডমিন সাপোর্টে স্বাগতম!' : 'Welcome to SafnexBD Admin Support!'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার কোনো প্রশ্ন থাকলে, কোনো ফিচার বুঝতে সমস্যা হলে অথবা যেকোনো সহায়তার জন্য নিচে মেসেজ লিখুন। আমাদের টিম দ্রুত উত্তর দেবে।'
                : 'Have a question or need help with any feature? Send us a message below and our support team will assist you shortly.'}
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              const isSystem = msg.messageType === 'SYSTEM';
              const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold text-center max-w-xl">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Left Avatar for SafnexBD Admin */}
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mb-1">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                      isOwn
                        ? 'bg-sky-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {/* Sender Name Label (Always Masked as SafnexBD Admin for incoming messages) */}
                    <div className="flex items-center justify-between gap-3 mb-1">
                      {!isOwn ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-600 dark:text-sky-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          SafnexBD Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-sky-100">
                          {lang === 'bn' ? 'আপনি' : 'You'}
                        </span>
                      )}
                      <span
                        className={`text-[10px] ${
                          isOwn ? 'text-sky-100/80' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>

                    {/* Attachments */}
                    {attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {attachments.map((att: any, i: number) => {
                          const url = getImageUrl(att.fileUrl);
                          const isImg =
                            att.fileType === 'IMAGE' ||
                            /\.(jpg|jpeg|png|gif|webp)$/i.test(att.fileUrl || '');
                          if (isImg) {
                            return (
                              <img
                                key={i}
                                src={url}
                                alt="Attachment"
                                onClick={() => setLightboxImage(url)}
                                className="max-h-72 rounded-xl object-contain cursor-pointer border border-black/10 dark:border-white/10 hover:opacity-95 transition"
                              />
                            );
                          }
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold underline ${
                                isOwn ? 'bg-sky-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-sky-500'
                              }`}
                            >
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate">Download Attachment</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* Message Text */}
                    {msg.content &&
                      !(attachments.length > 0 && msg.content === 'Sent an image') &&
                      renderFormattedContent(msg.content, isOwn)}

                    {isOwn && (
                      <div className="flex justify-end mt-1">
                        <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Area or Disabled Banner */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          {!canSendMessage ? (
            <div className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold text-center">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                {!isAdminChatEnabled
                  ? lang === 'bn'
                    ? 'অ্যাডমিন চ্যাট বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
                    : 'Admin Chat is currently turned OFF by Admin. Please try again later.'
                  : lang === 'bn'
                    ? 'এই চ্যাটটি বর্তমানে অ্যাডমিন কর্তৃক লক করা হয়েছে।'
                    : 'This chat conversation is currently locked by Admin.'}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              {/* Selected File Preview */}
              {selectedFile && (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer"
                  title={lang === 'bn' ? 'ছবি বা ফাইল যুক্ত করুন' : 'Attach image or file'}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                  rows={1}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    lang === 'bn'
                      ? 'SafnexBD Admin-কে মেসেজ লিখুন...'
                      : 'Write a message to SafnexBD Admin...'
                  }
                  className="flex-1 max-h-32 min-h-[46px] px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 resize-none"
                />

                <button
                  type="submit"
                  disabled={sending || (!messageInput.trim() && !selectedFile)}
                  className="px-5 py-3 h-[46px] rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {sending
                      ? lang === 'bn'
                        ? 'পাঠানো হচ্ছে...'
                        : 'Sending...'
                      : lang === 'bn'
                        ? 'পাঠান'
                        : 'Send'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full Preview"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

