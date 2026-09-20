import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Send,
  ShieldCheck,
  Check,
  CheckCheck,
  ShieldAlert,
  MoreVertical,
  Wallet,
  FileText,
  X,
  MessageSquare,
  AlertTriangle,
  ChevronLeft,
  Clock,
  Image as ImageIcon,
  Camera,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  CheckCircle2,
  XCircle,
  Lock,
  Scale,
  Bell,
  RotateCcw,
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/client';
import { getChatSocket } from '../../sockets/chatSocket';
import { getImageUrl } from '../../utils/imageUtils';
import { APP_CONFIG } from '../../config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HeaderTab = 'chat' | 'transaction' | 'rules' | 'admin_calling';

export const ChatDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user, refreshWallet, wallet } = useAuthStore();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 14);

  const {
    conversationId: initialConversationId,
    targetUserId,
    partner: initialPartner,
  } = route.params || {};

  // Navigation & Partner State
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [partner, setPartner] = useState<any | null>(initialPartner || null);
  const [activeTab, setActiveTab] = useState<HeaderTab>('chat');

  // Messages & Loading
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<any | null>(null);

  // Picture / Image Sending
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sendingAttachment, setSendingAttachment] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Modals & Menu
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Pay Money Modal (Sender locks funds into Escrow Hold)
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('সার্ভিস পেমেন্ট');
  const [submittingPay, setSubmittingPay] = useState(false);

  // 2. Request Money Modal (Receiver asks for money without upfront balance)
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('সার্ভিস ফি');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // 3. Dispute Modal
  const [showDisputeModal, setShowDisputeModal] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('পণ্য/সার্ভিস সঠিক সময়ে পাওয়া যায়নি');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Commission Settings
  const [txCommissionSetting, setTxCommissionSetting] = useState<{
    rateType: 'PERCENTAGE' | 'FLAT';
    value: number;
    isActive: boolean;
    minFee?: number;
    maxFee?: number;
  } | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // ---------------------------------------------------------------------------
  // 1. Derived Identity & Transactions
  // ---------------------------------------------------------------------------
  const resolvedPartnerId =
    partner?.id ||
    targetUserId ||
    initialPartner?.id ||
    (partner as any)?.userId ||
    (deal?.senderId === user?.id ? deal?.receiverId : deal?.senderId);

  const partnerName = partner?.firstName
    ? `${partner.firstName} ${partner.lastName || ''}`.trim()
    : partner?.name ||
      partner?.username ||
      partner?.uniqueUserId ||
      (resolvedPartnerId ? `User #${resolvedPartnerId.slice(0, 6)}` : 'Chat Partner');

  const partnerHandle = partner?.uniqueUserId || (resolvedPartnerId ? resolvedPartnerId.slice(0, 8) : 'user');
  const partnerAvatar = partner?.avatarUrl ? getImageUrl(partner.avatarUrl) : null;

  // Extract all transactions for this conversation (newest first)
  const conversationTransactions = useMemo(() => {
    const map = new Map<string, any>();
    if (deal && deal.id) {
      map.set(deal.id, {
        ...deal,
        transactionId: deal.id,
        createdAt: deal.createdAt || new Date().toISOString(),
      });
    }
    messages.forEach((msg) => {
      if (
        (msg.messageType === 'PAY_REQUEST' || msg.messageType === 'RECEIVE_REQUEST') &&
        msg.metadata?.transactionId
      ) {
        map.set(msg.metadata.transactionId, {
          ...msg.metadata,
          messageId: msg.id,
          messageType: msg.messageType,
          createdAt: msg.createdAt,
          sender: msg.sender,
          transactionId: msg.metadata.transactionId,
        });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messages, deal]);

  const hasDispute = useMemo(() => {
    return conversationTransactions.some((t) => t.status === 'DISPUTED');
  }, [conversationTransactions]);

  const txRateType = txCommissionSetting?.rateType || 'PERCENTAGE';
  const txRateVal = txCommissionSetting?.value !== undefined ? Number(txCommissionSetting.value) : 5;
  const isTxCommActive = txCommissionSetting ? txCommissionSetting.isActive !== false : true;
  const txMinFee = Number(txCommissionSetting?.minFee || 0);
  const txMaxFee = Number(txCommissionSetting?.maxFee || 0);

  const txCommLabel = !isTxCommActive || txRateVal === 0
    ? 'ফ্রি'
    : txRateType === 'PERCENTAGE'
    ? `${txRateVal}%`
    : `৳${txRateVal}`;

  const calculateCommission = (amount: number) => {
    if (!isTxCommActive || txRateVal <= 0 || !amount || amount <= 0) return 0;
    let est = txRateType === 'PERCENTAGE' ? (amount * txRateVal) / 100 : txRateVal;
    if (txMinFee > 0 && est < txMinFee) est = txMinFee;
    if (txMaxFee > 0 && est > txMaxFee) est = txMaxFee;
    return Math.round(est * 100) / 100;
  };

  // ---------------------------------------------------------------------------
  // 2. Fetch Conversation, Messages, Deal & Settings
  // ---------------------------------------------------------------------------
  const fetchMessagesAndDeal = async (activeConvId: string) => {
    try {
      const msgRes: any = await api.get(`/chat/conversations/${activeConvId}/messages`);
      const msgData = msgRes?.data !== undefined ? msgRes.data : msgRes;
      const msgList = Array.isArray(msgData) ? msgData : msgData?.messages || msgRes?.items || [];
      setMessages(msgList);

      api.post(`/chat/conversations/${activeConvId}/seen`).catch(() => {});

      try {
        const dealRes: any = await api.get(`/chat/conversations/${activeConvId}/transaction`);
        const dealData = dealRes?.data !== undefined ? dealRes.data : dealRes;
        if (dealData && dealData.id) {
          setDeal(dealData);
        }
      } catch {}
    } catch (err) {
      console.warn('Failed to fetch messages:', err);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        refreshWallet();

        // 1. Fetch commission settings
        try {
          const commRes: any = await api.get('/commission/settings');
          const raw = commRes?.data !== undefined ? commRes.data : commRes;
          const commData = raw?.data !== undefined ? raw.data : raw;
          if (commData?.transaction) {
            setTxCommissionSetting(commData.transaction);
          }
        } catch (err) {
          console.warn('Failed to load commission settings:', err);
        }

        let activeConvId = initialConversationId;

        // 2. If no conversationId but targetUserId exists, start or find conversation
        if (!activeConvId && targetUserId) {
          try {
            const res: any = await api.post('/chat/conversations', {
              targetUserId,
              recipientId: targetUserId,
            });
            const data = res?.data !== undefined ? res.data : res;
            activeConvId = data?.id || data?.conversationId;
            if (activeConvId) setConversationId(activeConvId);

            if (!partner) {
              if (data?.participants) {
                const other = data.participants.find((p: any) => p.userId !== user?.id)?.user;
                if (other) setPartner(other);
              } else if (data?.otherUser) {
                setPartner(data.otherUser);
              }
            }
          } catch (e) {
            console.warn('Could not create conversation upfront:', e);
          }
        }

        // 3. If partner is still missing, attempt profile lookup
        if (!partner && targetUserId) {
          try {
            const userRes: any = await api.get(`/users/profile/${targetUserId}`).catch(() => null);
            const uData = userRes?.data !== undefined ? userRes.data : userRes;
            if (uData && (uData.id || uData.uniqueUserId)) {
              setPartner(uData);
            }
          } catch {}
        }

        // 4. If conversationId exists, fetch conversation details & messages
        if (activeConvId) {
          try {
            const convRes: any = await api.get(`/chat/conversations/${activeConvId}`).catch(() => null);
            const convData = convRes?.data !== undefined ? convRes.data : convRes;
            if (convData) {
              if (!partner) {
                if (convData.participants) {
                  const other = convData.participants.find((p: any) => p.userId !== user?.id)?.user;
                  if (other) setPartner(other);
                } else if (convData.otherUser) {
                  setPartner(convData.otherUser);
                }
              }
            }
          } catch {}

          await fetchMessagesAndDeal(activeConvId);
        }

        // 5. Ultimate fallback if partner is still not populated
        if (!partner && activeConvId) {
          try {
            const convListRes: any = await api.get('/chat/conversations').catch(() => null);
            const rawList = convListRes?.data !== undefined ? convListRes.data : convListRes;
            const list = Array.isArray(rawList) ? rawList : rawList?.conversations || [];
            const found = list.find((c: any) => c.conversationId === activeConvId || c.id === activeConvId);
            if (found?.otherUser) {
              setPartner(found.otherUser);
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn('Failed to initialize conversation:', err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [initialConversationId, targetUserId]);

  // ---------------------------------------------------------------------------
  // 3. Real-Time Socket.io Listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const socket = getChatSocket(user.id);
    socket.emit('join:conversation', { conversationId });

    const handleReceive = (newMsg: any) => {
      if (!newMsg?.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const tempIdx = prev.findIndex(
          (m) =>
            m.id &&
            typeof m.id === 'string' &&
            m.id.startsWith('temp_') &&
            m.senderId === newMsg.senderId &&
            m.content === newMsg.content
        );
        if (tempIdx !== -1) {
          const copy = [...prev];
          copy[tempIdx] = newMsg;
          return copy;
        }
        return [newMsg, ...prev];
      });
    };

    const handleDealUpdate = (updatedDeal: any) => {
      if (updatedDeal) {
        setDeal(updatedDeal);
        refreshWallet();
        if (conversationId) fetchMessagesAndDeal(conversationId);
      }
    };

    socket.on('message:receive', handleReceive);
    socket.on('deal:update', handleDealUpdate);
    socket.on('transaction:update', handleDealUpdate);

    return () => {
      socket.emit('leave:conversation', { conversationId });
      socket.off('message:receive', handleReceive);
      socket.off('deal:update', handleDealUpdate);
      socket.off('transaction:update', handleDealUpdate);
    };
  }, [conversationId, user?.id]);

  // ---------------------------------------------------------------------------
  // 4. Image Picker (Camera or Gallery)
  // ---------------------------------------------------------------------------
  const handlePickImage = async (fromCamera: boolean = false) => {
    setShowImageSourceModal(false);
    try {
      let result: ImagePicker.ImagePickerResult;

      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('অনুমতি আবশ্যক', 'ছবি তোলার জন্য ক্যামেরার পারমিশন দিন।');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('অনুমতি আবশ্যক', 'ছবি সিলেক্ট করার জন্য গ্যালারির পারমিশন দিন।');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
      Alert.alert('ত্রুটি', 'ছবি নির্বাচন করা সম্ভব হয়নি।');
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Send Message (Text and/or Image)
  // ---------------------------------------------------------------------------
  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && !selectedImage) || !user?.id) return;

    let activeConvId = conversationId;
    if (!activeConvId && resolvedPartnerId) {
      try {
        const createRes: any = await api.post('/chat/conversations', {
          targetUserId: resolvedPartnerId,
          recipientId: resolvedPartnerId,
        });
        const cData = createRes?.data !== undefined ? createRes.data : createRes;
        activeConvId = cData?.id || cData?.conversationId;
        if (activeConvId) setConversationId(activeConvId);
      } catch (err: any) {
        Alert.alert('ত্রুটি', err?.message || 'কথোপকথন শুরু করতে ব্যর্থ হয়েছে।');
        return;
      }
    }

    if (!activeConvId) {
      Alert.alert('ত্রুটি', 'চ্যাট পার্টনারের তথ্য পাওয়া যায়নি।');
      return;
    }

    const imgToSend = selectedImage;
    setInputText('');
    setSelectedImage(null);

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId: activeConvId,
      senderId: user.id,
      content: text || 'Sent an image',
      messageType: imgToSend ? 'IMAGE' : 'TEXT',
      attachments: imgToSend ? [{ fileUrl: imgToSend.uri, fileType: 'IMAGE' }] : [],
      createdAt: new Date().toISOString(),
      sender: user,
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      let attachmentPayload = null;
      if (imgToSend) {
        setSendingAttachment(true);
        const mimeType = imgToSend.mimeType || 'image/jpeg';
        const base64Data = imgToSend.base64 ? `data:${mimeType};base64,${imgToSend.base64}` : null;

        if (base64Data) {
          const uploadRes: any = await api.post('/uploads', {
            base64Data,
            fileName: imgToSend.fileName || `chat_${Date.now()}.jpg`,
            folder: 'chat',
          });
          const uploadData = uploadRes?.data !== undefined ? uploadRes.data : uploadRes;
          const fileUrl = uploadData?.fileUrl || uploadData?.url;
          if (fileUrl) {
            attachmentPayload = [
              {
                fileUrl,
                fileType: 'IMAGE',
                fileSize: imgToSend.fileSize || 0,
              },
            ];
          }
        }
      }

      const res: any = await api.post(`/chat/conversations/${activeConvId}/messages`, {
        content: text || (attachmentPayload ? 'Sent an image' : ''),
        messageType: attachmentPayload ? 'IMAGE' : 'TEXT',
        attachments: attachmentPayload,
      });

      const savedMsg = res?.data !== undefined ? res.data : res;
      if (savedMsg?.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? savedMsg : m));
        });
      }
    } catch (err) {
      console.warn('Send message failed:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('ব্যর্থ', 'মেসেজ পাঠানো সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
    } finally {
      setSendingAttachment(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Pay Money (💸 Pay Request / Escrow Hold)
  // ---------------------------------------------------------------------------
  const handleSendPayMoney = async () => {
    const numAmount = parseFloat(payAmount);
    if (isNaN(numAmount) || numAmount < 10) {
      Alert.alert('ভুল ইনপুট', 'সর্বনিম্ন পেমেন্টের পরিমাণ ৳ ১০');
      return;
    }

    const targetRecipientId = resolvedPartnerId;
    if (!targetRecipientId) {
      Alert.alert('ত্রুটি', 'চ্যাট পার্টনারের তথ্য পাওয়া যায়নি। অনুগ্রহ করে চ্যাট রিফ্রেশ করুন।');
      return;
    }

    const availableBal = Number(user?.wallet?.availableBalance ?? wallet?.availableBalance ?? 0);
    const estCommission = calculateCommission(numAmount);
    const totalRequired = numAmount + estCommission;

    if (availableBal < totalRequired) {
      Alert.alert(
        'অপর্যাপ্ত ব্যালেন্স',
        `এই পেমেন্ট করতে মূল ৳${numAmount.toLocaleString()} + ${txCommLabel} কমিশন ৳${estCommission.toLocaleString()} = মোট ৳${totalRequired.toLocaleString()} প্রয়োজন। আপনার বর্তমান ব্যালেন্স ৳${availableBal.toLocaleString()}। অনুগ্রহ করে ওয়ালেট রিচার্জ করুন।`
      );
      return;
    }

    setSubmittingPay(true);
    try {
      const res: any = await api.post('/transactions/pay-request', {
        receiverId: targetRecipientId,
        amount: numAmount,
        notes: payNotes.trim() || 'সার্ভিস পেমেন্ট',
        conversationId: conversationId || undefined,
      });

      const newDeal = res?.data !== undefined ? res.data : res;
      if (newDeal) setDeal(newDeal);
      setShowPayModal(false);
      setPayAmount('');
      setPayNotes('সার্ভিস পেমেন্ট');

      await refreshWallet();
      if (conversationId) await fetchMessagesAndDeal(conversationId);

      const socket = getChatSocket(user?.id);
      socket.emit('transaction:update', {
        conversationId,
        transaction: newDeal?.transaction || newDeal,
      });

      Alert.alert('সফল', `৳${numAmount.toLocaleString()} টাকার পে রিকোয়েস্ট তৈরি করা হয়েছে!`);
    } catch (err: any) {
      Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'পেমেন্ট রিকোয়েস্ট তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setSubmittingPay(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 7. Request Money (📥 Receive Request)
  // ---------------------------------------------------------------------------
  const handleSendRequestMoney = async () => {
    const numAmount = parseFloat(requestAmount);
    if (isNaN(numAmount) || numAmount < 10) {
      Alert.alert('ভুল ইনপুট', 'সর্বনিম্ন রিকোয়েস্টের পরিমাণ ৳ ১০');
      return;
    }

    const targetRecipientId = resolvedPartnerId;
    if (!targetRecipientId) {
      Alert.alert('ত্রুটি', 'চ্যাট পার্টনারের তথ্য পাওয়া যায়নি। অনুগ্রহ করে চ্যাট রিফ্রেশ করুন।');
      return;
    }

    setSubmittingRequest(true);
    try {
      const res: any = await api.post('/transactions/request-money', {
        targetId: targetRecipientId,
        amount: numAmount,
        reason: requestReason.trim() || 'সার্ভিস ফি',
        conversationId: conversationId || undefined,
      });

      const newDeal = res?.data !== undefined ? res.data : res;
      if (newDeal) setDeal(newDeal);
      setShowRequestModal(false);
      setRequestAmount('');
      setRequestReason('সার্ভিস ফি');

      if (conversationId) await fetchMessagesAndDeal(conversationId);

      const socket = getChatSocket(user?.id);
      socket.emit('transaction:update', {
        conversationId,
        transaction: newDeal?.transaction || newDeal,
      });

      Alert.alert('সফল', `৳${numAmount.toLocaleString()} টাকা চেয়ে রিকোয়েস্ট পাঠানো হয়েছে।`);
    } catch (err: any) {
      Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 8. Approve Deal Proposal (Locks funds in Escrow Hold)
  // ---------------------------------------------------------------------------
  const handleApproveRequest = async (transactionId: string) => {
    Alert.alert(
      'পেমেন্ট অনুমোদন ও হোল্ড',
      'আপনি কি এই রিকোয়েস্ট অনুমোদন করে এসক্রো হোল্ডে লক করতে চান? প্রেরকের ব্যালেন্স থেকে টাকা কেটে সেফনেক্সবিডি সুরক্ষিত হোল্ডে জমা হবে।',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'অনুমোদন করুন',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res: any = await api.patch(`/transactions/${transactionId}/pay-request/approve`);
              const updated = res?.data !== undefined ? res.data : res;
              setDeal(updated);
              await refreshWallet();
              if (conversationId) await fetchMessagesAndDeal(conversationId);

              const socket = getChatSocket(user?.id);
              socket.emit('transaction:update', {
                conversationId,
                transaction: updated,
              });

              Alert.alert('সফল', 'টাকা নিরাপদ এসক্রো হোল্ডে জমা হয়েছে। কাজ শেষ হলে আপনি টাকা রিলিজ করতে পারবেন।');
            } catch (err: any) {
              Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'চুক্তি অনুমোদন করা সম্ভব হয়নি।');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // 9. Release Escrow Hold to Seller
  // ---------------------------------------------------------------------------
  const handleReleasePayRequest = async (transactionId: string) => {
    Alert.alert(
      'টাকা রিলিজ নিশ্চিতকরণ',
      'আপনি কি নিশ্চিত যে এই টাকা রিলিজ করতে চান? টাকা সাথে সাথে রিসিভারের মূল ব্যালেন্সে যুক্ত হবে।',
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'হ্যাঁ, রিলিজ করুন',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res: any = await api.patch(`/transactions/${transactionId}/pay-request/release`);
              const updated = res?.data !== undefined ? res.data : res;
              setDeal(updated);
              await refreshWallet();
              if (conversationId) await fetchMessagesAndDeal(conversationId);

              const socket = getChatSocket(user?.id);
              socket.emit('transaction:update', {
                conversationId,
                transaction: updated,
              });

              Alert.alert('অভিনন্দন!', 'টাকা সফলভাবে সেলারের মূল ব্যালেন্সে রিলিজ হয়েছে।');
            } catch (err: any) {
              Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'টাকা রিলিজ করতে সমস্যা হয়েছে।');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // 10. Decline / Cancel Pay Request
  // ---------------------------------------------------------------------------
  const handleDeclinePayRequest = async (transactionId: string) => {
    Alert.alert(
      'বাতিল নিশ্চিতকরণ',
      'আপনি কি নিশ্চিতভাবে এই লেনদেন রিকোয়েস্টটি বাতিল বা প্রত্যাখ্যান করতে চান?',
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, বাতিল করুন',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res: any = await api.patch(`/transactions/${transactionId}/pay-request/decline`, {
                reason: 'ব্যবহারকারী রিকোয়েস্ট বাতিল করেছেন',
              });
              const updated = res?.data !== undefined ? res.data : res;
              setDeal(updated);
              await refreshWallet();
              if (conversationId) await fetchMessagesAndDeal(conversationId);

              const socket = getChatSocket(user?.id);
              socket.emit('transaction:update', {
                conversationId,
                transaction: updated,
              });

              Alert.alert('অবহিতকরণ', 'রিকোয়েস্টটি সফলভাবে বাতিল করা হয়েছে।');
            } catch (err: any) {
              Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'বাতিল করা সম্ভব হয়নি।');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // 11. Request Release (Receiver notifies sender)
  // ---------------------------------------------------------------------------
  const handleRequestRelease = async (transactionId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/transactions/${transactionId}/pay-request/request-release`);
      if (conversationId) await fetchMessagesAndDeal(conversationId);
      Alert.alert('সফল', 'রিলিজের তাগাদা নোটিফিকেশন প্রেরকের কাছে পাঠানো হয়েছে।');
    } catch (err: any) {
      Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 12. Withdraw Dispute (Restores to Escrow Hold)
  // ---------------------------------------------------------------------------
  const handleWithdrawDispute = async (transactionId: string) => {
    Alert.alert(
      'ডিসপ্যুট প্রত্যাহার',
      'আপনি কি ডিসপ্যুট প্রত্যাহার করতে চান? পেমেন্ট পুনরায় এসক্রো হোল্ডে ফিরে যাবে এবং আপনি তা রিলিজ করতে পারবেন।',
      [
        { text: 'না', style: 'cancel' },
        {
          text: 'হ্যাঁ, প্রত্যাহার করুন',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res: any = await api.patch(`/transactions/${transactionId}/pay-request/withdraw-dispute`);
              const updated = res?.data !== undefined ? res.data : res;
              setDeal(updated);
              await refreshWallet();
              if (conversationId) await fetchMessagesAndDeal(conversationId);

              const socket = getChatSocket(user?.id);
              socket.emit('transaction:update', {
                conversationId,
                transaction: updated,
              });

              Alert.alert('সফল', 'ডিসপ্যুট প্রত্যাহার করা হয়েছে এবং পেমেন্ট হোল্ডে ফিরে এসেছে।');
            } catch (err: any) {
              Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'ডিসপ্যুট প্রত্যাহার সম্ভব হয়নি।');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ---------------------------------------------------------------------------
  // 13. Submit Dispute to Admin Calling Queue
  // ---------------------------------------------------------------------------
  const handleSubmitDispute = async () => {
    const txnId = showDisputeModal?.transactionId || showDisputeModal?.id || deal?.id;
    if (!txnId || !disputeReason.trim()) {
      Alert.alert('অবহিতকরণ', 'বিরোধের সুনির্দিষ্ট কারণ লিখুন।');
      return;
    }

    setSubmittingDispute(true);
    try {
      const res: any = await api.post(`/transactions/${txnId}/pay-request/dispute`, {
        reason: disputeReason.trim(),
        details: disputeDetails.trim() || undefined,
      });

      const updated = res?.data !== undefined ? res.data : res;
      setShowDisputeModal(null);
      setDisputeReason('পণ্য/সার্ভিস সঠিক সময়ে পাওয়া যায়নি');
      setDisputeDetails('');

      await refreshWallet();
      if (conversationId) await fetchMessagesAndDeal(conversationId);

      const socket = getChatSocket(user?.id);
      socket.emit('transaction:update', {
        conversationId,
        transaction: updated?.transaction || updated,
      });

      Alert.alert(
        'ডিসপ্যুট দাখিল সফল',
        'আপনার বিরোধটি অ্যাডমিন কলিং কিউ (Calling Queue)-তে পাঠানো হয়েছে। অ্যাডমিন টিম খুব দ্রুত তদন্ত করে ফয়সালা দেবেন।'
      );
      setActiveTab('admin_calling');
    } catch (err: any) {
      Alert.alert('ব্যর্থ', err?.response?.data?.message || err?.message || 'ডিসপ্যুট আবেদন জমা দেওয়া যায়নি।');
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Helper to copy / view tracking number
  const copyTrackingNumber = (trackingId: string) => {
    Alert.alert('ট্র্যাকিং আইডি', trackingId);
  };

  // ---------------------------------------------------------------------------
  // 14. Message Stream Item Renderer
  // ---------------------------------------------------------------------------
  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === user?.id;
    const attachmentUrl = item.attachments?.[0]?.fileUrl ? getImageUrl(item.attachments[0].fileUrl) : null;

    // A. PAY_REQUEST or RECEIVE_REQUEST IN-CHAT CARD
    if (item.messageType === 'PAY_REQUEST' || item.messageType === 'RECEIVE_REQUEST') {
      const meta = item.metadata || {};
      const status = meta.status || 'REQUESTED';
      const amount = Number(meta.amount || 0);
      const trackingNumber = meta.trackingNumber || 'TXN-PENDING';
      const txnId = meta.transactionId;
      const isPayer = meta.senderId === user?.id || (isMine && meta.receiverId !== user?.id);
      const isReceiver = meta.receiverId === user?.id || (!isMine && meta.senderId !== user?.id);
      const senderName = meta.senderName || item.sender?.firstName || 'ইউজার';

      return (
        <View style={styles.dealMsgContainer}>
          <View
            style={[
              styles.dealMsgCard,
              {
                backgroundColor: colors.surface,
                borderColor:
                  status === 'HOLD'
                    ? '#38bdf8'
                    : status === 'DISPUTED'
                    ? '#f87171'
                    : status === 'RELEASED' || status === 'COMPLETED'
                    ? '#34d399'
                    : '#fbbf24',
              },
            ]}
          >
            {/* Header */}
            <View style={styles.dealCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Wallet size={16} color={colors.primary} />
                <Text style={[styles.dealCardTitle, { color: colors.primary }]}>
                  {item.messageType === 'PAY_REQUEST' ? 'SafnexBD Escrow Pay' : 'SafnexBD Money Request'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadgeSmall,
                  {
                    backgroundColor:
                      status === 'HOLD'
                        ? '#e0f2fe'
                        : status === 'DISPUTED'
                        ? '#fee2e2'
                        : status === 'RELEASED' || status === 'COMPLETED'
                        ? '#dcfce7'
                        : '#fef3c7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeSmallText,
                    {
                      color:
                        status === 'HOLD'
                          ? '#0369a1'
                          : status === 'DISPUTED'
                          ? '#b91c1c'
                          : status === 'RELEASED' || status === 'COMPLETED'
                          ? '#15803d'
                          : '#b45309',
                    },
                  ]}
                >
                  {status === 'HOLD'
                    ? '🔒 এসক্রো হোল্ড'
                    : status === 'DISPUTED'
                    ? '⚠️ ডিসপ্যুট'
                    : status === 'RELEASED' || status === 'COMPLETED'
                    ? '✅ রিলিজ সম্পন্ন'
                    : status === 'REJECTED' || status === 'CANCELLED'
                    ? '❌ বাতিল'
                    : '⏳ অপেক্ষমান'}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.dealCardAmountBox}>
              <Text style={[styles.dealCardAmountText, { color: colors.text }]}>
                {APP_CONFIG.currency} {amount.toLocaleString()}
              </Text>
              <Text style={[styles.dealCardSubText, { color: colors.textSecondary }]}>
                {status === 'REQUESTED'
                  ? isReceiver
                    ? `${senderName} আপনাকে টাকা গ্রহণের প্রস্তাব দিয়েছেন`
                    : 'আপনি পেমেন্ট প্রস্তাব পাঠিয়েছেন'
                  : isPayer
                  ? `আপনি ৳${amount.toLocaleString()} হোল্ডে রেখেছেন`
                  : `${senderName} আপনার জন্য ৳${amount.toLocaleString()} হোল্ডে রেখেছেন`}
              </Text>
            </View>

            {/* Notes & Tracking */}
            <View style={[styles.dealCardMetaBox, { backgroundColor: colors.surfaceSecondary }]}>
              {Boolean(meta.notes || meta.reason) && (
                <Text style={[styles.dealCardNotes, { color: colors.text }]} numberOfLines={2}>
                  নোট: {meta.notes || meta.reason}
                </Text>
              )}
              <View style={styles.dealCardTrackingRow}>
                <Text style={[styles.dealCardTrackingText, { color: colors.textMuted }]}>
                  আইডি: {trackingNumber}
                </Text>
                <TouchableOpacity onPress={() => copyTrackingNumber(trackingNumber)}>
                  <Copy size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            {txnId && status === 'REQUESTED' && (
              <View style={styles.dealCardActionsRow}>
                {isReceiver ? (
                  <>
                    <TouchableOpacity
                      disabled={actionLoading}
                      onPress={() => handleApproveRequest(txnId)}
                      style={[styles.dealBtn, { backgroundColor: '#10b981' }]}
                    >
                      <Check size={14} color="#ffffff" />
                      <Text style={styles.dealBtnText}>অনুমোদন (Approve)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={actionLoading}
                      onPress={() => handleDeclinePayRequest(txnId)}
                      style={[styles.dealBtn, { backgroundColor: '#fee2e2' }]}
                    >
                      <X size={14} color="#b91c1c" />
                      <Text style={[styles.dealBtnText, { color: '#b91c1c' }]}>প্রত্যাখ্যান</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    disabled={actionLoading}
                    onPress={() => handleDeclinePayRequest(txnId)}
                    style={[styles.dealBtn, { backgroundColor: colors.surfaceSecondary }]}
                  >
                    <X size={14} color={colors.textSecondary} />
                    <Text style={[styles.dealBtnText, { color: colors.textSecondary }]}>রিকোয়েস্ট বাতিল করুন</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {txnId && status === 'HOLD' && (
              <View style={styles.dealCardActionsRow}>
                {isPayer ? (
                  <>
                    <TouchableOpacity
                      disabled={actionLoading}
                      onPress={() => handleReleasePayRequest(txnId)}
                      style={[styles.dealBtn, { backgroundColor: '#10b981' }]}
                    >
                      <CheckCircle2 size={14} color="#ffffff" />
                      <Text style={styles.dealBtnText}>টাকা রিলিজ করুন</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={actionLoading}
                      onPress={() => setShowDisputeModal({ transactionId: txnId, amount, trackingNumber })}
                      style={[styles.dealBtn, { backgroundColor: '#fef3c7' }]}
                    >
                      <AlertTriangle size={14} color="#b45309" />
                      <Text style={[styles.dealBtnText, { color: '#b45309' }]}>ডিসপ্যুট</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      disabled={actionLoading}
                      onPress={() => handleRequestRelease(txnId)}
                      style={[styles.dealBtn, { backgroundColor: '#0284c7' }]}
                    >
                      <Bell size={14} color="#ffffff" />
                      <Text style={styles.dealBtnText}>রিলিজের অনুরোধ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={actionLoading}
                      onPress={() => setShowDisputeModal({ transactionId: txnId, amount, trackingNumber })}
                      style={[styles.dealBtn, { backgroundColor: '#fee2e2' }]}
                    >
                      <AlertTriangle size={14} color="#b91c1c" />
                      <Text style={[styles.dealBtnText, { color: '#b91c1c' }]}>ডিসপ্যুট</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {txnId && status === 'DISPUTED' && (
              <View style={styles.dealCardActionsRow}>
                {isPayer && (
                  <TouchableOpacity
                    disabled={actionLoading}
                    onPress={() => handleWithdrawDispute(txnId)}
                    style={[styles.dealBtn, { backgroundColor: '#0284c7' }]}
                  >
                    <RotateCcw size={14} color="#ffffff" />
                    <Text style={styles.dealBtnText}>প্রত্যাহার ও রিলিজ</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setActiveTab('admin_calling')}
                  style={[styles.dealBtn, { backgroundColor: '#fef3c7' }]}
                >
                  <ShieldAlert size={14} color="#b45309" />
                  <Text style={[styles.dealBtnText, { color: '#b45309' }]}>কল অ্যাডমিন কিউ</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    }

    // B. STANDARD TEXT OR IMAGE MESSAGE
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View
          style={[
            styles.bubble,
            isMine
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
              : { backgroundColor: colors.surfaceSecondary, borderBottomLeftRadius: 2 },
          ]}
        >
          {attachmentUrl && (
            <TouchableOpacity
              onPress={() => setLightboxImage(attachmentUrl)}
              activeOpacity={0.9}
              style={styles.imageBubbleContainer}
            >
              <Image source={{ uri: attachmentUrl }} style={styles.bubbleImage} resizeMode="cover" />
            </TouchableOpacity>
          )}

          {Boolean(item.content) && item.content !== 'Sent an image' && (
            <Text style={[styles.msgText, { color: isMine ? '#ffffff' : colors.text }]}>
              {item.content}
            </Text>
          )}

          <View style={styles.msgFooter}>
            <Text style={[styles.timeText, { color: isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </Text>
            {isMine && <CheckCheck size={12} color="rgba(255,255,255,0.7)" />}
          </View>
        </View>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // 15. Render Tab 2: Transactions Tab
  // ---------------------------------------------------------------------------
  const renderTransactionsTab = () => {
    const totalCount = conversationTransactions.length;
    const holdSum = conversationTransactions
      .filter((t) => t.status === 'HOLD')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const releasedSum = conversationTransactions
      .filter((t) => t.status === 'RELEASED' || t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const disputedSum = conversationTransactions
      .filter((t) => t.status === 'DISPUTED')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent}>
        {/* Banner & Action Buttons */}
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Wallet size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              চ্যাট ভিত্তিক লেনদেনসমূহ (Conversation Transactions)
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            এই চ্যাটে প্রেরিত সমস্ত পে রিকোয়েস্ট, এসক্রো হোল্ড ও লেনদেনের ইতিহাস
          </Text>

          <View style={styles.txTopActionsRow}>
            <TouchableOpacity
              style={[styles.txTopActionBtn, { backgroundColor: '#059669' }]}
              onPress={() => setShowPayModal(true)}
            >
              <ArrowUpRight size={16} color="#ffffff" />
              <Text style={styles.txTopActionBtnText}>💸 Pay Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.txTopActionBtn, { backgroundColor: '#0284c7' }]}
              onPress={() => setShowRequestModal(true)}
            >
              <ArrowDownLeft size={16} color="#ffffff" />
              <Text style={styles.txTopActionBtnText}>💰 Request Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4-Stat Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>মোট লেনদেন</Text>
            <Text style={[styles.statBoxValue, { color: colors.text }]}>{totalCount}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Lock size={12} color="#0284c7" />
              <Text style={[styles.statBoxLabel, { color: '#0284c7' }]}>এসক্রো হোল্ড</Text>
            </View>
            <Text style={[styles.statBoxValue, { color: '#0369a1' }]}>৳{holdSum.toLocaleString()}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={12} color="#059669" />
              <Text style={[styles.statBoxLabel, { color: '#059669' }]}>রিলিজ সম্পন্ন</Text>
            </View>
            <Text style={[styles.statBoxValue, { color: '#065f46' }]}>৳{releasedSum.toLocaleString()}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} color="#b45309" />
              <Text style={[styles.statBoxLabel, { color: '#b45309' }]}>বিরোধপূর্ণ</Text>
            </View>
            <Text style={[styles.statBoxValue, { color: '#92400e' }]}>৳{disputedSum.toLocaleString()}</Text>
          </View>
        </View>

        {/* Transactions Cards */}
        {conversationTransactions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Wallet size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>কোনো লেনদেন পাওয়া যায়নি</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              এই চ্যাটে এখনও কোনো লেনদেন শুরু হয়নি। উপরের বাটনে ক্লিক করে টাকা পাঠানো বা চাওয়ার প্রস্তাব তৈরি করুন।
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {conversationTransactions.map((txn) => {
              const isPayer = txn.senderId === user?.id || txn.sender?.id === user?.id;
              const isReceiver = txn.receiverId === user?.id;
              const status = txn.status || 'REQUESTED';
              const amount = Number(txn.amount || 0);
              const commission = calculateCommission(amount);
              const trackingNumber = txn.trackingNumber || 'TXN-PENDING';

              return (
                <View
                  key={txn.transactionId || txn.id}
                  style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.txnHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.txnTrackingText, { color: colors.text }]}>{trackingNumber}</Text>
                      <TouchableOpacity onPress={() => copyTrackingNumber(trackingNumber)}>
                        <Copy size={13} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        {
                          backgroundColor:
                            status === 'HOLD'
                              ? '#e0f2fe'
                              : status === 'DISPUTED'
                              ? '#fee2e2'
                              : status === 'RELEASED' || status === 'COMPLETED'
                              ? '#dcfce7'
                              : '#fef3c7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeSmallText,
                          {
                            color:
                              status === 'HOLD'
                                ? '#0369a1'
                                : status === 'DISPUTED'
                                ? '#b91c1c'
                                : status === 'RELEASED' || status === 'COMPLETED'
                                ? '#15803d'
                                : '#b45309',
                          },
                        ]}
                      >
                        {status === 'HOLD'
                          ? 'এসক্রো হোল্ড'
                          : status === 'DISPUTED'
                          ? 'বিরোধপূর্ণ (Disputed)'
                          : status === 'RELEASED' || status === 'COMPLETED'
                          ? 'রিলিজ সম্পন্ন'
                          : 'অপেক্ষমান'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txnStatsRow}>
                    <View style={[styles.txnMiniBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.txnMiniBoxLabel, { color: colors.textMuted }]}>পরিমাণ</Text>
                      <Text style={[styles.txnMiniBoxValue, { color: '#059669' }]}>
                        ৳{amount.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>কমিশন: ৳{commission}</Text>
                    </View>

                    <View style={[styles.txnMiniBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.txnMiniBoxLabel, { color: colors.textMuted }]}>ভূমিকা</Text>
                      <Text style={[styles.txnMiniBoxValue, { color: colors.text }]}>
                        {isPayer ? 'টাকা প্রেরক' : 'টাকা প্রাপক'}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        {txn.messageType === 'PAY_REQUEST' ? 'পে রিকোয়েস্ট' : 'টাকা অনুরোধ'}
                      </Text>
                    </View>

                    <View style={[styles.txnMiniBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.txnMiniBoxLabel, { color: colors.textMuted }]}>বিবরণ</Text>
                      <Text style={[styles.txnMiniBoxValue, { color: colors.text }]} numberOfLines={1}>
                        {txn.notes || txn.reason || 'সার্ভিস'}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Contextual Actions */}
                  {status === 'REQUESTED' && (
                    <View style={styles.dealCardActionsRow}>
                      {isReceiver ? (
                        <>
                          <TouchableOpacity
                            disabled={actionLoading}
                            onPress={() => handleApproveRequest(txn.transactionId)}
                            style={[styles.dealBtn, { backgroundColor: '#10b981' }]}
                          >
                            <Check size={14} color="#ffffff" />
                            <Text style={styles.dealBtnText}>অনুমোদন ও হোল্ড</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={actionLoading}
                            onPress={() => handleDeclinePayRequest(txn.transactionId)}
                            style={[styles.dealBtn, { backgroundColor: '#fee2e2' }]}
                          >
                            <X size={14} color="#b91c1c" />
                            <Text style={[styles.dealBtnText, { color: '#b91c1c' }]}>প্রত্যাখ্যান</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          disabled={actionLoading}
                          onPress={() => handleDeclinePayRequest(txn.transactionId)}
                          style={[styles.dealBtn, { backgroundColor: colors.surfaceSecondary }]}
                        >
                          <X size={14} color={colors.textSecondary} />
                          <Text style={[styles.dealBtnText, { color: colors.textSecondary }]}>রিকোয়েস্ট বাতিল</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {status === 'HOLD' && (
                    <View style={styles.dealCardActionsRow}>
                      {isPayer ? (
                        <>
                          <TouchableOpacity
                            disabled={actionLoading}
                            onPress={() => handleReleasePayRequest(txn.transactionId)}
                            style={[styles.dealBtn, { backgroundColor: '#10b981' }]}
                          >
                            <CheckCircle2 size={14} color="#ffffff" />
                            <Text style={styles.dealBtnText}>💸 টাকা রিলিজ করুন</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={actionLoading}
                            onPress={() => setShowDisputeModal(txn)}
                            style={[styles.dealBtn, { backgroundColor: '#fef3c7' }]}
                          >
                            <AlertTriangle size={14} color="#b45309" />
                            <Text style={[styles.dealBtnText, { color: '#b45309' }]}>⚠️ ডিসপ্যুট</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            disabled={actionLoading}
                            onPress={() => handleRequestRelease(txn.transactionId)}
                            style={[styles.dealBtn, { backgroundColor: '#0284c7' }]}
                          >
                            <Bell size={14} color="#ffffff" />
                            <Text style={styles.dealBtnText}>🔔 রিলিজের অনুরোধ</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={actionLoading}
                            onPress={() => setShowDisputeModal(txn)}
                            style={[styles.dealBtn, { backgroundColor: '#fee2e2' }]}
                          >
                            <AlertTriangle size={14} color="#b91c1c" />
                            <Text style={[styles.dealBtnText, { color: '#b91c1c' }]}>⚠️ ডিসপ্যুট</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {status === 'DISPUTED' && (
                    <View style={styles.dealCardActionsRow}>
                      {isPayer && (
                        <TouchableOpacity
                          disabled={actionLoading}
                          onPress={() => handleWithdrawDispute(txn.transactionId)}
                          style={[styles.dealBtn, { backgroundColor: '#0284c7' }]}
                        >
                          <RotateCcw size={14} color="#ffffff" />
                          <Text style={styles.dealBtnText}>↩ প্রত্যাহার ও রিলিজ</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => setActiveTab('admin_calling')}
                        style={[styles.dealBtn, { backgroundColor: '#fef3c7' }]}
                      >
                        <ShieldAlert size={14} color="#b45309" />
                        <Text style={[styles.dealBtnText, { color: '#b45309' }]}>কল কিউ স্ট্যাটাস</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  // ---------------------------------------------------------------------------
  // 16. Render Tab 3: Rules Tab
  // ---------------------------------------------------------------------------
  const renderRulesTab = () => (
    <ScrollView contentContainerStyle={styles.tabScrollContent}>
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
            <ShieldCheck size={24} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              SafnexBD নিরাপদ এসক্রো ও লেনদেন নীতিমালা
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              উভয় পক্ষের আর্থিক সুরক্ষা ও শতভাগ স্বচ্ছতা বজায় রাখার জন্য আমাদের নীতিমালা
            </Text>
          </View>
        </View>
      </View>

      {/* 4 Phases */}
      <View style={{ gap: 10 }}>
        <Text style={[styles.groupHeading, { color: colors.textMuted }]}>
          চার-ধাপের এসক্রো প্রক্রিয়া (4-Phase Escrow Process)
        </Text>

        <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.phaseNumberBadge, { backgroundColor: '#fef3c7' }]}>
            <Text style={{ fontWeight: '900', color: '#b45309', fontSize: 13 }}>১</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ruleCardTitle, { color: colors.text }]}>লেনদেন প্রস্তাবনা (Requested Phase)</Text>
            <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
              প্রেরক বা প্রাপক যে কেউই প্রস্তাব পাঠাতে পারেন। এই ধাপে কারো ব্যালেন্স থেকে টাকা কাটা হয় না। প্রাপক শর্তাবলী দেখে 'অনুমোদন' করলে তবেই টাকা এসক্রো হোল্ডে জমা হয়।
            </Text>
          </View>
        </View>

        <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.phaseNumberBadge, { backgroundColor: '#e0f2fe' }]}>
            <Text style={{ fontWeight: '900', color: '#0369a1', fontSize: 13 }}>২</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ruleCardTitle, { color: colors.text }]}>সুরক্ষিত হোল্ড ব্যালেন্স (Escrow Hold Phase)</Text>
            <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
              টাকা হোল্ডে যাওয়ার পর প্রেরক বা প্রাপক কেউই সরাসরি টাকা তুলতে পারবেন না। কাজ বা পণ্য শতভাগ বুঝিয়ে না দেওয়া পর্যন্ত অর্থ কোম্পানির সুরক্ষিত অ্যাকাউন্টে লক থাকবে।
            </Text>
          </View>
        </View>

        <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.phaseNumberBadge, { backgroundColor: '#dcfce7' }]}>
            <Text style={{ fontWeight: '900', color: '#15803d', fontSize: 13 }}>৩</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ruleCardTitle, { color: colors.text }]}>মূল ব্যালেন্সে রিলিজ (Release Phase)</Text>
            <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
              কাজ বা ডেলিভারি সম্পন্ন হলে প্রেরক 'টাকা রিলিজ করুন' বাটনে চাপ দিলেই টাকা সাথে সাথে প্রাপকের মূল ব্যালেন্সে জমা হবে এবং প্রাপক তা উইথড্র করতে পারবেন।
            </Text>
          </View>
        </View>

        <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.phaseNumberBadge, { backgroundColor: '#fee2e2' }]}>
            <Text style={{ fontWeight: '900', color: '#b91c1c', fontSize: 13 }}>৪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.ruleCardTitle, { color: colors.text }]}>বিরোধ নিষ্পত্তি ও অ্যাডমিন কলিং কিউ (Dispute Queue)</Text>
            <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
              কাজে কোনো সমস্যা দেখা দিলে যেকোনো পক্ষ 'ডিসপ্যুট' করতে পারেন। সাথে সাথে কেসটি অ্যাডমিন প্যানেল কলিং কিউ-তে চলে যাবে। অ্যাডমিন চ্যাট অডিট করে ফয়সালা দেবেন।
            </Text>
          </View>
        </View>
      </View>

      {/* Commission */}
      <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Wallet size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>প্ল্যাটফর্ম কমিশন ও চার্জ</Text>
        </View>
        <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
          • প্রতিটি সফল লেনদেনে {txCommLabel} প্ল্যাটফর্ম ফি প্রযোজ্য, যা প্রস্তাব অনুমোদন করার সময় প্রেরকের অ্যাকাউন্ট থেকে কেটে নেওয়া হয়।
          {'\n'}• প্রস্তাব বাতিল বা প্রত্যাখ্যাত হলে কোনো ফি কাটা হয় না।
        </Text>
      </View>

      {/* Security Warnings */}
      <View style={[styles.cardContainer, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <AlertTriangle size={18} color="#b45309" />
          <Text style={[styles.sectionTitle, { color: '#b45309' }]}>সতর্কবার্তা ও নিয়ম লঙ্ঘন</Text>
        </View>
        <Text style={[styles.ruleCardText, { color: '#92400e' }]}>
          ১. SafnexBD চ্যাটের বাইরে সরাসরি পার্সোনাল বিকাশ বা নগদে লেনদেন করবেন না। বাইরের কোনো প্রতারণার দায় সেফনেক্সবিডি নেবে না।{'\n'}
          ২. সমস্ত কাজের ফাইল ও বার্তা এই চ্যাটেই রাখবেন। চ্যাট হিস্ট্রি অ্যাডমিন ডিসপ্যুট নিষ্পত্তির একমাত্র আইনি প্রমাণ।
        </Text>
      </View>

      {/* Return to Chat */}
      <TouchableOpacity
        style={[styles.returnChatBtn, { backgroundColor: colors.primary }]}
        onPress={() => setActiveTab('chat')}
      >
        <MessageSquare size={16} color="#ffffff" />
        <Text style={styles.returnChatBtnText}>💬 চ্যাটে ফিরে যান (Back to Chat)</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ---------------------------------------------------------------------------
  // 17. Render Tab 4: Admin Calling Tab
  // ---------------------------------------------------------------------------
  const renderAdminCallingTab = () => {
    const disputedTxns = conversationTransactions.filter((t) => t.status === 'DISPUTED');

    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent}>
        {/* Header */}
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
              <ShieldAlert size={24} color="#b45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Admin Calling Queue & Dispute Desk
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                অ্যাডমিন মধ্যস্থতা, বিরোধ নিষ্পত্তি ও সরাসরি কলিং কিউ মনিটর
              </Text>
            </View>
          </View>
        </View>

        {/* Status Banner */}
        {hasDispute ? (
          <View style={[styles.cardContainer, { backgroundColor: '#fff1f2', borderColor: '#fecdd3' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.pulsingDot} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#be123c' }}>
                সক্রিয় ডিসপ্যুট পর্যবেক্ষণ চলছে (Active Dispute)
              </Text>
            </View>
            <Text style={[styles.ruleCardText, { color: '#9f1239', marginTop: 4 }]}>
              এই চ্যাটের বিরোধপূর্ণ লেনদেনটি বর্তমানে অ্যাডমিন প্যানেল কলিং কিউ (/admin/calling-queue)-তে তালিকাভুক্ত রয়েছে। অ্যাডমিন টিম উভয় পক্ষের বার্তা ও কাজ পর্যালোচনা করছেন।
            </Text>
          </View>
        ) : (
          <View style={[styles.cardContainer, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#059669" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#065f46' }}>
                কোনো সক্রিয় বিরোধ নেই (No Active Disputes)
              </Text>
            </View>
            <Text style={[styles.ruleCardText, { color: '#047857', marginTop: 4 }]}>
              আপনার এই চ্যাটে বর্তমানে কোনো অমীমাংসিত অভিযোগ নেই। সমস্ত লেনদেন সেফনেক্সবিডি নিরাপদ এসক্রো কাঠামোর অধীনে স্বাভাবিকভাবে চলমান রয়েছে।
            </Text>
          </View>
        )}

        {/* Disputed Transaction Details */}
        {disputedTxns.map((dt) => {
          const isPayer = dt.senderId === user?.id || dt.sender?.id === user?.id;

          return (
            <View
              key={dt.transactionId || dt.id}
              style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: '#f87171' }]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#b91c1c' }}>
                  বিরোধপূর্ণ লেনদেন বিবরণী
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                  {dt.trackingNumber || 'TXN-PENDING'}
                </Text>
              </View>

              <View style={styles.txnStatsRow}>
                <View style={[styles.txnMiniBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.txnMiniBoxLabel, { color: colors.textMuted }]}>পরিমাণ</Text>
                  <Text style={[styles.txnMiniBoxValue, { color: colors.text }]}>
                    ৳{Number(dt.amount || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.txnMiniBox, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.txnMiniBoxLabel, { color: colors.textMuted }]}>কারণ</Text>
                  <Text style={[styles.txnMiniBoxValue, { color: '#b91c1c' }]} numberOfLines={1}>
                    {dt.disputeReason || 'বিরোধ দাখিল'}
                  </Text>
                </View>
              </View>

              {Boolean(dt.disputeDetails) && (
                <View style={[styles.txnMiniBox, { backgroundColor: colors.surfaceSecondary, width: '100%' }]}>
                  <Text style={[styles.txnMiniBoxLabel, { color: colors.textMuted }]}>অভিযোগের বিবরণ:</Text>
                  <Text style={{ fontSize: 12, color: colors.text, fontStyle: 'italic', marginTop: 2 }}>
                    "{dt.disputeDetails}"
                  </Text>
                </View>
              )}

              {/* What happens next */}
              <View style={[styles.txnMiniBox, { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1, width: '100%' }]}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#b45309' }}>
                  🛡️ অ্যাডমিন পরবর্তী পদক্ষেপসমূহ:
                </Text>
                <Text style={{ fontSize: 11, color: '#92400e', marginTop: 4, lineHeight: 16 }}>
                  ১. অ্যাডমিন এই চ্যাটের বার্তা ও ফাইল অডিট করবেন।{'\n'}
                  ২. প্রয়োজনে উভয় পক্ষকে সরাসরি ফোন করে শুনবেন।{'\n'}
                  ৩. প্রেরককে রিফান্ড বা প্রাপককে রিলিজ করে চূড়ান্ত ফয়সালা দেবেন।
                </Text>
              </View>

              {isPayer && (
                <TouchableOpacity
                  disabled={actionLoading}
                  onPress={() => handleWithdrawDispute(dt.transactionId)}
                  style={[styles.dealBtn, { backgroundColor: '#0284c7', height: 42, width: '100%' }]}
                >
                  <RotateCcw size={16} color="#ffffff" />
                  <Text style={styles.dealBtnText}>↩ ডিসপ্যুট প্রত্যাহার ও রিলিজ করুন</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Benefits Grid */}
        <View style={[styles.cardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Scale size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>অ্যাডমিন মধ্যস্থতা ব্যবস্থার সুবিধা</Text>
          </View>
          <View style={{ gap: 8 }}>
            <View style={[styles.ruleCard, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 16 }}>📞</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ruleCardTitle, { color: colors.text }]}>সরাসরি শুনানি</Text>
                <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
                  বিরোধ দেখা দিলে অ্যাডমিন প্যানেল থেকে উভয় পক্ষের সাথে সমন্বয় করা হয়।
                </Text>
              </View>
            </View>

            <View style={[styles.ruleCard, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 16 }}>⚖️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ruleCardTitle, { color: colors.text }]}>নিরপেক্ষ ফয়সালা</Text>
                <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
                  চ্যাট রেকর্ড ও প্রমাণের ভিত্তিতে নিরপেক্ষ সিদ্ধান্ত নেওয়া হয়।
                </Text>
              </View>
            </View>

            <View style={[styles.ruleCard, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ fontSize: 16 }}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ruleCardTitle, { color: colors.text }]}>জিরো ব্যালেন্স রিস্ক</Text>
                <Text style={[styles.ruleCardText, { color: colors.textSecondary }]}>
                  বিরোধ নিষ্পত্তি না হওয়া পর্যন্ত অর্থ এসক্রো অ্যাকাউন্টে শতভাগ নিরাপদ থাকে।
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.returnChatBtn, { flex: 1, backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} color="#ffffff" />
            <Text style={styles.returnChatBtnText}>💬 চ্যাটে ফিরে যান</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.returnChatBtn, { flex: 1, backgroundColor: colors.surfaceSecondary }]}
            onPress={() => setActiveTab('transaction')}
          >
            <Wallet size={16} color={colors.text} />
            <Text style={[styles.returnChatBtnText, { color: colors.text }]}>💳 লেনদেন তালিকা</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 1. Header with Partner Name and Handle (@uniqueUserId) */}
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: topPadding,
            height: 58 + topPadding,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Partner Avatar & Info */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (resolvedPartnerId) navigation.navigate('UsersSearch');
            }}
            style={styles.partnerInfoRow}
          >
            {partnerAvatar ? (
              <Image source={{ uri: partnerAvatar }} style={styles.partnerAvatar as any} />
            ) : (
              <View style={[styles.partnerAvatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.partnerAvatarText}>
                  {partnerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.partnerTextCol}>
              <Text style={[styles.partnerNameText, { color: colors.text }]} numberOfLines={1}>
                {partnerName}
              </Text>
              <Text style={[styles.partnerHandleText, { color: colors.primary }]}>
                @{partnerHandle}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3-Dots Options Menu */}
        <TouchableOpacity
          onPress={() => setOptionsModalVisible(true)}
          style={styles.headerRightBtn}
        >
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 2. Sleek 4 Header Navigation Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('chat')}
          style={[
            styles.tabItem,
            activeTab === 'chat' && { backgroundColor: colors.surfaceSecondary, borderRadius: 10 },
          ]}
        >
          <MessageSquare size={15} color={activeTab === 'chat' ? colors.primary : colors.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'chat' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'chat' ? '800' : '600' },
            ]}
          >
            চ্যাট
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('transaction')}
          style={[
            styles.tabItem,
            activeTab === 'transaction' && { backgroundColor: colors.surfaceSecondary, borderRadius: 10 },
          ]}
        >
          <Wallet size={15} color={activeTab === 'transaction' ? colors.primary : colors.textMuted} />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'transaction' ? colors.primary : colors.textMuted,
                fontWeight: activeTab === 'transaction' ? '800' : '600',
              },
            ]}
          >
            লেনদেন
          </Text>
          {conversationTransactions.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.tabBadgeText}>{conversationTransactions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('rules')}
          style={[
            styles.tabItem,
            activeTab === 'rules' && { backgroundColor: colors.surfaceSecondary, borderRadius: 10 },
          ]}
        >
          <FileText size={15} color={activeTab === 'rules' ? colors.primary : colors.textMuted} />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'rules' ? colors.primary : colors.textMuted, fontWeight: activeTab === 'rules' ? '800' : '600' },
            ]}
          >
            নিয়মাবলী
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('admin_calling')}
          style={[
            styles.tabItem,
            activeTab === 'admin_calling' && { backgroundColor: colors.surfaceSecondary, borderRadius: 10 },
          ]}
        >
          <ShieldAlert
            size={15}
            color={activeTab === 'admin_calling' ? '#f59e0b' : hasDispute ? '#ef4444' : colors.textMuted}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'admin_calling' ? '#f59e0b' : hasDispute ? '#ef4444' : colors.textMuted,
                fontWeight: activeTab === 'admin_calling' ? '800' : '600',
              },
            ]}
          >
            কল অ্যাডমিন
          </Text>
          {hasDispute && <View style={[styles.tabBadge, { backgroundColor: '#ef4444', width: 8, height: 8, paddingHorizontal: 0 }]} />}
        </TouchableOpacity>
      </View>

      {/* 3. Tab Contents */}
      {activeTab === 'transaction' ? (
        renderTransactionsTab()
      ) : activeTab === 'rules' ? (
        renderRulesTab()
      ) : activeTab === 'admin_calling' ? (
        renderAdminCallingTab()
      ) : (
        /* TAB 1: LIVE CHAT STREAM */
        <>
          {/* Messages Stream */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => (item.id ? `${item.id}_${index}` : `msg_${index}`)}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={styles.messageList}
            />
          )}

          {/* Selected Image Preview before sending */}
          {selectedImage && (
            <View style={[styles.imagePreviewBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewThumbnail} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
                  {selectedImage.fileName || 'ছবি সংযুক্ত করা হয়েছে'}
                </Text>
                <Text style={[styles.previewHint, { color: colors.textMuted }]}>পাঠাতে সেন্ড বাটনে চাপুন</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removePreviewBtn}>
                <X size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions Toolbar (Photo, Pay Money, Request Money) */}
          <View style={[styles.quickActionsToolbar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setShowImageSourceModal(true)}
            >
              <ImageIcon size={16} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>ছবি পাঠান</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#ecfdf5' }]}
              onPress={() => setShowPayModal(true)}
            >
              <ArrowUpRight size={16} color="#059669" />
              <Text style={[styles.quickActionText, { color: '#059669' }]}>টাকা পাঠান</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: '#f0f9ff' }]}
              onPress={() => setShowRequestModal(true)}
            >
              <ArrowDownLeft size={16} color="#0284c7" />
              <Text style={[styles.quickActionText, { color: '#0284c7' }]}>টাকা চান</Text>
            </TouchableOpacity>
          </View>

          {/* Message Input Bar */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: bottomPadding,
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
              placeholder="মেসেজ লিখুন..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={(!inputText.trim() && !selectedImage) || sendingAttachment}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: (inputText.trim() || selectedImage) ? colors.primary : colors.surfaceSecondary,
                },
              ]}
            >
              {sendingAttachment ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={18} color={(inputText.trim() || selectedImage) ? '#ffffff' : colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Image Source Selection Modal (Camera vs Gallery) */}
      <Modal visible={showImageSourceModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageSourceModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>ছবি সংযুক্ত করুন</Text>

            <TouchableOpacity
              style={[styles.sheetItem, { borderColor: colors.border }]}
              onPress={() => handlePickImage(false)}
            >
              <ImageIcon size={22} color={colors.primary} />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>গ্যালারি থেকে ছবি নিন</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, { borderColor: colors.border }]}
              onPress={() => handlePickImage(true)}
            >
              <Camera size={22} color="#059669" />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>ক্যামেরা দিয়ে ছবি তুলুন</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setShowImageSourceModal(false)}
            >
              <Text style={[styles.sheetCancelText, { color: colors.text }]}>বাতিল</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Lightbox Modal (Fullscreen Image Viewer) */}
      <Modal visible={Boolean(lightboxImage)} transparent animationType="fade">
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity
            style={styles.lightboxCloseBtn}
            onPress={() => setLightboxImage(null)}
          >
            <X size={28} color="#ffffff" />
          </TouchableOpacity>
          {lightboxImage && (
            <Image
              source={{ uri: lightboxImage }}
              style={styles.lightboxFullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Pay Money Modal (টাকা পাঠান / Escrow Hold) */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.dealModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ArrowUpRight size={22} color="#059669" />
                <Text style={[styles.modalTitleText, { color: colors.text }]}>টাকা পাঠান (Escrow Pay)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelpText, { color: colors.textSecondary }]}>
              টাকা সাথে সাথে সেলার পাবে না, নিরাপদে সেফনেক্সবিডি এসক্রো হোল্ডে আটকে থাকবে। সেলার কাজ বুঝিয়ে দেওয়ার পর আপনি রিলিজ করবেন।
            </Text>

            <Text style={[styles.modalInputLabel, { color: colors.text }]}>পেমেন্টের পরিমাণ (টাকা)</Text>
            <TextInput
              style={[styles.modalInputField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
              autoFocus
            />

            <Text style={[styles.modalInputLabel, { color: colors.text }]}>উদ্দেশ্য / নোট</Text>
            <TextInput
              style={[styles.modalInputField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              placeholder="যেমন: ওয়েবসাইট ডেভেলপমেন্ট, পেপ্যাল ডলার"
              placeholderTextColor={colors.textMuted}
              value={payNotes}
              onChangeText={setPayNotes}
            />

            {parseFloat(payAmount) > 0 && (
              <View style={[styles.feePreviewBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>মূল পরিমাণ:</Text>
                  <Text style={[styles.previewValue, { color: colors.text }]}>৳{parseFloat(payAmount).toLocaleString()}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>প্ল্যাটফর্ম কমিশন ({txCommLabel}):</Text>
                  <Text style={[styles.previewValue, { color: '#ef4444' }]}>
                    ৳{calculateCommission(parseFloat(payAmount)).toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 4 }]}>
                  <Text style={[styles.previewLabel, { color: colors.text, fontWeight: '800' }]}>মোট ব্যালেন্স প্রয়োজন:</Text>
                  <Text style={[styles.previewValue, { color: '#059669', fontWeight: '900' }]}>
                    ৳{(parseFloat(payAmount) + calculateCommission(parseFloat(payAmount))).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: '#059669', opacity: submittingPay ? 0.7 : 1 }]}
              onPress={handleSendPayMoney}
              disabled={submittingPay}
            >
              {submittingPay ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>টাকা এসক্রো হোল্ডে পাঠান</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Request Money Modal (টাকা চান / Receive Request) */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.dealModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ArrowDownLeft size={22} color="#0284c7" />
                <Text style={[styles.modalTitleText, { color: colors.text }]}>টাকা চান (Request Money)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelpText, { color: colors.textSecondary }]}>
              অপর পক্ষের কাছে পেমেন্ট চেয়ে রিকোয়েস্ট পাঠান। উনি চ্যাটের ভেতরেই টাকা অনুমোদন করে এসক্রো হোল্ডে জমা রাখতে পারবেন।
            </Text>

            <Text style={[styles.modalInputLabel, { color: colors.text }]}>রিকোয়েস্টের পরিমাণ (টাকা)</Text>
            <TextInput
              style={[styles.modalInputField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={requestAmount}
              onChangeText={setRequestAmount}
              autoFocus
            />

            <Text style={[styles.modalInputLabel, { color: colors.text }]}>কাজের বিবরণ / কারণ</Text>
            <TextInput
              style={[styles.modalInputField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              placeholder="যেমন: গ্রাফিক্স ডিজাইন ফি"
              placeholderTextColor={colors.textMuted}
              value={requestReason}
              onChangeText={setRequestReason}
            />

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: '#0284c7', opacity: submittingRequest ? 0.7 : 1 }]}
              onPress={handleSendRequestMoney}
              disabled={submittingRequest}
            >
              {submittingRequest ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>টাকার রিকোয়েস্ট পাঠান</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={Boolean(showDisputeModal)} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.dealModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={22} color="#ef4444" />
                <Text style={[styles.modalTitleText, { color: colors.text }]}>বিরোধ দাখিল করুন (Dispute)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDisputeModal(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelpText, { color: colors.textSecondary }]}>
              যদি সেলার কাজ না দেয় বা বায়ার সহযোগিতা না করে, তবে ডিসপ্যুট দাখিল করুন। অ্যাডমিন তদন্ত করে সমাধান করবেন।
            </Text>

            <Text style={[styles.modalInputLabel, { color: colors.text }]}>বিরোধের কারণ</Text>
            <TextInput
              style={[styles.modalInputField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />

            <Text style={[styles.modalInputLabel, { color: colors.text }]}>বিস্তারিত বিবরণ</Text>
            <TextInput
              style={[styles.modalInputField, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text, height: 80 }]}
              placeholder="সমস্যার সুনির্দিষ্ট বিবরণ লিখুন..."
              placeholderTextColor={colors.textMuted}
              value={disputeDetails}
              onChangeText={setDisputeDetails}
              multiline
            />

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: '#ef4444', opacity: submittingDispute ? 0.7 : 1 }]}
              onPress={handleSubmitDispute}
              disabled={submittingDispute}
            >
              {submittingDispute ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>অ্যাডমিন ডিসপ্যুট দাখিল করুন</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Options Menu Modal */}
      <Modal visible={optionsModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>কথোপকথন অপশন</Text>

            <TouchableOpacity
              style={[styles.sheetItem, { borderColor: colors.border }]}
              onPress={() => {
                setOptionsModalVisible(false);
                if (resolvedPartnerId) navigation.navigate('UsersSearch');
              }}
            >
              <MessageSquare size={18} color={colors.primary} />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>পার্টনার প্রোফাইল খুঁজুন</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, { borderColor: colors.border }]}
              onPress={() => {
                setOptionsModalVisible(false);
                setActiveTab('rules');
              }}
            >
              <ShieldCheck size={18} color="#059669" />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>এসক্রো নিরাপত্তা নিয়মাবলী</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, { borderColor: colors.border }]}
              onPress={() => {
                setOptionsModalVisible(false);
                setActiveTab('admin_calling');
              }}
            >
              <ShieldAlert size={18} color="#f59e0b" />
              <Text style={[styles.sheetItemText, { color: colors.text }]}>কল অ্যাডমিন / ডিসপ্যুট ডেস্ক</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setOptionsModalVisible(false)}
            >
              <Text style={[styles.sheetCancelText, { color: colors.text }]}>বন্ধ করুন</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  partnerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partnerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  partnerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  partnerTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  partnerNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  partnerHandleText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  headerRightBtn: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
  },
  tabText: {
    fontSize: 12,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  msgRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: SCREEN_WIDTH * 0.78,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  imageBubbleContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
  },
  bubbleImage: {
    width: SCREEN_WIDTH * 0.65,
    height: 180,
    borderRadius: 8,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  dealMsgContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  dealMsgCard: {
    width: '94%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dealCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dealCardAmountBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dealCardAmountText: {
    fontSize: 24,
    fontWeight: '900',
  },
  dealCardSubText: {
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  },
  dealCardMetaBox: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  dealCardNotes: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  dealCardTrackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealCardTrackingText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  dealCardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dealBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dealBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  imagePreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  previewThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  previewName: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewHint: {
    fontSize: 11,
    marginTop: 2,
  },
  removePreviewBtn: {
    padding: 6,
  },
  quickActionsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  tabScrollContent: {
    padding: 14,
    gap: 14,
    paddingBottom: 40,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  txTopActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  txTopActionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  txTopActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: (SCREEN_WIDTH - 28 - 8) / 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  txnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  txnTrackingText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  txnStatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  txnMiniBox: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
  },
  txnMiniBoxLabel: {
    fontSize: 10,
  },
  txnMiniBoxValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  phaseNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  ruleCardText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  returnChatBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  returnChatBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  sheetItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sheetCancelBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  lightboxFullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  dealModalCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalHelpText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInputField: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 12,
  },
  feePreviewBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  previewLabel: {
    fontSize: 12,
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
