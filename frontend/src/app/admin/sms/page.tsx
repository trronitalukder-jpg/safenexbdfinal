'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquareCode,
  Mail,
  ShieldCheck,
  FileText,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Send,
  Lock,
  Server,
  Zap,
  Check,
  ChevronDown,
  Info,
  Sliders,
  Sparkles,
  Radio,
  ExternalLink,
  Languages,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface SmsGatewayConfig {
  isEnabled: boolean;
  provider: string;
  apiUrl: string;
  httpMethod: 'GET' | 'POST';
  requestFormat: 'JSON' | 'FORM_URLENCODED' | 'QUERY_PARAMS';
  apiKey: string;
  apiSecret?: string;
  senderId?: string;
  customHeaders?: Record<string, string>;
  customParams?: Record<string, string>;
}

interface MailGatewayConfig {
  isEnabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
}

interface SecurityModesConfig {
  forgotPasswordMode: 'MANUAL' | 'OTP';
  withdrawOtpEnabled: boolean;
  otpExpiryMinutes: number;
  otpLength: number;
  cooldownSeconds: number;
}

interface TemplateItem {
  key: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  isEnabled: boolean;
  sendSms: boolean;
  sendEmail: boolean;
  templateBn: string;
  templateEn: string;
  variables: string[];
}

const SMS_PRESETS: Record<
  string,
  {
    name: string;
    apiUrl: string;
    httpMethod: 'GET' | 'POST';
    requestFormat: 'JSON' | 'FORM_URLENCODED' | 'QUERY_PARAMS';
    noteBn: string;
    noteEn: string;
  }
> = {
  custom: {
    name: 'Custom HTTP API',
    apiUrl: '',
    httpMethod: 'POST',
    requestFormat: 'JSON',
    noteBn: 'যেকোনো কাস্টম এসএমএস গেটওয়ে API ইউআরএল ও প্যারামিটার কনফিগার করুন',
    noteEn: 'Configure custom SMS Gateway API URL, HTTP method & parameters',
  },
  bulksmsbd: {
    name: 'BulkSMSBD (Bangladesh)',
    apiUrl: 'http://bulksmsbd.net/api/smsapi',
    httpMethod: 'POST',
    requestFormat: 'FORM_URLENCODED',
    noteBn: 'BulkSMSBD API v2 - API Key, Sender ID (Approved Masking/Non-masking) প্রদান করুন',
    noteEn: 'BulkSMSBD API v2 - Provide API Key, Sender ID (Approved Masking/Non-masking)',
  },
  greenweb: {
    name: 'Greenweb SMS (Bangladesh)',
    apiUrl: 'http://api.greenweb.com.bd/api.php',
    httpMethod: 'GET',
    requestFormat: 'QUERY_PARAMS',
    noteBn: 'Greenweb BD Token-based API (Query Parameters)',
    noteEn: 'Greenweb BD Token-based API (Query Parameters)',
  },
  mimsms: {
    name: 'MimSMS (Bangladesh)',
    apiUrl: 'https://api.mimsms.com/api/SmsSending/Send',
    httpMethod: 'POST',
    requestFormat: 'JSON',
    noteBn: 'MimSMS REST JSON Gateway (application/json)',
    noteEn: 'MimSMS REST JSON Gateway (application/json)',
  },
  twilio: {
    name: 'Twilio SMS (International)',
    apiUrl: 'https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json',
    httpMethod: 'POST',
    requestFormat: 'FORM_URLENCODED',
    noteBn: 'Twilio Cloud SMS - Account SID & Auth Token প্রয়োজন',
    noteEn: 'Twilio Cloud SMS - Requires Account SID & Auth Token',
  },
};

export default function AdminSmsSettingsPage() {
  const { lang, setLang } = useLanguage();

  const [activeTab, setActiveTab] = useState<'sms' | 'mail' | 'security' | 'templates'>('sms');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Main Configurations State
  const [smsConfig, setSmsConfig] = useState<SmsGatewayConfig>({
    isEnabled: false,
    provider: 'custom',
    apiUrl: '',
    httpMethod: 'POST',
    requestFormat: 'JSON',
    apiKey: '',
    apiSecret: '',
    senderId: 'SafnexBD',
    customHeaders: {},
    customParams: {},
  });

  const [mailConfig, setMailConfig] = useState<MailGatewayConfig>({
    isEnabled: false,
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: 'SafnexBD',
    fromEmail: 'noreply@safnexbd.com',
  });

  const [securityModes, setSecurityModes] = useState<SecurityModesConfig>({
    forgotPasswordMode: 'MANUAL',
    withdrawOtpEnabled: false,
    otpExpiryMinutes: 5,
    otpLength: 6,
    cooldownSeconds: 45,
  });

  const [templates, setTemplates] = useState<Record<string, TemplateItem>>({});

  // Testing Modals / Status
  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [testSmsMessage, setTestSmsMessage] = useState('');
  const [sendingTestSms, setSendingTestSms] = useState(false);
  const [testSmsResult, setTestSmsResult] = useState<any>(null);

  const [testMailTo, setTestMailTo] = useState('');
  const [testMailSubject, setTestMailSubject] = useState('');
  const [testMailBody, setTestMailBody] = useState('');
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const [testMailResult, setTestMailResult] = useState<any>(null);

  const [activeTemplatePreview, setActiveTemplatePreview] = useState<string | null>('withdraw_otp');

  // Load default test messages based on language
  useEffect(() => {
    if (lang === 'bn') {
      if (!testSmsMessage || testSmsMessage.includes('SafnexBD Test SMS')) {
        setTestSmsMessage('SafnexBD টেস্ট এসএমএস: আপনার গেটওয়ে কনফিগারেশন সফল হয়েছে!');
      }
      if (!testMailSubject || testMailSubject.includes('Test Email')) {
        setTestMailSubject('SafnexBD টেস্ট ইমেইল ভেরিফিকেশন');
      }
      if (!testMailBody || testMailBody.includes('test verification email')) {
        setTestMailBody('SafnexBD প্ল্যাটফর্ম থেকে পাঠানো পরীক্ষামূলক টেস্ট ইমেইল। আপনার SMTP কনফিগারেশন সঠিক রয়েছে।');
      }
    } else {
      if (!testSmsMessage || testSmsMessage.includes('টেস্ট এসএমএস')) {
        setTestSmsMessage('SafnexBD Test SMS: Your gateway integration is active and working!');
      }
      if (!testMailSubject || testMailSubject.includes('টেস্ট ইমেইল')) {
        setTestMailSubject('SafnexBD Test Email Verification');
      }
      if (!testMailBody || testMailBody.includes('পরীক্ষামূলক')) {
        setTestMailBody('This is a test verification email from SafnexBD Platform. Your SMTP setup is successful.');
      }
    }
  }, [lang]);

  // Load configuration from backend
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res: any = await api.get('/sms/config');
      if (res) {
        if (res.sms) {
          setSmsConfig((prev) => ({
            ...prev,
            ...res.sms,
            apiUrl: res.sms.apiUrl || '',
            apiKey: res.sms.apiKey || '',
            apiSecret: res.sms.apiSecret || '',
            senderId: res.sms.senderId || '',
          }));
        }
        if (res.mail) {
          setMailConfig((prev) => ({
            ...prev,
            ...res.mail,
            host: res.mail.host || '',
            username: res.mail.username || '',
            password: res.mail.password || '',
            fromName: res.mail.fromName || '',
            fromEmail: res.mail.fromEmail || '',
            port: res.mail.port ?? 587,
            secure: Boolean(res.mail.secure),
          }));
        }
        const modesData = res.securityModes || res.modes;
        if (modesData) {
          setSecurityModes((prev) => ({
            ...prev,
            ...modesData,
            forgotPasswordMode: modesData.forgotPasswordMode || 'MANUAL',
            withdrawOtpEnabled: Boolean(modesData.withdrawOtpEnabled),
            otpExpiryMinutes: modesData.otpExpiryMinutes ?? 5,
            otpLength: modesData.otpLength ?? 6,
            cooldownSeconds: modesData.cooldownSeconds ?? 45,
          }));
        }
        if (res.templates) {
          const normalized: Record<string, TemplateItem> = {};
          Object.entries(res.templates).forEach(([k, item]: [string, any]) => {
            normalized[k] = {
              ...item,
              templateBn: item.templateBn || '',
              templateEn: item.templateEn || '',
              isEnabled: Boolean(item.isEnabled),
              sendEmail: Boolean(item.sendEmail),
              sendSms: Boolean(item.sendSms),
            };
          });
          setTemplates(normalized);
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (lang === 'bn' ? 'কনফিগারেশন লোড করতে ব্যর্থ হয়েছে' : 'Failed to load configuration')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save all settings to backend
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setErrorMessage('');

      await api.post('/sms/config', {
        sms: smsConfig,
        mail: mailConfig,
        modes: securityModes,
        securityModes,
        templates,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (lang === 'bn' ? 'কনফিগারেশন সংরক্ষণ করতে ত্রুটি হয়েছে' : 'Failed to save configuration')
      );
    } finally {
      setSaving(false);
    }
  };

  // Preset Selection
  const handleSelectPreset = (presetKey: string) => {
    const preset = SMS_PRESETS[presetKey];
    if (!preset) return;

    setSmsConfig((prev) => ({
      ...prev,
      provider: presetKey,
      apiUrl: preset.apiUrl || prev.apiUrl,
      httpMethod: preset.httpMethod,
      requestFormat: preset.requestFormat,
    }));
  };

  // Test SMS execution
  const handleSendTestSms = async () => {
    if (!testSmsPhone.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর লিখুন' : 'Please enter receiver mobile number');
      return;
    }

    try {
      setSendingTestSms(true);
      setTestSmsResult(null);
      const res = await api.post('/sms/test-sms', {
        phone: testSmsPhone.trim(),
        message: testSmsMessage,
      });
      setTestSmsResult({ success: true, data: res });
    } catch (err: any) {
      setTestSmsResult({
        success: false,
        error: err?.message || (lang === 'bn' ? 'এসএমএস পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send SMS'),
      });
    } finally {
      setSendingTestSms(false);
    }
  };

  // Test Email execution
  const handleSendTestEmail = async () => {
    if (!testMailTo.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে প্রাপকের ইমেইল লিখুন' : 'Please enter recipient email address');
      return;
    }

    try {
      setSendingTestMail(true);
      setTestMailResult(null);
      const res = await api.post('/sms/test-email', {
        to: testMailTo.trim(),
        subject: testMailSubject,
        html: `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#0ea5e9;">SafnexBD Gateway Test</h2>
          <p>${testMailBody}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0;"/>
          <small style="color:#888;">Sent from Admin Test Tool at ${new Date().toLocaleString()}</small>
        </div>`,
      });
      setTestMailResult({ success: true, data: res });
    } catch (err: any) {
      setTestMailResult({
        success: false,
        error: err?.message || (lang === 'bn' ? 'ইমেইল পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send email'),
      });
    } finally {
      setSendingTestMail(false);
    }
  };

  // Helper to insert template variable tag into textarea
  const handleInsertVariable = (tplKey: string, langField: 'templateBn' | 'templateEn', varName: string) => {
    setTemplates((prev) => {
      const current = prev[tplKey];
      if (!current) return prev;
      const text = current[langField] || '';
      return {
        ...prev,
        [tplKey]: {
          ...current,
          [langField]: text + ` {${varName}} `,
        },
      };
    });
  };

  // Mock template preview string generator honoring current selected language
  const getCompiledPreview = (tpl: TemplateItem) => {
    const isBn = lang === 'bn';
    let text = isBn ? (tpl.templateBn || tpl.templateEn || '') : (tpl.templateEn || tpl.templateBn || '');

    const mocks: Record<string, string> = isBn
      ? {
          name: 'আহমেদ হাসান',
          otp: '৭৩৯২০১',
          expiry: '৫',
          amount: '২,৫০০',
          netAmount: '২,৪৬৫',
          method: 'bKash (01700-000000)',
          txId: 'TRX-948271',
          reason: 'ব্যালেন্স ও লেনদেন যাচাই সম্পন্ন',
          time: '০২:৩০ PM',
        }
      : {
          name: 'Ahmed Hasan',
          otp: '739201',
          expiry: '5',
          amount: '2,500',
          netAmount: '2,465',
          method: 'bKash (01700-000000)',
          txId: 'TRX-948271',
          reason: 'Transaction verified successfully',
          time: '02:30 PM',
        };

    Object.entries(mocks).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    return text;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <MessageSquareCode className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {lang === 'bn' ? 'এসএমএস ও গেটওয়ে কনফিগারেশন' : 'SMS & Gateways Configuration'}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                  Dual-Mode OTP Switch
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'এসএমএস গেটওয়ে API, মেইল গেটওয়ে, ওটিপি মোড এবং অটোমেটিক নোটিফিকেশন টেমপ্লেট পরিচালনা করুন'
                  : 'Configure SMS Gateway API, SMTP Mail Gateway, Dual-Mode OTP Security, and Auto-notification Templates'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Language Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Dual Language Switcher Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                lang === 'bn'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇧🇩 বাংলা</span>
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇬🇧 English</span>
            </button>
          </div>

          <button
            onClick={fetchConfig}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition"
            title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Data'}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            <Save className={`w-5 h-5 ${saving ? 'animate-spin' : ''}`} />
            <span>
              {saving
                ? lang === 'bn'
                  ? 'সংরক্ষণ হচ্ছে...'
                  : 'Saving...'
                : lang === 'bn'
                ? 'পরিবর্তন সংরক্ষণ করুন'
                : 'Save All Changes'}
            </span>
          </button>
        </div>
      </div>

      {/* Status Bar / Alerts */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">
            {lang === 'bn'
              ? 'সকল গেটওয়ে, সিকিউরিটি মোড ও এসএমএস সেটিংস সফলভাবে আপডেট হয়েছে!'
              : 'All gateways, security modes, and SMS templates have been successfully saved!'}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Quick Status Bar Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SMS Gateway Status */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${smsConfig.isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'এসএমএস গেটওয়ে' : 'SMS Gateway'}</p>
              <p className="text-sm font-semibold text-white">
                {smsConfig.isEnabled
                  ? lang === 'bn' ? 'চালু (Active)' : 'Active (Enabled)'
                  : lang === 'bn' ? 'বন্ধ (Disabled)' : 'Disabled (Off)'}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded font-medium ${smsConfig.isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
            {smsConfig.provider.toUpperCase()}
          </span>
        </div>

        {/* Mail Gateway Status */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${mailConfig.isEnabled ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'মেইল গেটওয়ে' : 'Mail Gateway (SMTP)'}</p>
              <p className="text-sm font-semibold text-white">
                {mailConfig.isEnabled
                  ? lang === 'bn' ? 'চালু (Active)' : 'Active (Enabled)'
                  : lang === 'bn' ? 'বন্ধ (Disabled)' : 'Disabled (Off)'}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Port {mailConfig.port}
          </span>
        </div>

        {/* Forgot Password Mode */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'পাসওয়ার্ড রিসেট মোড' : 'Password Reset Mode'}</p>
              <p className="text-sm font-semibold text-white">
                {securityModes.forgotPasswordMode === 'OTP'
                  ? lang === 'bn' ? 'ইনস্ট্যান্ট ওটিপি (OTP)' : 'Instant OTP'
                  : lang === 'bn' ? 'ম্যানুয়াল রিকোয়েস্ট (Default)' : 'Manual Request (Default)'}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-mono ${securityModes.forgotPasswordMode === 'OTP' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
            {securityModes.forgotPasswordMode}
          </span>
        </div>

        {/* Withdraw OTP Status */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${securityModes.withdrawOtpEnabled ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{lang === 'bn' ? 'উইথড্র ওটিপি সিকিউরিটি' : 'Withdrawal Security OTP'}</p>
              <p className="text-sm font-semibold text-white">
                {securityModes.withdrawOtpEnabled
                  ? lang === 'bn' ? 'ওটিপি আবশ্যক (ON)' : 'OTP Required (ON)'
                  : lang === 'bn' ? 'সরাসরি সাবমিট (OFF)' : 'Direct Submit (OFF)'}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${securityModes.withdrawOtpEnabled ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'}`}>
            {securityModes.withdrawOtpEnabled ? 'REQUIRED' : 'DIRECT'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'sms'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{lang === 'bn' ? 'এসএমএস গেটওয়ে (SMS Gateway)' : 'SMS Gateway'}</span>
        </button>

        <button
          onClick={() => setActiveTab('mail')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'mail'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>{lang === 'bn' ? 'মেইল গেটওয়ে (Mail Gateway / SMTP)' : 'Mail Gateway (SMTP)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'bn' ? 'সিকিউরিটি ও ওটিপি মোড (Dual-Mode Switches)' : 'Security & Dual-Mode OTP'}</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'templates'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>
            {lang === 'bn'
              ? `এসএমএস টেমপ্লেট ও ট্রিগার (${Object.keys(templates).length || 11})`
              : `Notification Templates & Triggers (${Object.keys(templates).length || 11})`}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* TAB 1: SMS GATEWAY                                                        */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'sms' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Config Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {lang === 'bn' ? 'এসএমএস গেটওয়ে মাস্টার সুইচ' : 'SMS Gateway Master Switch'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'সক্রিয় থাকলে প্ল্যাটফর্ম থেকে লাইভ SMS পাঠানো হবে। বন্ধ থাকলে কনসোলে সিমুলেট হবে যাতে সিস্টেম আটকে না থাকে।'
                      : 'When enabled, live SMS will be dispatched via provider. When disabled, SMS will be safely simulated in backend console so workflows do not freeze.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsConfig.isEnabled}
                    onChange={(e) => setSmsConfig({ ...smsConfig, isEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Provider Preset Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {lang === 'bn' ? 'জনপ্রিয় এসএমএস গেটওয়ে প্রিসেট নির্বাচন করুন' : 'Select SMS Gateway Provider Preset'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(SMS_PRESETS).map(([k, p]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleSelectPreset(k)}
                      className={`p-3 text-left border rounded-xl transition ${
                        smsConfig.provider === k
                          ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {lang === 'bn' ? p.noteBn : p.noteEn}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL & Method */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'গেটওয়ে API এন্ডপয়েন্ট (URL)' : 'Gateway API Endpoint (URL)'}
                  </label>
                  <input
                    type="text"
                    value={smsConfig.apiUrl || ''}
                    onChange={(e) => setSmsConfig({ ...smsConfig, apiUrl: e.target.value })}
                    placeholder="https://api.gateway.com/sms/send"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'এইচটিটিপি মেথড' : 'HTTP Method'}
                  </label>
                  <select
                    value={smsConfig.httpMethod || 'POST'}
                    onChange={(e) => setSmsConfig({ ...smsConfig, httpMethod: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
              </div>

              {/* Request Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {lang === 'bn' ? 'রিকোয়েস্ট ফরম্যাট / পে-লোড টাইপ' : 'Request Format / Payload Type'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      val: 'JSON',
                      labelBn: 'JSON বডি',
                      labelEn: 'JSON Body',
                      desc: 'application/json',
                    },
                    {
                      val: 'FORM_URLENCODED',
                      labelBn: 'ফর্ম ইউআরএল-এনকোডেড',
                      labelEn: 'Form URL-Encoded',
                      desc: 'POST form body',
                    },
                    {
                      val: 'QUERY_PARAMS',
                      labelBn: 'কোয়েরি প্যারামিটার',
                      labelEn: 'Query Parameters',
                      desc: 'GET / POST query string',
                    },
                  ].map((fmt) => (
                    <button
                      key={fmt.val}
                      type="button"
                      onClick={() => setSmsConfig({ ...smsConfig, requestFormat: fmt.val as any })}
                      className={`p-3 border rounded-xl text-left transition ${
                        smsConfig.requestFormat === fmt.val
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-semibold text-sm">
                        {lang === 'bn' ? fmt.labelBn : fmt.labelEn}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{fmt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'এপিআই কি / টোকেন (API Key)' : 'API Key / Token'}
                  </label>
                  <input
                    type="password"
                    value={smsConfig.apiKey || ''}
                    onChange={(e) => setSmsConfig({ ...smsConfig, apiKey: e.target.value })}
                    placeholder={
                      lang === 'bn'
                        ? 'এসএমএস প্রোভাইডারের API Key লিখুন'
                        : 'Enter API Key from SMS Provider'
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'সেন্ডার আইডি / মাস্কিং নাম' : 'Sender ID / Masking Name'}
                  </label>
                  <input
                    type="text"
                    value={smsConfig.senderId || ''}
                    onChange={(e) => setSmsConfig({ ...smsConfig, senderId: e.target.value })}
                    placeholder={lang === 'bn' ? 'যেমন: SafnexBD বা ৮৮০৯৬...' : 'e.g. SafnexBD or 88096...'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              {/* Optional Secret */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  {lang === 'bn' ? 'এপিআই সিক্রেট / পাসওয়ার্ড (ঐচ্ছিক)' : 'API Secret / Password (Optional)'}
                </label>
                <input
                  type="password"
                  value={smsConfig.apiSecret || ''}
                  onChange={(e) => setSmsConfig({ ...smsConfig, apiSecret: e.target.value })}
                  placeholder={
                    lang === 'bn'
                      ? 'প্রোভাইডারে সিক্রেট প্রয়োজন হলে লিখুন (যেমন: Twilio Auth Token)'
                      : 'Only if your provider requires Secret/Password (e.g. Twilio Auth Token)'
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Test SMS Side Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-semibold text-white">
                  {lang === 'bn' ? 'লাইভ টেস্ট এসএমএস পাঠান' : 'Send Live Test SMS'}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'কনফিগারেশন যাচাই করার জন্য যেকোনো নম্বরে একটি পরীক্ষামূলক টেস্ট SMS পাঠান।'
                  : 'Send a test SMS to any mobile number to verify your gateway integration.'}
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর (Receiver Phone)' : 'Receiver Mobile Phone'}
                  </label>
                  <input
                    type="text"
                    value={testSmsPhone || ''}
                    onChange={(e) => setTestSmsPhone(e.target.value)}
                    placeholder="017XXXXXXXX / 88017XXXXXXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    {lang === 'bn' ? 'টেস্ট মেসেজ' : 'Test Message'}
                  </label>
                  <textarea
                    rows={3}
                    value={testSmsMessage || ''}
                    onChange={(e) => setTestSmsMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestSms}
                  disabled={sendingTestSms}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm shadow-md transition disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${sendingTestSms ? 'animate-spin' : ''}`} />
                  <span>
                    {sendingTestSms
                      ? lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'
                      : lang === 'bn' ? 'টেস্ট এসএমএস পাঠান' : 'Send Test SMS'}
                  </span>
                </button>

                {testSmsResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-mono break-all mt-3 ${
                      testSmsResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <p className="font-semibold mb-1">
                      {testSmsResult.success
                        ? lang === 'bn' ? '✓ টেস্ট রিকোয়েস্ট সফল:' : '✓ Test Request Successful:'
                        : lang === 'bn' ? '✕ এরর মেসেজ:' : '✕ Error Message:'}
                    </p>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(testSmsResult.data || testSmsResult.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Info className="w-4 h-4 text-blue-400" />
                <span>
                  {lang === 'bn' ? 'সিমুলেশন মোড (Simulated Mode):' : 'Simulation Mode (Safe Fallback):'}
                </span>
              </div>
              <p>
                {lang === 'bn'
                  ? 'গেটওয়ে মাস্টার সুইচ বন্ধ থাকলে কোনো আসল এসএমএস API কল করা হয় না। কিন্তু ওটিপি ও নোটিফিকেশন কোড সার্ভারের টার্মিনালে ও লগ ফাইলে নিরাপদে প্রদর্শিত হয়।'
                  : 'When the master switch is disabled, no external API call is dispatched. Instead, OTP and notification codes are safely logged to the server terminal and database so operations never break.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* TAB 2: MAIL GATEWAY (SMTP)                                                */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'mail' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {lang === 'bn' ? 'মেইল গেটওয়ে (SMTP) মাস্টার সুইচ' : 'Mail Gateway (SMTP) Master Switch'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'সক্রিয় থাকলে ইউজারদের গুরুত্বপূর্ণ নোটিফিকেশন ও ওটিপি ইমেইলেও পাঠানো হবে।'
                      : 'When enabled, users will also receive critical alerts and OTP codes via email.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mailConfig.isEnabled}
                    onChange={(e) => setMailConfig({ ...mailConfig, isEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* SMTP Host & Port */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'এসএমটিপি সার্ভার হোস্ট (Host)' : 'SMTP Server Host'}
                  </label>
                  <input
                    type="text"
                    value={mailConfig.host || ''}
                    onChange={(e) => setMailConfig({ ...mailConfig, host: e.target.value })}
                    placeholder="smtp.gmail.com / mail.domain.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'পোর্ট (587 / 465)' : 'Port (587 / 465)'}
                  </label>
                  <input
                    type="number"
                    value={mailConfig.port ?? 587}
                    onChange={(e) => setMailConfig({ ...mailConfig, port: parseInt(e.target.value, 10) || 587 })}
                    placeholder="587"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* SSL/TLS Toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={Boolean(mailConfig.secure)}
                  onChange={(e) => setMailConfig({ ...mailConfig, secure: e.target.checked })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="smtpSecure" className="text-xs text-slate-300 cursor-pointer">
                  {lang === 'bn'
                    ? 'SSL/TLS কানেকশন (সাধারণত Port 465 এর জন্য টিক দিন, Port 587 এর জন্য আনচেক রাখুন)'
                    : 'SSL/TLS Connection (Check for Port 465, uncheck for Port 587 STARTTLS)'}
                </label>
              </div>

              {/* Auth Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'এসএমটিপি ইউজারনেম / ইমেইল' : 'SMTP Username / Email'}
                  </label>
                  <input
                    type="text"
                    value={mailConfig.username || ''}
                    onChange={(e) => setMailConfig({ ...mailConfig, username: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'এসএমটিপি পাসওয়ার্ড / অ্যাপ পাসওয়ার্ড' : 'SMTP Password / App Password'}
                  </label>
                  <input
                    type="password"
                    value={mailConfig.password || ''}
                    onChange={(e) => setMailConfig({ ...mailConfig, password: e.target.value })}
                    placeholder="Enter App Password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* From Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'প্রেরকের নাম (Sender Name)' : 'Sender Name'}
                  </label>
                  <input
                    type="text"
                    value={mailConfig.fromName || ''}
                    onChange={(e) => setMailConfig({ ...mailConfig, fromName: e.target.value })}
                    placeholder="SafnexBD Official"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    {lang === 'bn' ? 'প্রেরকের ইমেইল (From Email)' : 'From Email Address'}
                  </label>
                  <input
                    type="email"
                    value={mailConfig.fromEmail || ''}
                    onChange={(e) => setMailConfig({ ...mailConfig, fromEmail: e.target.value })}
                    placeholder="noreply@safnexbd.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test Mail Side Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Mail className="w-5 h-5" />
                <h3 className="font-semibold text-white">
                  {lang === 'bn' ? 'লাইভ টেস্ট ইমেইল পাঠান' : 'Send Live Test Email'}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'কনফিগারেশন যাচাই করতে যেকোনো ইমেইলে টেস্ট মেইল পাঠান।'
                  : 'Send a test verification email to any address to verify SMTP credentials.'}
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    {lang === 'bn' ? 'প্রাপকের ইমেইল (Recipient Email)' : 'Recipient Email'}
                  </label>
                  <input
                    type="email"
                    value={testMailTo || ''}
                    onChange={(e) => setTestMailTo(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইমেইল সাবজেক্ট (Subject)' : 'Email Subject'}
                  </label>
                  <input
                    type="text"
                    value={testMailSubject || ''}
                    onChange={(e) => setTestMailSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTestMail}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm shadow-md transition disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${sendingTestMail ? 'animate-spin' : ''}`} />
                  <span>
                    {sendingTestMail
                      ? lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'
                      : lang === 'bn' ? 'টেস্ট ইমেইল পাঠান' : 'Send Test Email'}
                  </span>
                </button>

                {testMailResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-mono break-all mt-3 ${
                      testMailResult.success
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <p className="font-semibold mb-1">
                      {testMailResult.success
                        ? lang === 'bn' ? '✓ ইমেইল রিকোয়েস্ট সফল:' : '✓ Email Sent Successfully:'
                        : lang === 'bn' ? '✕ এরর মেসেজ:' : '✕ Error Message:'}
                    </p>
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(testMailResult.data || testMailResult.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* TAB 3: SECURITY & DUAL-MODE SWITCHBOARD                                   */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Critical Guarantee Banner */}
          <div className="bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {lang === 'bn'
                    ? 'ডুয়েল-মোড সিকিউরিটি সুইচবোর্ড (Dual-Mode Fail-Safe System)'
                    : 'Dual-Mode Fail-Safe Security Switchboard'}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'bn'
                    ? 'বর্তমান এবং ভবিষ্যৎ উভয় সিস্টেমই এখানে সংরক্ষিত আছে। আপনি যেকোনো সময় সুইচ অন/অফ করতে পারেন। ওটিপি মোড বন্ধ থাকলে প্ল্যাটফর্মের পূর্ববর্তী সিস্টেম সরাসরি কাজ করবে (কোনো ঝামেলা ছাড়াই)। ওটিপি মোড চালু করলে এসএমএস গেটওয়ে ব্যবহার করে তাৎক্ষণিক ভেরিফিকেশন চালু হবে।'
                    : 'Both existing direct procedures and automated OTP methods are fully supported with instant fail-safe switching. When OTP is disabled, the platform retains existing direct submission without breaking. When enabled, instant OTP verification is enforced.'}
                </p>
              </div>
            </div>
          </div>

          {/* Warning when both gateways are disabled */}
          {!smsConfig.isEnabled && !mailConfig.isEnabled && (
            <div className="p-4 bg-amber-950/50 border border-amber-500/40 text-amber-300 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-200">
                  {lang === 'bn' ? 'সতর্কতা: কোনো গেটওয়ে চালু নেই' : 'Notice: All Gateways Disabled'}
                </p>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  {lang === 'bn'
                    ? 'এসএমএস গেটওয়ে এবং মেইল গেটওয়ে উভয়ই বন্ধ রয়েছে। তাই ওটিপি পাঠানো সম্ভব নয়—ফরগট পাসওয়ার্ড পেজে ওটিপি অপশন সম্পূর্ণ বন্ধ থাকবে (শুধুমাত্র ম্যানুয়াল রিকোয়েস্ট কাজ করবে)। ওটিপি ভেরিফিকেশন সক্রিয় করতে অন্তত একটি গেটওয়ে চালু করুন।'
                    : 'Both SMS and Mail gateways are currently disabled. Because no OTP can be delivered, the instant OTP option is automatically hidden from users on the forgot password page, retaining only manual ticket requests.'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Forgot Password Mode Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {lang === 'bn' ? 'ফরগট পাসওয়ার্ড মোড' : 'Forgot Password Mode'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn'
                      ? 'ইউজার পাসওয়ার্ড ভুলে গেলে কোন পদ্ধতিতে পুনরুদ্ধার করতে পারবে তা নির্ধারণ করুন'
                      : 'Select how users can recover their account password'}
                  </p>
                </div>
              </div>

              {/* Mode Option 1: Existing Manual Request */}
              <div
                onClick={() => setSecurityModes({ ...securityModes, forgotPasswordMode: 'MANUAL' })}
                className={`p-5 rounded-2xl border cursor-pointer transition relative ${
                  securityModes.forgotPasswordMode === 'MANUAL'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {lang === 'bn'
                          ? 'ম্যানুয়াল রিকোয়েস্ট (পূর্ববর্তী সিস্টেম - DEFAULT)'
                          : 'Manual Request (Existing System - DEFAULT)'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        MANUAL_REQUEST
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {lang === 'bn'
                        ? 'ইউজার ফর্ম পূরণ করে অ্যাডমিনের কাছে পাসওয়ার্ড পরিবর্তনের রিকোয়েস্ট পাঠাবে। অ্যাডমিন পর্যালোচনার পর পাসওয়ার্ড রিসেট করে দেবে। এসএমএস গেটওয়ে বা কোনো ওটিপির প্রয়োজন হয় না।'
                        : 'Users submit account details to request a password reset ticket. Admin manually reviews and resets it. No SMS gateway or OTP required.'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    securityModes.forgotPasswordMode === 'MANUAL'
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-slate-700'
                  }`}>
                    {securityModes.forgotPasswordMode === 'MANUAL' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Mode Option 2: Self-Service Instant OTP */}
              <div
                onClick={() => setSecurityModes({ ...securityModes, forgotPasswordMode: 'OTP' })}
                className={`p-5 rounded-2xl border cursor-pointer transition relative ${
                  securityModes.forgotPasswordMode === 'OTP'
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/5'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {lang === 'bn'
                          ? 'সেলফ-সার্ভিস ইনস্ট্যান্ট ওটিপি (SMS & Email OTP)'
                          : 'Self-Service Instant OTP (SMS & Email)'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                        SMS_OTP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {lang === 'bn'
                        ? 'ইউজার তার নিবন্ধিত ফোন নম্বরে বা ইমেইলে ৬-ডিজিটের নিরাপদ ওটিপি কোড পেয়ে সাথে সাথে সেলফ-সার্ভিসের মাধ্যমে নতুন পাসওয়ার্ড সেট করে নিতে পারবে।'
                        : 'Users receive an instant 6-digit numeric OTP on their registered phone or email to reset password on their own immediately.'}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    securityModes.forgotPasswordMode === 'OTP'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-slate-700'
                  }`}>
                    {securityModes.forgotPasswordMode === 'OTP' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Withdrawal Request OTP Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {lang === 'bn' ? 'উইথড্র সিকিউরিটি ওটিপি' : 'Withdrawal Security OTP'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn'
                      ? 'টাকা উত্তোলনের রিকোয়েস্ট দেওয়ার সময় ওটিপি ভেরিফিকেশন সক্রিয় করবেন কিনা'
                      : 'Choose whether to enforce OTP verification before submitting withdrawals'}
                  </p>
                </div>
              </div>

              {/* Master Withdrawal OTP Toggle */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <p className="font-semibold text-sm text-white">
                    {lang === 'bn'
                      ? 'উইথড্র সাবমিট করার পূর্বে ওটিপি যাচাই বাধ্যতামূলক করুন'
                      : 'Enforce OTP Verification Before Withdrawal Submission'}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {securityModes.withdrawOtpEnabled
                      ? lang === 'bn'
                        ? '✓ ওটিপি চালু আছে: ব্যালেন্স কাটার আগে ইউজারের মোবাইলে কোড পাঠানো হবে এবং কোড মিলিয়ে রিকোয়েস্ট নিশ্চিত করা হবে।'
                        : '✓ OTP Enabled: A 6-digit verification code is sent to user mobile before balance deduction.'
                      : lang === 'bn'
                      ? '✓ পূর্ববর্তী সিস্টেম চালু আছে: কোনো ওটিপি ছাড়াই ইউজার সরাসরি উইথড্র ফর্ম সাবমিট করতে পারবে।'
                      : '✓ Existing Mode Active: Users submit withdrawal requests directly without OTP verification.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={securityModes.withdrawOtpEnabled}
                    onChange={(e) =>
                      setSecurityModes({
                        ...securityModes,
                        withdrawOtpEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Global OTP Timing Settings */}
              <div className="pt-2 space-y-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {lang === 'bn' ? 'ওটিপি প্যারামিটার সেটিংস' : 'Global OTP Parameters'}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {lang === 'bn' ? 'ওটিপি মেয়াদ (মিনিট)' : 'OTP Expiry (Minutes)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={securityModes.otpExpiryMinutes}
                      onChange={(e) =>
                        setSecurityModes({
                          ...securityModes,
                          otpExpiryMinutes: parseInt(e.target.value, 10) || 5,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      {lang === 'bn' ? 'ওটিপি কোড দৈর্ঘ্য' : 'OTP Code Length'}
                    </label>
                    <select
                      value={securityModes.otpLength}
                      onChange={(e) =>
                        setSecurityModes({
                          ...securityModes,
                          otpLength: parseInt(e.target.value, 10) || 6,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
                    >
                      <option value={4}>4 Digits (e.g. 5821)</option>
                      <option value={6}>6 Digits (e.g. 739201)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? 'স্প্যাম ও ফ্লাডিং রোধে ৪৫ সেকেন্ড স্বয়ংক্রিয় কুলডাউন রেট-লিমিট সক্রিয় রয়েছে।'
                      : 'Automatic 45-second cooldown rate-limiting is active to prevent spam and flooding.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* TAB 4: SMS TRIGGER TEMPLATES                                              */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h3 className="font-bold text-white text-base">
                {lang === 'bn' ? 'এসএমএস নোটিফিকেশন টেমপ্লেট ও ট্রিগার' : 'SMS Notification Templates & Triggers'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? '১১টি গুরুত্বপূর্ণ ইভেন্টের জন্য বাংলা ও ইংরেজি এসএমএস মেসেজ ফরম্যাট এবং ডাইনামিক ভেরিয়েবল সেট করুন'
                  : 'Configure Bengali and English message formats with dynamic variables for 11 critical system events'}
              </p>
            </div>
            <div className="text-xs text-slate-400">
              {lang === 'bn' ? 'মোট ট্রিগার' : 'Total Triggers'}:{' '}
              <span className="text-blue-400 font-bold">{Object.keys(templates).length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of Triggers */}
            <div className="lg:col-span-2 space-y-4">
              {Object.entries(templates).map(([key, tpl]) => (
                <div
                  key={key}
                  className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition ${
                    activeTemplatePreview === key
                      ? 'border-blue-500/50 shadow-md shadow-blue-500/5'
                      : 'border-slate-800'
                  }`}
                  onClick={() => setActiveTemplatePreview(key)}
                >
                  {/* Card Header & Switches */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                        <MessageSquareCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          {lang === 'bn' ? tpl.titleBn : tpl.titleEn}
                          <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800">
                            {key}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          {lang === 'bn' ? tpl.descriptionBn : (tpl.titleEn || tpl.titleBn)}
                        </p>
                      </div>
                    </div>

                    {/* Individual Toggles */}
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.isEnabled}
                          onChange={(e) =>
                            setTemplates({
                              ...templates,
                              [key]: { ...tpl, isEnabled: e.target.checked },
                            })
                          }
                          className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>{lang === 'bn' ? 'সক্রিয় (ON)' : 'Active (ON)'}</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.sendEmail}
                          onChange={(e) =>
                            setTemplates({
                              ...templates,
                              [key]: { ...tpl, sendEmail: e.target.checked },
                            })
                          }
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span>{lang === 'bn' ? 'ইমেইল সহ' : 'Include Email'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Bangla Template Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">
                        {lang === 'bn' ? 'বাংলা এসএমএস ফরম্যাট (Bangla SMS Format)' : 'Bangla SMS Format'}
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {tpl.templateBn?.length || 0} {lang === 'bn' ? 'অক্ষর' : 'chars'}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={tpl.templateBn || ''}
                      onChange={(e) =>
                        setTemplates({
                          ...templates,
                          [key]: { ...tpl, templateBn: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white resize-none"
                    />
                  </div>

                  {/* English Template Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-400">
                        {lang === 'bn' ? 'ইংরেজি এসএমএস ফরম্যাট (English SMS Format)' : 'English SMS Format (Fallback)'}
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {tpl.templateEn?.length || 0} {lang === 'bn' ? 'অক্ষর' : 'chars'}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={tpl.templateEn || ''}
                      onChange={(e) =>
                        setTemplates({
                          ...templates,
                          [key]: { ...tpl, templateEn: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono resize-none"
                    />
                  </div>

                  {/* Available Dynamic Variables Tags */}
                  <div className="pt-1">
                    <p className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                      <span>{lang === 'bn' ? 'ক্লিক করে ভেরিয়েবল যুক্ত করুন:' : 'Click to insert dynamic variable:'}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.variables?.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            handleInsertVariable(
                              key,
                              lang === 'bn' ? 'templateBn' : 'templateEn',
                              v
                            )
                          }
                          className="px-2 py-0.5 text-xs bg-slate-800 hover:bg-blue-600/30 text-blue-300 border border-slate-700 hover:border-blue-500/50 rounded-md font-mono transition"
                        >
                          +{`{${v}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Preview Side Box */}
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-6 space-y-4">
                <div className="flex items-center gap-2 text-blue-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-semibold text-white">
                    {lang === 'bn' ? 'লাইভ প্রিভিউ (Live SMS Preview)' : 'Live SMS Preview'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'ইউজারের মোবাইল ফোনে এসএমএসটি যেভাবে দেখাবে:'
                    : 'How the message appears on user mobile phone:'}
                </p>

                {activeTemplatePreview && templates[activeTemplatePreview] ? (
                  <div className="space-y-3 pt-2">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                        <span className="text-xs font-semibold text-blue-400">
                          {smsConfig.senderId || 'SafnexBD'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {lang === 'bn' ? 'এখনই' : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {getCompiledPreview(templates[activeTemplatePreview])}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
                      <p className="text-slate-300 font-semibold">
                        {lang === 'bn' ? 'নির্বাচিত ট্রিগার:' : 'Selected Trigger:'}
                      </p>
                      <p>
                        {lang === 'bn'
                          ? templates[activeTemplatePreview].titleBn
                          : templates[activeTemplatePreview].titleEn}
                      </p>
                      <p className="text-slate-500 font-mono text-[11px]">
                        Event: {templates[activeTemplatePreview].key}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    {lang === 'bn'
                      ? 'প্রিভিউ দেখতে যেকোনো টেমপ্লেট কার্ডে ক্লিক করুন'
                      : 'Click any template card to inspect live preview'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
