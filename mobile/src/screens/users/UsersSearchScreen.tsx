import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Search,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  UserCheck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { getImageUrl } from '../../utils/imageUtils';

export const UsersSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      if (isVerifiedOnly) params.append('isVerified', 'true');

      const res: any = await api.get(`/users/search?${params.toString()}`);
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      setUsers(list);
    } catch (e) {
      console.warn('User search error:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchUsers();
  }, [isVerifiedOnly]);

  const handleChat = (target: any) => {
    if (!currentUser) {
      navigation.navigate('Login');
      return;
    }
    const targetId = typeof target === 'string' ? target : target?.id;
    const partnerObj = typeof target === 'object' ? target : undefined;
    navigation.navigate('ChatDetail', { targetUserId: targetId, partner: partnerObj });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="ইউজার অনুসন্ধান" />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.topSection}>
          <Text style={[styles.heading, { color: colors.text }]}>টপ ইউজার ও সেলার আইডি</Text>
          <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
            ইউজার আইডি (যেমন Rahim2345), নাম দিয়ে খুঁজুন এবং সরাসরি নিরাপদে চ্যাট বা লেনদেন করুন।
          </Text>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchUsers}
              returnKeyType="search"
              placeholder="ইউজার আইডি, নাম বা ইমেইল লিখুন..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
            <TouchableOpacity onPress={searchUsers} style={[styles.searchSubmitBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.searchSubmitText}>সার্চ</Text>
            </TouchableOpacity>
          </View>

          {/* Verified Toggle Filter */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsVerifiedOnly(!isVerifiedOnly)}
            style={[
              styles.filterPill,
              {
                backgroundColor: isVerifiedOnly ? '#10b981' : colors.surface,
                borderColor: isVerifiedOnly ? '#10b981' : colors.border,
              },
            ]}
          >
            <CheckCircle2 size={15} color={isVerifiedOnly ? '#ffffff' : colors.textMuted} />
            <Text style={[styles.filterPillText, { color: isVerifiedOnly ? '#ffffff' : colors.textSecondary }]}>
              {isVerifiedOnly ? '✓ শুধু ভেরিফাইড প্রোফাইল দেখানো হচ্ছে' : 'শুধু ভেরিফাইড আইডি ফিল্টার করুন'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : users.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <UserCheck size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>কোনো ইউজার খুঁজে পাওয়া যায়নি।</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {users.map((u) => {
              const avatar = getImageUrl(u.avatarUrl);
              return (
                <View
                  key={u.id}
                  style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.cardTop}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarFallbackText}>
                          {u.firstName?.charAt(0) || u.fullName?.charAt(0) || 'U'}
                        </Text>
                      </View>
                    )}

                    <View style={styles.infoCol}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.userIdText, { color: colors.text }]}>@{u.uniqueUserId}</Text>
                        {u.isVerified && <CheckCircle2 size={14} color={colors.primary} />}
                      </View>
                      <Text style={[styles.fullNameText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.fullName || 'Safnex Trader'}
                      </Text>
                    </View>
                  </View>

                  {/* Deals & Products mini stats */}
                  <View style={[styles.statsRow, { borderColor: colors.border }]}>
                    <View style={[styles.statBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>সক্রিয় প্রোডাক্ট</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>{u.activeProductsCount || 0}</Text>
                    </View>

                    <View style={[styles.statBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>সম্পন্ন ডিল</Text>
                      <Text style={[styles.statValue, { color: '#059669' }]}>
                        {u.completedTransactionsCount || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Chat Action */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleChat(u)}
                    style={[styles.chatBtn, { backgroundColor: colors.primary }]}
                  >
                    <MessageSquare size={15} color="#ffffff" />
                    <Text style={styles.chatBtnText}>চ্যাট শুরু করুন</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
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
    padding: 16,
    gap: 16,
  },
  topSection: {
    gap: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 6,
  },
  searchSubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  searchSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  list: {
    gap: 12,
  },
  userCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userIdText: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
  },
  fullNameText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  statBox: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});

