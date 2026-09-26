'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface PwaContextType {
  isInstalled: boolean;
  canInstall: boolean;
  isInstallModalOpen: boolean;
  isIos: boolean;
  openInstallModal: () => void;
  closeInstallModal: (snooze?: boolean) => void;
  installApp: () => Promise<void>;
  triggerPostRegistrationPrompt: (delaySeconds?: number) => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstalled: false,
  canInstall: false,
  isInstallModalOpen: false,
  isIos: false,
  openInstallModal: () => {},
  closeInstallModal: () => {},
  installApp: async () => {},
  triggerPostRegistrationPrompt: () => {},
});

const SNOOZE_HOURS = 24;

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  // Check if app is installed
  const checkInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false;

    // Check standalone display mode (Android/Chrome/Desktop PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Check iOS standalone mode
    const isIosStandalone = (window.navigator as any).standalone === true;
    // Check local storage record
    const storedInstalled =
      localStorage.getItem('safnexbd_app_installed') === 'true' ||
      localStorage.getItem('safnexbd_app_installed') === 'true';

    return isStandalone || isIosStandalone || storedInstalled;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Register service worker
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.debug('ServiceWorker registration note:', err);
      });
    }

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Initial install check
    const installed = checkInstalled();
    setIsInstalled(installed);

    // 4. Capture native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic browser banner
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
      localStorage.setItem('safnexbd_app_installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    if (isIosDevice && !installed) {
      setCanInstall(true);
    }

    // 6. Listen for custom post-registration install trigger
    const handleRegistrationComplete = (e: any) => {
      const delay = (e.detail?.delaySeconds ?? 10) * 1000;
      setTimeout(() => {
        if (!checkInstalled()) {
          setIsInstallModalOpen(true);
        }
      }, delay);
    };
    window.addEventListener('safnex:registration_completed', handleRegistrationComplete);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('safnex:registration_completed', handleRegistrationComplete);
    };
  }, [checkInstalled]);

  const openInstallModal = useCallback(() => {
    setIsInstallModalOpen(true);
  }, []);

  const closeInstallModal = useCallback((snooze = true) => {
    setIsInstallModalOpen(false);
    if (snooze && typeof window !== 'undefined') {
      const snoozeUntil = Date.now() + SNOOZE_HOURS * 60 * 60 * 1000;
      localStorage.setItem('safnexbd_install_snoozed_until', snoozeUntil.toString());
    }
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          localStorage.setItem('safnexbd_app_installed', 'true');
          setIsInstallModalOpen(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    } else {
      // For iOS or browsers without native prompt support, open the modal with instructions
      setIsInstallModalOpen(true);
    }
  }, [deferredPrompt]);

  const triggerPostRegistrationPrompt = useCallback((delaySeconds = 10) => {
    if (typeof window === 'undefined') return;
    const delay = Math.max(1, delaySeconds) * 1000;
    setTimeout(() => {
      if (!checkInstalled()) {
        setIsInstallModalOpen(true);
      }
    }, delay);
  }, [checkInstalled]);

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall,
        isInstallModalOpen,
        isIos,
        openInstallModal,
        closeInstallModal,
        installApp,
        triggerPostRegistrationPrompt,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => useContext(PwaContext);

