import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Store, MessageSquare, Wallet, User } from 'lucide-react-native';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MarketplaceScreen } from '../screens/marketplace/MarketplaceScreen';
import { ConversationsScreen } from '../screens/chat/ConversationsScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useThemeStore } from '../store/useThemeStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const AppTabs = () => {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  // Respect phone navigation buttons (Android 3-button or gesture bar)
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const tabHeight = 56 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'হোম',
          tabBarIcon: ({ color, size, focused }) => (
            <Home size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: 'মার্কেট',
          tabBarIcon: ({ color, size, focused }) => (
            <Store size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="Chat"
        component={ConversationsScreen}
        options={{
          tabBarLabel: 'মেসেজ',
          tabBarIcon: ({ color, size, focused }) => (
            <MessageSquare size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: 'ওয়ালেট',
          tabBarIcon: ({ color, size, focused }) => (
            <Wallet size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'প্রোফাইল',
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
