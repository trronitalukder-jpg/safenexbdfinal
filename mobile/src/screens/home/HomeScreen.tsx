import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import {
  ShieldCheck,
  Search,
  ChevronRight,
  Cpu,
  DownloadCloud,
  Coins,
  Users,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Zap,
  BookOpen,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/cards/ProductCard';
import { api } from '../../api/client';
import { resolveImageUrl } from '../../utils/imageUtils';

const { width } = Dimensions.get('window');

const unwrap = (res: any) => (res && res.data !== undefined ? res.data : res);

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user, refreshMe } = useAuthStore();
  const { lang, t } = useLanguageStore();

  const [categories, setCategories] = useState<any[]>([]);
  const [sliders, setSliders] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [physicalProducts, setPhysicalProducts] = useState<any[]>([]);
  const [moneyExchangeProducts, setMoneyExchangeProducts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Auto slide timer
  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliders.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [sliders]);

  const loadHomeData = async () => {
    try {
      // 1. Fetch sliders & categories
      const [catRes, sliderRes]: any = await Promise.allSettled([
        api.get('/categories'),
        api.get('/cms/sliders'),
      ]);

      if (catRes.status === 'fulfilled') {
        const catData = unwrap(catRes.value);
        setCategories(Array.isArray(catData) ? catData : []);
      }

      if (sliderRes.status === 'fulfilled') {
        const sliderData = unwrap(sliderRes.value);
        setSliders(Array.isArray(sliderData) && sliderData.length > 0 ? sliderData : []);
      }

      // 2. Fetch bid display settings or fallback defaults
      let dLimit = 8;
      let pLimit = 8;
      let mLimit = 6;
      let uLimit = 6;

      try {
        const settingsRes: any = await api.get('/bids/settings');
        const settingsData = unwrap(settingsRes);
        const homeLimits = settingsData?.homePageSettings;
        if (homeLimits) {
          dLimit = homeLimits.digitalProductsCount || 8;
          pLimit = homeLimits.physicalProductsCount || 8;
          mLimit = homeLimits.moneyExchangeCount || 6;
          uLimit = homeLimits.usersCount || 6;
        }
      } catch (e) {
        // use default limits
      }

      // 3. Fetch product sections & top users
      const [digRes, physRes, exchRes, usersRes]: any = await Promise.allSettled([
        api.get(`/products?productType=DIGITAL_DOWNLOAD&scope=HOME_PAGE&limit=${dLimit}`),
        api.get(`/products?productType=PHYSICAL&scope=HOME_PAGE&limit=${pLimit}`),
        api.get(`/products?canonicalUrl=/money-exchange&scope=HOME_PAGE&limit=${mLimit}`),
        api.get(`/users/search?limit=${uLimit}`),
      ]);

      if (digRes.status === 'fulfilled') {
        const data = unwrap(digRes.value);
        setDigitalProducts(Array.isArray(data) ? data : data?.items || []);
      }

      if (physRes.status === 'fulfilled') {
        const data = unwrap(physRes.value);
        setPhysicalProducts(Array.isArray(data) ? data : data?.items || []);
      }

      if (exchRes.status === 'fulfilled') {
        const data = unwrap(exchRes.value);
        setMoneyExchangeProducts(Array.isArray(data) ? data : data?.items || []);
      }

      if (usersRes.status === 'fulfilled') {
        const data = unwrap(usersRes.value);
        setTopUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Home data load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (user) {
      refreshMe();
    }
    loadHomeData();
  }, [user]);

  const activeSlide = sliders[currentSlide] || null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero & CMS Slider Banner */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <ShieldCheck size={14} color="#38BDF8" />
            <Text style={styles.badgeText}>
              {lang === 'bn' ? '১০০% নিরাপদ এসক্রো প্ল্যাটফর্ম' : '100% Secure Escrow Platform'}
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {activeSlide?.title ||
              (lang === 'bn' ? 'নিরাপদ লেনদেন ও আধুনিক মার্কেটপ্লেস' : 'Safe Transaction Marketplace & Escrow')}
          </Text>

          <Text style={styles.heroSubtitle}>
            {activeSlide?.subtitle ||
              (lang === 'bn'
                ? 'পণ্য বা সার্ভিস বুঝে পেয়ে টাকা ছাড়ুন। টাকা থাকবে সুরক্ষিত Hold ব্যালেন্সে। কোনো প্রতারণার সুযোগ নেই।'
                : 'Pay with complete peace of mind. Funds stay locked in Escrow Hold balance until you confirm delivery.')}
          </Text>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TransactionsHub')}
            >
              <Text style={styles.heroPrimaryBtnText}>
                {lang === 'bn' ? 'নিরাপদ লেনদেন' : 'Safe Deals'}
              </Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Marketplace')}
            >
              <Text style={styles.heroSecondaryBtnText}>
                {lang === 'bn' ? 'মার্কেটপ্লেস' : 'Marketplace'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Slider Dots */}
          {sliders.length > 1 && (
            <View style={styles.sliderDotsRow}>
              {sliders.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setCurrentSlide(idx)}
                  style={[
                    styles.sliderDot,
                    currentSlide === idx ? styles.sliderDotActive : styles.sliderDotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* 2. Escrow 3-Step Simulation Card */}
        <View style={[styles.escrowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.escrowCardHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.escrowCardTitle, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'এসক্রো লেনদেন সুরক্ষা' : 'Escrow Protection Flow'}
            </Text>
            <View style={styles.protectedTag}>
              <Text style={styles.protectedTagText}>PROTECTED</Text>
            </View>
          </View>

          <View style={styles.stepsList}>
            {/* Step 1 */}
            <View style={[styles.stepItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#38BDF820' }]}>
                <Text style={[styles.stepNumberText, { color: '#0284C7' }]}>১</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  {lang === 'bn' ? 'চ্যাটে কথা বলে অফার ঠিক করুন' : 'Chat & Agree on Price'}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  {lang === 'bn' ? 'সরাসরি চ্যাটে Pay বা Receive রিকোয়েস্ট পাঠান' : 'Direct one-to-one negotiation'}
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={[styles.stepItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#F59E0B20' }]}>
                <Text style={[styles.stepNumberText, { color: '#D97706' }]}>২</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  {lang === 'bn' ? 'টাকা থাকবে Hold ব্যালেন্সে' : 'Funds Secured in Hold Balance'}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  {lang === 'bn'
                    ? 'কাজ চলাকালীন সেলার বা বায়ার কেউ টাকা তুলতে পারবে না'
                    : 'Locked safely under system escrow'}
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={[styles.stepItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#10B98120' }]}>
                <Text style={[styles.stepNumberText, { color: '#059669' }]}>৩</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  {lang === 'bn' ? 'কাজ শেষ হলে নিশ্চিত করে রিলিজ' : 'Approve Work & Release Money'}
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
                  {lang === 'bn' ? 'কোনো বিরোধ হলে Call Admin দিয়ে ২৪/৭ সাপোর্ট নিন' : 'Dispute mediation available 24/7'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.escrowFooter}>
            <CheckCircle2 size={14} color="#10B981" />
            <Text style={[styles.escrowFooterText, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'জিরো ফ্রড গ্যারান্টি ও সেন্ট্রালাইজড লেজার' : 'Zero Fraud Guarantee & Centralized Ledger'}
            </Text>
          </View>
        </View>

        {/* 3. Quick Feature Hub Navigation Bar */}
        <View style={styles.quickHubGrid}>
          <TouchableOpacity
            style={[styles.hubTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('MoneyExchange')}
          >
            <View style={[styles.hubIconCircle, { backgroundColor: '#F59E0B18' }]}>
              <Coins size={18} color="#D97706" />
            </View>
            <Text style={[styles.hubTileTitle, { color: colors.text }]}>
              {lang === 'bn' ? 'মানি এক্সচেঞ্জ' : 'Money Exchange'}
            </Text>
            <Text style={[styles.hubTileSub, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'P2P কারেন্সি' : 'P2P Currency'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hubTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('TransactionsHub')}
          >
            <View style={[styles.hubIconCircle, { backgroundColor: '#0284C718' }]}>
              <ShieldCheck size={18} color="#0284C7" />
            </View>
            <Text style={[styles.hubTileTitle, { color: colors.text }]}>
              {lang === 'bn' ? 'নিরাপদ লেনদেন' : 'Safe Deals'}
            </Text>
            <Text style={[styles.hubTileSub, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'এসক্রো ট্র্যাকার' : 'Escrow Tracker'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hubTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('UsersSearch')}
          >
            <View style={[styles.hubIconCircle, { backgroundColor: '#8B5CF618' }]}>
              <Users size={18} color="#7C3AED" />
            </View>
            <Text style={[styles.hubTileTitle, { color: colors.text }]}>
              {lang === 'bn' ? 'টপ ইউজার' : 'Top Users'}
            </Text>
            <Text style={[styles.hubTileSub, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'যাচাইকৃত প্রোফাইল' : 'Verified Profiles'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.hubTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Guides')}
          >
            <View style={[styles.hubIconCircle, { backgroundColor: '#10B98118' }]}>
              <BookOpen size={18} color="#059669" />
            </View>
            <Text style={[styles.hubTileTitle, { color: colors.text }]}>
              {lang === 'bn' ? 'গাইড ও টিউটোরিয়াল' : 'Guides'}
            </Text>
            <Text style={[styles.hubTileSub, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'শিখুন ও জানুন' : 'Learn How It Works'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Search Bar Trigger */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Marketplace')}
          style={[styles.searchTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Search size={16} color={colors.textMuted} />
          <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>
            {lang === 'bn' ? 'প্রোডাক্ট বা সার্ভিস সার্চ করুন...' : 'Search products or services...'}
          </Text>
        </TouchableOpacity>

        {/* 5. Categories Horizontal Scroll */}
        {categories.length > 0 ? (
          <View style={styles.sectionBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Marketplace', { category: '' })}
                style={[styles.catPill, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Sparkles size={12} color="#fff" />
                <Text style={styles.catPillActiveText}>{lang === 'bn' ? 'সকল' : 'All'}</Text>
              </TouchableOpacity>

              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => navigation.navigate('Marketplace', { category: c.slug })}
                  style={[styles.catPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.catPillText, { color: colors.text }]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Loading Spinner */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              {lang === 'bn' ? 'তথ্য লোড হচ্ছে...' : 'Loading data...'}
            </Text>
          </View>
        ) : (
          <>
            {/* 6. Digital Products Section (2-Columns) */}
            {digitalProducts.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={styles.sectionSubTag}>
                      <DownloadCloud size={13} color={colors.primary} />
                      <Text style={[styles.sectionSubTagText, { color: colors.primary }]}>
                        {lang === 'bn' ? 'ডিজিটাল মার্কেটপ্লেস' : 'Digital Marketplace'}
                      </Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {lang === 'bn' ? 'ডিজিটাল প্রোডাক্টস ও সফটওয়্যার' : 'Digital Products & Software'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Marketplace', { type: 'DIGITAL_DOWNLOAD' })}
                    style={styles.seeAllRow}
                  >
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>
                      {lang === 'bn' ? 'সবগুলো' : 'View All'}
                    </Text>
                    <ChevronRight size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* 2-Column Grid */}
                <View style={styles.grid}>
                  {digitalProducts.map((p) => (
                    <View key={p.id} style={styles.gridCol}>
                      <ProductCard product={p} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 7. Physical Products Section (2-Columns) */}
            {physicalProducts.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={styles.sectionSubTag}>
                      <Cpu size={13} color={colors.success} />
                      <Text style={[styles.sectionSubTagText, { color: colors.success }]}>
                        {lang === 'bn' ? 'স্মার্ট ডিভাইস ও গ্যাজেট' : 'Smart Devices & Hardware'}
                      </Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {lang === 'bn' ? 'ফিজিক্যাল প্রোডাক্টস ও ইলেকট্রনিক্স' : 'Physical Products & Gadgets'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Marketplace', { type: 'PHYSICAL' })}
                    style={styles.seeAllRow}
                  >
                    <Text style={[styles.seeAllText, { color: colors.success }]}>
                      {lang === 'bn' ? 'সবগুলো' : 'View All'}
                    </Text>
                    <ChevronRight size={14} color={colors.success} />
                  </TouchableOpacity>
                </View>

                {/* 2-Column Grid */}
                <View style={styles.grid}>
                  {physicalProducts.map((p) => (
                    <View key={p.id} style={styles.gridCol}>
                      <ProductCard product={p} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 8. Money Exchange Offers Showcase */}
            {moneyExchangeProducts.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={styles.sectionSubTag}>
                      <Coins size={13} color="#D97706" />
                      <Text style={[styles.sectionSubTagText, { color: '#D97706' }]}>
                        {lang === 'bn' ? 'পিয়ার-টু-পিয়ার এসক্রো' : 'P2P Escrow Exchange'}
                      </Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {lang === 'bn' ? 'মানি এক্সচেঞ্জ অফারসমূহ' : 'Money Exchange Offers'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('MoneyExchange')}
                    style={styles.seeAllRow}
                  >
                    <Text style={[styles.seeAllText, { color: '#D97706' }]}>
                      {lang === 'bn' ? 'সব এক্সচেঞ্জ' : 'View All'}
                    </Text>
                    <ChevronRight size={14} color="#D97706" />
                  </TouchableOpacity>
                </View>

                <View style={styles.grid}>
                  {moneyExchangeProducts.map((p) => (
                    <View key={p.id} style={styles.gridCol}>
                      <ProductCard product={p} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 9. Top Verified Users Section */}
            {topUsers.length > 0 && (
              <View style={styles.sectionBox}>
                <View style={styles.sectionHeader}>
                  <View>
                    <View style={styles.sectionSubTag}>
                      <Users size={13} color="#7C3AED" />
                      <Text style={[styles.sectionSubTagText, { color: '#7C3AED' }]}>
                        {lang === 'bn' ? 'শীর্ষ প্রোফাইল' : 'Top Profiles'}
                      </Text>
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      {lang === 'bn' ? 'টপ ইউজার ও সেলার আইডি' : 'Top Users & Verified Sellers'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('UsersSearch')}
                    style={styles.seeAllRow}
                  >
                    <Text style={[styles.seeAllText, { color: '#7C3AED' }]}>
                      {lang === 'bn' ? 'সকল ইউজার' : 'Find Users'}
                    </Text>
                    <ChevronRight size={14} color="#7C3AED" />
                  </TouchableOpacity>
                </View>

                <View style={styles.usersList}>
                  {topUsers.slice(0, 4).map((u) => {
                    const avatarUri = resolveImageUrl(u.avatarUrl);
                    return (
                      <View
                        key={u.id}
                        style={[styles.userItemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <View style={styles.userLeft}>
                          {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.userAvatar} />
                          ) : (
                            <View style={[styles.userAvatarFallback, { backgroundColor: colors.primary }]}>
                              <Text style={styles.userAvatarFallbackText}>
                                {u.fullName?.charAt(0) || u.uniqueUserId?.charAt(0) || 'U'}
                              </Text>
                            </View>
                          )}
                          <View style={styles.userInfo}>
                            <View style={styles.userRow}>
                              <Text style={[styles.userNameText, { color: colors.text }]}>@{u.uniqueUserId}</Text>
                              {u.isVerified && <CheckCircle2 size={13} color="#0284C7" />}
                            </View>
                            <Text style={[styles.userSubName, { color: colors.textMuted }]}>{u.fullName}</Text>
                            <Text style={[styles.userStatsMeta, { color: colors.textMuted }]}>
                              {lang === 'bn' ? 'ডিল:' : 'Deals:'} {u.completedTransactionsCount || 0} • {lang === 'bn' ? 'প্রোডাক্ট:' : 'Products:'} {u.activeProductsCount || 0}
                            </Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[styles.userChatBtn, { backgroundColor: colors.primary + '18' }]}
                          onPress={() => navigation.navigate('ChatDetail', { targetUserId: u.id, targetUser: u })}
                        >
                          <MessageSquare size={14} color={colors.primary} />
                          <Text style={[styles.userChatBtnText, { color: colors.primary }]}>
                            {lang === 'bn' ? 'চ্যাট' : 'Chat'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 10. Trust & Safety Statistics */}
            <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statsHeading, { color: colors.text }]}>
                {lang === 'bn' ? 'বিশ্বাস ও নিরাপত্তার প্রতীক — SafnexBD' : 'Trust, Security & Protection — SafnexBD'}
              </Text>
              <Text style={[styles.statsSubHeading, { color: colors.textMuted }]}>
                {lang === 'bn'
                  ? 'আমরা বায়ার ও সেলার উভয়ের অর্থ সুরক্ষায় ১০০% মধ্যস্থতা প্রদান করি'
                  : 'Zero-fraud policy with centralized wallet ledger & automated dispute support'}
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#0284C7' }]}>
                    {lang === 'bn' ? '১০০%' : '100%'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {lang === 'bn' ? 'এসক্রো সুরক্ষা' : 'Escrow Protected'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#10B981' }]}>
                    {lang === 'bn' ? '৳ ৫M+' : '৳ 5M+'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {lang === 'bn' ? 'ভলিউম সম্পন্ন' : 'Volume Secured'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                    {lang === 'bn' ? '২৪/৭' : '24/7'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {lang === 'bn' ? 'অ্যাডমিন মীমাংসা' : 'Dispute Support'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>
                    {lang === 'bn' ? '০%' : '0%'}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {lang === 'bn' ? 'প্রতারণার ঝুঁকি' : 'Fraud Risk'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 11. Call To Action Banner */}
            <View style={styles.ctaBanner}>
              <Text style={styles.ctaTitle}>
                {lang === 'bn' ? 'আজই শুরু করুন নিরাপদ লেনদেন' : 'Start Your Safe Deals Today'}
              </Text>
              <Text style={styles.ctaDesc}>
                {lang === 'bn'
                  ? 'একই অ্যাকাউন্ট থেকে কেনাবেচা করুন, সার্ভিস প্রদান করুন এবং নিশ্চিন্তে পেমেন্ট গ্রহণ করুন।'
                  : 'One single account for Buyer, Seller, Service Provider and Peer-to-Peer exchanges.'}
              </Text>
              <View style={styles.ctaBtnRow}>
                {!user ? (
                  <TouchableOpacity
                    style={styles.ctaPrimaryBtn}
                    onPress={() => navigation.navigate('Register')}
                  >
                    <Text style={styles.ctaPrimaryBtnText}>
                      {lang === 'bn' ? 'অ্যাকাউন্ট খুলুন' : 'Register Now'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.ctaPrimaryBtn}
                    onPress={() => navigation.navigate('AddProduct')}
                  >
                    <Text style={styles.ctaPrimaryBtnText}>
                      {lang === 'bn' ? 'বিজ্ঞাপন দিন' : 'Post Ad'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.ctaSecondaryBtn}
                  onPress={() => navigation.navigate('TransactionsHub')}
                >
                  <Text style={styles.ctaSecondaryBtnText}>
                    {lang === 'bn' ? 'নিরাপদ লেনদেন' : 'Safe Deals'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  // Hero
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 10,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSecondaryBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroSecondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  sliderDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  sliderDot: {
    height: 4,
    borderRadius: 2,
  },
  sliderDotActive: {
    width: 22,
    backgroundColor: '#38BDF8',
  },
  sliderDotInactive: {
    width: 6,
    backgroundColor: '#334155',
  },

  // Escrow Simulation Card
  escrowCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  escrowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  escrowCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  protectedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  protectedTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  stepNumberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  escrowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
  },
  escrowFooterText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Hub Grid
  quickHubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  hubTile: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  hubIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  hubTileTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  hubTileSub: {
    fontSize: 10,
    marginTop: 2,
  },

  // Search trigger
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 10,
  },
  searchPlaceholder: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Category pills
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catPillActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Sections
  sectionBox: {
    marginTop: 14,
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  sectionSubTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sectionSubTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridCol: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },

  // Users List
  usersList: {
    gap: 8,
  },
  userItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  userSubName: {
    fontSize: 11,
    marginTop: 1,
  },
  userStatsMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  userChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  userChatBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Stats Card
  statsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  statsHeading: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  statsSubHeading: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // CTA Banner
  ctaBanner: {
    backgroundColor: '#0369A1',
    borderRadius: 20,
    padding: 18,
    marginTop: 6,
    alignItems: 'center',
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  ctaDesc: {
    color: '#E0F2FE',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  ctaBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  ctaPrimaryBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaPrimaryBtnText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '800',
  },
  ctaSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaSecondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Loading
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
});
