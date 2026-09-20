import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MessageSquare,
  ShieldCheck,
  Cpu,
  Zap,
  CheckCircle2,
  Package,
  Clock,
  ArrowRight,
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { APP_CONFIG } from '../../config';

export const ProductDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);

  const { slug, id } = route.params || {};
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const identifier = slug || id;
        const res: any = await api.get(`/products/${identifier}`);
        const data = res?.data !== undefined ? res.data : res;
        setProduct(data);
      } catch (err) {
        console.warn('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title="প্রোডাক্ট লোড হচ্ছে..." />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header showBack title="প্রোডাক্ট পাওয়া যায়নি" />
        <View style={styles.centerLoading}>
          <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
            দুঃখিত, এই প্রোডাক্টটি পাওয়া যায়নি অথবা ডিঅ্যাক্টিভ করা হয়েছে।
          </Text>
        </View>
      </View>
    );
  }

  const isPhysical = product.productType === 'PHYSICAL';
  const images = product.images && product.images.length > 0
    ? product.images.map((img: any) => (typeof img === 'string' ? img : img.imageUrl))
    : ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'];

  const currentImg = images[selectedImageIndex] || images[0];

  const handleStartChat = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (product?.seller?.id && product.seller.id === user.id) {
      Alert.alert('অবহিতকরণ', 'এটি আপনার নিজের আপলোড করা প্রোডাক্ট। নিজের সাথে চ্যাট করা সম্ভব নয়।');
      return;
    }
    if (!product?.seller?.id) {
      Alert.alert('অবহিতকরণ', 'এই প্রোডাক্টের সেলার তথ্য পাওয়া যায়নি।');
      return;
    }
    navigation.navigate('ChatDetail', {
      targetUserId: product.seller.id,
      partner: product.seller,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title={product.title} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + bottomPadding }]}>
        {/* Main Image */}
        <View style={[styles.imageCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Image source={{ uri: currentImg }} style={styles.mainImage} resizeMode="contain" />
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isPhysical ? '#059669' : '#0284c7' },
            ]}
          >
            {isPhysical ? <Cpu size={12} color="#fff" /> : <Zap size={12} color="#fff" />}
            <Text style={styles.typeBadgeText}>{isPhysical ? 'PHYSICAL GADGET' : 'DIGITAL DOWNLOAD'}</Text>
          </View>
        </View>

        {/* Thumbnail Carousel */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbScroll}>
            {images.map((imgUrl: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImageIndex(idx)}
                style={[
                  styles.thumbBox,
                  { borderColor: selectedImageIndex === idx ? colors.primary : colors.border },
                ]}
              >
                <Image source={{ uri: imgUrl }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Title & Price Card */}
        <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.productTitle, { color: colors.text }]}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.priceTag, { color: colors.primary }]}>
              {APP_CONFIG.currency} {Number(product.price || 0).toLocaleString()}
            </Text>
            {product.category?.name && (
              <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {product.category.name}
                </Text>
              </View>
            )}
          </View>

          {/* Physical specs if physical */}
          {isPhysical && product.physicalMeta && (
            <View style={[styles.specsBox, { backgroundColor: colors.surfaceSecondary }]}>
              {product.physicalMeta.stock !== undefined && (
                <Text style={[styles.specText, { color: colors.textSecondary }]}>
                  📦 স্টক সংখ্যা: <Text style={{ color: colors.text, fontWeight: '700' }}>{product.physicalMeta.stock} টি</Text>
                </Text>
              )}
              {product.physicalMeta.sku && (
                <Text style={[styles.specText, { color: colors.textSecondary }]}>
                  🏷️ SKU / মডেল: <Text style={{ color: colors.text, fontWeight: '700' }}>{product.physicalMeta.sku}</Text>
                </Text>
              )}
              {product.physicalMeta.deliveryInfo && (
                <Text style={[styles.specText, { color: colors.textSecondary }]}>
                  🚚 ডেলিভারি: <Text style={{ color: colors.text, fontWeight: '700' }}>{product.physicalMeta.deliveryInfo}</Text>
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Seller Info Card */}
        <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardHeading, { color: colors.text }]}>বিক্রেতা পরিচিতি (Seller Profile)</Text>
          <View style={styles.sellerRow}>
            <View style={[styles.sellerAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.sellerAvatarText}>
                {product.seller?.firstName?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={[styles.sellerName, { color: colors.text }]}>
                  {product.seller?.firstName} {product.seller?.lastName}
                </Text>
                {product.seller?.isVerified && (
                  <CheckCircle2 size={16} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.sellerHandle, { color: colors.textMuted }]}>
                @{product.seller?.uniqueUserId || 'Seller'}
              </Text>
            </View>
          </View>
        </View>

        {/* Escrow Guarantee Info */}
        <View style={[styles.escrowCard, { backgroundColor: '#0284c715', borderColor: '#0284c740' }]}>
          <ShieldCheck size={24} color="#0284c7" />
          <View style={styles.escrowTextCol}>
            <Text style={[styles.escrowTitle, { color: colors.text }]}>১০০% ক্যাশ-অন-এসক্রো নিশ্চয়তা</Text>
            <Text style={[styles.escrowDesc, { color: colors.textSecondary }]}>
              আপনি টাকা দিলে তা সরাসরি সেলারের কাছে যাবে না। পণ্য বা সার্ভিস বুঝে পেয়ে নিশ্চিত করলেই কেবল সেলার টাকা তুলতে পারবে।
            </Text>
          </View>
        </View>

        {/* Description */}
        {product.descriptionHtml ? (
          <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardHeading, { color: colors.text }]}>বিবরণ (Description)</Text>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {product.descriptionHtml.replace(/<[^>]*>?/gm, '')}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: bottomPadding,
            height: 62 + bottomPadding,
          },
        ]}
      >
        <View style={styles.bottomPriceCol}>
          <Text style={[styles.bottomPriceLabel, { color: colors.textMuted }]}>মোট মূল্য</Text>
          <Text style={[styles.bottomPriceVal, { color: colors.primary }]}>
            {APP_CONFIG.currency} {Number(product.price || 0).toLocaleString()}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleStartChat}
          style={[styles.buyChatBtn, { backgroundColor: '#0284c7' }]}
        >
          <MessageSquare size={18} color="#fff" />
          <Text style={styles.buyChatBtnText}>সেলারকে মেসেজ দিন</Text>
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 90,
    gap: 12,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 13,
    textAlign: 'center',
  },
  imageCard: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  thumbScroll: {
    gap: 8,
  },
  thumbBox: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  contentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceTag: {
    fontSize: 22,
    fontWeight: '900',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  specsBox: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  specText: {
    fontSize: 12,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '800',
  },
  sellerHandle: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  escrowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  escrowTextCol: {
    flex: 1,
  },
  escrowTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  escrowDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  descriptionText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  bottomPriceVal: {
    fontSize: 17,
    fontWeight: '900',
  },
  buyChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buyChatBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
