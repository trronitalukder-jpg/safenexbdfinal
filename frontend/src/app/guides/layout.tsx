import type { Metadata } from 'next';
import React from 'react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://safnexbd.com';

export const metadata: Metadata = {
  title: 'সেফ ট্রেডিং ও এসক্রো গাইডস | SafnexBD Official Guides',
  description:
    'অনলাইনে প্রতারণা ছাড়া নিরাপদে ফেসবুক আইডি, পেজ, গেমিং অ্যাকাউন্ট ও ডিজিটাল প্রোডাক্ট কেনাবেচার নিয়মাবলী ও ভিডিও টিউটোরিয়াল।',
  keywords: [
    'safnexbd guides',
    'safe trading bangladesh',
    'escrow guide bangladesh',
    'অনলাইন লেনদেন নিরাপত্তা',
    'ফেসবুক পেজ কেনা বেচা',
    'এসক্রো সেবা বাংলাদেশ',
    'আইডি কেনাবেচা নিয়ম',
  ],
  alternates: {
    canonical: `${baseUrl}/guides`,
  },
  openGraph: {
    title: 'সেফ ট্রেডিং ও এসক্রো গাইডস | SafnexBD Official Guides',
    description:
      'অনলাইনে প্রতারণা ছাড়া নিরাপদে ফেসবুক আইডি, পেজ, গেমিং অ্যাকাউন্ট ও ডিজিটাল প্রোডাক্ট কেনাবেচার নিয়মাবলী ও ভিডিও টিউটোরিয়াল।',
    url: `${baseUrl}/guides`,
    siteName: 'SafnexBD',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/icon-512.png`,
        width: 512,
        height: 512,
        alt: 'SafnexBD Safe Trading Guides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'সেফ ট্রেডিং ও এসক্রো গাইডস | SafnexBD Official Guides',
    description:
      'অনলাইনে প্রতারণা ছাড়া নিরাপদে ফেসবুক আইডি, পেজ, গেমিং অ্যাকাউন্ট ও ডিজিটাল প্রোডাক্ট কেনাবেচার নিয়মাবলী ও টিউটোরিয়াল।',
    images: [`${baseUrl}/icon-512.png`],
  },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

