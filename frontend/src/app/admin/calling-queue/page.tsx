'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/context/LanguageContext';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { TaskHandoffModal } from '@/components/operations/TaskHandoffModal';
import { TaskEscalateModal } from '@/components/operations/TaskEscalateModal';
import {
  ShieldAlert,
  PhoneCall,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Send,
  Calendar,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Paperclip,
  X,
  Scale,
  Lock,
  Wallet,
  Copy,
  Phone,
  Maximize2,
  ChevronRight,
  Download,
  Sparkles,
  Shuffle,
  ArrowUpRight,
  UserCheck,
  Unlock,
} from 'lucide-react';

interface DisputeItem {
  id: string;
  transactionId: string;
  initiatedById: string;
  assignedAdminId?: string;
  assignedToId?: string;
  assignedAt?: string;
  lockedUntil?: string;
  isEscalated?: boolean;
  escalationLevel?: string;
  escalationReason?: string;
  assignedTo?: {
    id: string;
    uniqueUserId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  status: 'ACTIVE_CALL' | 'UNRESOLVED' | 'RESOLVED' | 'HOLD_BALANCE' | string;
  reason: string;
  description: string;
  resolution?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  transaction: {
    id: string;
    trackingNumber?: string;
    conversationId?: string;
    title?: string;
    amount: string;
    status: string;
    escrowStatus?: string;
    sender: {
      id: string;
      uniqueUserId: string;
      firstName: string;
      lastName: string;
      phone: string;
      avatarUrl?: string;
    };
    receiver: {
      id: string;
      uniqueUserId: string;
      firstName: string;
      lastName: string;
      phone: string;
      avatarUrl?: string;
    };
    workLogs?: Array<{
      id: string;
      notes: string;
      proofUrls: string[];
      createdAt: string;
    }>;
  };
  initiatedBy: {
    id: string;
    uniqueUserId: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl?: string;
  };
  evidences: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    description?: string;
    createdAt: string;
  }>;
}

// Helper to safely unwrap api.ts responses
function unwrap<T = any>(res: any): T {
  if (res && typeof res === 'object' && res.data !== undefined) {
    return unwrap(res.data);
  }
  return res;
}

export default function AdminCallingQueuePage() {
  const { lang } = useLanguage();
  const { user, isSuperAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'ACTIVE_CALL' | 'UNRESOLVED' | 'RESOLVED' | 'HOLD_BALANCE'>('ACTIVE_CALL');
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Operations & Workload
  const [claimingDispute, setClaimingDispute] = useState(false);
  const [handoffDispute, setHandoffDispute] = useState<DisputeItem | null>(null);
  const [escalateDispute, setEscalateDispute] = useState<DisputeItem | null>(null);

  // Inspector Modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'DETAILS' | 'CHAT' | 'HOLD_SCHEDULE'>('DETAILS');
  const [verdictAction, setVerdictAction] = useState<'REFUND_BUYER' | 'PAYOUT_SELLER' | 'SPLIT'>('REFUND_BUYER');
  const [buyerAmount, setBuyerAmount] = useState('');
  const [sellerAmount, setSellerAmount] = useState('');
  const [verdictNotes, setVerdictNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Full Chat Room States
  const [activeFullChatDispute, setActiveFullChatDispute] = useState<DisputeItem | null>(null);
  const [adminMessageType, setAdminMessageType] = useState<'ADMIN_INTERVENTION' | 'TEXT'>('ADMIN_INTERVENTION');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [quickVerdictModal, setQuickVerdictModal] = useState<{
    isOpen: boolean;
    actionType: 'REFUND_BUYER' | 'PAYOUT_SELLER';
    notes: string;
  } | null>(null);

  // AI Dispute Dossier States
  const [generatingAiDossier, setGeneratingAiDossier] = useState(false);
  const [aiDossier, setAiDossier] = useState<any>(null);
  const [showAiDossierModal, setShowAiDossierModal] = useState(false);

  const handleGenerateAiDossier = async (disputeId: string) => {
    setGeneratingAiDossier(true);
    try {
      const res: any = await api.post(`/disputes/admin/${disputeId}/ai-summary`);
      const data = unwrap(res);
      if (data?.dossier) {
        setAiDossier(data.dossier);
        setShowAiDossierModal(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to generate AI summary');
    } finally {
      setGeneratingAiDossier(false);
    }
  };

  // Live Chat & Messaging states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [adminMessageInput, setAdminMessageInput] = useState('');
  const [sendingAdminMessage, setSendingAdminMessage] = useState(false);

  // Hold Schedule states
  const [warningDate, setWarningDate] = useState('');
  const [warningTime, setWarningTime] = useState('12:00 PM');
  const [holdNotes, setHoldNotes] = useState('');

  // Refs
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Active conversation ID across Full Chat and Inspector
  const currentActiveConversationId =
    activeFullChatDispute?.transaction?.conversationId ||
    (selectedDispute && inspectorTab === 'CHAT' ? selectedDispute.transaction?.conversationId : null);

  // Socket.IO real-time synchronization
  useEffect(() => {
    if (!currentActiveConversationId) return;
    const socket = getSocket();

    socket.emit('join:conversation', { conversationId: currentActiveConversationId });

    const handleMessageReceive = (newMsg: any) => {
      if (newMsg.conversationId === currentActiveConversationId) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const handleTransactionUpdate = (data: any) => {
      if (data.conversationId === currentActiveConversationId) {
        api
          .get(`/chat/conversations/${currentActiveConversationId}/messages`)
          .then((res: any) => {
            const d = unwrap(res);
            const list = Array.isArray(d) ? d : (d?.messages || []);
            setChatMessages(list);
          })
          .catch(console.error);
      }
    };

    socket.on('message:receive', handleMessageReceive);
    socket.on('transaction:update', handleTransactionUpdate);

    return () => {
      socket.emit('leave:conversation', { conversationId: currentActiveConversationId });
      socket.off('message:receive', handleMessageReceive);
      socket.off('transaction:update', handleTransactionUpdate);
    };
  }, [currentActiveConversationId]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeFullChatDispute, inspectorTab]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFilePreview(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(`/disputes/admin/queue${activeTab ? `?status=${activeTab}` : ''}`);
      const data = unwrap(res);
      const list = Array.isArray(data) ? data : (data?.data || data?.disputes || []);
      setDisputes(list);
    } catch (err: any) {
      console.error('Failed to load disputes queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimNextDispute = async () => {
    try {
      setClaimingDispute(true);
      const res = await api.post('/operations/claim', { taskType: 'DISPUTE' });
      if (res.data?.success && res.data?.data) {
        setFeedbackMsg({
          type: 'success',
          text: lang === 'bn' ? 'ডিসপুটটি সফলভাবে আপনাকে বরাদ্দ করা হয়েছে!' : 'Dispute claimed successfully!',
        });
        fetchQueue();
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || (lang === 'bn' ? 'কোনো অপেক্ষমাণ ডিসপুট পাওয়া যায়নি বা সীমা অতিক্রম হয়েছে।' : 'No dispute available or limit reached.'),
      });
    } finally {
      setClaimingDispute(false);
    }
  };

  const handleReleaseDispute = async (disputeId: string) => {
    try {
      const res = await api.post('/operations/release', { taskType: 'DISPUTE', taskId: disputeId });
      if (res.data?.success) {
        setFeedbackMsg({
          type: 'success',
          text: lang === 'bn' ? 'ডিসপুটটি সফলভাবে উন্মুক্ত কিউতে ফেরত দেওয়া হয়েছে।' : 'Dispute released back to queue.',
        });
        fetchQueue();
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to release dispute',
      });
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleOpenInspector = async (disp: DisputeItem) => {
    setSelectedDispute(disp);
    setInspectorTab('DETAILS');
    setVerdictAction('REFUND_BUYER');
    setVerdictNotes('');
    setBuyerAmount(parseFloat(disp.transaction?.amount || '0').toString());
    setSellerAmount('0');
    setFeedbackMsg(null);
    setChatMessages([]);
    setLoadingChat(true);

    try {
      const res: any = await api.get(`/disputes/admin/${disp.id}`);
      const data = unwrap(res);
      if (data) {
        if (data.chatMessages) {
          setChatMessages(data.chatMessages);
        }
        if (data.hold) {
          setWarningDate(data.hold.warningDate ? data.hold.warningDate.split('T')[0] : '');
          setWarningTime(data.hold.warningTime || '12:00 PM');
          setHoldNotes(data.hold.notes || '');
        }
        if (data.dispute) {
          setSelectedDispute(data.dispute);
        }
      }
    } catch (err) {
      console.error('Failed to fetch full dispute details:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCloseInspector = () => {
    setSelectedDispute(null);
    setFeedbackMsg(null);
  };

  const handleOpenFullChat = async (disp: DisputeItem) => {
    setActiveFullChatDispute(disp);
    setChatMessages([]);
    setLoadingChat(true);
    setSelectedFile(null);
    setFilePreview(null);
    setAdminMessageInput('');
    setAdminMessageType('ADMIN_INTERVENTION');

    try {
      const res: any = await api.get(`/disputes/admin/${disp.id}`);
      const data = unwrap(res);
      if (data) {
        if (data.chatMessages) {
          setChatMessages(data.chatMessages);
        }
        if (data.hold) {
          setWarningDate(data.hold.warningDate ? data.hold.warningDate.split('T')[0] : '');
          setWarningTime(data.hold.warningTime || '12:00 PM');
          setHoldNotes(data.hold.notes || '');
        }
        if (data.dispute) {
          setActiveFullChatDispute(data.dispute);
        }
      }
    } catch (err) {
      console.error('Failed to load full chat dispute details:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCloseFullChat = () => {
    setActiveFullChatDispute(null);
    setSelectedFile(null);
    setFilePreview(null);
    setAdminMessageInput('');
    setQuickVerdictModal(null);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const target = activeFullChatDispute || selectedDispute;
    if (!target) return;
    try {
      const res: any = await api.patch(`/disputes/admin/${target.id}/status`, {
        status: newStatus,
        notes: `Admin moved dispute to ${newStatus}`,
      });
      const data = unwrap(res);
      if (data) {
        setFeedbackMsg({
          type: 'success',
          text: lang === 'bn' ? `স্ট্যাটাস পরিবর্তিত: ${newStatus}` : `Status updated to ${newStatus}`,
        });
        fetchQueue();
        if (activeFullChatDispute) {
          setActiveFullChatDispute((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        if (selectedDispute) {
          setSelectedDispute((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleSendAdminChatMessage = async () => {
    const target = activeFullChatDispute || selectedDispute;
    if (!target) return;
    const conversationId = target.transaction?.conversationId;
    if (!conversationId) {
      alert(lang === 'bn' ? 'এই লেনদেনের সাথে কোনো চ্যাট কনভারসেশন যুক্ত নেই।' : 'No chat conversation linked to this transaction.');
      return;
    }

    const contentToSend = adminMessageInput.trim();
    const fileToSend = selectedFile;
    if (!contentToSend && !fileToSend) return;

    setSendingAdminMessage(true);
    try {
      let attachmentPayload: any = null;

      if (fileToSend) {
        const base64Data = await fileToBase64(fileToSend);
        const uploadRes: any = await api.post('/uploads', {
          base64Data,
          fileName: fileToSend.name,
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

      let finalContent = contentToSend;
      let messageType = adminMessageType;

      if (adminMessageType === 'ADMIN_INTERVENTION') {
        finalContent = contentToSend
          ? `🛡️ [Official SafnexBD Admin Message]:\n${contentToSend}`
          : '🛡️ [Official SafnexBD Admin Notice]';
      } else if (!finalContent && attachmentPayload) {
        finalContent = attachmentPayload[0].fileType === 'IMAGE' ? 'Sent an image' : 'Sent an attachment';
        messageType = attachmentPayload[0].fileType;
      }

      const payload = {
        content: finalContent,
        messageType,
        attachments: attachmentPayload,
      };

      const res: any = await api.post(`/chat/conversations/${conversationId}/messages`, payload);
      const savedMsg = unwrap(res);
      if (savedMsg) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
        setAdminMessageInput('');
        setSelectedFile(null);
        setFilePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Failed to send admin message:', err);
      alert(err.response?.data?.message || err.message || 'Failed to send admin message');
    } finally {
      setSendingAdminMessage(false);
    }
  };

  const handleExecuteQuickVerdict = async () => {
    if (!quickVerdictModal || !activeFullChatDispute) return;
    if (!quickVerdictModal.notes.trim()) {
      alert(lang === 'bn' ? 'রায়ের কারণ বা ব্যাখ্যা লিখুন।' : 'Please provide verdict notes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const actionType = quickVerdictModal.actionType === 'REFUND_BUYER' ? 'REFUND_SENDER' : 'RELEASE_RECEIVER';
      const res: any = await api.post(`/disputes/admin/${activeFullChatDispute.id}/resolve`, {
        actionType,
        notes: quickVerdictModal.notes.trim(),
      });
      const data = unwrap(res);
      if (data) {
        // Post official verdict notice into chat conversation
        if (activeFullChatDispute.transaction?.conversationId) {
          const actionText =
            quickVerdictModal.actionType === 'REFUND_BUYER'
              ? '💰 FULL REFUND TO BUYER (ক্রেতাকে ১০০% রিফান্ড)'
              : '✅ FULL RELEASE TO SELLER (বিক্রেতাকে ১০০% রিলিজ)';
          await api.post(`/chat/conversations/${activeFullChatDispute.transaction.conversationId}/messages`, {
            content: `⚖️ [FINAL ADMIN VERDICT / চূড়ান্ত প্রশাসনিক রায়]:\nসিদ্ধান্ত: ${actionText}\nমন্তব্য: ${quickVerdictModal.notes.trim()}`,
            messageType: 'ADMIN_INTERVENTION',
          }).catch(console.error);
        }

        setFeedbackMsg({
          type: 'success',
          text: lang === 'bn' ? 'ডিসপ্যুট সফলভাবে নিষ্পত্তি হয়েছে!' : 'Dispute resolved successfully!',
        });
        setQuickVerdictModal(null);
        fetchQueue();
        setActiveFullChatDispute((prev) => (prev ? { ...prev, status: 'RESOLVED' } : null));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Resolution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveHoldSchedule = async () => {
    if (!selectedDispute) return;
    if (!warningDate) {
      setFeedbackMsg({ type: 'error', text: 'Please select a warning/hold date.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res: any = await api.post(`/transactions/admin/${selectedDispute.transactionId}/set-hold`, {
        warningDate,
        warningTime,
        notes: holdNotes,
      });
      const data = unwrap(res);
      if (data) {
        setFeedbackMsg({
          type: 'success',
          text: lang === 'bn' ? 'হোল্ড শিডিউল সফলভাবে সংরক্ষিত হয়েছে!' : 'Hold schedule set successfully!',
        });
        fetchQueue();
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to update hold schedule',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResolution = async () => {
    if (!selectedDispute) return;
    if (!verdictNotes.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: lang === 'bn' ? 'রায় বা নিষ্পত্তির কারণ ব্যাখ্যা করুন' : 'Resolution explanation is required',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);

    const actionTypeMap: Record<string, string> = {
      REFUND_BUYER: 'REFUND_SENDER',
      PAYOUT_SELLER: 'RELEASE_RECEIVER',
      SPLIT: 'PARTIAL_SPLIT',
    };

    try {
      const payload: any = {
        actionType: actionTypeMap[verdictAction] || verdictAction,
        notes: verdictNotes.trim(),
      };

      if (verdictAction === 'SPLIT') {
        const bAmt = parseFloat(buyerAmount);
        const sAmt = parseFloat(sellerAmount);
        const total = parseFloat(selectedDispute.transaction?.amount || '0');
        if (isNaN(bAmt) || isNaN(sAmt) || bAmt + sAmt !== total) {
          setFeedbackMsg({
            type: 'error',
            text:
              lang === 'bn'
                ? `বিভাজন যোগফল মোট লেনদেন (৳${total}) এর সমান হতে হবে।`
                : `Buyer + Seller amounts must equal total transaction amount (৳${total}).`,
          });
          setIsSubmitting(false);
          return;
        }
        payload.amount = sAmt;
      }

      const res: any = await api.post(`/disputes/admin/${selectedDispute.id}/resolve`, payload);
      const data = unwrap(res);
      if (data) {
        setFeedbackMsg({
          type: 'success',
          text: lang === 'bn' ? 'ডিসপ্যুট সফলভাবে নিষ্পত্তি হয়েছে!' : 'Dispute resolved successfully!',
        });
        setTimeout(() => {
          handleCloseInspector();
          fetchQueue();
        }, 1200);
      }
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Resolution failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const queueTabs = [
    { key: 'ACTIVE_CALL', labelBn: 'এক্টিভ কল (Active Call)', labelEn: 'Active Call Queue', icon: PhoneCall },
    { key: 'UNRESOLVED', labelBn: 'অমীমাংসিত (Unresolved)', labelEn: 'Unresolved', icon: AlertCircle },
    { key: 'RESOLVED', labelBn: 'মীমাংসিত (Resolved)', labelEn: 'Resolved', icon: CheckCircle },
    { key: 'HOLD_BALANCE', labelBn: 'হোল্ড ব্যালেন্স কিউ (Hold)', labelEn: 'Hold Balance Queue', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            <span>{lang === 'bn' ? 'কল অ্যাডমিন ও ডিসপ্যুট সেন্টার' : 'Call Admin & Dispute Center'}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'উভয় পক্ষের তথ্য, লাইভ চ্যাটিং হিস্ট্রি দেখে মেসেজ দিন এবং চূড়ান্ত রায় বা হোল্ড কার্যকর করুন।'
              : 'Inspect both parties, view live chat messages, post official admin notices, and execute verdicts or custom hold schedules.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'ACTIVE_CALL' && (
            <button
              onClick={handleClaimNextDispute}
              disabled={claimingDispute}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              title={lang === 'bn' ? 'অ্যালগরিদম অনুসারে পরবর্তী অ্যাক্টিভ কল বা ডিসপুট কাজ নিন' : 'Claim next dispute in queue'}
            >
              <Sparkles className={`w-4 h-4 ${claimingDispute ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'পরবর্তী ডিসপুট নিন' : 'Claim Next'}</span>
            </button>
          )}

          <button
            onClick={fetchQueue}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 4 Status Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {queueTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition text-left ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl ${
                  isActive ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? t.labelBn : t.labelEn}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isActive ? `${disputes.length} records` : 'Click to inspect'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Disputes Queue Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Dispute / Trx ID</th>
                <th className="px-4 py-3.5">Caller (Initiator)</th>
                <th className="px-4 py-3.5">Buyer (Sender)</th>
                <th className="px-4 py-3.5">Seller (Receiver)</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Assigned / Queue</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                    <span>{lang === 'bn' ? 'ডিসপ্যুট কিউ লোড হচ্ছে...' : 'Loading dispute queue...'}</span>
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    {lang === 'bn' ? 'এই কিউ-তে কোনো ডিসপ্যুট পাওয়া যায়নি।' : 'No disputes in this queue.'}
                  </td>
                </tr>
              ) : (
                disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                      <div>ID: {d.id.substring(0, 8)}...</div>
                      <div className="text-[10px] text-slate-400">
                        TXN: {d.transaction?.trackingNumber || d.transactionId?.substring(0, 8)}
                      </div>
                    </td>

                    {/* Caller */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {d.initiatedBy?.avatarUrl ? (
                          <img
                            src={getImageUrl(d.initiatedBy.avatarUrl)}
                            alt={d.initiatedBy.firstName || 'Caller'}
                            className="w-7 h-7 rounded-full object-cover border border-rose-500/30 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {d.initiatedBy?.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-rose-600 dark:text-rose-400">
                            {d.initiatedBy?.uniqueUserId}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {d.initiatedBy?.firstName} ({d.initiatedBy?.phone})
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Sender (Buyer) */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-blue-500">
                        {d.transaction?.sender?.uniqueUserId || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {d.transaction?.sender?.firstName} {d.transaction?.sender?.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.transaction?.sender?.phone}
                      </div>
                    </td>

                    {/* Receiver (Seller) */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-emerald-500">
                        {d.transaction?.receiver?.uniqueUserId || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {d.transaction?.receiver?.firstName} {d.transaction?.receiver?.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.transaction?.receiver?.phone}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white text-sm">
                      ৳{parseFloat(d.transaction?.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3.5 max-w-[180px] truncate text-slate-600 dark:text-slate-300">
                      {d.reason}
                    </td>

                    {/* Assigned / Queue Column */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {d.isEscalated && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            <span>{lang === 'bn' ? 'এস্কেলেট করা' : 'Escalated'}</span>
                          </span>
                        )}
                        {d.assignedToId ? (
                          <div className="flex items-center gap-1.5">
                            {d.assignedToId === user?.id ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <UserCheck className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'আমার দায়িত্ব' : 'Assigned to Me'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                <span>👤 {d.assignedTo?.firstName || 'Staff'}</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            {lang === 'bn' ? 'উন্মুক্ত কিউ' : 'Open Queue'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenFullChat(d)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                          title={lang === 'bn' ? 'সম্পূর্ণ চ্যাট রুমে প্রবেশ করুন' : 'Enter Full Chat Room'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{lang === 'bn' ? 'চ্যাটে ঢুকুন' : 'Chat'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenInspector(d)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Scale className="w-3 h-3 text-rose-500" />
                          <span>{lang === 'bn' ? 'ইন্সপেক্ট' : 'Inspect'}</span>
                        </button>
                        {(d.assignedToId === user?.id || isSuperAdmin()) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setHandoffDispute(d)}
                              title={lang === 'bn' ? 'সহকর্মীকে হস্তান্তর করুন' : 'Reassign to colleague'}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs transition cursor-pointer"
                            >
                              <Shuffle className="w-3.5 h-3.5" />
                            </button>
                            {d.assignedToId && (
                              <button
                                type="button"
                                onClick={() => handleReleaseDispute(d.id)}
                                title={lang === 'bn' ? 'পুলে রিলিজ করুন' : 'Release to queue'}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!d.isEscalated && (
                              <button
                                type="button"
                                onClick={() => setEscalateDispute(d)}
                                title={lang === 'bn' ? 'সুপার অ্যাডমিনে এস্কেলেট করুন' : 'Escalate to Super Admin'}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs transition cursor-pointer"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal with Live Chat & Hold Schedule Tabs */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>Case #{selectedDispute.id.substring(0, 8)} — Trx {selectedDispute.transaction?.trackingNumber || selectedDispute.transactionId}</span>
                </h3>
                {selectedDispute.isEscalated && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/15 text-rose-500 border border-rose-500/30">
                    ESCALATED
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateAiDossier(selectedDispute.id)}
                  disabled={generatingAiDossier}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
                  title="Generate AI Case Dossier"
                >
                  {generatingAiDossier ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {generatingAiDossier
                      ? (lang === 'bn' ? 'বিশ্লেষণ...' : 'Analyzing...')
                      : (lang === 'bn' ? '🤖 এআই ডসিয়ার' : '🤖 AI Dossier')}
                  </span>
                </button>

                {(selectedDispute.assignedToId === user?.id || isSuperAdmin()) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHandoffDispute(selectedDispute)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'হস্তান্তর' : 'Handoff'}</span>
                    </button>
                    {!selectedDispute.isEscalated && (
                      <button
                        type="button"
                        onClick={() => setEscalateDispute(selectedDispute)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'এস্কেলেট' : 'Escalate'}</span>
                      </button>
                    )}
                  </>
                )}
                <button onClick={handleCloseInspector} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 ml-1 cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  {selectedDispute.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleUpdateStatus('ACTIVE_CALL')}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[11px] font-medium"
                >
                  Active Call
                </button>
                <button
                  onClick={() => handleUpdateStatus('UNRESOLVED')}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[11px] font-medium"
                >
                  Unresolved
                </button>
                <button
                  onClick={() => handleUpdateStatus('HOLD_BALANCE')}
                  className="px-2.5 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 rounded-lg text-[11px] font-medium"
                >
                  Hold Queue
                </button>
              </div>
            </div>

            {/* Navigation Tabs in Inspector */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setInspectorTab('DETAILS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  inspectorTab === 'DETAILS'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Verdict & Details</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab('CHAT')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  inspectorTab === 'CHAT'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Live Chat & Messaging ({chatMessages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab('HOLD_SCHEDULE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  inspectorTab === 'HOLD_SCHEDULE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Set Hold Schedule</span>
              </button>
            </div>

            {/* TAB 1: DETAILS & VERDICT */}
            {inspectorTab === 'DETAILS' && (
              <div className="space-y-4">
                {/* Transaction & Parties Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span>Buyer (Sender / Payer)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {selectedDispute.transaction?.sender?.avatarUrl ? (
                        <img
                          src={getImageUrl(selectedDispute.transaction.sender.avatarUrl)}
                          alt="Buyer"
                          className="w-8 h-8 rounded-full object-cover border border-blue-500/30 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {selectedDispute.transaction?.sender?.firstName?.charAt(0) || 'B'}
                        </div>
                      )}
                      <div>
                        <div>ID: <span className="font-semibold font-mono text-blue-500">{selectedDispute.transaction?.sender?.uniqueUserId}</span></div>
                        <div>Name: {selectedDispute.transaction?.sender?.firstName} {selectedDispute.transaction?.sender?.lastName}</div>
                        <div className="text-slate-500">Phone: {selectedDispute.transaction?.sender?.phone}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Seller (Receiver / Worker)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {selectedDispute.transaction?.receiver?.avatarUrl ? (
                        <img
                          src={getImageUrl(selectedDispute.transaction.receiver.avatarUrl)}
                          alt="Seller"
                          className="w-8 h-8 rounded-full object-cover border border-emerald-500/30 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {selectedDispute.transaction?.receiver?.firstName?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div>
                        <div>ID: <span className="font-semibold font-mono text-emerald-500">{selectedDispute.transaction?.receiver?.uniqueUserId}</span></div>
                        <div>Name: {selectedDispute.transaction?.receiver?.firstName} {selectedDispute.transaction?.receiver?.lastName}</div>
                        <div className="text-slate-500">Phone: {selectedDispute.transaction?.receiver?.phone}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispute Complaint Details */}
                <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-700 dark:text-rose-400">
                        Caller: {selectedDispute.initiatedBy?.uniqueUserId} ({selectedDispute.initiatedBy?.firstName})
                      </span>
                    </div>
                    <span className="text-slate-400">{new Date(selectedDispute.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    Reason: {selectedDispute.reason}
                  </div>
                  {selectedDispute.description && (
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {selectedDispute.description}
                    </p>
                  )}
                </div>

                {/* Verdict Options */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {lang === 'bn' ? 'প্রশাসনিক রায় ও তহবিল নিষ্পত্তির সিদ্ধান্ত' : 'Admin Verdict & Fund Distribution'}
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVerdictAction('REFUND_BUYER')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition text-center ${
                        verdictAction === 'REFUND_BUYER'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lang === 'bn' ? 'সম্পূর্ণ রিফান্ড (ক্রেতা/Sender)' : 'Full Refund (Sender)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerdictAction('PAYOUT_SELLER')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition text-center ${
                        verdictAction === 'PAYOUT_SELLER'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lang === 'bn' ? 'সম্পূর্ণ রিলিজ (বিক্রেতা/Receiver)' : 'Full Release (Receiver)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerdictAction('SPLIT')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition text-center ${
                        verdictAction === 'SPLIT'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lang === 'bn' ? 'আংশিক বিভাজন (Split)' : 'Partial Split'}
                    </button>
                  </div>

                  {verdictAction === 'SPLIT' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-blue-500 mb-1">
                          Buyer Refund (৳)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={buyerAmount}
                          onChange={(e) => setBuyerAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-500 mb-1">
                          Seller Payout (৳)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={sellerAmount}
                          onChange={(e) => setSellerAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'bn' ? 'রায়ের বিশদ ব্যাখ্যা ও কারণ (আবশ্যক)' : 'Verdict Rationale & Notes (Required)'}
                    </label>
                    <textarea
                      rows={3}
                      value={verdictNotes}
                      onChange={(e) => setVerdictNotes(e.target.value)}
                      placeholder={
                        lang === 'bn'
                          ? 'উভয় পক্ষের প্রমাণ ও আলোচনা বিশ্লেষণের প্রেক্ষিতে প্রদত্ত রায়...'
                          : 'Explain the factual basis for this verdict and how funds will be distributed...'
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CHAT & MESSAGING */}
            {inspectorTab === 'CHAT' && (
              <div className="space-y-4">
                {/* Full Chat Banner */}
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      {lang === 'bn' ? 'পূর্ণাঙ্গ অ্যাডমিন চ্যাট রুম' : 'Full Chat Room Experience'}
                    </div>
                    <div className="text-[11px] text-blue-600/80 dark:text-blue-400">
                      {lang === 'bn' ? 'রিয়েল-টাইম ফটো, ফাইল ও দ্রুত রায়ের সুবিধাসহ ফুল স্ক্রিন চ্যাটে আলোচনা করুন।' : 'Full screen interactive chatting with live socket sync, photo & file attachments.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const d = selectedDispute;
                      handleCloseInspector();
                      if (d) handleOpenFullChat(d);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ফুল চ্যাটে ঢুকুন' : 'Open Full Chat'}</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Conversation Thread between <span className="text-blue-500 font-mono">{selectedDispute.transaction?.sender?.uniqueUserId}</span> and <span className="text-emerald-500 font-mono">{selectedDispute.transaction?.receiver?.uniqueUserId}</span>
                  </div>
                  <span className="text-slate-400">{chatMessages.length} total messages</span>
                </div>

                {/* Messages stream */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/40 max-h-96 overflow-y-auto space-y-3 text-xs">
                  {loadingChat ? (
                    <div className="text-center py-10 text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Loading chat messages...</span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      No messages found in this conversation.
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => {
                      const isSender = msg.senderId === selectedDispute.transaction?.sender?.id;
                      const isReceiver = msg.senderId === selectedDispute.transaction?.receiver?.id;
                      const isAdminMsg = msg.messageType === 'ADMIN_INTERVENTION' || (!isSender && !isReceiver);

                      return (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-2xl max-w-[85%] space-y-1 ${
                            isAdminMsg
                              ? 'mx-auto bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-center'
                              : isSender
                              ? 'mr-auto bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-slate-900 dark:text-white'
                              : 'ml-auto bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-slate-900 dark:text-white text-right'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 font-semibold">
                            <span className={isAdminMsg ? 'text-amber-600 font-bold' : isSender ? 'text-blue-500' : 'text-emerald-500'}>
                              {isAdminMsg
                                ? '🛡️ Admin Intervention'
                                : isSender
                                ? `Sender (${msg.sender?.uniqueUserId || 'Buyer'})`
                                : `Receiver (${msg.sender?.uniqueUserId || 'Seller'})`}
                            </span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {msg.attachments.map((att: any, idx: number) => {
                                const isImg = att.fileType === 'IMAGE' || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl);
                                const url = getImageUrl(att.fileUrl);
                                if (isImg) {
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setLightboxImage(url)}
                                      className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-w-[120px] max-h-[90px]"
                                    >
                                      <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                    </button>
                                  );
                                }
                                return (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-blue-500 hover:underline flex items-center gap-1"
                                  >
                                    <span>Attachment #{idx + 1}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Admin Message Composer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                      <span>{lang === 'bn' ? 'অ্যাডমিন মেসেজ পাঠান' : 'Post Admin Message'}</span>
                    </span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAdminMessageType('ADMIN_INTERVENTION')}
                        className={`px-2 py-0.5 rounded-lg transition ${adminMessageType === 'ADMIN_INTERVENTION' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500'}`}
                      >
                        Official Notice
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminMessageType('TEXT')}
                        className={`px-2 py-0.5 rounded-lg transition ${adminMessageType === 'TEXT' ? 'bg-blue-600 text-white font-bold' : 'text-slate-500'}`}
                      >
                        Direct
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminMessageInput}
                      onChange={(e) => setAdminMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAdminChatMessage()}
                      placeholder={
                        lang === 'bn'
                          ? 'উভয় পক্ষকে সতর্কবার্তা বা নির্দেশনা লিখুন...'
                          : 'Type official instructions or notices for both parties...'
                      }
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendAdminChatMessage}
                      disabled={sendingAdminMessage || !adminMessageInput.trim()}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {sendingAdminMessage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Notice</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SET HOLD SCHEDULE */}
            {inspectorTab === 'HOLD_SCHEDULE' && (
              <div className="space-y-4 p-4 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40">
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'bn' ? 'কাস্টম হোল্ড সময়সীমা ও শর্ত নির্ধারণ' : 'Set Custom Hold Deadline & Admin Instructions'}</span>
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'টাকা হোল্ডে রেখে উভয় পক্ষকে সময় দিন। সময় শেষ হওয়ার পর পরবর্তী সিদ্ধান্ত নেওয়া হবে।'
                      : 'Maintain money on escrow hold and set a deadline for parties to submit missing deliverables.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hold Expiry / Warning Date
                    </label>
                    <input
                      type="date"
                      value={warningDate}
                      onChange={(e) => setWarningDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Warning Time
                    </label>
                    <input
                      type="text"
                      value={warningTime}
                      onChange={(e) => setWarningTime(e.target.value)}
                      placeholder="e.g. 12:00 PM, 06:00 PM"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hold Notes / Specific Deliverable Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={holdNotes}
                    onChange={(e) => setHoldNotes(e.target.value)}
                    placeholder="Explain what the parties must submit or accomplish before this hold deadline..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveHoldSchedule}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'bn' ? 'হোল্ড শিডিউল কার্যকর ও নোটিশ পাঠান' : 'Apply Hold Schedule & Notify Chat'}</span>
                </button>
              </div>
            )}

            {/* Feedback Alert */}
            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={handleCloseInspector}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>

              {inspectorTab === 'DETAILS' && (
                <button
                  type="button"
                  onClick={handleSubmitResolution}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'bn' ? 'চূড়ান্ত রায় কার্যকর করুন' : 'Execute Final Verdict'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN ADMIN DISPUTE CHAT ROOM OVERLAY                                 */}
      {/* ========================================================================= */}
      {activeFullChatDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden">
            {/* Header Bar */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'অ্যাডমিন ফুল চ্যাট রুম' : 'Admin Dispute Full Chat Room'}
                    </h2>
                    <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900">
                      Case #{activeFullChatDispute.id.substring(0, 8)}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {activeFullChatDispute.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-mono">
                      TXN: {activeFullChatDispute.transaction?.trackingNumber || activeFullChatDispute.transactionId?.substring(0, 10)}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      মোট: ৳{parseFloat(activeFullChatDispute.transaction?.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Sync Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status toggles */}
                <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => handleUpdateStatus('ACTIVE_CALL')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      activeFullChatDispute.status === 'ACTIVE_CALL'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Active Call
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('HOLD_BALANCE')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      activeFullChatDispute.status === 'HOLD_BALANCE'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Hold Queue
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('UNRESOLVED')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      activeFullChatDispute.status === 'UNRESOLVED'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Unresolved
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const d = activeFullChatDispute;
                    handleCloseFullChat();
                    if (d) handleOpenInspector(d);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Scale className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">{lang === 'bn' ? 'ইন্সপেক্টর ভিউ' : 'Inspector View'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseFullChat}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dual Pane Body */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
              {/* Left Pane: Case Dossier & Quick Actions */}
              <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4 overflow-y-auto space-y-4 flex-shrink-0">
                {/* Parties Involved */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'bn' ? 'উভয় পক্ষের পরিচিতি' : 'Parties Involved'}
                  </h4>

                  {/* Buyer Card */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/40 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {lang === 'bn' ? 'ক্রেতা (Sender / Payer)' : 'Buyer (Sender)'}
                      </span>
                      {activeFullChatDispute.initiatedById === activeFullChatDispute.transaction?.sender?.id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                          Caller
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {activeFullChatDispute.transaction?.sender?.avatarUrl ? (
                        <img
                          src={getImageUrl(activeFullChatDispute.transaction.sender.avatarUrl)}
                          alt="Buyer"
                          className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {activeFullChatDispute.transaction?.sender?.firstName?.charAt(0) || 'B'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {activeFullChatDispute.transaction?.sender?.firstName} {activeFullChatDispute.transaction?.sender?.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-blue-500 truncate">
                          @{activeFullChatDispute.transaction?.sender?.uniqueUserId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 text-[11px]">Phone:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeFullChatDispute.transaction?.sender?.phone || '', 'buyerPhone')}
                        className="flex items-center gap-1 font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-blue-500"
                      >
                        <Phone className="w-3 h-3 text-blue-500" />
                        <span>{activeFullChatDispute.transaction?.sender?.phone || 'N/A'}</span>
                        {copiedText === 'buyerPhone' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Seller Card */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {lang === 'bn' ? 'বিক্রেতা (Receiver / Worker)' : 'Seller (Receiver)'}
                      </span>
                      {activeFullChatDispute.initiatedById === activeFullChatDispute.transaction?.receiver?.id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                          Caller
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {activeFullChatDispute.transaction?.receiver?.avatarUrl ? (
                        <img
                          src={getImageUrl(activeFullChatDispute.transaction.receiver.avatarUrl)}
                          alt="Seller"
                          className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {activeFullChatDispute.transaction?.receiver?.firstName?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {activeFullChatDispute.transaction?.receiver?.firstName} {activeFullChatDispute.transaction?.receiver?.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-500 truncate">
                          @{activeFullChatDispute.transaction?.receiver?.uniqueUserId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 text-[11px]">Phone:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(activeFullChatDispute.transaction?.receiver?.phone || '', 'sellerPhone')}
                        className="flex items-center gap-1 font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-500"
                      >
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span>{activeFullChatDispute.transaction?.receiver?.phone || 'N/A'}</span>
                        {copiedText === 'sellerPhone' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dispute Complaint & Reason */}
                <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {lang === 'bn' ? 'অভিযোগের কারণ ও বিবরণ' : 'Dispute Reason & Details'}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(activeFullChatDispute.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {activeFullChatDispute.reason}
                  </div>
                  {activeFullChatDispute.description && (
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px]">
                      {activeFullChatDispute.description}
                    </p>
                  )}

                  {/* Evidences / Attachments if any */}
                  {activeFullChatDispute.evidences && activeFullChatDispute.evidences.length > 0 && (
                    <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40">
                      <div className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase">
                        {lang === 'bn' ? 'সংযুক্ত প্রমাণপত্র' : 'Uploaded Evidences'} ({activeFullChatDispute.evidences.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeFullChatDispute.evidences.map((ev, i) => {
                          const url = getImageUrl(ev.fileUrl);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setLightboxImage(url)}
                              className="w-14 h-14 rounded-xl border border-rose-200 dark:border-rose-800 overflow-hidden relative group"
                            >
                              <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 🤖 Dispute AI Case Dossier Trigger */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900 rounded-2xl border border-indigo-500/30 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'এআই কেস অ্যানালাইজার' : 'AI Case Analyzer'}</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      GPT/Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {lang === 'bn'
                      ? 'চ্যাট হিস্ট্রি, এভিডেন্স ও কাজের প্রমাণ বিশ্লেষণ করে ১-ক্লিকে কেস সামারি ও রায় তৈরি করুন।'
                      : 'Analyze chat history, evidence & work logs for instant case timeline & verdict suggestions.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiDossier(activeFullChatDispute.id)}
                    disabled={generatingAiDossier}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {generatingAiDossier ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {generatingAiDossier
                        ? lang === 'bn'
                          ? 'এআই বিশ্লেষণ চলছে...'
                          : 'Analyzing Case...'
                        : lang === 'bn'
                        ? '🤖 এআই কেস সামারি ও রায় তৈরি'
                        : '🤖 Generate AI Dossier'}
                    </span>
                  </button>
                </div>

                {/* Quick Actions Panel */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'bn' ? 'সরাসরি প্রশাসনিক রায় ও একশন' : 'Fast Verdict & Fund Action'}
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQuickVerdictModal({
                          isOpen: true,
                          actionType: 'REFUND_BUYER',
                          notes: lang === 'bn' ? 'উভয় পক্ষের সম্মতিক্রমে ক্রেতাকে সম্পূর্ণ অর্থ ফেরত প্রদান করা হলো।' : 'Full refund granted to buyer based on mutual agreement.',
                        })
                      }
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? '💰 ক্রেতাকে ১০০% রিফান্ড দিন' : 'Refund 100% to Buyer'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setQuickVerdictModal({
                          isOpen: true,
                          actionType: 'PAYOUT_SELLER',
                          notes: lang === 'bn' ? 'কাজ যথাযথভাবে সম্পন্ন হওয়ায় বিক্রেতাকে অর্থ রিলিজ করা হলো।' : 'Funds released to seller upon task completion.',
                        })
                      }
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? '✅ বিক্রেতাকে ১০০% রিলিজ দিন' : 'Release 100% to Seller'}</span>
                    </button>
                  </div>

                  {/* Hold Schedule Setting */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'হোল্ড শিডিউল নির্ধারণ' : 'Set Hold Deadline'}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <input
                        type="date"
                        value={warningDate}
                        onChange={(e) => setWarningDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleSaveHoldSchedule}
                        disabled={isSubmitting || !warningDate}
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                        <span>{lang === 'bn' ? 'হোল্ড কার্যকর করুন' : 'Apply Hold Schedule'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: Live Interactive Chat */}
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 overflow-hidden">
                {/* Subheader */}
                <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs flex-shrink-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500">{lang === 'bn' ? 'কনভারসেশন:' : 'Participants:'}</span>
                    <span className="font-semibold text-blue-500 font-mono">@{activeFullChatDispute.transaction?.sender?.uniqueUserId}</span>
                    <span className="text-slate-400">↔</span>
                    <span className="font-semibold text-emerald-500 font-mono">@{activeFullChatDispute.transaction?.receiver?.uniqueUserId}</span>
                    <span className="text-slate-400">↔</span>
                    <span className="font-semibold text-rose-500">🛡️ Admin</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">{chatMessages.length} messages</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFullChatDispute.transaction?.conversationId) {
                          setLoadingChat(true);
                          api
                            .get(`/chat/conversations/${activeFullChatDispute.transaction.conversationId}/messages`)
                            .then((res: any) => {
                              const d = unwrap(res);
                              setChatMessages(Array.isArray(d) ? d : (d?.messages || []));
                            })
                            .finally(() => setLoadingChat(false));
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      title="Refresh Chat"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingChat ? 'animate-spin text-blue-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
                  {loadingChat ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-xs">{lang === 'bn' ? 'চ্যাট মেসেজ লোড হচ্ছে...' : 'Loading chat messages...'}</span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                      <MessageSquare className="w-8 h-8 opacity-40" />
                      <span className="text-xs">{lang === 'bn' ? 'এই কনভারসেশনে কোনো মেসেজ নেই।' : 'No messages found in this conversation.'}</span>
                    </div>
                  ) : (
                    chatMessages.map((msg: any) => {
                      const isSender = msg.senderId === activeFullChatDispute.transaction?.sender?.id;
                      const isReceiver = msg.senderId === activeFullChatDispute.transaction?.receiver?.id;
                      const isAdminIntervention = msg.messageType === 'ADMIN_INTERVENTION';
                      const isAdminDirect = !isSender && !isReceiver && !isAdminIntervention;

                      // 1. Official Admin Notice
                      if (isAdminIntervention) {
                        return (
                          <div
                            key={msg.id}
                            className="mx-auto max-w-[90%] md:max-w-[80%] bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 shadow-sm space-y-2 text-center"
                          >
                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                              <ShieldAlert className="w-4 h-4 text-amber-600" />
                              <span>🛡️ {lang === 'bn' ? 'সেফনেক্সবিডি অফিসিয়াল অ্যাডমিন নোটিশ' : 'SafnexBD Official Admin Notice'}</span>
                            </div>
                            <div className="text-xs text-amber-950 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </div>
                            {/* Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-2 pt-1">
                                {msg.attachments.map((att: any, idx: number) => {
                                  const isImg = att.fileType === 'IMAGE' || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl);
                                  const url = getImageUrl(att.fileUrl);
                                  if (isImg) {
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setLightboxImage(url)}
                                        className="group relative rounded-xl overflow-hidden border border-amber-300 dark:border-amber-700 max-w-[200px] max-h-[140px]"
                                      >
                                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                          <Maximize2 className="w-4 h-4" />
                                        </div>
                                      </button>
                                    );
                                  }
                                  return (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 rounded-xl text-xs text-amber-800 dark:text-amber-300 hover:underline"
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                      <span>File #{idx + 1}</span>
                                      <Download className="w-3 h-3 text-slate-400" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                            <div className="text-[10px] text-amber-600/70 dark:text-amber-400/60 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      }

                      // 2. Admin Direct Message
                      if (isAdminDirect) {
                        return (
                          <div
                            key={msg.id}
                            className="mx-auto max-w-[85%] md:max-w-[75%] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3.5 shadow-sm space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                              <span className="flex items-center gap-1 font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Admin Direct Message</span>
                              </span>
                              <span className="font-mono">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="text-xs text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </div>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {msg.attachments.map((att: any, idx: number) => {
                                  const isImg = att.fileType === 'IMAGE' || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl);
                                  const url = getImageUrl(att.fileUrl);
                                  if (isImg) {
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setLightboxImage(url)}
                                        className="group relative rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-700 max-w-[180px] max-h-[130px]"
                                      >
                                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                          <Maximize2 className="w-4 h-4" />
                                        </div>
                                      </button>
                                    );
                                  }
                                  return (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-indigo-200 rounded-lg text-xs text-indigo-600 hover:underline"
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      <span>File #{idx + 1}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // 3. Buyer / Sender Message
                      if (isSender) {
                        return (
                          <div
                            key={msg.id}
                            className="mr-auto max-w-[85%] md:max-w-[70%] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-3.5 shadow-sm space-y-1.5 text-slate-900 dark:text-white"
                          >
                            <div className="flex items-center justify-between gap-2 text-[10px]">
                              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <span>Buyer / ক্রেতা</span>
                                <span className="font-mono">(@{activeFullChatDispute.transaction?.sender?.uniqueUserId})</span>
                              </span>
                              <span className="text-slate-400 font-mono">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-xs whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </div>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {msg.attachments.map((att: any, idx: number) => {
                                  const isImg = att.fileType === 'IMAGE' || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl);
                                  const url = getImageUrl(att.fileUrl);
                                  if (isImg) {
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setLightboxImage(url)}
                                        className="group relative rounded-xl overflow-hidden border border-blue-200 dark:border-blue-800 max-w-[180px] max-h-[130px]"
                                      >
                                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                          <Maximize2 className="w-4 h-4" />
                                        </div>
                                      </button>
                                    );
                                  }
                                  return (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      download
                                      className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-blue-200 rounded-lg text-xs text-blue-600 hover:underline"
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      <span>File #{idx + 1}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // 4. Seller / Receiver Message
                      return (
                        <div
                          key={msg.id}
                          className="ml-auto max-w-[85%] md:max-w-[70%] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-3.5 shadow-sm space-y-1.5 text-slate-900 dark:text-white"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span>Seller / বিক্রেতা</span>
                              <span className="font-mono">(@{activeFullChatDispute.transaction?.receiver?.uniqueUserId})</span>
                            </span>
                            <span className="text-slate-400 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-xs whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </div>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1 justify-end">
                              {msg.attachments.map((att: any, idx: number) => {
                                const isImg = att.fileType === 'IMAGE' || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileUrl);
                                const url = getImageUrl(att.fileUrl);
                                if (isImg) {
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => setLightboxImage(url)}
                                      className="group relative rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 max-w-[180px] max-h-[130px]"
                                    >
                                      <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                        <Maximize2 className="w-4 h-4" />
                                      </div>
                                    </button>
                                  );
                                }
                                return (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                    className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-emerald-200 rounded-lg text-xs text-emerald-600 hover:underline"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span>File #{idx + 1}</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Attachment Preview Strip */}
                {selectedFile && (
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-300 dark:border-slate-600" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 flex items-center justify-center">
                          <Paperclip className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{selectedFile.name}</div>
                        <div className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 hover:text-rose-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Admin Composer */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 flex-shrink-0">
                  {/* Mode Selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setAdminMessageType('ADMIN_INTERVENTION')}
                        className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                          adminMessageType === 'ADMIN_INTERVENTION'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? '🛡️ অফিসিয়াল নোটিশ' : 'Official Notice'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminMessageType('TEXT')}
                        className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                          adminMessageType === 'TEXT'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? '💬 সাধারণ মেসেজ' : 'Direct Message'}</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      {adminMessageType === 'ADMIN_INTERVENTION'
                        ? (lang === 'bn' ? 'উভয় পক্ষকে সতর্কবার্তা বা অফিশিয়াল নোটিশ পাঠান' : 'Broadcasts prominent warning notice to both parties')
                        : (lang === 'bn' ? 'সরাসরি অ্যাডমিন কথোপকথন' : 'Direct conversation message')}
                    </span>
                  </div>

                  {/* Input Bar */}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                      title={lang === 'bn' ? 'ছবি যুক্ত করুন' : 'Attach Photo'}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                      title={lang === 'bn' ? 'ডকুমেন্ট যুক্ত করুন' : 'Attach File'}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={adminMessageInput}
                      onChange={(e) => setAdminMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendAdminChatMessage();
                        }
                      }}
                      placeholder={
                        adminMessageType === 'ADMIN_INTERVENTION'
                          ? (lang === 'bn' ? 'উভয় পক্ষকে সতর্কবার্তা বা নির্দেশনামূলক নোটিশ লিখুন...' : 'Type official instructions or warnings for both parties...')
                          : (lang === 'bn' ? 'ক্রেতা ও বিক্রেতার উদ্দেশ্যে আপনার মেসেজ লিখুন...' : 'Type message to buyer and seller...')
                      }
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={handleSendAdminChatMessage}
                      disabled={sendingAdminMessage || (!adminMessageInput.trim() && !selectedFile)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 ${
                        adminMessageType === 'ADMIN_INTERVENTION'
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {sendingAdminMessage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK VERDICT CONFIRMATION MODAL                                          */}
      {/* ========================================================================= */}
      {quickVerdictModal && quickVerdictModal.isOpen && activeFullChatDispute && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-500" />
                <span>
                  {quickVerdictModal.actionType === 'REFUND_BUYER'
                    ? (lang === 'bn' ? 'ক্রেতাকে সম্পূর্ণ রিফান্ড নিশ্চিতকরণ' : 'Confirm Full Refund to Buyer')
                    : (lang === 'bn' ? 'বিক্রেতাকে সম্পূর্ণ রিলিজ নিশ্চিতকরণ' : 'Confirm Full Release to Seller')}
                </span>
              </h3>
              <button onClick={() => setQuickVerdictModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs space-y-1">
              <div className="text-slate-500">{lang === 'bn' ? 'মোট তহবিল পরিমাণ:' : 'Total Dispute Amount:'}</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                ৳{parseFloat(activeFullChatDispute.transaction?.amount || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400">
                {quickVerdictModal.actionType === 'REFUND_BUYER'
                  ? (lang === 'bn' ? 'তহবিল ক্রেতার মেইন ব্যালেন্সে ফেরত পাঠানো হবে।' : 'Funds will be refunded 100% to buyer available balance.')
                  : (lang === 'bn' ? 'তহবিল বিক্রেতার মেইন ব্যালেন্সে রিলিজ করা হবে।' : 'Funds will be released 100% to seller available balance.')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'রায়ের কারণ বা ব্যাখ্যা (চ্যাটে নোটিশ যাবে)' : 'Verdict Notes (Posted into Chat)'}
              </label>
              <textarea
                rows={3}
                value={quickVerdictModal.notes}
                onChange={(e) => setQuickVerdictModal({ ...quickVerdictModal, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickVerdictModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteQuickVerdict}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm ${
                  quickVerdictModal.actionType === 'REFUND_BUYER'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'রায় কার্যকর করুন' : 'Execute Verdict'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IMAGE LIGHTBOX MODAL                                                      */}
      {/* ========================================================================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Enlarged" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🤖 AI DISPUTE CASE DOSSIER MODAL                                          */}
      {/* ========================================================================= */}
      {showAiDossierModal && aiDossier && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{lang === 'bn' ? 'এআই কেস ডসিয়ার ও রায় সুপারিশ' : 'AI Case Dossier & Arbitration Recommendation'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn' ? 'চ্যাট হিস্ট্রি, এভিডেন্স ও কাজের প্রমাণভিত্তিক নিরপেক্ষ বিশ্লেষণ' : 'Objective arbitration based on chat history, evidence & work logs'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiDossierModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Recommended Verdict Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  aiDossier.recommendedVerdict === 'REFUND_SENDER'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
                    : aiDossier.recommendedVerdict === 'RELEASE_RECEIVER'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : aiDossier.recommendedVerdict === 'PARTIAL_SPLIT'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-900 dark:text-purple-200'
                }`}
              >
                <Scale className="w-6 h-6 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {lang === 'bn' ? 'প্রস্তাবিত রায়:' : 'Recommended Verdict:'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/70 dark:bg-slate-800/80 shadow-xs">
                      {aiDossier.recommendedVerdict === 'REFUND_SENDER' && (lang === 'bn' ? 'ক্রেতাকে রিফান্ড' : 'Refund Buyer')}
                      {aiDossier.recommendedVerdict === 'RELEASE_RECEIVER' && (lang === 'bn' ? 'বিক্রেতাকে রিলিজ' : 'Release to Seller')}
                      {aiDossier.recommendedVerdict === 'PARTIAL_SPLIT' && (
                        lang === 'bn'
                          ? `আংশিক বণ্টন (${aiDossier.recommendedSplit?.senderPercent || 50}% / ${aiDossier.recommendedSplit?.receiverPercent || 50}%)`
                          : `Split (${aiDossier.recommendedSplit?.senderPercent || 50}% Buyer / ${aiDossier.recommendedSplit?.receiverPercent || 50}% Seller)`
                      )}
                      {aiDossier.recommendedVerdict === 'MANUAL_INVESTIGATION' && (lang === 'bn' ? 'ম্যানুয়াল তদন্ত প্রয়োজন' : 'Manual Review')}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {aiDossier.justification}
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'bn' ? '📋 সংক্ষেপিত সারসংক্ষেপ' : '📋 Executive Summary'}
                </h4>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {aiDossier.executiveSummary}
                </div>
              </div>

              {/* Two Column: Buyer vs Seller Claims */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-blue-500/5 rounded-2xl border border-blue-500/20 space-y-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ক্রেতার মূল দাবি' : 'Buyer Claims'}</span>
                  </span>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    {aiDossier.buyerArguments?.length > 0 ? (
                      aiDossier.buyerArguments.map((arg: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{arg}</li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">{lang === 'bn' ? 'কোনো দাবি নেই' : 'None specified'}</li>
                    )}
                  </ul>
                </div>

                <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বিক্রেতার মূল দাবি' : 'Seller Claims'}</span>
                  </span>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    {aiDossier.sellerArguments?.length > 0 ? (
                      aiDossier.sellerArguments.map((arg: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{arg}</li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">{lang === 'bn' ? 'কোনো দাবি নেই' : 'None specified'}</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Evidence & Work Log Findings */}
              {aiDossier.evidenceFindings?.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'bn' ? '🔍 প্রমাণের ফলাফল' : '🔍 Evidence & Proof Findings'}
                  </h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                    {aiDossier.evidenceFindings.map((finding: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {aiDossier.timeline?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'bn' ? '⏱️ ঘটনার টাইমলাইন' : '⏱️ Incident Timeline'}
                  </h4>
                  <div className="space-y-2 relative pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                    {aiDossier.timeline.map((step: any, idx: number) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="text-[10px] text-slate-400 font-mono">{step.time}</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{step.event}</div>
                        {step.actor && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {step.actor}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'এআই শুধুমাত্র সিদ্ধান্ত সহায়ক, চূড়ান্ত দায়িত্ব অ্যাডমিনের।' : 'AI serves as decision support; final verdict is arbitrator responsibility.'}
              </span>
              <button
                type="button"
                onClick={() => setShowAiDossierModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close Dossier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Peer Reassignment Modal */}
      {handoffDispute && (
        <TaskHandoffModal
          isOpen={!!handoffDispute}
          onClose={() => setHandoffDispute(null)}
          taskType="DISPUTE"
          taskId={handoffDispute.id}
          taskTitle={`ডিসপুট: ৳${parseFloat(handoffDispute.transaction?.amount || '0').toLocaleString()} (Trx ${handoffDispute.transaction?.trackingNumber || handoffDispute.transactionId?.slice(-6)})`}
          currentStaffId={user?.id}
          onSuccess={() => {
            setFeedbackMsg({
              type: 'success',
              text: lang === 'bn' ? 'ডিসপুটটি সফলভাবে সহকর্মীকে হস্তান্তর করা হয়েছে।' : 'Dispute reassigned to colleague successfully.',
            });
            fetchQueue();
          }}
        />
      )}

      {/* Escalation to Super Admin Modal */}
      {escalateDispute && (
        <TaskEscalateModal
          isOpen={!!escalateDispute}
          onClose={() => setEscalateDispute(null)}
          taskId={escalateDispute.id}
          taskTitle={`জরুরি ডিসপুট: ৳${parseFloat(escalateDispute.transaction?.amount || '0').toLocaleString()} (Trx ${escalateDispute.transaction?.trackingNumber || escalateDispute.transactionId?.slice(-6)})`}
          onSuccess={() => {
            setFeedbackMsg({
              type: 'success',
              text: lang === 'bn' ? 'ডিসপুটটি সফলভাবে সুপার অ্যাডমিনের কাছে এস্কেলেট করা হয়েছে।' : 'Dispute escalated to Super Admin successfully.',
            });
            fetchQueue();
          }}
        />
      )}
    </div>
  );
}
