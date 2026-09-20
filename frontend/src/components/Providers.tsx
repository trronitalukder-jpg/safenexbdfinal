'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { PwaProvider } from '@/context/PwaContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { InstallPromptModal } from '@/components/pwa/InstallPromptModal';
import { NotificationPromptBanner } from '@/components/notifications/NotificationPromptBanner';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <NotificationProvider>
            <PwaProvider>
              {children}
              <InstallPromptModal />
              <NotificationPromptBanner />
            </PwaProvider>
          </NotificationProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};
