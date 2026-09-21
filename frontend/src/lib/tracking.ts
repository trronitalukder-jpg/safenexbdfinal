'use client';

export type StandardEventName =
  | 'PageView'
  | 'ViewContent'
  | 'CompleteRegistration'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Contact'
  | 'Lead'
  | 'Search'
  | 'AddToCart'
  | 'CustomizeProduct';

export interface TrackingParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[] | string;
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  search_string?: string;
  status?: boolean | string;
  method?: string;
  transaction_id?: string;
  page_path?: string;
  page_title?: string;
  [key: string]: any;
}

declare global {
  interface Window {
    fbq?: any;
    gtag?: any;
    dataLayer?: any[];
    ttq?: any;
    __SAFNEX_TRACKING_DEBUG__?: boolean;
  }
}

/**
 * Check if Meta Pixel is loaded and available in the browser
 */
export function isPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

/**
 * Check if Google Analytics (gtag) is loaded
 */
export function isGtagLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/**
 * Check if Google Tag Manager (dataLayer) is loaded
 */
export function isGtmLoaded(): boolean {
  return typeof window !== 'undefined' && Array.isArray(window.dataLayer);
}

/**
 * Check if TikTok Pixel is loaded
 */
export function isTiktokLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.ttq?.track === 'function';
}

/**
 * Dispatch a standard tracking event across all connected platforms
 */
export function trackEvent(eventName: StandardEventName, params: TrackingParams = {}): void {
  if (typeof window === 'undefined') return;

  const enrichedParams: TrackingParams = {
    currency: params.currency || 'BDT',
    ...params,
  };

  const isDebug =
    process.env.NODE_ENV !== 'production' ||
    window.__SAFNEX_TRACKING_DEBUG__ === true;

  if (isDebug) {
    console.groupCollapsed(`🎯 [Safnex Tracking] Event: ${eventName}`);
    console.log('Payload:', enrichedParams);
    console.log('Services:', {
      MetaPixel: isPixelLoaded(),
      GA4: isGtagLoaded(),
      GTM: isGtmLoaded(),
      TikTok: isTiktokLoaded(),
    });
    console.groupEnd();
  }

  // 1. Meta / Facebook Pixel
  try {
    if (isPixelLoaded()) {
      window.fbq('track', eventName, enrichedParams);
    }
  } catch (err) {
    if (isDebug) console.warn('[Tracking] Meta Pixel error:', err);
  }

  // 2. Google Analytics (GA4)
  try {
    if (isGtagLoaded()) {
      window.gtag('event', eventName, enrichedParams);
    }
  } catch (err) {
    if (isDebug) console.warn('[Tracking] GA4 error:', err);
  }

  // 3. Google Tag Manager (GTM)
  try {
    if (isGtmLoaded()) {
      window.dataLayer?.push({
        event: eventName,
        ...enrichedParams,
      });
    }
  } catch (err) {
    if (isDebug) console.warn('[Tracking] GTM error:', err);
  }

  // 4. TikTok Pixel
  try {
    if (isTiktokLoaded()) {
      window.ttq.track(eventName, enrichedParams);
    }
  } catch (err) {
    if (isDebug) console.warn('[Tracking] TikTok Pixel error:', err);
  }
}

/**
 * Dispatch a custom tracking event
 */
export function trackCustomEvent(eventName: string, params: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;

  // 1. Meta Custom Event
  try {
    if (isPixelLoaded()) {
      window.fbq('trackCustom', eventName, params);
    }
  } catch (err) {
    console.warn('[Tracking] Meta Custom Event error:', err);
  }

  // 2. GA4 Custom Event
  try {
    if (isGtagLoaded()) {
      window.gtag('event', eventName, params);
    }
  } catch (err) {
    console.warn('[Tracking] GA4 Custom Event error:', err);
  }

  // 3. GTM Custom Event
  try {
    if (isGtmLoaded()) {
      window.dataLayer?.push({
        event: eventName,
        ...params,
      });
    }
  } catch (err) {
    console.warn('[Tracking] GTM Custom Event error:', err);
  }
}
