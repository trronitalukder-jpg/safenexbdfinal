import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/useAuthStore';
import { useThemeStore } from './src/store/useThemeStore';
import { useLanguageStore } from './src/store/useLanguageStore';
import { chatSocket } from './src/sockets/chatSocket';

export default function App() {
  const { loadStoredAuth, user, isAuthenticated } = useAuthStore();
  const { mode, colors, loadTheme } = useThemeStore();
  const { loadLang } = useLanguageStore();

  useEffect(() => {
    // 1. Initialize persistent auth, theme, and language on app launch
    loadStoredAuth();
    loadTheme();
    loadLang();
  }, []);

  useEffect(() => {
    // 2. Real-time Socket connection lifecycle
    if (isAuthenticated && user?.id) {
      chatSocket.connect();
      chatSocket.joinUserRoom(user.id);
    } else {
      chatSocket.disconnect();
    }

    return () => {
      chatSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // React Navigation Theme adapter
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}