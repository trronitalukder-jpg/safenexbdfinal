'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  CreditCard,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  X,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Moon,
  Sun,
  Globe,
  Bell,
  Smartphone,
  Building2,
  Star,
  Check,
  Copy,
  Laptop,
  CheckSquare,
  Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { compressImage, getImageUrl } from '@/lib/imageUtils';

const BANGLADESH_BANKS = [
  'Dutch-Bangla Bank PLC (DBBL)',
  'BRAC Bank PLC',
  'Islami Bank Bangladesh PLC',
  'The City Bank Limited',
  'Eastern Bank PLC (EBL)',
  'Sonali Bank PLC',
  'Mutual Trust Bank PLC (MTB)',
  'United Commercial Bank (UCB)',
  'Pubali Bank PLC',
  'Southeast Bank Limited',
  'Standard Chartered Bank Bangladesh',
  'Prime Bank PLC',
  'Dhaka Bank PLC',
  'Trust Bank Limited',
  'Al-Arafah Islami Bank PLC',
  'First Security Islami Bank PLC',
  'Bank Asia PLC',
  'Jamuna Bank PLC',
  'NCC Bank PLC',
  'Mercantile Bank PLC',
  'Shahjalal Islami Bank PLC',
  'EXIM Bank Bangladesh',
  'One Bank PLC',
  'Social Islami Bank PLC',
  'Uttara Bank PLC',
  'Janata Bank PLC',
  'Agrani Bank PLC',
  'Rupali Bank PLC',
  'OTHER',
];

type TabType = 'profile' | 'password' | 'payouts' | 'preferences' | 'security';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'profile';

  const { user, refreshMe } = useAuthStore();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { permission: notifPermission, requestPermission, soundEnabled, toggleSound, sendNotification } = useNotification();
  const [testingNotif, setTestingNotif] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Profile Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Payment Accounts state
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  // Add Account form state
  const [methodType, setMethodType] = useState('BKASH');
  const [accountType, setAccountType] = useState<'PERSONAL' | 'AGENT' | 'MERCHANT'>('PERSONAL');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('Dutch-Bangla Bank PLC (DBBL)');
  const [customBankName, setCustomBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [isDefaultAccount, setIsDefaultAccount] = useState(true);
  const [accountPassword, setAccountPassword] = useState('');
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [addAccountError, setAddAccountError] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Edit Account state
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [editMethodType, setEditMethodType] = useState('BKASH');
  const [editAccountType, setEditAccountType] = useState<'PERSONAL' | 'AGENT' | 'MERCHANT'>('PERSONAL');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountName, setEditAccountName] = useState('');
  const [editBankName, setEditBankName] = useState('Dutch-Bangla Bank PLC (DBBL)');
  const [editCustomBankName, setEditCustomBankName] = useState('');
  const [editBranchName, setEditBranchName] = useState('');
  const [editRoutingNumber, setEditRoutingNumber] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editAccountError, setEditAccountError] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  // Delete Account Confirmation Modal state
  const [deletingAccount, setDeletingAccount] = useState<any | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Advance Preference toggles (saved to localStorage)
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('safnexbd_sound_alerts');
      return val !== null ? val === 'true' : true;
    }
    return true;
  });

  const [emailAlerts, setEmailAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('safnexbd_email_alerts');
      return val !== null ? val === 'true' : true;
    }
    return true;
  });

  const [pushAlerts, setPushAlerts] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('safnexbd_push_alerts');
      return val !== null ? val === 'true' : true;
    }
    return true;
  });

  const [copiedId, setCopiedId] = useState(false);

  const handleCopyUserId = () => {
    if (!user?.uniqueUserId) return;
    navigator.clipboard.writeText(user.uniqueUserId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleSound = () => {
    const nextVal = !soundAlerts;
    setSoundAlerts(nextVal);
    localStorage.setItem('safnexbd_sound_alerts', String(nextVal));
  };

  const handleToggleEmail = () => {
    const nextVal = !emailAlerts;
    setEmailAlerts(nextVal);
    localStorage.setItem('safnexbd_email_alerts', String(nextVal));
  };

  const handleTogglePush = () => {
    const nextVal = !pushAlerts;
    setPushAlerts(nextVal);
    localStorage.setItem('safnexbd_push_alerts', String(nextVal));
  };

  const handleTestNotification = async () => {
    setTestingNotif(true);
    try {
      await sendNotification(
        '🔔 SafnexBD টেস্ট নোটিফিকেশন',
        {
          body: 'অভিনন্দন! আপনার ফোন ও কম্পিউটারে ব্রাউজার নোটিফিকেশন সফলভাবে কাজ করছে। নতুন মেসেজ আসলে এভাবে দেখতে পাবেন।',
          icon: '/icon-192.png',
        },
        '/dashboard/settings?tab=preferences',
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setTestingNotif(false), 1200);
    }
  };

  const loadPaymentAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res: any = await api.get('/users/payment-accounts');
      setPaymentAccounts(Array.isArray(res) ? res : res?.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setAddress(user.address || '');
      setBusinessName(user.businessName || '');
      setBusinessType(user.businessType || '');
      setAvatarPreview(user.avatarUrl || null);
    }
    loadPaymentAccounts();
  }, [user]);

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setAvatarMessage({
        type: 'error',
        text: lang === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ২০ মেগাবাইট হতে পারে' : 'Image size must not exceed 20MB',
      });
      return;
    }

    setUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      const { base64Data, fileName } = await compressImage(file, 800, 800, 0.85);
      setAvatarPreview(base64Data);

      const uploadRes: any = await api.post('/uploads', {
        base64Data,
        fileName,
        folder: 'avatars',
      });

      const fileUrl = uploadRes?.fileUrl || uploadRes?.data?.fileUrl;
      if (!fileUrl) {
        throw new Error('Upload response missing file URL');
      }

      await api.patch('/users/profile', {
        avatarUrl: fileUrl,
      });

      await refreshMe();

      setAvatarMessage({
        type: 'success',
        text: lang === 'bn' ? 'প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!' : 'Profile picture updated successfully!',
      });
    } catch (err: any) {
      setAvatarMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || (lang === 'bn' ? 'ছবি আপলোড ব্যর্থ হয়েছে' : 'Failed to upload photo'),
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = async () => {
    if (!confirm(lang === 'bn' ? 'আপনি কি প্রোফাইল ছবি মুছে ফেলতে চান?' : 'Remove profile picture?')) return;
    setUploadingAvatar(true);
    setAvatarMessage(null);

    try {
      await api.patch('/users/profile', {
        avatarUrl: '',
      });
      setAvatarPreview(null);
      await refreshMe();
      setAvatarMessage({
        type: 'success',
        text: lang === 'bn' ? 'প্রোফাইল ছবি সরানো হয়েছে' : 'Profile picture removed',
      });
    } catch (err: any) {
      setAvatarMessage({
        type: 'error',
        text: err.message || 'Failed to remove avatar',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setSavingProfile(true);

    try {
      await api.patch('/users/profile', {
        firstName,
        lastName,
        address,
        businessName,
        businessType,
      });
      await refreshMe();
      setProfileMessage(lang === 'bn' ? 'প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile information updated successfully!');
      setTimeout(() => setProfileMessage(''), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError(lang === 'bn' ? 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না!' : 'New password and confirmation password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(lang === 'bn' ? 'পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters long');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(lang === 'bn' ? 'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে ভিন্ন হতে হবে' : 'New password must be different from current password');
      return;
    }

    setPasswordLoading(true);

    try {
      const res: any = await api.patch('/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordMessage(
        res?.message || (lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password changed successfully!')
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 5000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: lang === 'bn' ? 'দুর্বল' : 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: lang === 'bn' ? 'মাঝারি' : 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score: 3, label: lang === 'bn' ? 'শক্তিশালী' : 'Good', color: 'bg-sky-500' };
    return { score: 4, label: lang === 'bn' ? 'অত্যন্ত নিরাপদ' : 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(newPassword);

  // Add Payment Account
  const handleAddPaymentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAccountError('');

    if (!accountNumber.trim()) {
      setAddAccountError(lang === 'bn' ? 'অ্যাকাউন্ট নম্বর দিন' : 'Account number is required');
      return;
    }

    if (!accountName.trim()) {
      setAddAccountError(lang === 'bn' ? 'অ্যাকাউন্টধারীর নাম দিন' : 'Account holder name is required');
      return;
    }

    if (methodType === 'BANK') {
      const finalBank = bankName === 'OTHER' ? customBankName.trim() : bankName.trim();
      if (!finalBank) {
        setAddAccountError(lang === 'bn' ? 'ব্যাংকের নাম দিন' : 'Bank name is required');
        return;
      }
      if (!routingNumber.trim()) {
        setAddAccountError(lang === 'bn' ? 'ব্যাংক রাউটিং নম্বর আবশ্যক' : 'Bank routing number is required');
        return;
      }
    }

    if (!accountPassword.trim()) {
      setAddAccountError(lang === 'bn' ? 'নিরাপত্তার জন্য আপনার অ্যাকাউন্ট পাসওয়ার্ড দিন' : 'Account password is required for security');
      return;
    }

    setIsSavingAccount(true);
    try {
      await api.post('/users/payment-accounts', {
        methodType,
        accountType,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        bankName: methodType === 'BANK' ? (bankName === 'OTHER' ? customBankName.trim() : bankName.trim()) : undefined,
        branchName: methodType === 'BANK' ? branchName.trim() || undefined : undefined,
        routingNumber: methodType === 'BANK' ? routingNumber.trim() || undefined : undefined,
        isDefault: isDefaultAccount,
        password: accountPassword.trim(),
      });

      setShowAddAccountModal(false);
      setAccountNumber('');
      setAccountName('');
      setAccountPassword('');
      setBankName('Dutch-Bangla Bank PLC (DBBL)');
      setCustomBankName('');
      setBranchName('');
      setRoutingNumber('');
      setIsDefaultAccount(true);
      loadPaymentAccounts();
    } catch (err: any) {
      setAddAccountError(err.response?.data?.message || err.message || 'Failed to save account');
    } finally {
      setIsSavingAccount(false);
    }
  };

  // Open Edit Modal prefilled with account details
  const handleStartEditAccount = (acc: any) => {
    setEditingAccount(acc);
    setEditMethodType(acc.methodType || 'BKASH');
    setEditAccountType(acc.accountType || 'PERSONAL');
    setEditAccountNumber(acc.accountNumber || '');
    setEditAccountName(acc.accountName || '');
    if (acc.bankName) {
      if (BANGLADESH_BANKS.includes(acc.bankName)) {
        setEditBankName(acc.bankName);
        setEditCustomBankName('');
      } else {
        setEditBankName('OTHER');
        setEditCustomBankName(acc.bankName);
      }
    } else {
      setEditBankName('Dutch-Bangla Bank PLC (DBBL)');
      setEditCustomBankName('');
    }
    setEditBranchName(acc.branchName || '');
    setEditRoutingNumber(acc.routingNumber || '');
    setEditIsDefault(Boolean(acc.isDefault));
    setEditPassword('');
    setShowEditPassword(false);
    setEditAccountError('');
  };

  // Submit Account Edit with Password
  const handleUpdatePaymentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditAccountError('');

    if (!editAccountNumber.trim()) {
      setEditAccountError(lang === 'bn' ? 'অ্যাকাউন্ট নম্বর দিন' : 'Account number is required');
      return;
    }

    if (!editAccountName.trim()) {
      setEditAccountError(lang === 'bn' ? 'অ্যাকাউন্টধারীর নাম দিন' : 'Account holder name is required');
      return;
    }

    if (editMethodType === 'BANK') {
      const finalBank = editBankName === 'OTHER' ? editCustomBankName.trim() : editBankName.trim();
      if (!finalBank) {
        setEditAccountError(lang === 'bn' ? 'ব্যাংকের নাম দিন' : 'Bank name is required');
        return;
      }
      if (!editRoutingNumber.trim()) {
        setEditAccountError(lang === 'bn' ? 'ব্যাংক রাউটিং নম্বর আবশ্যক' : 'Bank routing number is required');
        return;
      }
    }

    if (!editPassword.trim()) {
      setEditAccountError(lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করতে আপনার পাসওয়ার্ড দিন' : 'Password is required to save changes');
      return;
    }

    setIsUpdatingAccount(true);
    try {
      await api.put(`/users/payment-accounts/${editingAccount.id}`, {
        methodType: editMethodType,
        accountType: editAccountType,
        accountNumber: editAccountNumber.trim(),
        accountName: editAccountName.trim(),
        bankName: editMethodType === 'BANK' ? (editBankName === 'OTHER' ? editCustomBankName.trim() : editBankName.trim()) : undefined,
        branchName: editMethodType === 'BANK' ? editBranchName.trim() || undefined : undefined,
        routingNumber: editMethodType === 'BANK' ? editRoutingNumber.trim() || undefined : undefined,
        isDefault: editIsDefault,
        password: editPassword.trim(),
      });

      setEditingAccount(null);
      setEditPassword('');
      loadPaymentAccounts();
    } catch (err: any) {
      setEditAccountError(err.response?.data?.message || err.message || 'Failed to update account');
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  // Open Delete Confirmation Modal with Password
  const handleStartDeleteAccount = (acc: any) => {
    setDeletingAccount(acc);
    setDeletePassword('');
    setShowDeletePassword(false);
    setDeleteAccountError('');
  };

  // Submit Delete Account with Password
  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingAccount) return;
    setDeleteAccountError('');

    if (!deletePassword.trim()) {
      setDeleteAccountError(lang === 'bn' ? 'অ্যাকাউন্ট মুছতে আপনার পাসওয়ার্ড দিন' : 'Password is required to delete account');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await api.delete(`/users/payment-accounts/${deletingAccount.id}`, {
        data: { password: deletePassword.trim() },
        params: { password: deletePassword.trim() },
      });

      setDeletingAccount(null);
      setDeletePassword('');
      loadPaymentAccounts();
    } catch (err: any) {
      setDeleteAccountError(err.response?.data?.message || err.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Set Default Account
  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await api.patch(`/users/payment-accounts/${id}/default`);
      loadPaymentAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to set default account');
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-sky-500/10 text-sky-500 dark:bg-sky-500/20">
              <Settings className="w-6 h-6" />
            </div>
            <span>{lang === 'bn' ? 'অ্যাকাউন্ট সেটিংস ও নিরাপত্তা' : 'Account & Security Settings'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'bn'
              ? 'প্রোফাইল আপডেট, পাসওয়ার্ড পরিবর্তন, উইথড্র অ্যাকাউন্ট ম্যানেজমেন্ট এবং সিকিউরিটি কনফিগারেশন।'
              : 'Manage profile, change password, configure saved withdrawal payout accounts, and security preferences.'}
          </p>
        </div>

        {/* Quick User ID Tag */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 px-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs shadow-xs self-start sm:self-auto">
          <span className="text-slate-400 font-medium">User ID:</span>
          <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{user?.uniqueUserId || '...'}</span>
          <button
            type="button"
            onClick={handleCopyUserId}
            title={lang === 'bn' ? 'কপি করুন' : 'Copy ID'}
            className="p-1 text-slate-400 hover:text-sky-600 transition"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{lang === 'bn' ? 'প্রোফাইল তথ্য' : 'Profile Details'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
            activeTab === 'password'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
            activeTab === 'payouts'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{lang === 'bn' ? 'উইথড্র অ্যাকাউন্ট' : 'Saved Payouts'}</span>
          {paymentAccounts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-extrabold">
              {paymentAccounts.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
            activeTab === 'preferences'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'bn' ? 'পছন্দ ও ডিসপ্লে' : 'Preferences & Display'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নিরাপত্তা ও অ্যাক্টিভিটি' : 'Security & Activity'}</span>
        </button>
      </div>

      {/* TAB 1: PROFILE DETAILS */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? 'ব্যক্তিগত তথ্য ও প্রোফাইল ছবি' : 'Personal Details & Profile Picture'}</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'আপনার তথ্য ক্রেতা ও বিক্রেতারা দেখতে পাবেন' : 'Visible on public trade profiles'}
            </span>
          </div>

          {/* Profile Picture Upload Section */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-850/50 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black relative">
                {avatarPreview ? (
                  <img
                    src={getImageUrl(avatarPreview)}
                    alt={user?.firstName || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.firstName?.charAt(0) || 'U'}</span>
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Quick Camera Click Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                title={lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Avatar'}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-md border-2 border-white dark:border-slate-900 transition hover:scale-105"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                <span>{lang === 'bn' ? 'প্রোফাইল ছবি (Avatar)' : 'Profile Picture'}</span>
                {user?.isVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-md">
                {lang === 'bn'
                  ? 'একটি স্পষ্ট প্রোফাইল ছবি যুক্ত করুন যাতে ট্রেডার ও বায়াররা সহজেই আপনাকে চিনতে পারে। সমর্থিত ফরম্যাট: JPG, PNG, WebP (সর্বোচ্চ ২০MB, স্বয়ংক্রিয় কম্প্রেস)।'
                  : 'Upload a clear profile photo to build trust with buyers and traders. Supported: JPG, PNG, WebP (Max 20MB, auto-compressed).'}
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Photo'}</span>
                </button>

                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition"
                  >
                    {lang === 'bn' ? 'ছবি মুছুন' : 'Remove Photo'}
                  </button>
                )}
              </div>

              {/* Avatar feedback */}
              {avatarMessage && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] flex items-center gap-2 mt-2 ${
                    avatarMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{avatarMessage.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {profileMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}
          {profileError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'প্রথম নাম (First Name) *' : 'First Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'শেষ নাম (Last Name) *' : 'Last Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ফোন নম্বর (নিরাপত্তার কারণে লকড)' : 'Phone Number (Locked)'}
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.phone || ''}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono opacity-80 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-80 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ব্যবসা বা দোকানের নাম (ঐচ্ছিক)' : 'Business / Store Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. TrustTech Solutions"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ব্যবসার ধরন (ঐচ্ছিক)' : 'Business Type (Optional)'}
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">{lang === 'bn' ? '-- নির্বাচন করুন --' : '-- Select Type --'}</option>
                  <option value="INDIVIDUAL">{lang === 'bn' ? 'ব্যক্তিগত ফ্রিল্যান্সার / ট্রেডার' : 'Individual / Trader'}</option>
                  <option value="E_COMMERCE">{lang === 'bn' ? 'ই-কমার্স শপ / অনলাইন পেজ' : 'E-Commerce / Online Store'}</option>
                  <option value="AGENCY">{lang === 'bn' ? 'এজেন্সি / আইটি ফার্ম' : 'Agency / IT Firm'}</option>
                  <option value="SERVICE_PROVIDER">{lang === 'bn' ? 'সার্ভিস প্রোভাইডার' : 'Service Provider'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {lang === 'bn' ? 'ঠিকানা (Address)' : 'Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. House 12, Road 4, Banani, Dhaka"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {savingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CHANGE PASSWORD */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Your Password'}</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'নিয়মিত পাসওয়ার্ড পরিবর্তন অ্যাকাউন্ট সুরক্ষিত রাখে' : 'Protects your wallet & escrow deals'}
            </span>
          </div>

          {passwordMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            {/* Current Password */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড (Current Password) *' : 'Current Password *'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={lang === 'bn' ? 'বর্তমান পাসওয়ার্ড দিন' : 'Enter current password'}
                  className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {lang === 'bn' ? 'নতুন পাসওয়ার্ড (New Password) *' : 'New Password *'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === 'bn' ? 'কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড' : 'At least 6 characters'}
                  className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {newPassword && (
                <div className="mt-2 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {lang === 'bn' ? 'পাসওয়ার্ড শক্তি:' : 'Password Strength:'}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{pwdStrength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwdStrength.color}`}
                      style={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {lang === 'bn' ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন (Confirm Password) *' : 'Confirm New Password *'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === 'bn' ? 'একই পাসওয়ার্ড পুনরায় দিন' : 'Re-type new password'}
                  className="w-full pr-10 pl-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {lang === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Guidelines Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1 text-[11px] text-slate-500">
              <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'পাসওয়ার্ড সিকিউরিটি নির্দেশিকা:' : 'Password Security Rules:'}
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3 h-3 ${newPassword.length >= 6 ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{lang === 'bn' ? 'কমপক্ষে ৬টি ক্যারেক্টার' : 'At least 6 characters'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3 h-3 ${/[A-Z]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{lang === 'bn' ? 'কমপক্ষে একটি বড় হাতের অক্ষর (A-Z)' : 'At least one uppercase letter'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3 h-3 ${/[0-9]/.test(newPassword) ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span>{lang === 'bn' ? 'কমপক্ষে একটি সংখ্যা (0-9)' : 'At least one numeric digit'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {passwordLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SAVED PAYOUT / WITHDRAWAL ACCOUNTS */}
      {activeTab === 'payouts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'bn' ? 'সেভ করা উইথড্র ও পে-আউট অ্যাকাউন্টস' : 'Saved Payout & Withdrawal Accounts'}</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'আপনার বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্ট সেভ করে রাখুন যাতে ১-ক্লিকে টাকা তুলতে পারেন।'
                  : 'Save your bKash, Nagad, Rocket or Bank accounts for faster 1-click withdrawals.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAddAccountError('');
                setShowAddAccountModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'bn' ? 'নতুন অ্যাকাউন্ট যোগ করুন' : 'Add New Account'}</span>
            </button>
          </div>

          {loadingAccounts ? (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-500" />
              <span>{lang === 'bn' ? 'অ্যাকাউন্ট লোড হচ্ছে...' : 'Loading saved accounts...'}</span>
            </div>
          ) : paymentAccounts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
              <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'কোনো সেভ করা অ্যাকাউন্ট নেই' : 'No saved payment accounts yet'}
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  {lang === 'bn'
                    ? 'টাকা উত্তোলনের সময় প্রতিবার নম্বর লেখার ঝামেলা এড়াতে এখনই বিকাশ, নগদ বা ব্যাংক একাউন্ট সেভ করুন।'
                    : 'Save your bKash, Nagad or Bank account to withdraw funds directly with a single click.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold inline-flex items-center gap-1.5 text-xs shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'প্রথম অ্যাকাউন্ট যোগ করুন' : 'Add First Account'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {paymentAccounts.map((acc) => {
                const isBkash = acc.methodType === 'BKASH';
                const isNagad = acc.methodType === 'NAGAD';
                const isRocket = acc.methodType === 'ROCKET';
                const isBank = acc.methodType === 'BANK';

                let brandColor = isBkash
                  ? 'border-[#E2136E]/30 bg-[#E2136E]/5 hover:border-[#E2136E]/50'
                  : isNagad
                  ? 'border-[#F7941D]/30 bg-[#F7941D]/5 hover:border-[#F7941D]/50'
                  : isRocket
                  ? 'border-[#8C3494]/30 bg-[#8C3494]/5 hover:border-[#8C3494]/50'
                  : isBank
                  ? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40';

                let badgeColor = isBkash
                  ? 'bg-[#E2136E] text-white'
                  : isNagad
                  ? 'bg-[#F7941D] text-white'
                  : isRocket
                  ? 'bg-[#8C3494] text-white'
                  : isBank
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white';

                return (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-2xl border transition relative flex flex-col justify-between gap-3 ${brandColor}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wide ${badgeColor}`}>
                          {acc.methodType}
                        </span>
                        {acc.accountType && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {acc.accountType}
                          </span>
                        )}
                        {acc.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-emerald-500" />
                            <span>{lang === 'bn' ? 'ডিফল্ট' : 'Default'}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditAccount(acc)}
                          title={lang === 'bn' ? 'অ্যাকাউন্ট এডিট করুন' : 'Edit Account'}
                          className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartDeleteAccount(acc)}
                          title={lang === 'bn' ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account'}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                        {acc.accountNumber}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{acc.accountName}</span>
                      </div>

                      {acc.bankName && (
                        <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-blue-500" />
                            <span>{acc.bankName}</span>
                          </div>
                          {acc.branchName && <div>Branch: {acc.branchName}</div>}
                          {acc.routingNumber && <div className="font-mono">Routing: {acc.routingNumber}</div>}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {new Date(acc.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      {!acc.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(acc.id)}
                          disabled={settingDefaultId === acc.id}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400 hover:underline flex items-center gap-1"
                        >
                          {settingDefaultId === acc.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Star className="w-3 h-3" />
                          )}
                          <span>{lang === 'bn' ? 'ডিফল্ট করুন' : 'Set as Default'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PREFERENCES & DISPLAY */}
      {activeTab === 'preferences' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? 'পছন্দ ও ডিসপ্লে সেটিংস' : 'Display & App Preferences'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn' ? 'থিম, ভাষা ও নোটিফিকেশন নিয়ন্ত্রণ করুন' : 'Control theme, language and sound alert preferences'}
            </p>
          </div>

          <div className="space-y-5 max-w-xl">
            {/* Theme Preference */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>{lang === 'bn' ? 'অ্যাপের থিম (Theme)' : 'App Theme'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'লাইট বা ডার্ক মোড বেছে নিন' : 'Choose between Light and Dark mode'}
                </p>
              </div>

              <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-700/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Language Preference */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-500" />
                  <span>{lang === 'bn' ? 'ভাষা নির্বাচন (Language)' : 'Language Selection'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'বাংলা অথবা ইংরেজি নির্বাচন করুন' : 'Select English or Bengali'}
                </p>
              </div>

              <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-700/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    lang === 'bn'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🇧🇩 বাংলা</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    lang === 'en'
                      ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>🇬🇧 English</span>
                </button>
              </div>
            </div>

            {/* Sound Alerts */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'সাউন্ড অ্যালার্ট ও রিংটোন' : 'Sound & Audio Alerts'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'নতুন চ্যাট মেসেজ ও উইথড্র নোটিফিকেশনে রিংটোন বাজবে' : 'Play synthetic audio chime on chat and withdrawal alerts'}
                </p>
              </div>

              <button
                type="button"
                onClick={toggleSound}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  soundEnabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Email Notifications */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'ইমেইল নোটিফিকেশন' : 'Email Notifications'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'গুরুত্বপূর্ণ লেনদেন ও ওয়ালেট আপডেটের ইমেইল পান' : 'Receive receipts and important dispute updates via email'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleEmail}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailAlerts ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Push / Desktop Notifications */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-500" />
                    <span>{lang === 'bn' ? 'ব্রাউজার পুশ নোটিফিকেশন (ফোন ও কম্পিউটার)' : 'Browser Push Notifications (Mobile & Desktop)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'নতুন চ্যাট মেসেজ (কে পাঠিয়েছে সহ) এবং উইথড্র অনুমোদনের সাথে সাথে নোটিফিকেশন পান'
                      : 'Get real-time alerts when someone messages you or your withdrawal status updates'}
                  </p>
                </div>

                {/* Status Badge or Request Action */}
                {notifPermission === 'granted' && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'চালু আছে (অনুমোদিত)' : 'Active & Allowed'}</span>
                  </span>
                )}
                {notifPermission === 'denied' && (
                  <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 font-bold text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ব্লক করা আছে (Blocked)' : 'Blocked in Browser'}</span>
                  </span>
                )}
                {notifPermission === 'default' && (
                  <button
                    type="button"
                    onClick={() => requestPermission()}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'নোটিফিকেশন অন করুন' : 'Enable Notifications'}</span>
                  </button>
                )}
                {notifPermission === 'unsupported' && (
                  <span className="px-3 py-1 rounded-xl bg-slate-500/10 text-slate-500 border border-slate-500/25 font-bold text-[11px]">
                    {lang === 'bn' ? 'ডিভাইসে সমর্থিত নয়' : 'Not Supported'}
                  </span>
                )}
              </div>

              {/* Action/Info row when granted */}
              {notifPermission === 'granted' && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'ট্যাব ব্যাকগ্রাউন্ডে থাকলেও বা ফোন লক থাকলেও মেসেজ ও উইথড্র বার্তা আসবে।'
                      : 'You will receive notifications even when this tab is in the background.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={testingNotif}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-300 font-bold text-[11px] hover:bg-sky-100 dark:hover:bg-sky-900 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {testingNotif ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-sky-500" />}
                    <span>{lang === 'bn' ? 'টেস্ট নোটিফিকেশন পাঠান' : 'Send Test Notification'}</span>
                  </button>
                </div>
              )}

              {/* Help message when blocked */}
              {notifPermission === 'denied' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-[11px]">
                  {lang === 'bn'
                    ? '⚠️ আপনার ব্রাউজারে নোটিফিকেশন ব্লক করা রয়েছে। চালু করতে ব্রাউজারের URL বারে তালার (Lock) আইকনে ক্লিক করে Notification "Allow" করুন।'
                    : '⚠️ Notifications are blocked in your browser settings. To unblock, click the lock icon in your browser URL address bar and set Notifications to "Allow".'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & ACTIVITY */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'নিরাপত্তা ও অ্যাক্টিভিটি সেন্টার' : 'Security & Activity Center'}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn' ? 'আপনার অ্যাকাউন্ট স্ট্যাটাস ও সেফনেক্সবিডি এসক্রো সুরক্ষা' : 'SafnexBD escrow protection and account verification telemetry'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Status Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'অ্যাকাউন্ট ভেরিফিকেশন স্ট্যাটাস' : 'Account Status'}</span>
              </div>

              <div className="flex items-center gap-2">
                {user?.isVerified ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ভেরিফাইড অ্যাকাউন্ট (KYC Verified)' : 'Verified User'}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'আনভেরিফাইড (সাধারণ ব্যবহারকারী)' : 'Basic User'}</span>
                  </span>
                )}
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার ফোন নম্বর ও আইডি সেফনেক্সবিডি সেন্ট্রাল ডাটাবেজে এনক্রিপ্ট করে সংরক্ষিত আছে।'
                  : 'Your phone number and identity are securely encrypted in the SafnexBD system.'}
              </p>
            </div>

            {/* Escrow Protection Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/25 space-y-3">
              <div className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span>{lang === 'bn' ? '১০০% এসক্রো সুরক্ষা কার্যকর' : '100% Escrow Protection Active'}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                {lang === 'bn'
                  ? 'SafnexBD প্ল্যাটফর্মে আপনার প্রতিটি লেনদেন ও টাকা অ্যাডমিন তত্ত্বাবধানে সম্পূর্ণ সুরক্ষিত। কাজ সন্তোষজনক হওয়া ছাড়া বায়ারের টাকা বিক্রেতা তুলতে পারে না।'
                  : 'Every transaction is guarded by SafnexBD Mediation Escrow. Funds are locked safely until buyer approves satisfaction.'}
              </p>
            </div>

            {/* Active Session Info */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-500" />
                <span>{lang === 'bn' ? 'বর্তমান সেশন ও ডিভাইস' : 'Current Active Session'}</span>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className="text-emerald-500 font-bold">● Active Session</span>
                </div>
                <div>
                  <span className="text-slate-400">User ID: </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user?.uniqueUserId}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone: </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user?.phone}</span>
                </div>
              </div>
            </div>

            {/* Best Security Practices */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
              <div className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{lang === 'bn' ? 'নিরাপত্তা সতর্কতা' : 'Security Best Practices'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                <li>{lang === 'bn' ? 'কখনও আপনার ওটিপি (OTP) বা পাসওয়ার্ড কারো সাথে শেয়ার করবেন না।' : 'Never share your password or OTP.'}</li>
                <li>{lang === 'bn' ? 'প্ল্যাটফর্মের বাইরে কোনো পেমেন্ট করবেন না।' : 'Never transact outside SafnexBD escrow.'}</li>
                <li>{lang === 'bn' ? 'কোনো সন্দেহ হলে চ্যাট রুম থেকে "কল অ্যাডমিন" বোতাম চাপুন।' : 'Use Call Admin if any suspicious activity occurs.'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex-shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'উইথড্র অ্যাকাউন্ট যুক্ত করুন' : 'Add Payout Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
              {addAccountError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-900/50">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{addAccountError}</span>
                </div>
              )}

              <form id="add-account-form" onSubmit={handleAddPaymentAccount} className="space-y-3.5">
                {/* Method Type Grid */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {lang === 'bn' ? 'পেমেন্ট মেথড *' : 'Payment Method *'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'BKASH', label: 'bKash', border: 'border-[#E2136E]', text: 'text-[#E2136E]' },
                      { id: 'NAGAD', label: 'Nagad', border: 'border-[#F7941D]', text: 'text-[#F7941D]' },
                      { id: 'ROCKET', label: 'Rocket', border: 'border-[#8C3494]', text: 'text-[#8C3494]' },
                      { id: 'BANK', label: 'Bank', border: 'border-blue-600', text: 'text-blue-600' },
                    ].map((m) => {
                      const isSel = methodType === m.id;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setMethodType(m.id)}
                          className={`p-2.5 rounded-xl border font-bold text-center transition ${
                            isSel
                              ? `${m.border} bg-slate-100 dark:bg-slate-800 ring-2 ring-sky-500/20 ${m.text}`
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Type for Mobile */}
                {methodType !== 'BANK' && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      {lang === 'bn' ? 'অ্যাকাউন্টের ধরন *' : 'Account Type *'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['PERSONAL', 'AGENT', 'MERCHANT'] as const).map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setAccountType(t)}
                          className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                            accountType === t
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {t === 'PERSONAL' ? (lang === 'bn' ? 'পার্সোনাল' : 'Personal') : t === 'AGENT' ? (lang === 'bn' ? 'এজেন্ট' : 'Agent') : (lang === 'bn' ? 'মার্চেন্ট' : 'Merchant')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account Number */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {methodType === 'BANK'
                      ? lang === 'bn' ? 'ব্যাংক একাউন্ট নম্বর *' : 'Bank Account Number *'
                      : lang === 'bn' ? 'মোবাইল একাউন্ট নম্বর (১১ ডিজিট) *' : 'Mobile Account Number (11 digits) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={methodType === 'BANK' ? 'e.g. 20501234567890' : 'e.g. 01712345678'}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Account Holder Name */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {lang === 'bn' ? 'অ্যাকাউন্টধারীর নাম *' : 'Account Holder Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder={lang === 'bn' ? 'যেমন: রহিম আহমেদ' : 'e.g. Rahim Ahmed'}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Specific fields for Bank */}
                {methodType === 'BANK' && (
                  <>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                        {lang === 'bn' ? 'ব্যাংকের নাম *' : 'Bank Name *'}
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {BANGLADESH_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b === 'OTHER' ? (lang === 'bn' ? 'অন্যান্য ব্যাংক (Other Bank)' : 'Other Bank') : b}
                          </option>
                        ))}
                      </select>
                    </div>

                    {bankName === 'OTHER' && (
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                          {lang === 'bn' ? 'ব্যাংকের নাম লিখুন *' : 'Specify Bank Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={customBankName}
                          onChange={(e) => setCustomBankName(e.target.value)}
                          placeholder="e.g. Modhumoti Bank Limited"
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                          {lang === 'bn' ? 'রাউটিং নম্বর (৯ ডিজিট) *' : 'Routing Number (9 Digits) *'}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={9}
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="e.g. 090271234"
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                          {lang === 'bn' ? 'শাখার নাম (ঐচ্ছিক)' : 'Branch Name (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="e.g. Motijheel Branch"
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Account Password for Verification */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-500" />
                      <span>{lang === 'bn' ? 'নিরাপত্তার জন্য আপনার পাসওয়ার্ড দিন *' : 'Account Password (for verification) *'}</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAccountPassword ? 'text' : 'password'}
                      required
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder={lang === 'bn' ? 'আপনার অ্যাকাউন্টের বর্তমান পাসওয়ার্ড' : 'Enter your account password'}
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountPassword(!showAccountPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'bn'
                      ? 'অননুমোদিত পরিবর্তন রোধে আপনার অ্যাকাউন্ট পাসওয়ার্ড প্রয়োজন।'
                      : 'Password confirmation is required to prevent unauthorized payment changes.'}
                  </p>
                </div>

                {/* Default checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefaultAccount}
                      onChange={(e) => setIsDefaultAccount(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn'
                        ? 'টাকা তোলার সময় এটি ডিফল্ট অ্যাকাউন্ট হিসেবে নির্বাচন করুন'
                        : 'Set as default withdrawal payout account'}
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="add-account-form"
                disabled={isSavingAccount}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isSavingAccount && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'অ্যাকাউন্ট সেভ করুন' : 'Save Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ACCOUNT MODAL */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex-shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'উইথড্র অ্যাকাউন্ট পরিবর্তন করুন' : 'Edit Payout Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
              {editAccountError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-900/50">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{editAccountError}</span>
                </div>
              )}

              <form id="edit-account-form" onSubmit={handleUpdatePaymentAccount} className="space-y-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {lang === 'bn' ? 'পেমেন্ট মেথড *' : 'Payment Method *'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'BKASH', label: 'bKash', border: 'border-[#E2136E]', text: 'text-[#E2136E]' },
                      { id: 'NAGAD', label: 'Nagad', border: 'border-[#F7941D]', text: 'text-[#F7941D]' },
                      { id: 'ROCKET', label: 'Rocket', border: 'border-[#8C3494]', text: 'text-[#8C3494]' },
                      { id: 'BANK', label: 'Bank', border: 'border-blue-600', text: 'text-blue-600' },
                    ].map((m) => {
                      const isSel = editMethodType === m.id;
                      return (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => setEditMethodType(m.id)}
                          className={`p-2.5 rounded-xl border font-bold text-center transition ${
                            isSel
                              ? `${m.border} bg-slate-100 dark:bg-slate-800 ring-2 ring-sky-500/20 ${m.text}`
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {editMethodType !== 'BANK' && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                      {lang === 'bn' ? 'অ্যাকাউন্টের ধরন *' : 'Account Type *'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['PERSONAL', 'AGENT', 'MERCHANT'] as const).map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setEditAccountType(t)}
                          className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                            editAccountType === t
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {t === 'PERSONAL' ? (lang === 'bn' ? 'পার্সোনাল' : 'Personal') : t === 'AGENT' ? (lang === 'bn' ? 'এজেন্ট' : 'Agent') : (lang === 'bn' ? 'মার্চেন্ট' : 'Merchant')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {editMethodType === 'BANK'
                      ? lang === 'bn' ? 'ব্যাংক একাউন্ট নম্বর *' : 'Bank Account Number *'
                      : lang === 'bn' ? 'মোবাইল একাউন্ট নম্বর (১১ ডিজিট) *' : 'Mobile Account Number (11 digits) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {lang === 'bn' ? 'অ্যাকাউন্টধারীর নাম *' : 'Account Holder Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editAccountName}
                    onChange={(e) => setEditAccountName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {editMethodType === 'BANK' && (
                  <>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                        {lang === 'bn' ? 'ব্যাংকের নাম *' : 'Bank Name *'}
                      </label>
                      <select
                        value={editBankName}
                        onChange={(e) => setEditBankName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {BANGLADESH_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b === 'OTHER' ? (lang === 'bn' ? 'অন্যান্য ব্যাংক (Other Bank)' : 'Other Bank') : b}
                          </option>
                        ))}
                      </select>
                    </div>

                    {editBankName === 'OTHER' && (
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                          {lang === 'bn' ? 'ব্যাংকের নাম লিখুন *' : 'Specify Bank Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={editCustomBankName}
                          onChange={(e) => setEditCustomBankName(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                          {lang === 'bn' ? 'রাউটিং নম্বর (৯ ডিজিট) *' : 'Routing Number (9 Digits) *'}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={9}
                          value={editRoutingNumber}
                          onChange={(e) => setEditRoutingNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                          {lang === 'bn' ? 'শাখার নাম (ঐচ্ছিক)' : 'Branch Name (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={editBranchName}
                          onChange={(e) => setEditBranchName(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Account Password Verification */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'bn' ? 'নিরাপত্তার জন্য আপনার পাসওয়ার্ড দিন *' : 'Account Password (for verification) *'}</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      required
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder={lang === 'bn' ? 'বর্তমান অ্যাকাউন্ট পাসওয়ার্ড দিন' : 'Enter current account password'}
                      className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsDefault}
                      onChange={(e) => setEditIsDefault(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'ডিফল্ট অ্যাকাউন্ট হিসেবে নির্বাচন করুন' : 'Set as default payment account'}
                    </span>
                  </label>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                form="edit-account-form"
                disabled={isUpdatingAccount}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isUpdatingAccount && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL WITH PASSWORD */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>{lang === 'bn' ? 'অ্যাকাউন্ট মুছে ফেলা নিশ্চিত করুন' : 'Confirm Delete Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
              <div className="font-bold text-rose-800 dark:text-rose-300">
                {deletingAccount.methodType}: <span className="font-mono">{deletingAccount.accountNumber}</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                {lang === 'bn'
                  ? 'অ্যাকাউন্টটি মুছে ফেলতে নিরাপত্তার জন্য আপনার অ্যাকাউন্ট পাসওয়ার্ড দিন।'
                  : 'For security, please enter your password to confirm deletion of this account.'}
              </p>
            </div>

            {deleteAccountError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-semibold text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteAccountError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDeleteAccount} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 text-xs">
                  {lang === 'bn' ? 'অ্যাকাউন্ট পাসওয়ার্ড *' : 'Account Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder={lang === 'bn' ? 'পাসওয়ার্ড দিন' : 'Enter your password'}
                    className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showDeletePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingAccount(null)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  {isDeletingAccount && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Confirm Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
