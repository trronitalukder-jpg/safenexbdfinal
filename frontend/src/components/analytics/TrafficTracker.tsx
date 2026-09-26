'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Generate or retrieve persistent anonymous Visitor ID
 */
function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let vid = localStorage.getItem('safnex_vid');
  if (!vid) {
    vid = 'vid_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    try {
      localStorage.setItem('safnex_vid', vid);
    } catch {}
  }
  return vid;
}

/**
 * Detect client device type
 */
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'DESKTOP';
  const width = window.innerWidth;
  if (width < 768) return 'MOBILE';
  if (width < 1024) return 'TABLET';
  return 'DESKTOP';
}

/**
 * Detect basic browser name
 */
function getBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
  if (ua.includes('SamsungBrowser/')) return 'Samsung Internet';
  return 'Other Browser';
}

/**
 * Detect operating system
 */
function getOs(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Other OS';
}

/**
 * Get current logged in user ID if any
 */
function getLoggedInUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('safnexbd_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.id || undefined;
    }
  } catch {}
  return undefined;
}

function TrafficTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dwellSecondsRef = useRef<number>(0);
  const activeSecondsRef = useRef<number>(0);
  const currentPathRef = useRef<string>(pathname);
  const isTabVisibleRef = useRef<boolean>(true);

  // Send ping beacon helper
  const sendPing = (isUnload = false) => {
    if (typeof window === 'undefined') return;

    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    const payload = {
      visitorId,
      pagePath: currentPathRef.current || '/',
      pageTitle: document.title || '',
      referrer: document.referrer || '',
      utmSource: searchParams?.get('utm_source') || undefined,
      utmMedium: searchParams?.get('utm_medium') || undefined,
      utmCampaign: searchParams?.get('utm_campaign') || undefined,
      dwellSeconds: dwellSecondsRef.current,
      activeSeconds: activeSecondsRef.current,
      deviceType: getDeviceType(),
      browser: getBrowser(),
      os: getOs(),
      userId: getLoggedInUserId(),
    };

    const url = `${API_BASE_URL}/traffic/ping`;
    const bodyStr = JSON.stringify(payload);

    // Reset counters after preparing payload
    dwellSecondsRef.current = 0;
    activeSecondsRef.current = 0;

    if (isUnload && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([bodyStr], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr,
        keepalive: true,
      }).catch(() => {
        // Non-blocking silent fail
      });
    }
  };

  // Track page path changes
  useEffect(() => {
    if (pathname !== currentPathRef.current) {
      // Send previous page's remaining dwell time
      sendPing(false);
      currentPathRef.current = pathname;
      dwellSecondsRef.current = 0;
      activeSecondsRef.current = 0;
      // Immediate ping for new page entry
      sendPing(false);
    }
  }, [pathname, searchParams]);

  // Initial mount & heartbeat timer
  useEffect(() => {
    // Immediate entry ping
    sendPing(false);

    // Second-by-second ticker for accurate active dwell tracking
    const ticker = setInterval(() => {
      dwellSecondsRef.current += 1;
      if (isTabVisibleRef.current) {
        activeSecondsRef.current += 1;
      }
    }, 1000);

    // Heartbeat every 20 seconds to backend
    const heartbeat = setInterval(() => {
      sendPing(false);
    }, 20000);

    // Page visibility listener (Pause active time when tab is hidden)
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Page unload / exit listener
    const handleUnload = () => {
      sendPing(true);
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // Global CTA / Action click tracking
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('button, a');
      if (!target) return;

      const href = target.getAttribute('href') || '';
      const text = (target.textContent || '').trim().substring(0, 50);

      // Check if it's a key action
      let eventName = '';
      if (href.includes('/register') || text.toLowerCase().includes('register') || text.includes('সাইন আপ')) {
        eventName = 'REGISTER_INTENT';
      } else if (href.includes('/micro-jobs') || text.includes('কাজ') || text.toLowerCase().includes('job')) {
        eventName = 'EXPLORE_JOBS';
      } else if (href.includes('/deposit') || text.includes('রিচার্জ') || text.toLowerCase().includes('deposit')) {
        eventName = 'DEPOSIT_CLICK';
      } else if (target.hasAttribute('data-track-cta')) {
        eventName = target.getAttribute('data-track-cta') || 'CUSTOM_CTA';
      }

      if (eventName) {
        const vid = getOrCreateVisitorId();
        fetch(`${API_BASE_URL}/traffic/event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: vid,
            eventType: 'CTA_CLICK',
            eventName,
            pagePath: window.location.pathname,
            metadata: { buttonText: text, href },
          }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    document.addEventListener('click', handleGlobalClick, { passive: true });

    return () => {
      clearInterval(ticker);
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return null;
}

export default function TrafficTracker() {
  return (
    <Suspense fallback={null}>
      <TrafficTrackerInner />
    </Suspense>
  );
}

