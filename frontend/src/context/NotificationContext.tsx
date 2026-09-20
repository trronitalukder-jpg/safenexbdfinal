'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getSocket } from '@/lib/socket';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UserNotificationItem {
  id: string;
  type: 'message' | 'pay_request' | 'receive_request' | 'hold_approved' | 'release_request' | 'release_approve' | 'dispute' | 'withdraw' | 'general';
  title: string;
  message: string;
  url?: string;
  createdAt: string;
  read: boolean;
  metadata?: any;
}

interface NotificationContextType {
  permission: NotificationPermissionState;
  soundEnabled: boolean;
  toggleSound: () => void;
  requestPermission: () => Promise<NotificationPermissionState>;
  sendNotification: (title: string, options?: NotificationOptions, targetUrl?: string, type?: UserNotificationItem['type'], metadata?: any) => Promise<void>;
  playNotificationSound: () => void;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  notifications: UserNotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  permission: 'default',
  soundEnabled: true,
  toggleSound: () => {},
  requestPermission: async () => 'default',
  sendNotification: async () => {},
  playNotificationSound: () => {},
  isBannerDismissed: false,
  dismissBanner: () => {},
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('safnexbd_sound_alerts') || localStorage.getItem('safnexbd_sound_alerts');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const dismissedUntil =
        localStorage.getItem('safnexbd_notif_banner_dismissed_until') ||
        localStorage.getItem('safnexbd_notif_banner_dismissed_until');
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return true;
      }
    }
    return false;
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play synthetic pleasant chime without external asset dependency
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      // Note 1: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: B5 (987.77Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (err) {
      console.debug('Audio chime error:', err);
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('safnexbd_sound_alerts', String(next));
      }
      return next;
    });
  }, []);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    if (typeof window !== 'undefined') {
      const until = Date.now() + 24 * 60 * 60 * 1000; // 24 hours snooze
      localStorage.setItem('safnexbd_notif_banner_dismissed_until', until.toString());
    }
  }, []);

  // Check initial permission
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        setIsBannerDismissed(true);
        // Play confirmation sound
        playNotificationSound();
        // Send welcoming notification
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification('SafnexBD নোটিফিকেশন চালু হয়েছে', {
            body: 'এখন থেকে নতুন চ্যাট মেসেজ ও উইথড্র আপডেট সাথে সাথে পাবেন।',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: { url: '/dashboard' },
          });
        } else {
          new Notification('SafnexBD নোটিফিকেশন চালু হয়েছে', {
            body: 'এখন থেকে নতুন চ্যাট মেসেজ ও উইথড্র আপডেট সাথে সাথে পাবেন।',
            icon: '/icon-192.png',
          });
        }
      }
      return res;
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return 'denied';
    }
  }, [playNotificationSound]);

  // Persistent User Notifications (backed by localStorage per user)
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) {
      setNotifications([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`safnexbd_notifs_${user.id}`);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse user notifications', e);
    }
  }, [user?.id]);

  const addNotification = useCallback(
    (notif: Omit<UserNotificationItem, 'id' | 'createdAt' | 'read'>) => {
      const newItem: UserNotificationItem = {
        ...notif,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => {
        // Prevent duplicate spam within 3 seconds for identical title & url
        const isDuplicate = prev.some(
          (p) =>
            p.title === newItem.title &&
            p.message === newItem.message &&
            Date.now() - new Date(p.createdAt).getTime() < 3000,
        );
        if (isDuplicate) return prev;

        const updated = [newItem, ...prev].slice(0, 60);
        if (typeof window !== 'undefined' && user?.id) {
          try {
            localStorage.setItem(`safnexbd_notifs_${user.id}`, JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    },
    [user?.id],
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        if (typeof window !== 'undefined' && user?.id) {
          try {
            localStorage.setItem(`safnexbd_notifs_${user.id}`, JSON.stringify(updated));
          } catch (e) {}
        }
        return updated;
      });
    },
    [user?.id],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      if (typeof window !== 'undefined' && user?.id) {
        try {
          localStorage.setItem(`safnexbd_notifs_${user.id}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  }, [user?.id]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (typeof window !== 'undefined' && user?.id) {
      try {
        localStorage.removeItem(`safnexbd_notifs_${user.id}`);
      } catch (e) {}
    }
  }, [user?.id]);

  // Send browser notification with target click URL and record in in-app notification list
  const sendNotification = useCallback(
    async (
      title: string,
      options?: NotificationOptions,
      targetUrl = '/dashboard',
      type: UserNotificationItem['type'] = 'general',
      metadata?: any,
    ) => {
      // 1. Always record in-app notification history
      addNotification({
        type,
        title,
        message: typeof options?.body === 'string' ? options.body : '',
        url: targetUrl,
        metadata,
      });

      // 2. Play sound alert
      playNotificationSound();

      // 3. Dispatch browser push notification if supported and granted
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      try {
        const notifOptions: NotificationOptions = {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
          data: {
            url: targetUrl,
            ...(options?.data || {}),
          },
        };

        // Try service worker first for mobile & background support
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, notifOptions);
            return;
          }
        }

        // Fallback to Window Notification
        const notif = new Notification(title, notifOptions);
        notif.onclick = (e) => {
          e.preventDefault();
          window.focus();
          router.push(targetUrl);
          notif.close();
        };
      } catch (err) {
        console.error('Error dispatching browser notification:', err);
      }
    },
    [addNotification, playNotificationSound, router],
  );

  // Real-time socket listener for chat messages and withdrawals
  useEffect(() => {
    if (!user?.id) return;

    const socket = getSocket();

    // Join personal user room on socket
    socket.emit('user:join', { userId: user.id });

    // Handle reconnect to re-join room
    const handleConnect = () => {
      socket.emit('user:join', { userId: user.id });
    };

    socket.on('connect', handleConnect);

    // 1. Listen for new chat messages from other users
    const handleChatMessage = (data: any) => {
      if (!data) return;

      // Do not notify self
      if (data.senderId === user.id) return;

      const senderName = data.senderName || 'ব্যবহারকারী';
      let snippet = data.content || '';

      if (data.messageType === 'PAY_REQUEST') {
        snippet = 'টাকা প্রদানের অনুরোধ (Pay Request) পাঠিয়েছেন';
      } else if (data.messageType === 'RECEIVE_REQUEST') {
        snippet = 'টাকা গ্রহণের অনুরোধ (Receive Request) পাঠিয়েছেন';
      } else if (data.messageType === 'IMAGE') {
        snippet = 'একটি ছবি পাঠিয়েছেন 📷';
      } else if (data.messageType === 'FILE') {
        snippet = 'একটি ফাইল সংযুক্ত করেছেন 📎';
      }

      if (snippet.length > 80) {
        snippet = snippet.substring(0, 80) + '...';
      }

      const notifTitle = `${senderName} আপনাকে মেসেজ পাঠিয়েছেন`;
      const notifUrl = `/dashboard/chat?conversationId=${data.conversationId}`;

      sendNotification(
        notifTitle,
        {
          body: snippet,
          icon: data.senderAvatar || '/icon-192.png',
          tag: `chat-${data.conversationId}`,
        },
        notifUrl,
        'message',
        data,
      );
    };

    // 2. Listen for pay request notifications
    const handlePayRequestNotification = (data: any) => {
      if (!data) return;
      sendNotification(
        data.title || '💸 নতুন পে-রিকোয়েস্ট (Pay Request)',
        {
          body: data.message || `আপনাকে ৳${data.amount || ''} এর পে-রিকোয়েস্ট পাঠানো হয়েছে।`,
          icon: data.senderAvatar || '/icon-192.png',
          tag: `pay-${data.transactionId || Date.now()}`,
        },
        data.conversationId ? `/dashboard/chat?conversationId=${data.conversationId}` : '/dashboard/chat',
        'pay_request',
        data,
      );
    };

    // 3. Listen for receive request notifications
    const handleReceiveRequestNotification = (data: any) => {
      if (!data) return;
      sendNotification(
        data.title || '💰 নতুন পেমেন্ট রিকোয়েস্ট (Money Request)',
        {
          body: data.message || `আপনার কাছে ৳${data.amount || ''} পেমেন্টের অনুরোধ জানানো হয়েছে।`,
          icon: data.requesterAvatar || '/icon-192.png',
          tag: `receive-${data.transactionId || Date.now()}`,
        },
        data.conversationId ? `/dashboard/chat?conversationId=${data.conversationId}` : '/dashboard/chat',
        'receive_request',
        data,
      );
    };

    // 4. Listen for escrow hold approved notifications
    const handleHoldApprovedNotification = (data: any) => {
      if (!data) return;
      sendNotification(
        data.title || '🔒 এসক্রো লক সক্রিয় (Escrow Hold Active)',
        {
          body: data.message || `৳${data.amount || ''} সেফনেক্সবিডি এসক্রো হোল্ডে লক করা হয়েছে।`,
          icon: '/icon-192.png',
          tag: `hold-${data.transactionId || Date.now()}`,
        },
        data.conversationId ? `/dashboard/chat?conversationId=${data.conversationId}` : '/dashboard/chat',
        'hold_approved',
        data,
      );
    };

    // 5. Listen for release request notifications
    const handleReleaseRequestNotification = (data: any) => {
      if (!data) return;
      sendNotification(
        data.title || '🔔 রিলিজের অনুরোধ (Release Request)',
        {
          body: data.message || 'কাজ সম্পন্ন হয়েছে, পেমেন্ট রিলিজ করার অনুরোধ এসেছে।',
          icon: '/icon-192.png',
          tag: `rel-req-${data.transactionId || Date.now()}`,
        },
        data.conversationId ? `/dashboard/chat?conversationId=${data.conversationId}` : '/dashboard/chat',
        'release_request',
        data,
      );
    };

    // 6. Listen for release approve notifications
    const handleReleaseApproveNotification = (data: any) => {
      if (!data) return;
      sendNotification(
        data.title || '🎉 পেমেন্ট রিলিজ সম্পন্ন!',
        {
          body: data.message || `৳${data.amount || ''} মূল ব্যালেন্সে যুক্ত হয়েছে।`,
          icon: '/icon-192.png',
          tag: `rel-app-${data.transactionId || Date.now()}`,
        },
        data.conversationId ? `/dashboard/chat?conversationId=${data.conversationId}` : '/dashboard/wallet',
        'release_approve',
        data,
      );
    };

    // 7. Listen for dispute notifications
    const handleDisputeNotification = (data: any) => {
      if (!data) return;
      sendNotification(
        data.title || '⚠️ লেনদেনে বিরোধ (Dispute)',
        {
          body: data.message || 'লেনদেনে বিরোধ উত্থাপিত হয়েছে এবং অ্যাডমিন কিউতে পাঠানো হয়েছে।',
          icon: '/icon-192.png',
          tag: `dispute-${data.transactionId || Date.now()}`,
        },
        data.conversationId ? `/dashboard/chat?conversationId=${data.conversationId}` : '/dashboard/disputes',
        'dispute',
        data,
      );
    };

    // 8. Listen for withdrawal updates (submission, approval, rejection)
    const handleWithdrawNotification = (data: any) => {
      if (!data) return;

      const title = data.title || 'উইথড্র আপডেট';
      const message = data.message || 'আপনার উত্তোলন স্ট্যাটাস পরিবর্তিত হয়েছে।';
      const notifUrl = '/dashboard/wallet';

      sendNotification(
        title,
        {
          body: message,
          icon: '/icon-192.png',
          tag: `withdraw-${data.id || Date.now()}`,
        },
        notifUrl,
        'withdraw',
        data,
      );
    };

    socket.on('notification:message', handleChatMessage);
    socket.on('notification:pay_request', handlePayRequestNotification);
    socket.on('notification:receive_request', handleReceiveRequestNotification);
    socket.on('notification:hold_approved', handleHoldApprovedNotification);
    socket.on('notification:release_request', handleReleaseRequestNotification);
    socket.on('notification:release_approve', handleReleaseApproveNotification);
    socket.on('notification:dispute', handleDisputeNotification);
    socket.on('notification:withdraw', handleWithdrawNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:message', handleChatMessage);
      socket.off('notification:pay_request', handlePayRequestNotification);
      socket.off('notification:receive_request', handleReceiveRequestNotification);
      socket.off('notification:hold_approved', handleHoldApprovedNotification);
      socket.off('notification:release_request', handleReleaseRequestNotification);
      socket.off('notification:release_approve', handleReleaseApproveNotification);
      socket.off('notification:dispute', handleDisputeNotification);
      socket.off('notification:withdraw', handleWithdrawNotification);
    };
  }, [user?.id, sendNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        permission,
        soundEnabled,
        toggleSound,
        requestPermission,
        sendNotification,
        playNotificationSound,
        isBannerDismissed,
        dismissBanner,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

