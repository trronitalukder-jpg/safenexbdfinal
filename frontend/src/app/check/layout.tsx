import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'অনলাইন প্রতারক ও স্ক্যামার চেকার (Scammer Name, Phone & Facebook ID Check BD) | SafnexBD',
  description:
    'যেকোনো বিকাশ, নগদ, রকেট মোবাইল নম্বর, প্রতারকের নাম বা ফেসবুক আইডি লিখে মাত্র ৫ সেকেন্ডে যাচাই করুন ব্যক্তিটি অনলাইন প্রতারক বা স্ক্যামার কিনা। বাংলাদেশের সবচেয়ে বড় ভেরিফায়েড স্ক্যামার ডাটাবেজ।',
  keywords: [
    'Scammer Check Bangladesh',
    'bKash Scammer Number Check',
    'Nagad Fraud Number Check BD',
    'অনলাইন প্রতারক চেক',
    'বিকাশ প্রতারক নাম্বার',
    'ফেসবুক প্রতারক আইডি যাচাই',
    'Scammer Database BD',
    'Report Online Scammer Bangladesh',
    'SafnexBD Scammer Checker',
  ],
  alternates: {
    canonical: 'https://safnexbd.com/check',
  },
  openGraph: {
    title: 'অনলাইন প্রতারক ও স্ক্যামার চেকার (Scammer Name & Phone Number Check BD) | SafnexBD',
    description:
      'অগ্রিম টাকা পাঠানোর আগে প্রতারকের নাম, বিকাশ/নগদ মোবাইল নম্বর বা ফেসবুক আইডি দিয়ে সার্চ করে প্রতারণা থেকে বাঁচুন এবং প্রমাণসহ প্রতারকের বিরুদ্ধে রিপোর্ট করুন।',
    url: 'https://safnexbd.com/check',
    siteName: 'SafnexBD',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'অনলাইন প্রতারক ও স্ক্যামার চেকার | SafnexBD Scammer Database',
    description:
      'মোবাইল নম্বর, নাম বা ফেসবুক লিংক দিয়ে অনলাইন প্রতারক যাচাই করুন এবং নিরাপদে এসক্রো লেনদেন করুন।',
  },
};

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
