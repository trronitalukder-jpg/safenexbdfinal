import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  X,
  ShieldCheck,
  Home,
  Store,
  Coins,
  Users,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Headphones,
  Moon,
  Sun,
  Globe,
  ArrowRight,
  Layers,
  Sparkles,
  ShoppingBag,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../config';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

interface LeftPublicDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const LeftPublicDrawer: React.FC<LeftPublicDrawerProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme } = useThemeStore();
  const { lang, toggleLang } = useLanguageStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catsExpanded, setCatsExpanded] = useState(true);

  useEffect(() => {
    if (visible && categories.length === 0) {
      setLoadingCats(true);
      api.get('/categories')
        .then((res: any) => {
          const data = res && res.data !== undefined ? res.data : res;
          setCategories(Array.isArray(data) ? data : []);
        })
        .catch(() => setCategories([]))
        .finally(() => setLoadingCats(false));
    }
  }, [visible]);

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
    } else {
      navigation.navigate(screen, params);
    }
  };

  const handleSupport = () => {
    onClose();
    Linking.openURL('https://wa.me/8801800000000').catch(() => {
      Alert.alert('সহায়তা', `সাপোর্ট সেন্টারে যোগাযোগ করতে হেল্পলাইন ${APP_CONFIG.supportPhone} এ কল করুন।`);
    });
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 26 : 14);
  const bottomPadding = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Drawer on the LEFT */}
        <View
          style={[
            styles.drawerContent,
            {
              width: DRAWER_WIDTH,
              backgroundColor: colors.surface,
              borderRightColor: colors.border,
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <ShieldCheck size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.brandText, { color: colors.text }]}>
                Safnex<Text style={{ color: colors.primary }}>BD</Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityLabel="Close public menu"
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Quick Public Navigation Links */}
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'পাবলিক পেজ ও এক্সপ্লোর' : 'Public Pages & Explore'}
            </Text>

            <View style={styles.menuGroup}>
              {/* Home */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleNavigate('Home')}
                style={[styles.navItem, { borderBottomColor: colors.border + '50' }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
                  <Home size={16} color="#0284c7" />
                </View>
                <Text style={[styles.navItemText, { color: colors.text }]}>
                  {lang === 'bn' ? 'হোম পেজ (Home)' : 'Home Page'}
                </Text>
              </TouchableOpacity>

              {/* Browse Marketplace */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleNavigate('Marketplace')}
                style={[styles.navItem, { borderBottomColor: colors.border + '50' }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                  <Store size={16} color="#059669" />
                </View>
                <Text style={[styles.navItemText, { color: colors.text }]}>
                  {lang === 'bn' ? 'সকল মার্কেটপ্লেস পণ্য' : 'Browse Marketplace'}
                </Text>
              </TouchableOpacity>

              {/* Money Exchange */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleNavigate('MoneyExchange')}
                style={[styles.navItem, { borderBottomColor: colors.border + '50' }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Coins size={16} color="#d97706" />
                </View>
                <Text style={[styles.navItemText, { color: colors.text }]}>
                  {lang === 'bn' ? 'মানি এক্সচেঞ্জ (USD/EUR/USDT)' : 'Money Exchange'}
                </Text>
              </TouchableOpacity>

              {/* Top Users */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleNavigate('UsersSearch')}
                style={[styles.navItem, { borderBottomColor: colors.border + '50' }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
                  <Users size={16} color="#7e22ce" />
                </View>
                <Text style={[styles.navItemText, { color: colors.text }]}>
                  {lang === 'bn' ? 'টপ ভেরিফায়েড ইউজার' : 'Top Verified Traders'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Categories Accordion */}
            <View style={[styles.catSection, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setCatsExpanded(!catsExpanded)}
                style={styles.catHeader}
              >
                <View style={styles.catHeaderLeft}>
                  <Layers size={16} color={colors.primary} />
                  <Text style={[styles.catHeaderTitle, { color: colors.text }]}>
                    {lang === 'bn' ? 'পণ্য ও সার্ভিস ক্যাটাগরি' : 'Categories'}
                  </Text>
                </View>
                {catsExpanded ? (
                  <ChevronUp size={16} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={colors.textMuted} />
                )}
              </TouchableOpacity>

              {catsExpanded && (
                <View style={styles.catBody}>
                  {loadingCats ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
                  ) : categories.length === 0 ? (
                    <Text style={[styles.emptyCatText, { color: colors.textMuted }]}>
                      {lang === 'bn' ? 'ক্যাটাগরি লোড হচ্ছে...' : 'Loading categories...'}
                    </Text>
                  ) : (
                    categories.map((cat: any) => (
                      <TouchableOpacity
                        key={cat.id}
                        activeOpacity={0.7}
                        onPress={() => handleNavigate('Marketplace', { category: cat.slug })}
                        style={styles.catItem}
                      >
                        <View style={[styles.catDot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.catItemText, { color: colors.text }]} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        {cat.productsCount ? (
                          <Text style={[styles.catCount, { color: colors.textMuted }]}>
                            ({cat.productsCount})
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Safety & Guidelines */}
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'পলিসি ও সহায়তা' : 'Guidelines & Support'}
            </Text>

            <View style={styles.menuGroup}>
              {/* Guides */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleNavigate('Guides')}
                style={[styles.navItem, { borderBottomColor: colors.border + '50' }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                  <BookOpen size={16} color="#0284c7" />
                </View>
                <Text style={[styles.navItemText, { color: colors.text }]}>
                  {lang === 'bn' ? 'গাইডস ও টিউটোরিয়াল' : 'Guides & Tutorials'}
                </Text>
              </TouchableOpacity>

              {/* Dispute Policy */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleNavigate('DisputePolicy')}
                style={[styles.navItem, { borderBottomColor: colors.border + '50' }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                  <FileText size={16} color="#d97706" />
                </View>
                <Text style={[styles.navItemText, { color: colors.text }]}>
                  {lang === 'bn' ? 'এসক্রো ও ডিসপ্যুট পলিসি' : 'Escrow & Dispute Policy'}
                </Text>
              </TouchableOpacity>

              {/* 24/7 WhatsApp Support */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleSupport}
                style={[styles.navItem, { borderBottomColor: colors.border + '50' }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                  <Headphones size={16} color="#059669" />
                </View>
                <Text style={[styles.navItemText, { color: colors.text }]}>
                  {lang === 'bn' ? '২৪/৭ কাস্টমার সাপোর্ট' : '24/7 WhatsApp Support'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* App Settings Card */}
            <View style={[styles.settingsCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  {mode === 'dark' ? <Moon size={16} color={colors.primary} /> : <Sun size={16} color={colors.primary} />}
                  <Text style={[styles.prefText, { color: colors.text }]}>
                    {lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode'}
                  </Text>
                </View>
                <Switch
                  value={mode === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#cbd5e1', true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={[styles.prefDivider, { backgroundColor: colors.border }]} />

              <View style={styles.prefRow}>
                <View style={styles.prefLeft}>
                  <Globe size={16} color={colors.primary} />
                  <Text style={[styles.prefText, { color: colors.text }]}>
                    {lang === 'bn' ? 'ভাষা পরিবর্তন' : 'Language'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={toggleLang}
                  style={[styles.langChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.langChipText, { color: colors.primary }]}>
                    {lang === 'bn' ? 'বাংলা' : 'English'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Backdrop on the RIGHT to dismiss */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.backdrop}
        />
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
  drawerContent: {
    height: '100%',
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  backdrop: {
    flex: 1,
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
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
    marginLeft: 2,
  },
  menuGroup: {
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  catSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  catHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  catBody: {
    gap: 6,
    paddingTop: 6,
    paddingLeft: 6,
  },
  emptyCatText: {
    fontSize: 11,
    paddingVertical: 4,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  catDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  catItemText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  catCount: {
    fontSize: 10,
  },
  settingsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  prefDivider: {
    height: 1,
  },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
});

