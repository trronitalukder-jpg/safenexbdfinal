'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface WebsiteGeneralSettings {
  siteName: string;
  siteTagline: string;
  logoType: 'TEXT' | 'IMAGE_URL' | 'IMAGE_UPLOAD';
  logoText: string;
  logoAccent: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
}

export interface WebsiteSeoSettings {
  metaTitle: string;
  titleSeparator: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterHandle: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  robotsIndexing: boolean;
}

export interface WebsiteTrackingSettings {
  facebookPixelId: string;
  facebookCapiToken?: string;
  facebookTestEventCode?: string;
  googleAnalyticsId: string;
  gtmId: string;
  tiktokPixelId: string;
  customHeadScripts: string;
  customBodyScripts: string;
  events?: {
    pageView?: boolean;
    viewContent?: boolean;
    completeRegistration?: boolean;
    initiateCheckout?: boolean;
    purchase?: boolean;
    contact?: boolean;
    search?: boolean;
  };
}

export interface WebsiteLocalizationSettings {
  timezone: string;
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: 'BEFORE' | 'AFTER';
  dateFormat: string;
  timeFormat: string;
  defaultLanguage: 'bn' | 'en';
}

export interface WebsiteFooterSettings {
  copyrightText: string;
  aboutText: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  officeAddress: string;
  socialFacebook: string;
  socialYoutube: string;
  socialTelegram: string;
  socialWhatsapp: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialInstagram: string;
  noticeBarEnabled: boolean;
  noticeBarText: string;
}

export interface WebsiteSystemSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistration: boolean;
  requireKycForWithdraw?: boolean;
  mobileBottomNavEnabled?: boolean;
  appInstallPromptOnRegister?: boolean;
  appInstallDelaySeconds?: number;
  newVisitorPopupEnabled?: boolean;
  newVisitorPopupDelaySeconds?: number;
  newVisitorPopupAutoCloseSeconds?: number;
  newVisitorPopupTitle?: string;
  newVisitorPopupMessage?: string;
  newVisitorPopupCtaText?: string;
  newVisitorPopupCtaUrl?: string;
  scammerCheckerEnabled?: boolean;
  scammerGlobalWarningOnly?: boolean;
  socialProofEnabled?: boolean;
  socialProofInitialDelaySeconds?: number;
  socialProofIntervalSeconds?: number;
  socialProofDurationSeconds?: number;
}

export interface WebsiteMicroJobSettings {
  enabled: boolean;
  autoApproveHours: number;
  platformFeePercent: number;
  minJobReward: number;
  requireKycToPost: boolean;
  requireKycToWork: boolean;
  featuredJobFee?: number;
}

export interface WebsiteSettings {
  general: WebsiteGeneralSettings;
  seo: WebsiteSeoSettings;
  tracking: WebsiteTrackingSettings;
  localization: WebsiteLocalizationSettings;
  footer: WebsiteFooterSettings;
  system: WebsiteSystemSettings;
  microJob: WebsiteMicroJobSettings;
}

export const DEFAULT_PUBLIC_SETTINGS: WebsiteSettings = {
  general: {
    siteName: 'SafnexBD',
    siteTagline: 'Secure Escrow & P2P Marketplace in Bangladesh',
    logoType: 'TEXT',
    logoText: 'SafnexBD',
    logoAccent: '#f59e0b',
    logoLightUrl: '',
    logoDarkUrl: '',
    faviconUrl: '',
  },
  seo: {
    metaTitle: 'SafnexBD - Secure Escrow Marketplace in Bangladesh',
    titleSeparator: '|',
    metaDescription:
      'Buy and sell digital assets, physical goods, services, and exchange money securely with automated escrow protection in Bangladesh.',
    metaKeywords:
      'escrow bangladesh, buy sell online, digital goods, p2p escrow, safe payment, bkash escrow, nagad escrow',
    canonicalUrl: 'https://safnexbd.com',
    ogTitle: 'SafnexBD - Secure Escrow Marketplace in Bangladesh',
    ogDescription:
      'Experience zero-risk transactions with buyer and seller protection on SafnexBD.',
    ogImage: '',
    twitterCard: 'summary_large_image',
    twitterHandle: '@safnexbd',
    googleSiteVerification: '',
    bingSiteVerification: '',
    robotsIndexing: true,
  },
  tracking: {
    facebookPixelId: '',
    facebookCapiToken: '',
    facebookTestEventCode: '',
    googleAnalyticsId: '',
    gtmId: '',
    tiktokPixelId: '',
    customHeadScripts: '',
    customBodyScripts: '',
    events: {
      pageView: true,
      viewContent: true,
      completeRegistration: true,
      initiateCheckout: true,
      purchase: true,
      contact: true,
      search: true,
    },
  },
  localization: {
    timezone: 'Asia/Dhaka',
    currencySymbol: '৳',
    currencyCode: 'BDT',
    currencyPosition: 'BEFORE',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12H',
    defaultLanguage: 'bn',
  },
  footer: {
    copyrightText: '© 2026 SafnexBD. All rights reserved.',
    aboutText:
      'SafnexBD is Bangladesh’s premier multi-category digital escrow marketplace ensuring 100% security for online transactions, digital services, and physical products.',
    supportEmail: 'support@safnexbd.com',
    supportPhone: '+880 1700-000000',
    whatsappNumber: '+880 1700-000000',
    officeAddress: 'House #12, Road #5, Dhanmondi, Dhaka-1205, Bangladesh',
    socialFacebook: 'https://facebook.com/safnexbd',
    socialYoutube: 'https://youtube.com/@safnexbd',
    socialTelegram: 'https://t.me/safnexbd',
    socialWhatsapp: 'https://wa.me/8801700000000',
    socialTwitter: 'https://twitter.com/safnexbd',
    socialLinkedin: 'https://linkedin.com/company/safnexbd',
    socialInstagram: 'https://instagram.com/safnexbd',
    noticeBarEnabled: false,
    noticeBarText:
      '🎉 Welcome to SafnexBD! Fast, secure, and automated escrow for all your transactions.',
  },
  system: {
    maintenanceMode: false,
    maintenanceMessage:
      'We are currently upgrading our platform to serve you better. We will be back shortly.',
    allowRegistration: true,
    requireKycForWithdraw: false,
    mobileBottomNavEnabled: true,
    scammerCheckerEnabled: true,
    scammerGlobalWarningOnly: false,
    socialProofEnabled: true,
    socialProofInitialDelaySeconds: 5,
    socialProofIntervalSeconds: 25,
    socialProofDurationSeconds: 8,
  },
  microJob: {
    enabled: true,
    autoApproveHours: 48,
    platformFeePercent: 5,
    minJobReward: 1,
    requireKycToPost: false,
    requireKycToWork: false,
    featuredJobFee: 20,
  },
};

interface SettingsContextType {
  settings: WebsiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  formatCurrency: (amount: number | string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_PUBLIC_SETTINGS,
  loading: true,
  refreshSettings: async () => {},
  formatCurrency: (amount) => `৳${Number(amount || 0).toLocaleString('en-IN')}`,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WebsiteSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('safnexbd_public_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            general: { ...DEFAULT_PUBLIC_SETTINGS.general, ...(parsed.general || {}) },
            seo: { ...DEFAULT_PUBLIC_SETTINGS.seo, ...(parsed.seo || {}) },
            tracking: { ...DEFAULT_PUBLIC_SETTINGS.tracking, ...(parsed.tracking || {}) },
            localization: { ...DEFAULT_PUBLIC_SETTINGS.localization, ...(parsed.localization || {}) },
            footer: { ...DEFAULT_PUBLIC_SETTINGS.footer, ...(parsed.footer || {}) },
            system: { ...DEFAULT_PUBLIC_SETTINGS.system, ...(parsed.system || {}) },
            microJob: { ...DEFAULT_PUBLIC_SETTINGS.microJob, ...(parsed.microJob || {}) },
          };
        }
      } catch {}
    }
    return DEFAULT_PUBLIC_SETTINGS;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('safnexbd_public_settings');
    }
    return true;
  });

  const refreshSettings = useCallback(async () => {
    try {
      const res: any = await api.get('/settings/public');
      const data = res?.data !== undefined ? res.data : res;
      if (data && typeof data === 'object') {
        setSettings((prev) => {
          const next = {
            general: { ...prev.general, ...(data.general || {}) },
            seo: { ...prev.seo, ...(data.seo || {}) },
            tracking: { ...prev.tracking, ...(data.tracking || {}) },
            localization: { ...prev.localization, ...(data.localization || {}) },
            footer: { ...prev.footer, ...(data.footer || {}) },
            system: { ...prev.system, ...(data.system || {}) },
            microJob: { ...prev.microJob, ...(data.microJob || {}) },
          };
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('safnexbd_public_settings', JSON.stringify(next));
            } catch {}
          }
          return next;
        });
      }
    } catch (error) {
      console.warn('Failed to load public website settings, using defaults:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Inject tracking scripts & dynamic head elements on client side
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    // 1. Dynamic Favicon
    if (settings.general.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0]?.appendChild(link);
      }
      link.href = settings.general.faviconUrl;
    }

    // 2. Google Analytics (gtag.js)
    if (settings.tracking.googleAnalyticsId && !document.getElementById('ga-gtag-script')) {
      const script = document.createElement('script');
      script.id = 'ga-gtag-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.tracking.googleAnalyticsId}`;
      document.head.appendChild(script);

      const inlineScript = document.createElement('script');
      inlineScript.id = 'ga-inline-script';
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.tracking.googleAnalyticsId}');
      `;
      document.head.appendChild(inlineScript);
    }

    // 3. Meta / Facebook Pixel
    const pixelId = (settings.tracking.facebookPixelId || '').trim();
    if (pixelId && !document.getElementById('fb-pixel-script')) {
      const fbScript = document.createElement('script');
      fbScript.id = 'fb-pixel-script';
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);

      // Noscript fallback
      if (!document.getElementById('fb-pixel-noscript')) {
        const noscript = document.createElement('noscript');
        noscript.id = 'fb-pixel-noscript';
        noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
        document.body.appendChild(noscript);
      }
    }

    // 4. Google Tag Manager (GTM)
    if (settings.tracking.gtmId && !document.getElementById('gtm-script')) {
      const gtmScript = document.createElement('script');
      gtmScript.id = 'gtm-script';
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${settings.tracking.gtmId}');
      `;
      document.head.appendChild(gtmScript);
    }

    // 5. Custom Head Scripts
    if (settings.tracking.customHeadScripts && !document.getElementById('custom-head-scripts')) {
      const container = document.createElement('div');
      container.id = 'custom-head-scripts';
      container.innerHTML = settings.tracking.customHeadScripts;
      // Execute any script tags inside
      const scripts = container.querySelectorAll('script');
      scripts.forEach((s) => {
        const newScript = document.createElement('script');
        Array.from(s.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(s.innerHTML));
        document.head.appendChild(newScript);
      });
    }

    // 6. Custom Body Scripts
    if (settings.tracking.customBodyScripts && !document.getElementById('custom-body-scripts')) {
      const container = document.createElement('div');
      container.id = 'custom-body-scripts';
      container.innerHTML = settings.tracking.customBodyScripts;
      const scripts = container.querySelectorAll('script');
      scripts.forEach((s) => {
        const newScript = document.createElement('script');
        Array.from(s.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(s.innerHTML));
        document.body.appendChild(newScript);
      });
    }
  }, [settings, loading]);

  const formatCurrency = useCallback(
    (amount: number | string) => {
      const num = Number(amount || 0);
      const symbol = settings.localization.currencySymbol || '৳';
      const formatted = num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      if (settings.localization.currencyPosition === 'AFTER') {
        return `${formatted} ${symbol}`;
      }
      return `${symbol}${formatted}`;
    },
    [settings.localization.currencySymbol, settings.localization.currencyPosition]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        formatCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

