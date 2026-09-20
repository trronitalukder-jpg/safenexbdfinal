import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Extract the host IP where Expo packager is running (e.g. 192.168.0.105)
// This ensures real physical devices running Expo Go automatically connect to your PC's backend
const expoHost =
  Constants.expoConfig?.hostUri?.split(':').shift() ||
  (Constants as any).manifest?.debuggerHost?.split(':').shift() ||
  (Constants as any).manifest2?.extra?.expoGo?.debuggerHost?.split(':').shift();

export const DEFAULT_HOST = expoHost || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:5000/api/v1`;

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || `http://${DEFAULT_HOST}:5000`;

export const APP_CONFIG = {
  appName: 'SafnexBD',
  currency: '৳',
  supportPhone: '+880 1800-000000',
  supportEmail: 'support@safnexbd.com',
  companyTagline: '১০০% নিরাপদ এসক্রো মার্কেটপ্লেস',
};
