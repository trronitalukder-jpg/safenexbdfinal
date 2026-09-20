import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import {
  BookOpen,
  Video,
  FileText,
  Eye,
  Calendar,
  Search,
  ExternalLink,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { getImageUrl } from '../../utils/imageUtils';

export const GuidesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'article'>('all');

  const fetchGuides = async () => {
    try {
      const res: any = await api.get('/guides');
      const data = Array.isArray(res) ? res : res?.data || [];
      setGuides(data);
    } catch (err) {
      console.warn('Failed to load guides:', err);
      setGuides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const filteredGuides = guides.filter((g) => {
    const isVideo = Boolean(g.youtubeUrl);
    if (filterType === 'video' && !isVideo) return false;
    if (filterType === 'article' && isVideo) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = g.title?.toLowerCase().includes(q);
      const matchDesc = g.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="টিউটোরিয়াল ও নির্দেশিকা" />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.topSection}>
          <Text style={[styles.heading, { color: colors.text }]}>অফিসিয়াল গাইড ও টিউটোরিয়াল</Text>
          <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
            প্ল্যাটফর্মে নিরাপদ লেনদেন, ওয়ালেট রিচার্জ এবং এসক্রো নিয়মাবলী সম্পর্কে জানুন।
          </Text>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="গাইড বা টিউটোরিয়াল খুঁজুন..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {/* Filters */}
          <View style={styles.filterRow}>
            {(['all', 'video', 'article'] as const).map((ft) => (
              <TouchableOpacity
                key={ft}
                onPress={() => setFilterType(ft)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filterType === ft ? colors.primary : colors.surface,
                    borderColor: filterType === ft ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: filterType === ft ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {ft === 'all' ? 'সকল গাইড' : ft === 'video' ? 'ভিডিও টিউটোরিয়াল' : 'আর্টিকেল'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Guides List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : filteredGuides.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BookOpen size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>কোনো গাইড পাওয়া যায়নি।</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredGuides.map((g) => {
              const isVideo = Boolean(g.youtubeUrl);
              const cover = getImageUrl(g.coverImage);

              return (
                <TouchableOpacity
                  key={g.id}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('GuideDetail', { guideId: g.id, slug: g.slug })}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {cover ? (
                    <Image source={{ uri: cover }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardFallback, { backgroundColor: colors.surfaceSecondary }]}>
                      {isVideo ? <Video size={36} color="#ef4444" /> : <FileText size={36} color={colors.primary} />}
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: isVideo ? '#fef2f2' : '#eff6ff' },
                        ]}
                      >
                        {isVideo ? <Video size={12} color="#dc2626" /> : <FileText size={12} color="#2563eb" />}
                        <Text style={[styles.typeBadgeText, { color: isVideo ? '#dc2626' : '#2563eb' }]}>
                          {isVideo ? 'ভিডিও' : 'আর্টিকেল'}
                        </Text>
                      </View>

                      <View style={styles.viewsRow}>
                        <Eye size={12} color={colors.textMuted} />
                        <Text style={[styles.viewsText, { color: colors.textMuted }]}>{g.viewsCount || 0}</Text>
                      </View>
                    </View>

                    <Text style={[styles.guideTitle, { color: colors.text }]} numberOfLines={2}>
                      {g.title}
                    </Text>

                    {g.description ? (
                      <Text style={[styles.guideDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {g.description}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
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
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 36,
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardFallback: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 14,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 11,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  guideDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
});

