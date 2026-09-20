import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  X,
  ShieldCheck,
  ShoppingBag,
  LayoutDashboard,
  Wallet,
  MessageSquare,
  ArrowLeftRight,
  Package,
  PlusCircle,
  Coins,
  ShieldAlert,
  BookOpen,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle2,
  LogIn,
  UserPlus,
  ArrowRight,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { getImageUrl } from '../../utils/imageUtils';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

interface RightProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const RightProfileDrawer: React.FC<RightProfileDrawerProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { lang } = useLanguageStore();

  const handleNavigate = (screen: string, params?: any) => {
    onClose();
    if (screen === 'Home') {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else if (screen === 'Marketplace') {
      navigation.navigate('MainTabs', { screen: 'Marketplace', params });
    } else if (screen === 'Wallet') {
      navigation.navigate('MainTabs', { screen: 'Wallet' });
    } else if (screen === 'Chat') {
      navigation.navigate('MainTabs', { screen: 'Chat' });
    } else if (screen === 'Dashboard') {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } else {
      navigation.navigate(screen, params);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      lang === 'bn' ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Logout',
      lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?' : 'Are you sure you want to log out?',
      [
        { text: lang === 'bn' ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'bn' ? 'লগআউট' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await logout();
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 26 : 14);
  const bottomPadding = Math.max(insets.bottom, 16);
  const avatar = getImageUrl(user?.avatarUrl);

  const menuItems = [
    {
      id: 'overview',
      label: lang === 'bn' ? 'ওভারভিউ' : 'Overview',
      sublabel: lang === 'bn' ? 'ইউজার ড্যাশবোর্ড' : 'User Dashboard',
      icon: LayoutDashboard,
      color: '#0284c7',
      bgColor: '#e0f2fe',
      screen: 'Dashboard',
    },
    {
      id: 'wallet',
      label: lang === 'bn' ? 'ওয়ালেট ও লেজার' : 'Wallet and Ledger',
      sublabel: lang === 'bn' ? 'ব্যালেন্স, রিচার্জ ও উইথড্র' : 'Recharge & Withdraw',
      icon: Wallet,
      color: '#059669',
      bgColor: '#ecfdf5',
      screen: 'Wallet',
    },
    {
      id: 'chat',
      label: lang === 'bn' ? 'লাইভ চ্যাট ও ডিলস' : 'Live Chat and Deals',
      sublabel: lang === 'bn' ? 'এসক্রো লেনদেন ও মেসেজ' : 'Real-time Escrow Chat',
      icon: MessageSquare,
      color: '#2563eb',
      bgColor: '#eff6ff',
      screen: 'Chat',
    },
    {
      id: 'transactions',
      label: lang === 'bn' ? 'আমার লেনদেনসমূহ' : 'My Transactions',
      sublabel: lang === 'bn' ? 'ট্র্যাকিং ও স্ট্যাটাস হিস্ট্রি' : 'History & Tracking',
      icon: ArrowLeftRight,
      color: '#4f46e5',
      bgColor: '#e0e7ff',
      screen: 'TransactionsHub',
    },
    {
      id: 'products',
      label: lang === 'bn' ? 'আমার প্রোডাক্টসমূহ' : 'My Products',
      sublabel: lang === 'bn' ? 'ইনভেন্টরি ও স্টক ম্যানেজমেন্ট' : 'Manage Ads & Stock',
      icon: Package,
      color: '#7e22ce',
      bgColor: '#f3e8ff',
      screen: 'MyProducts',
    },
    {
      id: 'upload',
      label: lang === 'bn' ? 'প্রোডাক্ট আপলোড' : 'Upload Product',
      sublabel: lang === 'bn' ? 'নতুন ডিজিটাল বা ফিজিক্যাল পণ্য' : 'New Listing Post',
      icon: PlusCircle,
      color: '#10b981',
      bgColor: '#ecfdf5',
      screen: 'AddProduct',
    },
    {
      id: 'bids',
      label: lang === 'bn' ? 'আমার বিডসমূহ' : 'My Bids',
      sublabel: lang === 'bn' ? 'মার্কেটপ্লেস পজিশনিং ও র‍্যাঙ্ক' : 'Position Rankings',
      icon: Coins,
      color: '#d97706',
      bgColor: '#fef3c7',
      screen: 'MyBids',
    },
    {
      id: 'disputes',
      label: lang === 'bn' ? 'ডিসপ্যুট সাপোর্ট' : 'Disputes',
      sublabel: lang === 'bn' ? '২৪/৭ অ্যাডমিন কল ও আরবিট্রেশন' : 'Claim & Arbitration',
      icon: ShieldAlert,
      color: '#dc2626',
      bgColor: '#fee2e2',
      screen: 'MyDisputes',
    },
    {
      id: 'guides',
      label: lang === 'bn' ? 'গাইডস ও টিউটোরিয়াল' : 'Guides and Tutorials',
      sublabel: lang === 'bn' ? 'এসক্রো নিয়ম ও ব্যবহার বিধি' : 'Platform Rules & Docs',
      icon: BookOpen,
      color: '#0284c7',
      bgColor: '#eff6ff',
      screen: 'Guides',
    },
    {
      id: 'users',
      label: lang === 'bn' ? 'ইউজার সার্চ' : 'Search User',
      sublabel: lang === 'bn' ? 'টপ সেলার ও ইউজার আইডি' : 'Find Users & Sellers',
      icon: Users,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      screen: 'UsersSearch',
    },
    {
      id: 'settings',
      label: lang === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Account Setting',
      sublabel: lang === 'bn' ? 'প্রোফাইল তথ্য ও নিরাপত্তা' : 'Profile & Security',
      icon: Settings,
      color: '#64748b',
      bgColor: '#f1f5f9',
      screen: 'Dashboard',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop on the LEFT to dismiss */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.backdrop}
        />

        {/* Slide-in Drawer Container on the RIGHT */}
        <View
          style={[
            styles.drawerContent,
            {
              width: DRAWER_WIDTH,
              backgroundColor: colors.surface,
              borderLeftColor: colors.border,
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityLabel="Close profile menu"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleNavigate('Home')}
              style={styles.brandRow}
            >
              <View style={styles.brandIcon}>
                <ShieldCheck size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.brandText, { color: colors.text }]}>
                Safnex<Text style={{ color: colors.primary }}>BD</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* [Browse Marketplace] Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleNavigate('Marketplace')}
              style={[styles.browseMarketBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
            >
              <View style={styles.browseMarketLeft}>
                <View style={[styles.browseMarketIconWrap, { backgroundColor: colors.primary }]}>
                  <ShoppingBag size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[styles.browseMarketText, { color: colors.primary }]}>
                    {lang === 'bn' ? 'মার্কেটপ্লেস ব্রাউজ' : 'Browse Marketplace'}
                  </Text>
                  <Text style={[styles.browseMarketSub, { color: colors.textSecondary }]}>
                    {lang === 'bn' ? 'পণ্য ও সেবা খুঁজুন' : 'Explore all listings'}
                  </Text>
                </View>
              </View>
              <ArrowRight size={16} color={colors.primary} />
            </TouchableOpacity>

            {/* User Profile Picture, Name, User ID Card */}
            {isAuthenticated && user ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleNavigate('Dashboard')}
                style={[styles.userProfileCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <View style={styles.userInfoRow}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.userAvatarImg as any} />
                  ) : (
                    <View style={[styles.userAvatarFallback, { backgroundColor: colors.primary }]}>
                      <Text style={styles.userAvatarText}>
                        {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.userDetailsCol}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'সম্মানিত ইউজার'}
                      </Text>
                      {user.isVerified && (
                        <CheckCircle2 size={13} color="#10b981" />
                      )}
                    </View>

                    <Text style={[styles.userIdBadge, { color: colors.primary }]}>
                      ID: @{user.uniqueUserId || 'USER'}
                    </Text>
                  </View>
                </View>

                {/* Balances */}
                <View style={[styles.userBalanceRow, { borderTopColor: colors.border }]}>
                  <View style={styles.balanceCol}>
                    <Text style={[styles.balanceColLabel, { color: colors.textMuted }]}>
                      {lang === 'bn' ? 'ব্যবহারযোগ্য' : 'Available'}
                    </Text>
                    <Text style={[styles.balanceColVal, { color: '#059669' }]}>
                      ৳ {Number(user.wallet?.availableBalance || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.balanceDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.balanceCol}>
                    <Text style={[styles.balanceColLabel, { color: colors.textMuted }]}>
                      {lang === 'bn' ? 'এসক্রো হোল্ড' : 'Hold'}
                    </Text>
                    <Text style={[styles.balanceColVal, { color: '#d97706' }]}>
                      ৳ {Number(user.wallet?.holdBalance || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              /* Guest State Card */
              <View style={[styles.guestCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Text style={[styles.guestTitle, { color: colors.text }]}>
                  {lang === 'bn' ? 'স্বাগতম Guest' : 'Welcome Guest'}
                </Text>
                <Text style={[styles.guestSub, { color: colors.textSecondary }]}>
                  {lang === 'bn'
                    ? 'নিরাপদ লেনদেন ও চ্যাট করতে লগইন করুন'
                    : 'Log in to trade with 100% escrow protection'}
                </Text>
                <View style={styles.guestBtnRow}>
                  <TouchableOpacity
                    onPress={() => handleNavigate('Login')}
                    style={[styles.guestBtn, { backgroundColor: colors.primary }]}
                  >
                    <LogIn size={14} color="#FFFFFF" />
                    <Text style={styles.guestBtnText}>{lang === 'bn' ? 'লগইন' : 'Log In'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleNavigate('Register')}
                    style={[styles.guestBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                  >
                    <UserPlus size={14} color={colors.text} />
                    <Text style={[styles.guestBtnText, { color: colors.text }]}>{lang === 'bn' ? 'সাইনআপ' : 'Sign Up'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Menu Items (11 Items per instruction) */}
            <Text style={[styles.menuSectionTitle, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'ইউজার কমান্ড সেন্টার' : 'User Control Center'}
            </Text>

            <View style={styles.menuItemsList}>
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.75}
                    onPress={() => handleNavigate(item.screen)}
                    style={[styles.menuRow, { borderBottomColor: colors.border + '50' }]}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: item.bgColor }]}>
                      <IconComponent size={17} color={item.color} />
                    </View>

                    <View style={styles.menuTextCol}>
                      <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.menuItemSub, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.sublabel}
                      </Text>
                    </View>

                    <ChevronRight size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Logout Button */}
            {isAuthenticated ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleLogout}
                style={styles.logoutBtn}
              >
                <LogOut size={16} color="#ef4444" />
                <Text style={styles.logoutBtnText}>
                  {lang === 'bn' ? 'লগআউট (Logout)' : 'Logout'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContent: {
    height: '100%',
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
  },

  // [Browse Marketplace] Button
  browseMarketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  browseMarketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  browseMarketIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseMarketText: {
    fontSize: 13,
    fontWeight: '800',
  },
  browseMarketSub: {
    fontSize: 10,
    marginTop: 1,
  },

  // User Profile Card
  userProfileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0284c7',
  },
  userAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  userDetailsCol: {
    flex: 1,
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
  },
  userIdBadge: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  userBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  balanceCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  balanceColLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  balanceColVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  balanceDivider: {
    width: 1,
    height: 20,
  },

  // Guest State
  guestCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  guestTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  guestSub: {
    fontSize: 10.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  guestBtnRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  guestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
  },
  guestBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Menu Items
  menuSectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
    marginLeft: 2,
  },
  menuItemsList: {
    gap: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    gap: 1,
  },
  menuItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  menuItemSub: {
    fontSize: 10,
  },

  // Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
});

