import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, ChevronLeft, Menu, Globe, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { getImageUrl } from '../../utils/imageUtils';
import { APP_CONFIG } from '../../config';
import { LeftPublicDrawer } from './LeftPublicDrawer';
import { RightProfileDrawer } from './RightProfileDrawer';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showWalletPill?: boolean;
  showHamburger?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showWalletPill = true,
  showHamburger = true,
  rightAction,
}) => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user, isAuthenticated } = useAuthStore();
  const { lang, toggleLang } = useLanguageStore();
  const insets = useSafeAreaInsets();

  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Ensure ample breathing room below phone's status bar, notch, and network icons
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 26 : 14);
  const avatar = getImageUrl(user?.avatarUrl);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: topPadding,
            height: 56 + topPadding,
          },
        ]}
      >
        {/* Left Row: Left Hamburger Menu or Back button + SafnexBD Brand */}
        <View style={styles.leftRow}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color={colors.text} />
            </TouchableOpacity>
          ) : showHamburger ? (
            <TouchableOpacity
              onPress={() => setLeftDrawerOpen(true)}
              style={[styles.hamburgerBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              activeOpacity={0.7}
              accessibilityLabel="Open public menu"
            >
              <Menu size={21} color={colors.text} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            style={styles.brandRow}
          >
            <View style={styles.iconBox}>
              <ShieldCheck size={20} color="#ffffff" />
            </View>
            <Text style={[styles.brandText, { color: colors.text }]}>
              Safnex<Text style={{ color: colors.primary }}>BD</Text>
            </Text>
          </TouchableOpacity>

          {title && (showBack || title !== 'SafnexBD') ? (
            <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right Row: Wallet Pill + Language Toggle + Right Profile Menu Drawer Button */}
        <View style={styles.rightRow}>
          {rightAction ? (
            rightAction
          ) : (
            <>
              {showWalletPill && user ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Wallet' })}
                  style={[styles.walletPill, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                >
                  <Text style={[styles.walletLabel, { color: colors.textSecondary }]}>
                    {lang === 'bn' ? 'ব্যালেন্স:' : 'Bal:'}
                  </Text>
                  <Text style={[styles.walletAmount, { color: colors.success }]}>
                    {APP_CONFIG.currency} {Number(user.wallet?.availableBalance || 0).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Quick Language Toggle Button */}
              <TouchableOpacity
                onPress={toggleLang}
                style={[styles.langBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Globe size={13} color={colors.primary} />
                <Text style={[styles.langBtnText, { color: colors.text }]}>
                  {lang === 'bn' ? 'EN' : 'বাং'}
                </Text>
              </TouchableOpacity>

              {/* Right Profile Menu Button: Opens User Drawer from RIGHT */}
              <TouchableOpacity
                onPress={() => setRightDrawerOpen(true)}
                style={[
                  styles.profileBtn,
                  {
                    backgroundColor: isAuthenticated ? colors.primary : colors.surfaceSecondary,
                    borderColor: colors.primary,
                  },
                ]}
                activeOpacity={0.8}
                accessibilityLabel="Open user profile menu"
              >
                {isAuthenticated && avatar ? (
                  <Image source={{ uri: avatar }} style={styles.profileAvatarImg as any} />
                ) : isAuthenticated && user?.firstName ? (
                  <Text style={styles.profileAvatarText}>
                    {user.firstName.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <User size={18} color={isAuthenticated ? '#ffffff' : colors.text} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* 1. Left Public Navigation Drawer (Categories, Marketplace, Public Pages) */}
      <LeftPublicDrawer visible={leftDrawerOpen} onClose={() => setLeftDrawerOpen(false)} />

      {/* 2. Right User Profile Drawer (Overview, Wallet & Ledger, Chat, My Transactions, Products, etc.) */}
      <RightProfileDrawer visible={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  walletLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  walletAmount: {
    fontSize: 11,
    fontWeight: '800',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 34,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});
