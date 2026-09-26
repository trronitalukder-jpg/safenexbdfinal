import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import TrafficTracker from '@/components/analytics/TrafficTracker';
import NewVisitorWelcomeModal from '@/components/common/NewVisitorWelcomeModal';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0284c7',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'SafnexBD — Safe Transaction Marketplace & Escrow Platform',
  description: 'Buy and sell digital products, physical gadgets, and conduct escrow protected peer-to-peer safe transactions in Bangladesh.',
  manifest: '/manifest.json',
  verification: {
    google: '5FtxkWfKzTBUBHtmdabdUk7bdAEIhGoVnl_zLMw2EQk',
  },
  other: {
    'google-site-verification': '5FtxkWfKzTBUBHtmdabdUk7bdAEIhGoVnl_zLMw2EQk',
    'mobile-web-app-capable': 'yes',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SafnexBD',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white"
      >
        <Providers>
          <TrafficTracker />
          <NewVisitorWelcomeModal />
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
