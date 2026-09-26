'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { PwaProvider } from '@/context/PwaContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { InstallPromptModal } from '@/components/pwa/InstallPromptModal';
import { NotificationPromptBanner } from '@/components/notifications/NotificationPromptBanner';
import { TrackingRouteListener } from '@/components/tracking/TrackingRouteListener';
import { SocialProofPopup } from '@/components/common/SocialProofPopup';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <NotificationProvider>
            <PwaProvider>
              <TrackingRouteListener />
              {children}
              <InstallPromptModal />
              <NotificationPromptBanner />
              <SocialProofPopup />
            </PwaProvider>
          </NotificationProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};
