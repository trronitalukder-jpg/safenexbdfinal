'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/tracking';
import { useSettings } from '@/context/SettingsContext';

function RouteListenerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { settings } = useSettings();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first render if fbq already fired PageView on initial script load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Check if PageView tracking is enabled
    const isPageViewEnabled = settings?.tracking?.events?.pageView !== false;
    if (!isPageViewEnabled) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    trackEvent('PageView', {
      page_path: url,
      page_title: typeof document !== 'undefined' ? document.title : '',
    });
  }, [pathname, searchParams, settings?.tracking?.events?.pageView]);

  return null;
}

export function TrackingRouteListener() {
  return (
    <Suspense fallback={null}>
      <RouteListenerInner />
    </Suspense>
  );
}
