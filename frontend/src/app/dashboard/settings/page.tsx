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
  MapPin,
  GraduationCap,
  Briefcase,
  Share2,
  Award,
  ExternalLink,
  FileText,
  Send,
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

const BD_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

type TabType = 'profile' | 'address' | 'profession' | 'about' | 'verification' | 'payouts' | 'security' | 'preferences';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'profile';

  const { user, refreshMe } = useAuthStore();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { permission: notifPermission, requestPermission, soundEnabled, toggleSound, sendNotification } = useNotification();
  const [testingNotif, setTestingNotif] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // 1. Basic Profile Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [additionalPhone, setAdditionalPhone] = useState(user?.additionalPhone || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''
  );
  const [gender, setGender] = useState(user?.gender || '');
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

  // 2. Address & Location state
  const [country, setCountry] = useState(user?.country || 'Bangladesh');
  const [division, setDivision] = useState(user?.division || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [upazila, setUpazila] = useState(user?.upazila || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [addressMessage, setAddressMessage] = useState('');
  const [addressError, setAddressError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // 3. Education & Profession state
  const [profession, setProfession] = useState(user?.profession || '');
  const [company, setCompany] = useState(user?.company || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || '');
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || '');
  const [educationMessage, setEducationMessage] = useState('');
  const [educationError, setEducationError] = useState('');
  const [savingEducation, setSavingEducation] = useState(false);

  // 4. About / Personal state
  const [headline, setHeadline] = useState(user?.headline || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [interests, setInterests] = useState(user?.interests || '');
  const [languages, setLanguages] = useState(user?.languages || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [socialFacebook, setSocialFacebook] = useState(user?.socialLinks?.facebook || '');
  const [socialTwitter, setSocialTwitter] = useState(user?.socialLinks?.twitter || '');
  const [socialTelegram, setSocialTelegram] = useState(user?.socialLinks?.telegram || '');
  const [socialWhatsapp, setSocialWhatsapp] = useState(user?.socialLinks?.whatsapp || '');
  const [socialLinkedin, setSocialLinkedin] = useState(user?.socialLinks?.linkedin || '');
  const [socialGithub, setSocialGithub] = useState(user?.socialLinks?.github || '');
  const [socialYoutube, setSocialYoutube] = useState(user?.socialLinks?.youtube || '');
  const [aboutMessage, setAboutMessage] = useState('');
  const [aboutError, setAboutError] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);

  // 5. Verification (NID) state
  const [nidName, setNidName] = useState(user?.nidName || '');
  const [nidNumber, setNidNumber] = useState(user?.nidNumber || '');
  const [nidFrontUrl, setNidFrontUrl] = useState(user?.nidFrontUrl || '');
  const [nidBackUrl, setNidBackUrl] = useState(user?.nidBackUrl || '');
  const [isUploadingNidFront, setIsUploadingNidFront] = useState(false);
  const [isUploadingNidBack, setIsUploadingNidBack] = useState(false);
  const [nidMessage, setNidMessage] = useState('');
  const [nidError, setNidError] = useState('');
  const [submittingNid, setSubmittingNid] = useState(false);

  // 6. Privacy & Preferences state
  const [profileVisibility, setProfileVisibility] = useState(user?.profileVisibility || 'PUBLIC');
  const [whoCanMessage, setWhoCanMessage] = useState(user?.whoCanMessage || 'EVERYONE');
  const [showPhone, setShowPhone] = useState(Boolean(user?.showPhone));
  const [showEmail, setShowEmail] = useState(Boolean(user?.showEmail));
  const [showLocation, setShowLocation] = useState(user?.showLocation !== false);
  const [showProfession, setShowProfession] = useState(user?.showProfession !== false);
  const [showSkills, setShowSkills] = useState(user?.showSkills !== false);
  const [showSocialLinks, setShowSocialLinks] = useState(user?.showSocialLinks !== false);
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Dhaka');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [privacyMessage, setPrivacyMessage] = useState('');
  const [privacyError, setPrivacyError] = useState('');
  const [savingPrivacy, setSavingPrivacy] = useState(false);

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

  // Telegram Integration State
  const [telegramStatus, setTelegramStatus] = useState<{
    connected: boolean;
    telegramUsername?: string;
    telegramChatId?: string;
    telegramNotifications?: boolean;
    telegram2FaEnabled?: boolean;
    botUsername?: string;
    linkUrl?: string;
  } | null>(null);
  const [loadingTelegramStatus, setLoadingTelegramStatus] = useState(false);
  const [updatingTelegramPref, setUpdatingTelegramPref] = useState(false);
  const [telegramActionMsg, setTelegramActionMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchTelegramStatus = async () => {
    setLoadingTelegramStatus(true);
    try {
      const res: any = await api.get('/telegram/status');
      const data = res?.data !== undefined ? res.data : res;
      setTelegramStatus(data);
    } catch (err) {
      console.error('Failed to load telegram status:', err);
    } finally {
      setLoadingTelegramStatus(false);
    }
  };

  const handleToggleTelegramPref = async (
    field: 'telegramNotifications' | 'telegram2FaEnabled',
    value: boolean,
  ) => {
    setUpdatingTelegramPref(true);
    setTelegramActionMsg(null);
    try {
      const res: any = await api.patch('/telegram/preferences', { [field]: value });
      const data = res?.data !== undefined ? res.data : res;
      setTelegramStatus((prev: any) => ({ ...prev, ...data }));
      setTelegramActionMsg({
        type: 'success',
        text:
          lang === 'bn'
            ? 'টেলিগ্রাম প্রেফারেন্স সফলভাবে আপডেট করা হয়েছে!'
            : 'Telegram preferences updated successfully!',
      });
      setTimeout(() => setTelegramActionMsg(null), 3000);
    } catch (err: any) {
      setTelegramActionMsg({
        type: 'error',
        text:
          err.response?.data?.message ||
          (lang === 'bn' ? 'প্রেফারেন্স পরিবর্তন ব্যর্থ হয়েছে' : 'Failed to update preferences'),
      });
    } finally {
      setUpdatingTelegramPref(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (
      !confirm(
        lang === 'bn'
          ? 'আপনি কি নিশ্চিত যে আপনার টেলিগ্রাম অ্যাকাউন্টটি বিচ্ছিন্ন করতে চান?'
          : 'Are you sure you want to disconnect Telegram?',
      )
    )
      return;
    setUpdatingTelegramPref(true);
    setTelegramActionMsg(null);
    try {
      await api.post('/telegram/disconnect');
      await fetchTelegramStatus();
      setTelegramActionMsg({
        type: 'success',
        text:
          lang === 'bn'
            ? 'টেলিগ্রাম সফলভাবে ডিসকানেক্ট করা হয়েছে'
            : 'Telegram disconnected successfully',
      });
      setTimeout(() => setTelegramActionMsg(null), 3000);
    } catch (err: any) {
      setTelegramActionMsg({
        type: 'error',
        text:
          err.response?.data?.message ||
          (lang === 'bn' ? 'ডিসকানেক্ট করতে ব্যর্থ হয়েছে' : 'Failed to disconnect'),
      });
    } finally {
      setUpdatingTelegramPref(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setAdditionalPhone(user.additionalPhone || '');
      setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '');
      setGender(user.gender || '');
      setCountry(user.country || 'Bangladesh');
      setDivision(user.division || '');
      setDistrict(user.district || '');
      setUpazila(user.upazila || '');
      setCity(user.city || '');
      setAddress(user.address || '');
      setPostalCode(user.postalCode || '');
      setProfession(user.profession || '');
      setCompany(user.company || '');
      setJobTitle(user.jobTitle || '');
      setInstitution(user.institution || '');
      setDepartment(user.department || '');
      setEducationLevel(user.educationLevel || '');
      setGraduationYear(user.graduationYear || '');
      setHeadline(user.headline || '');
      setBio(user.bio || '');
      setSkills(user.skills || '');
      setInterests(user.interests || '');
      setLanguages(user.languages || '');
      setWebsite(user.website || '');
      setSocialFacebook(user.socialLinks?.facebook || '');
      setSocialTwitter(user.socialLinks?.twitter || '');
      setSocialTelegram(user.socialLinks?.telegram || '');
      setSocialWhatsapp(user.socialLinks?.whatsapp || '');
      setSocialLinkedin(user.socialLinks?.linkedin || '');
      setSocialGithub(user.socialLinks?.github || '');
      setSocialYoutube(user.socialLinks?.youtube || '');
      setNidName(user.nidName || '');
      setNidNumber(user.nidNumber || '');
      setNidFrontUrl(user.nidFrontUrl || '');
      setNidBackUrl(user.nidBackUrl || '');
      setProfileVisibility(user.profileVisibility || 'PUBLIC');
      setWhoCanMessage(user.whoCanMessage || 'EVERYONE');
      setShowPhone(Boolean(user.showPhone));
      setShowEmail(Boolean(user.showEmail));
      setShowLocation(user.showLocation !== false);
      setShowProfession(user.showProfession !== false);
      setShowSkills(user.showSkills !== false);
      setShowSocialLinks(user.showSocialLinks !== false);
      setTimezone(user.timezone || 'Asia/Dhaka');
      setTwoFactorEnabled(Boolean(user.twoFactorEnabled));
      setBusinessName(user.businessName || '');
      setBusinessType(user.businessType || '');
      setAvatarPreview(user.avatarUrl || null);
    }
    loadPaymentAccounts();
    fetchTelegramStatus();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchTelegramStatus();
    }
  }, [activeTab]);

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

  // 1. Update Basic Profile
  const handleUpdateBasicProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setSavingProfile(true);

    try {
      await api.patch('/users/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        headline: headline.trim() || undefined,
        phone: phone.trim() || undefined,
        additionalPhone: additionalPhone.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        businessName: businessName.trim() || undefined,
        businessType: businessType.trim() || undefined,
      });
      await refreshMe();
      setProfileMessage(lang === 'bn' ? 'বেসিক প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!' : 'Basic profile saved successfully!');
      setTimeout(() => setProfileMessage(''), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Update Address & Location
  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressMessage('');
    setAddressError('');
    setSavingAddress(true);

    try {
      await api.patch('/users/profile', {
        country: country.trim() || 'Bangladesh',
        division: division.trim() || undefined,
        district: district.trim() || undefined,
        upazila: upazila.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
      });
      await refreshMe();
      setAddressMessage(lang === 'bn' ? 'ঠিকানা ও অবস্থান সফলভাবে সংরক্ষিত হয়েছে!' : 'Address details saved successfully!');
      setTimeout(() => setAddressMessage(''), 4000);
    } catch (err: any) {
      setAddressError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSavingAddress(false);
    }
  };

  // 3. Update Education & Profession
  const handleUpdateEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setEducationMessage('');
    setEducationError('');
    setSavingEducation(true);

    try {
      await api.patch('/users/profile', {
        profession: profession.trim() || undefined,
        company: company.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        institution: institution.trim() || undefined,
        department: department.trim() || undefined,
        educationLevel: educationLevel.trim() || undefined,
        graduationYear: graduationYear.trim() || undefined,
      });
      await refreshMe();
      setEducationMessage(lang === 'bn' ? 'শিক্ষা ও পেশাগত তথ্য সংরক্ষিত হয়েছে!' : 'Education & profession saved successfully!');
      setTimeout(() => setEducationMessage(''), 4000);
    } catch (err: any) {
      setEducationError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSavingEducation(false);
    }
  };

  // 4. Update About & Personal
  const handleUpdateAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setAboutMessage('');
    setAboutError('');
    setSavingAbout(true);

    try {
      const links = {
        facebook: socialFacebook.trim() || undefined,
        twitter: socialTwitter.trim() || undefined,
        telegram: socialTelegram.trim() || undefined,
        whatsapp: socialWhatsapp.trim() || undefined,
        linkedin: socialLinkedin.trim() || undefined,
        github: socialGithub.trim() || undefined,
        youtube: socialYoutube.trim() || undefined,
      };

      await api.patch('/users/profile', {
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        skills: skills.trim() || undefined,
        interests: interests.trim() || undefined,
        languages: languages.trim() || undefined,
        website: website.trim() || undefined,
        socialLinks: links,
      });
      await refreshMe();
      setAboutMessage(lang === 'bn' ? 'ব্যক্তিগত ও সোশ্যাল লিংক সংরক্ষিত হয়েছে!' : 'About and social links saved successfully!');
      setTimeout(() => setAboutMessage(''), 4000);
    } catch (err: any) {
      setAboutError(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setSavingAbout(false);
    }
  };

  // 5. Update Verification / NID
  const handleUpdateNid = async (e: React.FormEvent) => {
    e.preventDefault();
    setNidMessage('');
    setNidError('');

    if (!nidName.trim()) {
      setNidError(lang === 'bn' ? 'এনআইডি কার্ডে থাকা নাম লিখুন' : 'Enter name as on NID card');
      return;
    }
    if (!nidNumber.trim()) {
      setNidError(lang === 'bn' ? 'এনআইডি নম্বর দিন' : 'Enter NID number');
      return;
    }
    if (!nidFrontUrl) {
      setNidError(lang === 'bn' ? 'এনআইডি কার্ডের সামনের অংশের ছবি আপলোড করুন' : 'Upload NID front photo');
      return;
    }

    setSubmittingNid(true);
    try {
      await api.patch('/users/profile', {
        nidName: nidName.trim(),
        nidNumber: nidNumber.trim(),
        nidFrontUrl,
        nidBackUrl: nidBackUrl || undefined,
      });
      await refreshMe();
      setNidMessage(
        lang === 'bn'
          ? 'এনআইডি তথ্য ও ছবি সফলভাবে জমা দেওয়া হয়েছে! এডমিন যাচাই করে আপনার অ্যাকাউন্ট ভেরিফাই করবেন।'
          : 'NID details submitted! Admin will review and verify your account.'
      );
      setTimeout(() => setNidMessage(''), 5000);
    } catch (err: any) {
      setNidError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmittingNid(false);
    }
  };

  // 6. Update Privacy & Preferences
  const handleUpdatePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivacyMessage('');
    setPrivacyError('');
    setSavingPrivacy(true);

    try {
      await api.patch('/users/profile', {
        profileVisibility,
        whoCanMessage,
        showPhone,
        showEmail,
        showLocation,
        showProfession,
        showSkills,
        showSocialLinks,
        timezone,
        twoFactorEnabled,
      });
      await refreshMe();
      setPrivacyMessage(lang === 'bn' ? 'প্রাইভেসি ও সিকিউরিটি সেটিংস সংরক্ষিত হয়েছে!' : 'Privacy and security settings saved!');
      setTimeout(() => setPrivacyMessage(''), 4000);
    } catch (err: any) {
      setPrivacyError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSavingPrivacy(false);
    }
  };

  // NID Image Upload helpers
  const handleNidFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingNidFront(true);
    setNidError('');
    try {
      const { base64Data, fileName } = await compressImage(file, 1200, 1200, 0.85);
      const res: any = await api.post('/uploads', { base64Data, fileName, folder: 'nid' });
      const url = res?.fileUrl || res?.data?.fileUrl || res?.url;
      if (url) setNidFrontUrl(url);
    } catch (err: any) {
      setNidError(lang === 'bn' ? 'এনআইডি সামনের ছবি আপলোড ব্যর্থ হয়েছে' : 'Failed to upload NID front photo');
    } finally {
      setIsUploadingNidFront(false);
      e.target.value = '';
    }
  };

  const handleNidBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingNidBack(true);
    setNidError('');
    try {
      const { base64Data, fileName } = await compressImage(file, 1200, 1200, 0.85);
      const res: any = await api.post('/uploads', { base64Data, fileName, folder: 'nid' });
      const url = res?.fileUrl || res?.data?.fileUrl || res?.url;
      if (url) setNidBackUrl(url);
    } catch (err: any) {
      setNidError(lang === 'bn' ? 'এনআইডি পেছনের ছবি আপলোড ব্যর্থ হয়েছে' : 'Failed to upload NID back photo');
    } finally {
      setIsUploadingNidBack(false);
      e.target.value = '';
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
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
        {[
          { id: 'profile', icon: User, label: lang === 'bn' ? 'বেসিক প্রোফাইল' : 'Basic Profile' },
          { id: 'address', icon: MapPin, label: lang === 'bn' ? 'ঠিকানা ও অবস্থান' : 'Address & Location' },
          { id: 'profession', icon: GraduationCap, label: lang === 'bn' ? 'শিক্ষা ও পেশা' : 'Education & Career' },
          { id: 'about', icon: FileText, label: lang === 'bn' ? 'ব্যক্তিগত ও সোশ্যাল' : 'About & Social' },
          { id: 'verification', icon: Award, label: lang === 'bn' ? 'এনআইডি কার্ড' : 'NID Verification', badge: user?.isVerified ? 'Verified' : user?.verificationStatus === 'PENDING' ? 'Pending' : undefined },
          { id: 'payouts', icon: CreditCard, label: lang === 'bn' ? 'উইথড্র একাউন্ট' : 'Payout Accounts', count: paymentAccounts.length },
          { id: 'security', icon: Lock, label: lang === 'bn' ? 'পাসওয়ার্ড সিকিউরিটি' : 'Security' },
          { id: 'preferences', icon: Sparkles, label: lang === 'bn' ? 'প্রাইভেসি সেটিংস' : 'Privacy & Settings' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl font-bold text-xs text-center transition ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-sky-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span className={`px-1 py-0.2 rounded-full text-[8px] font-black shrink-0 ${
                  tab.badge === 'Verified' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-extrabold shrink-0">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BASIC PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? '১. বেসিক প্রোফাইল (Basic Profile)' : '1. Basic Profile'}</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'আপনার মূল পরিচয় ও যোগাযোগ তথ্য' : 'Identity & Contact Info'}
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
                  ? 'একটি স্পষ্ট প্রোফাইল ছবি যুক্ত করুন যাতে ট্রেডার ও বায়াররা সহজেই আপনাকে চিনতে পারে।'
                  : 'Upload a clear profile photo to build trust with buyers and traders.'}
              </p>

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

          <form onSubmit={handleUpdateBasicProfile} className="space-y-4 pt-2">
            {/* Full Name */}
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

            {/* Username / User ID & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ইউজারনেম / ইউজার আইডি (Username / User ID)' : 'Username / User ID'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={user?.uniqueUserId || ''}
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 font-mono font-bold opacity-90 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUserId}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-sky-600"
                    title="Copy User ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ইমেইল অ্যাড্রেস (Email Address)' : 'Email Address'}
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-80 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Phone & Additional Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ফোন নম্বর (Primary Phone)' : 'Primary Phone Number'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01712345678"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'অতিরিক্ত ফোন নম্বর (Additional Phone)' : 'Additional Phone Number'}
                </label>
                <input
                  type="text"
                  value={additionalPhone}
                  onChange={(e) => setAdditionalPhone(e.target.value)}
                  placeholder="e.g. 01812345678"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Date of Birth & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'জন্ম তারিখ (Date of Birth)' : 'Date of Birth'}
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'লিঙ্গ (Gender)' : 'Gender'}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">{lang === 'bn' ? '-- নির্বাচন করুন --' : '-- Select Gender --'}</option>
                  <option value="MALE">{lang === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                  <option value="FEMALE">{lang === 'bn' ? 'মহিলা (Female)' : 'Female'}</option>
                  <option value="OTHER">{lang === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                </select>
              </div>
            </div>

            {/* Headline / Title */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>{lang === 'bn' ? 'প্রোফাইল হেডলাইন / উপাধি (Headline / Title)' : 'Profile Headline / Title'}</span>
                <span className="text-[10px] text-sky-500 font-medium">{lang === 'bn' ? 'ইউজার লিস্টে ও চ্যাটে এটি সবার আগে দেখা যাবে' : 'Visible first on users list and chat'}</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: Top Rated P2P Trader | Full-stack Developer' : 'e.g. Top Rated P2P Trader | Full-stack Developer'}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Business info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ব্যবসা বা ব্র্যান্ডের নাম (ঐচ্ছিক)' : 'Business / Brand Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. CryptoKing BD"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {savingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'বেসিক তথ্য সংরক্ষণ করুন' : 'Save Basic Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ADDRESS & LOCATION */}
      {activeTab === 'address' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? '২. ঠিকানা ও অবস্থান (Address & Location)' : '2. Address & Location'}</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'আপনার সঠিক ঠিকানা ও ভৌগোলিক তথ্য' : 'Geographical location'}
            </span>
          </div>

          {addressMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{addressMessage}</span>
            </div>
          )}
          {addressError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{addressError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateAddress} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'দেশ (Country)' : 'Country'}
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Bangladesh"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'বিভাগ (Division)' : 'Division'}
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">{lang === 'bn' ? '-- বিভাগ নির্বাচন করুন --' : '-- Select Division --'}</option>
                  {BD_DIVISIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'জেলা (District)' : 'District'}
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Dhaka, Chittagong, Sylhet"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'উপজেলা / থানা (Upazila / Thana)' : 'Upazila / Thana'}
                </label>
                <input
                  type="text"
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  placeholder="e.g. Mirpur, Gulshan, Sadar"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'এলাকা / শহর (Area / City)' : 'Area / City'}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dhanmondi, Agrabad"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'সম্পূর্ণ ঠিকানা (Full Address)' : 'Full Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House #14, Road #5, Sector #3, Uttara"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'পোস্টাল কোড (Postal Code)' : 'Postal Code'}
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 1230"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingAddress}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {savingAddress && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'ঠিকানা সংরক্ষণ করুন' : 'Save Address'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: EDUCATION & PROFESSION */}
      {activeTab === 'profession' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-purple-500" />
              <span>{lang === 'bn' ? '৩. শিক্ষা ও পেশা (Education & Profession)' : '3. Education & Profession'}</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'আপনার পেশা ও শিক্ষাগত যোগ্যতা' : 'Career and academic credentials'}
            </span>
          </div>

          {educationMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{educationMessage}</span>
            </div>
          )}
          {educationError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{educationError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateEducation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'পেশা (Profession)' : 'Profession'}
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Freelancer, Trader, Software Engineer"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'প্রতিষ্ঠান / কোম্পানি (Company / Org)' : 'Company / Organization'}
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. TechCorp BD / Self-Employed"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'পদবী (Job Title / Designation)' : 'Job Title / Designation'}
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Trader / Graphic Designer"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'স্কুল / কলেজ / বিশ্ববিদ্যালয় (Institution)' : 'School / College / University'}
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of Dhaka"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'বিভাগ / বিষয় (Department / Subject)' : 'Department / Subject'}
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science / Business Studies"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'শিক্ষাগত যোগ্যতা (Education Level)' : 'Education Level'}
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">{lang === 'bn' ? '-- নির্বাচন করুন --' : '-- Select Level --'}</option>
                  <option value="Secondary (SSC)">Secondary (SSC)</option>
                  <option value="Higher Secondary (HSC)">Higher Secondary (HSC)</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's Degree">Bachelor's Degree (স্নাতক)</option>
                  <option value="Master's Degree">Master's Degree (স্নাতকোত্তর)</option>
                  <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'পাসের বছর (Graduation Year)' : 'Graduation Year'}
                </label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingEducation}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {savingEducation && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'শিক্ষা ও পেশা সংরক্ষণ করুন' : 'Save Education & Profession'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ABOUT / PERSONAL */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-500" />
              <span>{lang === 'bn' ? '৪. ব্যক্তিগত ও সোশ্যাল (About & Personal)' : '4. About & Personal'}</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'আপনার বায়ো, স্কিলস এবং সোশ্যাল মিডিয়া প্রোফাইল' : 'Bio, skills, and social presence'}
            </span>
          </div>

          {aboutMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{aboutMessage}</span>
            </div>
          )}
          {aboutError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{aboutError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateAbout} className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {lang === 'bn' ? 'হেডলাইন / পদবী ট্যাগ (Headline / Title)' : 'Profile Headline'}
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Trusted Crypto Trader | Full Stack Developer | Fast Delivery"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {lang === 'bn' ? 'এটি ইউজার সার্চে এবং পাবলিক প্রোফাইলে আপনার নামের নিচে দেখাবে।' : 'Displayed below your name in search results and public profile.'}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                {lang === 'bn' ? 'সংক্ষিপ্ত বায়ো (Short Bio / Description)' : 'Short Bio / Description'}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. 5+ years of experience in P2P escrow trading. Instant releases and 24/7 fast support."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'দক্ষতাসমূহ (Skills - কমা দিয়ে লিখুন)' : 'Skills (Comma separated)'}
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. P2P Trading, Crypto, Next.js, SEO"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'আগ্রহ / শখ (Interests)' : 'Interests'}
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Blockchain, Gaming, E-commerce"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ভাষাসমূহ (Languages)' : 'Languages'}
                </label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. Bengali, English, Hindi"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'ওয়েবসাইট / পোর্টফোলিও (Website / Portfolio)' : 'Website / Portfolio'}
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'সোশ্যাল মিডিয়া লিংকসমূহ (Social Media Links)' : 'Social Media Profiles'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    placeholder="https://facebook.com/username"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Twitter / X</label>
                  <input
                    type="url"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    placeholder="https://x.com/username"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Telegram</label>
                  <input
                    type="text"
                    value={socialTelegram}
                    onChange={(e) => setSocialTelegram(e.target.value)}
                    placeholder="@username or https://t.me/username"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={socialWhatsapp}
                    onChange={(e) => setSocialWhatsapp(e.target.value)}
                    placeholder="e.g. +8801712345678"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={socialLinkedin}
                    onChange={(e) => setSocialLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">GitHub</label>
                  <input
                    type="url"
                    value={socialGithub}
                    onChange={(e) => setSocialGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingAbout}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {savingAbout && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{lang === 'bn' ? 'ব্যক্তিগত তথ্য সংরক্ষণ করুন' : 'Save About & Social'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: VERIFICATION / NID */}
      {activeTab === 'verification' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? '৫. জাতীয় পরিচয়পত্র (NID) ভেরিফিকেশন' : '5. NID Verification'}</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'ভেরিফাইড ব্যাজ ও আনলিমিটেড উইথড্র লিমিট পান' : 'Get verified badge & higher limits'}
            </span>
          </div>

          {/* Verification Status Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {lang === 'bn' ? 'বর্তমান ভেরিফিকেশন স্ট্যাটাস:' : 'Current Status:'}
                </span>
                {user?.isVerified ? (
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-black text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>VERIFIED (ভেরিফাইড)</span>
                  </span>
                ) : user?.verificationStatus === 'PENDING' ? (
                  <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black text-xs flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>PENDING (যাচাই প্রক্রিয়াধীন)</span>
                  </span>
                ) : user?.verificationStatus === 'REJECTED' ? (
                  <span className="px-3 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>REJECTED (প্রত্যাখ্যাত)</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    UNVERIFIED (আনভেরিফাইড)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {user?.isVerified
                  ? (lang === 'bn' ? 'আপনার অ্যাকাউন্ট সম্পূর্ণ ভেরিফাইড। আপনি আনলিমিটেড উইথড্র ও বায়ার ট্রাস্ট পাবেন।' : 'Account is verified with verified badge and priority support.')
                  : (lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID) সাবমিট করে অ্যাকাউন্ট ভেরিফাই করুন।' : 'Submit your NID card to get verified.')}
              </p>
            </div>

            {user?.isVerified && (
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            )}
          </div>

          {nidMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{nidMessage}</span>
            </div>
          )}
          {nidError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{nidError}</span>
            </div>
          )}

          {!user?.isVerified && (
            <form onSubmit={handleUpdateNid} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {lang === 'bn' ? 'এনআইডি কার্ডে থাকা নাম (NID Full Name) *' : 'Full Name (as in NID) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nidName}
                    onChange={(e) => setNidName(e.target.value)}
                    placeholder="e.g. Md. Rahim Ahmed"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                    {lang === 'bn' ? 'এনআইডি নম্বর (১০ বা ১৭ ডিজিট) *' : 'NID Number (10 or 17 digits) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nidNumber}
                    onChange={(e) => setNidNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 19901234567890123"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Front & Back Photo Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front Photo */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'bn' ? 'এনআইডি সামনের অংশ (Front Side) *' : 'NID Front Photo *'}
                  </div>
                  {nidFrontUrl ? (
                    <div className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700">
                      <img src={getImageUrl(nidFrontUrl)} alt="NID Front" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNidFrontUrl('')}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                      <input type="file" accept="image/*" onChange={handleNidFrontUpload} className="hidden" disabled={isUploadingNidFront} />
                      {isUploadingNidFront ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                            {lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Front Image'}
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>

                {/* Back Photo */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'bn' ? 'এনআইডি পেছনের অংশ (Back Side)' : 'NID Back Photo (Optional)'}
                  </div>
                  {nidBackUrl ? (
                    <div className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700">
                      <img src={getImageUrl(nidBackUrl)} alt="NID Back" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNidBackUrl('')}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                      <input type="file" accept="image/*" onChange={handleNidBackUpload} className="hidden" disabled={isUploadingNidBack} />
                      {isUploadingNidBack ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                            {lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Back Image'}
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingNid || !nidNumber || !nidFrontUrl}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {submittingNid && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'bn' ? 'ভেরিফিকেশন আবেদন জমা দিন' : 'Submit for Verification'}</span>
                </button>
              </div>
            </form>
          )}
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

      {/* TAB 7: PASSWORD & SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? '৭. পাসওয়ার্ড পরিবর্তন (Change Password)' : '7. Change Password'}</span>
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

          {/* Security & Activity Center Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
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
        </div>
      )}

      {/* TAB 8: PRIVACY & APP PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Privacy & Profile Visibility Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? '৮. প্রোফাইল প্রাইভেসি ও দৃশ্যমানতা (Privacy & Visibility)' : '8. Profile Privacy & Visibility'}</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'পাবলিক প্রোফাইলে কী তথ্য দেখাবেন তা নিয়ন্ত্রণ করুন' : 'Control your visibility & data'}
              </span>
            </div>

            {privacyMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{privacyMessage}</span>
              </div>
            )}
            {privacyError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{privacyError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePrivacy} className="space-y-4 max-w-xl">
              {/* Profile Visibility */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'প্রোফাইল দৃশ্যমানতা (Profile Visibility)' : 'Profile Visibility'}
                </div>
                <p className="text-[11px] text-slate-400">
                  {lang === 'bn'
                    ? 'পাবলিক রাখলে যেকোনো ইউজার আপনার স্কিল, বায়ো ও প্রোডাক্ট দেখতে পাবে। প্রাইভেট রাখলে গোপন থাকবে।'
                    : 'Public lets users see your bio, skills & products. Private hides them.'}
                </p>
                <div className="flex gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="PUBLIC"
                      checked={profileVisibility === 'PUBLIC'}
                      onChange={() => setProfileVisibility('PUBLIC')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পাবলিক (Public)' : 'Public'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="PRIVATE"
                      checked={profileVisibility === 'PRIVATE'}
                      onChange={() => setProfileVisibility('PRIVATE')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'প্রাইভেট (Private)' : 'Private'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Who can message me */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'কে আপনাকে সরাসরি মেসেজ দিতে পারবে?' : 'Who Can Send You Direct Messages?'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'EVERYONE', label: lang === 'bn' ? 'যে কেউ (Everyone)' : 'Everyone' },
                    { id: 'TRADERS_ONLY', label: lang === 'bn' ? 'শুধুমাত্র ট্রেডাররা' : 'Traders Only' },
                    { id: 'NOBODY', label: lang === 'bn' ? 'কেউ না (Nobody)' : 'Nobody' },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setWhoCanMessage(opt.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                        whoCanMessage === opt.id
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Data Display & Privacy toggles */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 space-y-3">
                <div className="font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'পাবলিক প্রোফাইল তথ্য প্রদর্শন নিয়ন্ত্রণ' : 'Public Profile Data Display Control'}
                </div>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পাবলিক প্রোফাইলে ফোন নম্বর দেখান' : 'Show phone number on public profile'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'bn' ? 'অন্যান্য ইউজাররা আপনার প্রোফাইল পেজে ফোন দেখতে পারবে' : 'Other users can view your phone number'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পাবলিক প্রোফাইলে ইমেইল দেখান' : 'Show email address on public profile'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'bn' ? 'অন্যান্য ইউজাররা আপনার ইমেইল দেখতে পারবে' : 'Other users can view your email'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showEmail}
                    onChange={(e) => setShowEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পাবলিক প্রোফাইলে ঠিকানা ও অবস্থান দেখান' : 'Show location / address on public profile'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'bn' ? 'অন্যান্য ইউজাররা আপনার বিভাগ ও জেলা দেখতে পারবে' : 'Other users can view your division/district'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পাবলিক প্রোফাইলে পেশা ও শিক্ষা দেখান' : 'Show profession & career on public profile'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'bn' ? 'অন্যান্য ইউজাররা আপনার পেশা, কোম্পানি বা প্রতিষ্ঠান দেখতে পারবে' : 'Other users can view your profession and company'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showProfession}
                    onChange={(e) => setShowProfession(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পাবলিক প্রোফাইলে স্কিল ও দক্ষতা দেখান' : 'Show skills & tags on public profile'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'bn' ? 'অন্যান্য ইউজাররা আপনার স্কিল ট্যাগগুলো দেখতে পারবে' : 'Other users can view your skill badges'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSkills}
                    onChange={(e) => setShowSkills(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>

                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-2" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'bn' ? 'পাবলিক প্রোফাইলে সোশ্যাল মিডিয়া লিংক দেখান' : 'Show social media links on public profile'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {lang === 'bn' ? 'অন্যান্য ইউজাররা আপনার ফেসবুক, টেলিগ্রাম ইত্যাদি লিংক দেখতে পারবে' : 'Other users can view your social profiles'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSocialLinks}
                    onChange={(e) => setShowSocialLinks(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                </label>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  {lang === 'bn' ? 'টাইমজোন (Timezone)' : 'Timezone'}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6 - Bangladesh Standard Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30 - India)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4 - UAE)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                </select>
              </div>

              {/* 2FA Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'bn' ? 'টু-ফ্যাক্টর অথেনটিকেশন (2FA)' : 'Two-Factor Authentication (2FA)'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'bn' ? 'লগইনের সময় অতিরিক্ত নিরাপত্তা স্তর নিশ্চিত করুন' : 'Extra security layer during login'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPrivacy}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {savingPrivacy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'bn' ? 'প্রাইভেসি সেটিংস সংরক্ষণ করুন' : 'Save Privacy Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Display & App Preferences */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 text-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'অ্যাপ ডিসপ্লে ও নোটিফিকেশন সেটিংস' : 'Display & App Preferences'}</span>
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

              {/* Telegram Instant Alerts & Bot Link */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-sky-500" />
                      <span>
                        {lang === 'bn'
                          ? 'টেলিগ্রাম ইনস্ট্যান্ট নোটিফিকেশন ও বট সার্ভিস (Telegram Instant Alerts)'
                          : 'Telegram Instant Alerts & Bot Service'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {lang === 'bn'
                        ? 'ব্রাউজার বন্ধ থাকলেও আপনার মোবাইলে সরাসরি নতুন চ্যাট মেসেজ, এসক্রো অর্ডার ও পেমেন্টের ইনস্ট্যান্ট অ্যালার্ট পান।'
                        : 'Get instant notifications for new chat messages, escrow updates, and payments directly on Telegram.'}
                    </p>
                  </div>

                  {/* Status Badge */}
                  {telegramStatus?.connected ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সংযুক্ত (Connected)' : 'Connected'}</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-slate-500/10 text-slate-500 border border-slate-500/25 font-bold text-[11px]">
                      {lang === 'bn' ? 'সংযুক্ত নয়' : 'Not Connected'}
                    </span>
                  )}
                </div>

                {telegramActionMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      telegramActionMsg.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                    }`}
                  >
                    {telegramActionMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{telegramActionMsg.text}</span>
                  </div>
                )}

                {/* If Connected */}
                {telegramStatus?.connected ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div className="space-y-0.5">
                        <div className="text-slate-500 text-[11px]">
                          {lang === 'bn' ? 'সংযুক্ত টেলিগ্রাম প্রোফাইল:' : 'Linked Telegram Profile:'}
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>
                            {telegramStatus.telegramUsername
                              ? `@${telegramStatus.telegramUsername}`
                              : 'Telegram User'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {telegramStatus.telegramChatId}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {telegramStatus.botUsername && (
                          <a
                            href={`https://t.me/${telegramStatus.botUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-300 font-bold text-[11px] hover:bg-sky-100 dark:hover:bg-sky-900 transition flex items-center gap-1.5"
                          >
                            <Send className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'বট ওপেন করুন' : 'Open Bot'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={handleDisconnectTelegram}
                          disabled={updatingTelegramPref}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold text-[11px] hover:bg-rose-100 dark:hover:bg-rose-900 transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'ডিসকানেক্ট' : 'Disconnect'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Notifications Toggle */}
                      <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                        <div className="space-y-0.5 pr-2">
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {lang === 'bn' ? 'টেলিগ্রাম নোটিফিকেশন' : 'Telegram Notifications'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {lang === 'bn'
                              ? 'মেসেজ ও লেনদেনের ইনস্ট্যান্ট বার্তা পান'
                              : 'Instant alerts for messages & escrow'}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(telegramStatus.telegramNotifications)}
                          onChange={(e) =>
                            handleToggleTelegramPref('telegramNotifications', e.target.checked)
                          }
                          disabled={updatingTelegramPref}
                          className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      {/* 2FA Toggle */}
                      <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
                        <div className="space-y-0.5 pr-2">
                          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {lang === 'bn' ? 'টেলিগ্রাম ২-ফ্যাক্টর ওটিপি (2FA)' : 'Telegram 2FA Security OTP'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {lang === 'bn'
                              ? 'লগইন ও উইথড্রাল কোড টেলিগ্রামে পান'
                              : 'Receive security codes in Telegram'}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={Boolean(telegramStatus.telegram2FaEnabled)}
                          onChange={(e) =>
                            handleToggleTelegramPref('telegram2FaEnabled', e.target.checked)
                          }
                          disabled={updatingTelegramPref}
                          className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  /* If NOT Connected */
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {lang === 'bn'
                          ? '👉 এক ক্লিকে টেলিগ্রাম বট ওপেন করে "START" চাপুন। আপনার আইডি স্বয়ংক্রিয়ভাবে কানেক্ট হয়ে যাবে!'
                          : '👉 Click to open Telegram and tap "START". Your account will link automatically!'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {lang === 'bn'
                          ? 'কোনো ফোন নাম্বার বা অতিরিক্ত পাসওয়ার্ড শেয়ারের প্রয়োজন নেই।'
                          : 'No phone number sharing required. Completely secure & private.'}
                      </div>
                    </div>

                    {telegramStatus?.linkUrl ? (
                      <a
                        href={telegramStatus.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? '🔗 টেলিগ্রাম কানেক্ট করুন' : 'Connect Telegram'}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={fetchTelegramStatus}
                        disabled={loadingTelegramStatus}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
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
