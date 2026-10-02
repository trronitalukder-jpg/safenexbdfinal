import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'সেফনেক্সবিডি নির্দেশিকা, এসক্রো গাইড ও অনলাইন ইনকাম টিউটোরিয়াল | SafnexBD Guides',
  description:
    'বাংলাদেশে নিরাপদ এসক্রো লেনদেন (Escrow Service BD), মাইক্রো-জব অনলাইন ইনকাম, স্ক্যামার নম্বর চেক, ডিজিটাল প্রোডাক্ট, ফেসবুক পেজ ও ইউটিউব চ্যানেল কেনাবেচা এবং মানি এক্সচেঞ্জের সম্পূর্ণ গাইড ও টিউটোরিয়াল।',
  keywords: [
    'SafnexBD Guides',
    'Escrow Service Bangladesh',
    'এসক্রো সার্ভিস বাংলাদেশ',
    'অনলাইন ইনকাম বিকাশ পেমেন্ট',
    'Micro job site in Bangladesh',
    'Scammer number check BD',
    'Facebook page buy sell BD',
    'YouTube channel buy sell Bangladesh',
    'Digital product marketplace BD',
    'Dollar buy sell bKash Nagad',
  ],
  alternates: {
    canonical: 'https://safnexbd.com/guides',
  },
  openGraph: {
    title: 'সেফনেক্সবিডি নির্দেশিকা ও এসক্রো গাইড | SafnexBD Official Guides',
    description:
      'কিভাবে প্রতারণা ছাড়া নিরাপদে অনলাইনে কেনাবেচা করবেন, মাইক্রো-জব করে আয় করবেন এবং ১০০% ভেরিফায়েড এসক্রো সুরক্ষা ব্যবহার করবেন তার বিস্তারিত গাইড।',
    url: 'https://safnexbd.com/guides',
    siteName: 'SafnexBD',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'সেফনেক্সবিডি নির্দেশিকা ও এসক্রো গাইড | SafnexBD Guides',
    description:
      'বাংলাদেশে নিরাপদ এসক্রো লেনদেন, মাইক্রো-জব ইনকাম ও ডিজিটাল প্রোডাক্ট কেনাবেচার অফিসিয়াল নির্দেশিকা।',
  },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

