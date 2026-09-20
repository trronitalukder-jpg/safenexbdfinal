'use client';

import { create } from 'zustand';
import { api } from '../lib/api';
import { reconnectSocket } from '../lib/socket';

export interface UserWallet {
  id: string;
  availableBalance: number | string;
  holdBalance: number | string;
  currency: string;
}

export interface UserProfile {
  id: string;
  uniqueUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalPhone?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  avatarUrl?: string;
  country?: string;
  division?: string;
  district?: string;
  upazila?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  profession?: string;
  company?: string;
  jobTitle?: string;
  institution?: string;
  department?: string;
  educationLevel?: string;
  graduationYear?: string;
  headline?: string;
  bio?: string;
  skills?: string;
  interests?: string;
  languages?: string;
  website?: string;
  socialLinks?: Record<string, any>;
  nidName?: string;
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  verificationStatus?: string;
  profileVisibility?: string;
  whoCanMessage?: string;
  showPhone?: boolean;
  showEmail?: boolean;
  timezone?: string;
  twoFactorEnabled?: boolean;
  businessName?: string;
  businessType?: string;
  isVerified: boolean;
  isEmployee?: boolean;
  wallet?: UserWallet;
  roles: string[];
  permissions: string[];
  adminPermissions?: string[];
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: UserProfile, token: string, refreshToken?: string) => void;
  updateWallet: (wallet: UserWallet) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  hasAdminPermission: (permKey: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('safnexbd_token', token);
      if (refreshToken) {
        localStorage.setItem('safnexbd_refresh_token', refreshToken);
      }
      localStorage.setItem('safnexbd_user', JSON.stringify(user));
      try {
        reconnectSocket();
      } catch {}
    }
    set({ user, token, isLoading: false });
  },

  updateWallet: (wallet) => {
    set((state) => ({
      user: state.user ? { ...state.user, wallet } : null,
    }));
  },

  refreshMe: async () => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('safnexbd_token') || localStorage.getItem('safnexbd_token'))
        : null;
      if (!token) {
        set({ user: null, token: null, isLoading: false });
        return;
      }
      const res: any = await api.get('/auth/me');
      const userData = res?.uniqueUserId ? res : (res?.data?.data || res?.data || null);
      set({ user: userData, token, isLoading: false });
    } catch {
      set({ user: null, token: null, isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safnexbd_token');
      localStorage.removeItem('safnexbd_refresh_token');
      localStorage.removeItem('safnexbd_user');
      localStorage.removeItem('safnexbd_token');
      localStorage.removeItem('safnexbd_refresh_token');
      localStorage.removeItem('safnexbd_user');
      try {
        reconnectSocket();
      } catch {}
    }
    set({ user: null, token: null, isLoading: false });
  },

  isAdmin: () => {
    const user = get().user;
    if (!user) return false;
    const roles = user.roles || [];
    return (
      roles.includes('SUPER_ADMIN') ||
      roles.includes('ADMIN') ||
      roles.includes('FINANCE_ADMIN') ||
      roles.includes('EMPLOYEE') ||
      Boolean(user.adminPermissions && user.adminPermissions.length > 0)
    );
  },

  isSuperAdmin: () => {
    return Boolean(get().user?.roles?.includes('SUPER_ADMIN'));
  },

  hasAdminPermission: (permKey: string) => {
    const user = get().user;
    if (!user) return false;
    const roles = user.roles || [];
    if (roles.includes('SUPER_ADMIN')) return true;

    // Employees management is strictly for SUPER_ADMIN
    if (permKey === 'employees') {
      return roles.includes('SUPER_ADMIN');
    }

    const perms = user.adminPermissions || [];
    if (perms.includes('*')) return true;
    return perms.includes(permKey);
  },
}));
