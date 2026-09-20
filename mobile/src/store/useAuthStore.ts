import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../api/client';

export interface UserWallet {
  id: string;
  balance?: number | string;
  availableBalance?: number | string;
  holdBalance: number | string;
  currency?: string;
}

export interface UserProfile {
  id: string;
  uniqueUserId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  businessName?: string;
  businessType?: string;
  isVerified?: boolean;
  wallet?: UserWallet;
  roles?: string[];
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  wallet: UserWallet | null;
  setAuth: (user: UserProfile, token: string, refreshToken?: string) => Promise<void>;
  updateWallet: (wallet: UserWallet) => void;
  loadStoredAuth: () => Promise<void>;
  refreshMe: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  wallet: null,

  setAuth: async (user, token, refreshToken) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
    set({
      user,
      token,
      isAuthenticated: true,
      wallet: user.wallet || null,
      isLoading: false,
    });
  },

  updateWallet: (wallet) => {
    set((state) => ({
      wallet,
      user: state.user ? { ...state.user, wallet } : null,
    }));
  },

  loadStoredAuth: async () => {
    try {
      const [token, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        set({
          token,
          user: parsedUser,
          isAuthenticated: true,
          wallet: parsedUser.wallet || null,
          isLoading: false,
        });

        // Background refresh profile & wallet from server if valid token exists
        try {
          const [profileRes, walletRes]: any = await Promise.allSettled([
            api.get('/auth/me'),
            api.get('/wallet'),
          ]);

          // Check if token was rejected due to 401 Unauthorized (expired token)
          if (
            profileRes.status === 'rejected' &&
            (profileRes.reason?.status === 401 || profileRes.reason?.message?.includes('Unauthorized'))
          ) {
            set({ token: null, user: null, isAuthenticated: false, wallet: null, isLoading: false });
            await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
            return;
          }

          const nextUser = profileRes.status === 'fulfilled' ? profileRes.value : parsedUser;
          const nextWallet =
            walletRes.status === 'fulfilled'
              ? walletRes.value?.data !== undefined
                ? walletRes.value.data
                : walletRes.value
              : nextUser?.wallet || null;

          set({ user: nextUser, wallet: nextWallet });
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        } catch {
          // Token expired or server unreachable
        }
      } else {
        set({ token: null, user: null, isAuthenticated: false, wallet: null, isLoading: false });
      }
    } catch {
      set({ token: null, user: null, isAuthenticated: false, wallet: null, isLoading: false });
    }
  },

  refreshMe: async () => {
    const { token, isAuthenticated } = get();
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const profile: any = await api.get('/auth/me');
      if (profile) {
        set((state) => ({
          user: profile,
          wallet: profile.wallet || state.wallet,
        }));
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.message?.includes('Unauthorized')) {
        set({ user: null, token: null, isAuthenticated: false, wallet: null });
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      } else {
        console.warn('Failed to refresh user profile:', e?.message || e);
      }
    }
  },

  refreshWallet: async () => {
    const { token, isAuthenticated } = get();
    if (!token || !isAuthenticated) {
      return;
    }

    try {
      const res: any = await api.get('/wallet');
      const wData = res?.data !== undefined ? res.data : res;
      if (wData) {
        set((state) => ({
          wallet: wData,
          user: state.user ? { ...state.user, wallet: wData } : null,
        }));
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.message?.includes('Unauthorized')) {
        set({ user: null, token: null, isAuthenticated: false, wallet: null });
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
      } else {
        console.warn('Failed to refresh wallet:', e?.message || e);
      }
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.warn('Logout removal failed:', e);
    }
    set({ user: null, token: null, isAuthenticated: false, wallet: null, isLoading: false });
  },
}));
