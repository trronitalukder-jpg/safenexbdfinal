'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getSocket } from '@/lib/socket';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface NotificationContextType {
  permission: NotificationPermissionState;
  soundEnabled: boolean;
  toggleSound: () => void;
  requestPermission: () => Promise<NotificationPermissionState>;
  sendNotification: (title: string, options?: NotificationOptions, targetUrl?: string) => Promise<void>;
  playNotificationSound: () => void;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
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
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
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

  // Send browser notification with target click URL
  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions, targetUrl = '/dashboard') => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;

      if (Notification.permission !== 'granted') return;

      playNotificationSound();

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
    [playNotificationSound, router],
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
      );
    };

    // 2. Listen for withdrawal updates (submission, approval, rejection)
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
      );
    };

    socket.on('notification:message', handleChatMessage);
    socket.on('notification:withdraw', handleWithdrawNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification:message', handleChatMessage);
      socket.off('notification:withdraw', handleWithdrawNotification);
    };
  }, [user?.id, sendNotification]);

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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

