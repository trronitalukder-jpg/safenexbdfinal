'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Scale,
  ShoppingBag,
  MessageCircle,
  Download,
  Smartphone,
  Code2,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { usePwa } from '@/context/PwaContext';
import { getImageUrl } from '@/lib/imageUtils';

// Standalone SVG Icons for Social Media
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
  </svg>
);

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const Footer = () => {
  const { lang, t } = useLanguage();
  const { theme } = useTheme();
  const { settings } = useSettings();
  const { installApp, isInstalled } = usePwa();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) {
    return null;
  }

  const footer = settings.footer;
  const general = settings.general;

  // Compile active social links
  const socialLinks = [
    {
      label: 'Facebook',
      href: footer.socialFacebook,
      icon: FacebookIcon,
      hoverClass: 'hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300',
    },
    {
      label: 'YouTube',
      href: footer.socialYoutube,
      icon: YoutubeIcon,
      hoverClass: 'hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 hover:border-red-300',
    },
    {
      label: 'Telegram',
      href: footer.socialTelegram,
      icon: TelegramIcon,
      hoverClass: 'hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:border-sky-300',
    },
    {
      label: 'WhatsApp',
      href: footer.socialWhatsapp || (footer.whatsappNumber ? `https://wa.me/${footer.whatsappNumber.replace(/[^0-9]/g, '')}` : ''),
      icon: WhatsappIcon,
      hoverClass: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:border-emerald-300',
    },
    {
      label: 'Twitter / X',
      href: footer.socialTwitter,
      icon: TwitterIcon,
      hoverClass: 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400',
    },
    {
      label: 'LinkedIn',
      href: footer.socialLinkedin,
      icon: LinkedinIcon,
      hoverClass: 'hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-400',
    },
    {
      label: 'Instagram',
      href: footer.socialInstagram,
      icon: InstagramIcon,
      hoverClass: 'hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/50 hover:border-pink-300',
    },
  ].filter((s) => Boolean(s.href && s.href.trim()));

  // Render dynamic logo
  const renderLogo = () => {
    if (
      (general.logoType === 'IMAGE_URL' || general.logoType === 'IMAGE_UPLOAD') &&
      (general.logoLightUrl || general.logoDarkUrl)
    ) {
      const activeLogoUrl =
        theme === 'dark' && general.logoDarkUrl ? general.logoDarkUrl : general.logoLightUrl || general.logoDarkUrl;
      return (
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src={getImageUrl(activeLogoUrl)}
            alt={general.siteName || 'Logo'}
            className="h-9 w-auto max-w-[180px] object-contain"
          />
        </Link>
      );
    }

    if (general.logoType === 'TEXT') {
      return (
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span
            className="text-2xl font-black tracking-tight"
            style={{ color: general.logoAccent || undefined }}
          >
            {general.logoText || general.siteName || 'SafnexBD'}
          </span>
        </Link>
      );
    }

    // Default SafnexBD Brand
    return (
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Safnex<span className="text-sky-500">BD</span>
        </span>
      </Link>
    );
  };

  return (
    <footer className="bg-slate-100/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-[1650px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Col 1: Brand & Escrow Trust (Spans 2 cols on mobile & lg) */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 space-y-4">
            {renderLogo()}

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              {footer.aboutText ||
                (lang === 'bn'
                  ? 'বাংলাদেশের ১ নম্বর বিশ্বস্ত ও নিরপেক্ষ এসক্রো ট্রেডিং মার্কেটপ্লেস। প্রতিটি লেনদেনে আপনার অর্জিত অর্থ থাকে শতভাগ সুরক্ষিত ও ঝুঁকিমুক্ত।'
                  : 'Bangladesh’s premier safe escrow trading marketplace. Every deal and transaction is 100% safeguarded against fraud.')}
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{lang === 'bn' ? '১০০% ভেরিফাইড এসক্রো মধ্যস্থতা' : '100% Verified Escrow Protection'}</span>
            </div>

            {/* Quick Contact Micro Info */}
            <div className="space-y-2 pt-1 text-[12px] text-slate-600 dark:text-slate-400">
              {footer.supportPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                  <a
                    href={`tel:${footer.supportPhone.replace(/\s+/g, '')}`}
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition font-medium"
                  >
                    {footer.supportPhone} {lang === 'bn' ? '(২৪/৭ হেল্পলাইন)' : '(24/7 Helpline)'}
                  </a>
                </div>
              )}

              {footer.supportEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                  <a
                    href={`mailto:${footer.supportEmail}`}
                    className="hover:text-sky-600 dark:hover:text-sky-400 transition font-medium"
                  >
                    {footer.supportEmail}
                  </a>
                </div>
              )}

              {footer.whatsappNumber && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <a
                    href={
                      footer.socialWhatsapp ||
                      `https://wa.me/${footer.whatsappNumber.replace(/[^0-9]/g, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    WhatsApp: {footer.whatsappNumber}
                  </a>
                </div>
              )}

              {footer.officeAddress && (
                <div className="flex items-start gap-2 pt-0.5 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug text-[11px]">{footer.officeAddress}</span>
                </div>
              )}
            </div>

            {/* Social Media Links Strip */}
            {socialLinks.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  {lang === 'bn' ? 'সোশ্যাল মিডিয়ায় আমাদের সাথে থাকুন:' : 'Connect with us on social media:'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all shadow-sm ${s.hoverClass}`}
                    >
                      <s.icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Marketplace Deals */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? 'মার্কেটপ্লেস' : 'Marketplace'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/shop" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'শপ (SHOP)' : 'SHOP'}
                </Link>
              </li>
              <li>
                <Link href="/digital-products" className="hover:text-sky-600 dark:hover:text-white transition">
                  {t('digital_products')}
                </Link>
              </li>
              <li>
                <Link href="/physical-products" className="hover:text-sky-600 dark:hover:text-white transition">
                  {t('physical_products')}
                </Link>
              </li>
              <li>
                <Link href="/money-exchange" className="hover:text-sky-600 dark:hover:text-white transition">
                  {t('money_exchange')}
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="hover:text-sky-600 dark:hover:text-white transition">
                  {t('safe_transactions')}
                </Link>
              </li>
              <li>
                <Link href="/users" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'ভেরিফাইড ইউজার ডিরেক্টরি' : 'Verified Users'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company & Information (About, FAQ, Contact) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? 'কোম্পানি ও সাহায্য' : 'Company & Help'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about-us" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'আমাদের সম্পর্কে (About Us)' : 'About SafnexBD'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Help Center & FAQ'}
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-sky-600 dark:hover:text-white transition font-medium text-sky-600 dark:text-sky-400">
                  {lang === 'bn' ? '📚 সেফ ট্রেডিং গাইড (Guides)' : '📚 Safe Trading Guides'}
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'যোগাযোগ ও সহায়তা (Contact)' : 'Contact & Support'}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/chat" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'লাইভ সাপোর্ট চ্যাট' : 'Live Support Chat'}
                </Link>
              </li>
              <li>
                <Link
                  href="/partner-api"
                  className="hover:text-sky-600 dark:hover:text-white transition flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'মার্চেন্ট এপিআই ও পার্টনার্স' : 'Merchant API & Partners'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Safety, Escrow & Policies */}
          <div className="col-span-2 sm:col-span-1 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? 'নিরাপত্তা ও নীতিমালা' : 'Trust & Policies'}</span>
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/partner-api" className="hover:text-sky-600 dark:hover:text-white transition font-medium text-indigo-600 dark:text-indigo-400">
                  {lang === 'bn' ? '🚀 এপিআই আবেদন (API Apply)' : '🚀 Partner API Application'}
                </Link>
              </li>
              <li>
                <Link href="/escrow-rules" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'এসক্রো নিয়মাবলী (Escrow Rules)' : 'Escrow Protocol Rules'}
                </Link>
              </li>
              <li>
                <Link href="/dispute-policy" className="hover:text-sky-600 dark:hover:text-white transition font-medium text-amber-600 dark:text-amber-400">
                  {lang === 'bn' ? '⚖️ বিরোধ নিষ্পত্তি (Dispute Policy)' : '⚖️ Dispute Resolution Policy'}
                </Link>
              </li>
              <li>
                <Link href="/terms-conditions" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'ব্যবহারের শর্তাবলি (Terms)' : 'Terms and Conditions'}
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-sky-600 dark:hover:text-white transition">
                  {lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
                </Link>
              </li>
            </ul>

            {/* Payment Methods Badges */}
            <div className="pt-2">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {lang === 'bn' ? 'সমর্থিত পেমেন্ট মাধ্যম:' : 'Supported Payments:'}
              </p>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900/50">
                  bKash
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                  Nagad
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50">
                  Rocket
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">
                  Bank
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Merchant & API Banner in Footer */}
        <div className="mt-10 p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
                <span>
                  {lang === 'bn'
                    ? 'আপনার ওয়েবসাইটে SafnexBD এপিআই ও চ্যাট যুক্ত করতে চান?'
                    : 'Want to Integrate SafnexBD API on Your Website?'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                  DEVELOPERS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'WordPress, React, Laravel বা Python সাইটে সরাসরি ইনস্ট্যান্ট ওয়ালেট, রিচার্জ, ওটিপি উইথড্র ও এসক্রো ট্রানজেকশন চালু করুন।'
                  : 'Enable instant wallet, automated recharge, OTP payouts, and safe escrow deals on your platform via our SDK & REST API.'}
              </p>
            </div>
          </div>

          <Link
            href="/partner-api"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-95 flex-shrink-0"
          >
            <span>{lang === 'bn' ? 'এপিআই এর জন্য আবেদন করুন' : 'Apply for API Access'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* App Download / Install Banner in Footer */}
        <div className="mt-4 p-5 rounded-3xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent border border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {lang === 'bn' ? 'SafnexBD অ্যাপ আপনার ডিভাইসে ইনস্টল করুন' : 'Install SafnexBD App on your device'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'ব্রাউজার ছাড়াই মোবাইল ও কম্পিউটারে সরাসরি ১-ট্যাপে দ্রুত ও নিরাপদ এসক্রো লেনদেন করুন।'
                  : 'Fast, secure and convenient 1-tap escrow transactions on your mobile or desktop.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={installApp}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 transition active:scale-95 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>
              {isInstalled
                ? lang === 'bn'
                  ? '✓ অ্যাপ ইনস্টল করা আছে'
                  : '✓ App Installed'
                : lang === 'bn'
                ? 'অ্যাপ ইনস্টল করুন (Install App)'
                : 'Install Official App'}
            </span>
          </button>
        </div>

        {/* Bottom Bar: Copyright & Security Note */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 dark:text-slate-500 text-[11px]">
          <div>
            {footer.copyrightText ||
              `© ${new Date().getFullYear()} ${general.siteName || 'SafnexBD'} Escrow Platform. ${
                lang === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'
              }`}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {lang === 'bn'
                ? '১০০% নিরাপদ ও সুরক্ষিত এসক্রো ট্রানজ্যাকশন সিস্টেম'
                : '100% Secure & Encrypted Escrow Transactions'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
