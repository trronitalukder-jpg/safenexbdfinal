'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  Globe,
  ShieldCheck,
  Zap,
  Code2,
  Lock,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Layers,
  Send,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Coins,
  Cpu,
  Server,
  HelpCircle,
} from 'lucide-react';

export default function PartnerApiPage() {
  const { lang } = useLanguage();

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    websiteUrl: '',
    applicantName: '',
    email: '',
    phone: '',
    techStack: 'WordPress',
    useCase: 'eCommerce',
    monthlyVolume: '৳১,০০,০০০ - ৳৫,০০,০০০',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    appId?: string;
    apiKey?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res: any = await api.post('/partner/apply', formData);
      const data = res?.data || res;
      setResult({
        success: true,
        message:
          lang === 'bn'
            ? 'আপনার আবেদনটি সফলভাবে জমা হয়েছে! আমাদের মার্চেন্ট অনবোর্ডিং টিম যাচাই করে ২৪ ঘণ্টার মধ্যে আপনার লাইভ এপিআই সক্রিয় করবে।'
            : 'Your API application has been submitted successfully! Our onboarding team will review and activate your production credentials within 24 hours.',
        appId: data.appId,
        apiKey: data.apiKey,
      });
      // Reset form
      setFormData({
        businessName: '',
        websiteUrl: '',
        applicantName: '',
        email: '',
        phone: '',
        techStack: 'WordPress',
        useCase: 'eCommerce',
        monthlyVolume: '৳১,০০,০০০ - ৳৫,০০,০০০',
        notes: '',
      });
    } catch (err: any) {
      setResult({
        success: false,
        message:
          err.response?.data?.message ||
          err.message ||
          (lang === 'bn' ? 'আবেদন জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Failed to submit application. Please try again.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToApply = () => {
    document.getElementById('apply-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 font-bold text-xs mb-6 shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>
              {lang === 'bn'
                ? 'SafnexBD মার্চেন্ট ও এপিআই পার্টনার্স ইকোসিস্টেম'
                : 'SafnexBD Merchant & API Partners Ecosystem'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            {lang === 'bn' ? (
              <>
                আপনার ওয়েবসাইটে যুক্ত করুন{' '}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  নিরাপদ ওয়ালেট, চ্যাট ও এসক্রো এপিআই
                </span>
              </>
            ) : (
              <>
                Empower Your Website With{' '}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  Safe Wallet, Live Chat & Escrow API
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'WordPress, WooCommerce, Next.js, Laravel, Python বা যেকোনো প্ল্যাটফর্ম থেকে SafnexBD যুক্ত করুন। আপনার ব্যবহারকারীদের এখানে আলাদা রেজিস্ট্রেশনের প্রয়োজন নেই (Silent SSO)।'
              : 'Seamlessly integrate SafnexBD into WordPress, WooCommerce, Next.js, Laravel, Python or custom platforms. Zero user registration friction with Silent SSO.'}
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={scrollToApply}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-sky-600/25 flex items-center gap-2 transition active:scale-95"
            >
              <span>{lang === 'bn' ? 'এপিআই এর জন্য আবেদন করুন' : 'Apply for API Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features-section"
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-bold text-sm sm:text-base text-slate-700 dark:text-slate-300 transition"
            >
              {lang === 'bn' ? 'সুবিধাসমূহ দেখুন' : 'Explore Capabilities'}
            </a>
          </div>

          {/* Key Metrics / Highlights Strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xs">
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">0</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {lang === 'bn' ? 'রেজিস্ট্রেশন ঝামেলা (Silent SSO)' : 'Manual Registration (SSO)'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xs">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {lang === 'bn' ? 'এসক্রো সুরক্ষা ও গ্যারান্টি' : 'Escrow Fraud Protection'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xs">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">1-Line</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {lang === 'bn' ? 'সহজ SDK স্ক্রিপ্ট ইন্টিগ্রেশন' : 'SDK Script Integration'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xs">
              <div className="text-2xl font-black text-amber-500">0৳</div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {lang === 'bn' ? 'অতিরিক্ত কোনো API ফি নেই' : 'Zero Extra API Charges'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Capabilities & Value Proposition */}
      <section id="features-section" className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {lang === 'bn'
                ? 'আপনার ওয়েবসাইটের জন্য পূর্ণাঙ্গ ট্রাস্ট আর্কিটেকচার'
                : 'A Complete Trust Infrastructure For Your Website'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              {lang === 'bn'
                ? 'SafnexBD এপিআই ব্যবহারের মাধ্যমে আপনার প্ল্যাটফর্মের ক্রেতা-বিক্রেতার লেনদেন ও কথোপকথন শতভাগ সুরক্ষিত থাকবে।'
                : 'Turn your platform into a safe trading powerhouse with verified escrow, instant bKash recharge, and live buyer-seller chat.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Silent SSO */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {lang === 'bn' ? 'জিরো-রেজিস্ট্রেশন সাইলেন্ট এসএসও' : 'Zero-Friction Silent SSO'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার ব্যবহারকারীকে SafnexBD-তে আলাদা অ্যাকাউন্ট খুলতে হবে না। আপনার সাইটের ইউজার আইডি পাঠালেই ব্যাকএন্ডে স্বয়ংক্রিয়ভাবে সিকিউর ভার্চুয়াল প্রোফাইল তৈরি হয়ে যাবে।'
                  : 'Users never have to register manually on SafnexBD. Pass your internal user ID, and our backend auto-provisions a dedicated wallet and 24-hour session.'}
              </p>
            </div>

            {/* Feature 2: Embedded Wallet & Recharge */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {lang === 'bn' ? 'অটোমেটিক রিচার্জ ও ওয়ালেট' : 'Instant Gateway Recharge'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'বিকাশ এবং SSLCommerz গেটওয়ের মাধ্যমে আপনার ব্যবহারকারীরা ১ ক্লিকে টাকা রিচার্জ করতে পারবে। ব্যালেন্স তাৎক্ষণিকভাবে ওয়ালেটে যুক্ত হবে।'
                  : 'Embedded bKash & SSLCommerz automated payment gateways allow your users to recharge their safe balance instantly right inside the widget.'}
              </p>
            </div>

            {/* Feature 3: OTP Verified Withdrawals */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {lang === 'bn' ? 'ওটিপি সুরক্ষিত উইথড্রয়াল' : 'OTP-Secured Withdrawals'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'টাকা উত্তোলনের সময় ব্যবহারকারীর ফোনে বা ইমেইলে ৬-ডিজিট ওটিপি কোড পাঠানো হবে। ওটিপি সঠিক হলেই কেবল উইথড্র রিকোয়েস্ট গৃহীত হবে।'
                  : 'High-risk payouts require a 6-digit numeric OTP sent directly to the registered phone or email, protecting funds from unauthorized access.'}
              </p>
            </div>

            {/* Feature 4: Live Buyer-Seller Chat */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {lang === 'bn' ? 'রিয়েল-টাইম লাইভ চ্যাট উইজেট' : 'Real-time Live Chat Widget'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার পণ্য বা অর্ডার পেজে বায়ার ও সেলারের জন্য সরাসরি ইনস্ট্যান্ট মেসেজিং উইজেট। সব চ্যাট এনক্রিপ্টেড এবং বিরোধ নিষ্পত্তিতে অ্যাডমিন দ্বারা পর্যবেক্ষণযোগ্য।'
                  : 'Embed a real-time WebSocket chat directly into your order pages. Keep all communication on-platform for auditability and dispute protection.'}
              </p>
            </div>

            {/* Feature 5: Safe Escrow Deal Engine */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {lang === 'bn' ? '১০০% মানিব্যাক এসক্রো ইঞ্জিন' : 'Automated Escrow Engine'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'লেনদেনের সময় টাকা এসক্রো হোল্ডে থাকবে। ডেলিভারি নিশ্চিত হলে সেলার টাকা পাবে, আর বিরোধ তৈরি হলে আমাদের আরবিট্রেশন টিম নিরপেক্ষভাবে মীমাংসা করবে।'
                  : 'Funds remain held in escrow until delivery is verified. Seamless release via API with automated platform fee handling and dispute resolution.'}
              </p>
            </div>

            {/* Feature 6: Webhooks & HMAC Signatures */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {lang === 'bn' ? 'রিয়েলটাইম ওয়েবহুক ও HMAC' : 'Instant Webhooks & HMAC'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'রিচার্জ সফল হওয়া, উইথড্রয়াল স্ট্যাটাস আপডেট এবং এসক্রো ডিল সম্পন্ন হওয়ার সাথে সাথে আপনার সার্ভারে HMAC-SHA256 সাইনড ওয়েব হুক নোটিফিকেশন পৌঁছাবে।'
                  : 'Receive cryptographically signed HMAC-SHA256 webhook alerts the instant an escrow deal is created, funded, released, or disputed.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Supported Platforms Strip */}
      <section className="py-12 bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
            {lang === 'bn' ? 'যেকোনো প্রযুক্তি ও প্ল্যাটফর্মে সহজেই কাজ করে' : 'Seamless Support For All Technologies'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {['WordPress & WooCommerce', 'Next.js & React', 'PHP & Laravel', 'Python / Django / FastAPI', 'Android & iOS (Flutter)', 'HTML / Vanilla JS'].map((tech) => (
              <div
                key={tech}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
              >
                <Cpu className="w-3.5 h-3.5 text-sky-500" />
                <span>{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works (Step-by-Step) */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {lang === 'bn' ? 'কিভাবে শুরু করবেন? (মাত্র ৪টি সহজ ধাপ)' : 'How To Integrate (In 4 Simple Steps)'}
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {lang === 'bn'
                ? 'জটিল কোনো প্রক্রিয়া নেই। নিচের ফরম পূরণ করে আবেদন করার ২৪ ঘণ্টার মধ্যেই আপনি লাইভ ইন্টিগ্রেশন শুরু করতে পারবেন।'
                : 'No complicated red tape. Submit the application below, receive your App ID & API Keys, and launch in minutes.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                titleEn: 'Apply for Access',
                titleBn: 'আবেদন করুন',
                descEn: 'Fill out the merchant application below with your website details to receive your App ID & API Keys.',
                descBn: 'নিচের ফরমে আপনার ওয়েবসাইট ও ব্যবসার তথ্য দিয়ে আবেদন করুন এবং তাৎক্ষণিক টেস্ট ক্রেডেনশিয়ালস পান।',
              },
              {
                step: '02',
                titleEn: 'Call Session API',
                titleBn: 'সেশন টোকেন কল করুন',
                descEn: 'Your backend calls /partner/auth/session with your user’s ID to generate a 24-hour client session token.',
                descBn: 'আপনার সার্ভার থেকে কাস্টমারের আইডি পাঠিয়ে SafnexBD সেশন টোকেন গ্রহণ করুন।',
              },
              {
                step: '03',
                titleEn: 'Embed 1-Line SDK',
                titleBn: '১-লাইনের SDK যুক্ত করুন',
                descEn: 'Include safnexbd-sdk.js in your frontend. The floating badge and modal initialize automatically.',
                descBn: 'আপনার সাইটের হেডারে safnexbd-sdk.js যুক্ত করুন। স্বয়ংক্রিয়ভাবে ওয়ালেট ও চ্যাট ব্যাজ লোড হবে।',
              },
              {
                step: '04',
                titleEn: 'Secure Transactions',
                titleBn: 'নিরাপদ লেনদেন শুরু',
                descEn: 'Your customers can recharge, withdraw with OTP, chat, and complete safe escrow orders.',
                descBn: 'আপনার কাস্টমাররা নিশ্চিন্তে রিচার্জ, ওটিপি উইথড্র, রিয়েলটাইম চ্যাট ও এসক্রো অর্ডার সম্পন্ন করবে।',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative"
              >
                <div className="text-3xl font-black text-sky-600 dark:text-sky-400 mb-3">{item.step}</div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                  {lang === 'bn' ? item.titleBn : item.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'bn' ? item.descBn : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Interactive Application Form */}
      <section id="apply-form-section" className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '১০০% ফ্রি আবেদন' : 'Free Application'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {lang === 'bn' ? 'এপিআই ও পার্টনার অ্যাকাউন্টের জন্য আবেদন করুন' : 'Apply for Merchant API Access'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {lang === 'bn'
                ? 'আপনার ওয়েবসাইটের তথ্য প্রদান করুন। আবেদন সাবমিট করলে তাৎক্ষণিকভাবে টেস্ট ক্রেডেনশিয়ালস তৈরি হবে এবং আমাদের টিম দ্রুত আপনার লাইভ মোড সক্রিয় করে দেবে।'
                : 'Provide your business details below. Test credentials will be generated immediately, and our team will activate your production live mode.'}
            </p>
          </div>

          {/* Form Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            {result && (
              <div
                className={`p-5 rounded-2xl mb-6 text-sm font-medium border ${
                  result.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <p className="font-semibold">{result.message}</p>
                    {result.appId && (
                      <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl text-xs font-mono border border-emerald-200 dark:border-emerald-800">
                        <div>App ID: <span className="font-bold">{result.appId}</span></div>
                        {result.apiKey && (
                          <div className="mt-1">Public Key: <span className="font-bold">{result.apiKey}</span></div>
                        )}
                        <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                          Status: Pending Review (Activated within 24h)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ব্যবসা বা ওয়েবসাইটের নাম *' : 'Business / Website Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka Mart Online"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ওয়েবসাইট / অ্যাপ লিংক (URL) *' : 'Website or App URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'যোগাযোগকারীর নাম *' : 'Contact Person Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sabbir Hossain"
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইমেইল ঠিকানা *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sabbir@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মোবাইল / হোয়াটসঅ্যাপ *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'প্রযুক্তি (Technology Stack)' : 'Tech Stack'}
                  </label>
                  <select
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  >
                    <option value="WordPress / WooCommerce">WordPress / WooCommerce</option>
                    <option value="Next.js / React">Next.js / React</option>
                    <option value="PHP / Laravel">PHP / Laravel</option>
                    <option value="Python (Django/FastAPI)">Python (Django/FastAPI)</option>
                    <option value="Mobile App (Flutter/React Native)">Mobile App (Flutter/React Native)</option>
                    <option value="Custom HTML/Node.js">Custom HTML/Node.js</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ব্যবহারের ধরন (Use Case)' : 'Primary Use Case'}
                  </label>
                  <select
                    value={formData.useCase}
                    onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  >
                    <option value="eCommerce Marketplace">ই-কমার্স মার্কেটপ্লেস</option>
                    <option value="Freelance & Services">ফ্রিল্যান্স ও সার্ভিসেস</option>
                    <option value="Digital Goods & Accounts">ডিজিটাল পণ্য ও অ্যাকাউন্ট</option>
                    <option value="Gaming & Top-up">গেমিং ও টপ-আপ</option>
                    <option value="Custom Escrow Deals">কাস্টম এসক্রো ডিল</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'মাসিক লেনদেন (Estimated Volume)' : 'Monthly Volume'}
                  </label>
                  <select
                    value={formData.monthlyVolume}
                    onChange={(e) => setFormData({ ...formData, monthlyVolume: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                  >
                    <option value="৳৫০,০০০ - ৳২,০০,০০০">৳৫০,০০০ - ৳২,০০,০০০</option>
                    <option value="৳২,০০,০০০ - ৳১০,০০,০০০">৳২,০০,০০০ - ৳১০,০০,০০০</option>
                    <option value="৳১০,০০,০০০ - ৳৫০,০০,০০০">৳১০,০০,০০০ - ৳৫০,০০,০০০</option>
                    <option value="৳৫০,০০,০০০+">৳৫০,০০,০০০+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'অতিরিক্ত কোনো তথ্য বা রিকোয়ারমেন্ট (ঐচ্ছিক)' : 'Additional Notes / Requirements (Optional)'}
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your transaction workflow or any special features you need..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{lang === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Submitting Application...'}</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'আবেদন জমা দিন (Submit Application)' : 'Submit Application'}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-500 mt-3">
                {lang === 'bn'
                  ? '🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ এবং কোনো হিডেন চার্জ নেই। ২৪ ঘণ্টার মধ্যে আমাদের টিম আপনার সাথে যোগাযোগ করবে।'
                  : '🔒 Your data is fully encrypted and secure. Our onboarding specialist will contact you within 24 hours.'}
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              {lang === 'bn'
                ? 'SafnexBD এপিআই ব্যবহারের সাধারণ প্রশ্ন ও উত্তর।'
                : 'Everything you need to know about our Merchant API & SDK.'}
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                qEn: 'Do my customers need to create a SafnexBD account?',
                qBn: 'আমার ওয়েবসাইটের কাস্টমারদের কি SafnexBD-তে রেজিস্ট্রেশন করতে হবে?',
                aEn: 'No! With our Silent SSO mechanism, customers never leave your site. Their profile and wallet are auto-provisioned securely in the background using their user ID from your website.',
                aBn: 'না! কাস্টমারদের SafnexBD-তে আলাদা একাউন্ট খুলতে হবে না। আপনার সাইটের ইউজার আইডি দিয়েই স্বয়ংক্রিয়ভাবে ব্যাকএন্ডে ভার্চুয়াল ওয়ালেট তৈরি হয়ে যাবে।',
              },
              {
                qEn: 'How much is the platform commission fee?',
                qBn: 'প্ল্যাটফর্ম ফি বা কমিশন কত নেওয়া হয়?',
                aEn: 'There are no extra API charges or setup fees. Standard SafnexBD platform fees apply for wallet recharges, withdrawals, and escrow transactions as configured by admin.',
                aBn: 'API ব্যবহার করার জন্য কোনো অতিরিক্ত সেটআপ ফি বা মাসিক চার্জ নেই। সেফনেক্সবিডিতে রিচার্জ, উইথড্র ও ট্রানজেকশনের জন্য যে নিয়মিত প্ল্যাটফর্ম ফি নির্ধারিত আছে শুধু সেটাই প্রযোজ্য হবে।',
              },
              {
                qEn: 'Which payment methods are supported for wallet recharges?',
                qBn: 'ওয়ালেটে কি কি পেমেন্ট গেটওয়ের মাধ্যমে রিচার্জ করা যায়?',
                aEn: 'Instant automated recharge is supported via bKash Online Gateway and SSLCommerz (Visa, Mastercard, Nagad, Rocket, Upay, Internet Banking).',
                aBn: 'বিকাশ অনলাইন পেমেন্ট এবং SSLCommerz (ভিসা, মাস্টারকার্ড, নগদ, রকেট, উপায় ও নেট ব্যাংকিং) দিয়ে সরাসরি অটো রিচার্জ করা যায়।',
              },
              {
                qEn: 'How does withdrawal OTP security work?',
                qBn: 'উইথড্র করার সময় ওটিপি কিভাবে কাজ করে?',
                aEn: 'Whenever a user requests a payout to their bKash, Nagad, or Bank account, a 6-digit numeric OTP is dispatched to their phone/email. The payout is only approved once the OTP is verified.',
                aBn: 'কাস্টমার যখন বিকাশ, নগদ বা ব্যাংকে টাকা উইথড্র করতে চাইবে, তখন তার ফোনে বা ইমেইলে একটি ৬-সংখ্যার ওটিপি কোড যাবে। ওটিপি ছাড়া টাকা তোলা অসম্ভব।',
              },
              {
                qEn: 'How do I test before going live?',
                qBn: 'লাইভে যাওয়ার আগে টেস্ট করার সুবিধা আছে কি?',
                aEn: 'Yes! Upon submitting your application, you will receive Sandbox/Test credentials (app_test_...) to test all features locally without real money.',
                aBn: 'হ্যাঁ! আবেদন করলেই তাৎক্ষণিকভাবে টেস্ট স্যান্ডবক্স ক্রেডেনশিয়ালস (app_test_...) পাওয়া যায়, যা দিয়ে লোকালহোস্টে নিরাপদে টেস্ট করা সম্ভব।',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{lang === 'bn' ? faq.qBn : faq.qEn}</span>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">
                  {lang === 'bn' ? faq.aBn : faq.aEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Footer CTA Strip */}
      <section className="py-14 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black">
            {lang === 'bn'
              ? 'আজই আপনার সাইটে নিরাপদ পেমেন্ট ও এসক্রো ট্রাস্ট যুক্ত করুন'
              : 'Ready to Transform Your Website with Safe Escrow?'}
          </h2>
          <p className="text-xs sm:text-sm opacity-90 max-w-xl mx-auto">
            {lang === 'bn'
              ? 'আমাদের ইঞ্জিনিয়ার ও মার্চেন্ট সাপোর্ট টিম আপনাকে সম্পূর্ণ সেটআপে সরাসরি সহায়তা করবে।'
              : 'Our merchant integration engineers are available 24/7 to guide you through SDK and API setup.'}
          </p>
          <div className="pt-2">
            <button
              onClick={scrollToApply}
              className="px-8 py-3.5 rounded-2xl bg-white text-sky-700 font-extrabold text-sm sm:text-base shadow-xl hover:bg-slate-50 transition active:scale-95"
            >
              {lang === 'bn' ? 'আবেদন ফর্ম পূরণ করুন' : 'Get Started Now'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

