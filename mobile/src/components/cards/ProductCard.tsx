import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MessageSquare, Cpu, Zap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { APP_CONFIG } from '../../config';

interface ProductCardProps {
  product: any;
  onPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();

  const isPhysical = product.productType === 'PHYSICAL';
  const rawImg = product.images?.[0]?.imageUrl || (product.images?.[0] ? product.images[0] : null);
  const imgUrl = rawImg || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80';

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('ProductDetail', { slug: product.slug, id: product.id });
    }
  };

  const handleChatPress = () => {
    if (product.seller?.id) {
      navigation.navigate('ChatDetail', { targetUserId: product.seller.id });
    } else {
      handleCardPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleCardPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Image & Type Badge */}
      <View style={styles.imageBox}>
        <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
        <View
          style={[
            styles.badge,
            { backgroundColor: isPhysical ? 'rgba(5, 150, 105, 0.9)' : 'rgba(2, 132, 199, 0.9)' },
          ]}
        >
          {isPhysical ? <Cpu size={10} color="#fff" /> : <Zap size={10} color="#fff" />}
          <Text style={styles.badgeText}>{isPhysical ? 'PHYSICAL' : 'DIGITAL'}</Text>
        </View>
      </View>

      {/* Body Content */}
      <View style={styles.body}>
        {/* Seller Info */}
        <View style={styles.sellerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {product.seller?.firstName?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={[styles.sellerName, { color: colors.textMuted }]} numberOfLines={1}>
            @{product.seller?.uniqueUserId || 'Seller'}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Price */}
        <Text style={[styles.price, { color: colors.primary }]}>
          {APP_CONFIG.currency} {Number(product.price || 0).toLocaleString()}
        </Text>

        {/* Chat Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleChatPress}
          style={[styles.chatBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MessageSquare size={13} color={colors.text} />
          <Text style={[styles.chatBtnText, { color: colors.text }]}>চ্যাট করুন</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imageBox: {
    width: '100%',
    height: 110,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
  },
  body: {
    padding: 10,
    gap: 5,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  sellerName: {
    fontSize: 10,
    fontFamily: 'monospace',
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    height: 32,
  },
  price: {
    fontSize: 14,
    fontWeight: '900',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 3,
  },
  chatBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
