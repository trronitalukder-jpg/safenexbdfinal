'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function PromoRedirectPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const code = resolvedParams.code;
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');

  useEffect(() => {
    if (!code) return;

    const trackAndRedirect = async () => {
      try {
        // Detect device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const device = isMobile ? 'Mobile' : 'Desktop';
        const referrer = typeof document !== 'undefined' ? document.referrer : '';

        // Call tracking API
        const res: any = await api.post(`/promotions/click/${encodeURIComponent(code)}`, {
          referrer,
          device,
        });

        const data = res?.data !== undefined ? res.data : res;

        // Store promotion referral code in localStorage and cookie for 30-day attribution
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('safnex_promo', code.toLowerCase().trim());
            localStorage.setItem('safnex_promo_timestamp', Date.now().toString());

            // Set cookie for 30 days
            const maxAge = 30 * 24 * 60 * 60;
            document.cookie = `safnex_promo=${encodeURIComponent(
              code.toLowerCase().trim()
            )}; path=/; max-age=${maxAge}; SameSite=Lax`;
          } catch {
            // ignore localStorage quota errors
          }
        }

        setStatus('redirecting');

        // Target redirect destination
        const destination = data?.targetUrl || '/';
        router.replace(destination);
      } catch (err) {
        console.warn('Promo track error, redirecting to home', err);
        // Fallback store and redirect anyway
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('safnex_promo', code.toLowerCase().trim());
          } catch {}
        }
        router.replace('/');
      }
    };

    trackAndRedirect();
  }, [code, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-sky-400">⚡</span>
          </div>
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white">
            {status === 'redirecting' ? 'রিডাইরেক্ট করা হচ্ছে...' : 'সেফনেক্সবিডি কানেক্ট হচ্ছে...'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            অনুগ্রহ করে এক সেকেন্ড অপেক্ষা করুন
          </p>
        </div>
      </div>
    </div>
  );
}
