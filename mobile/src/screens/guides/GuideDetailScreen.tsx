import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Video,
  FileText,
  Eye,
  Calendar,
  ExternalLink,
  Play,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { getImageUrl } from '../../utils/imageUtils';

export const GuideDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const { guideId, slug } = route.params || {};

  const [guide, setGuide] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const identifier = slug || guideId;
        const res: any = await api.get(`/guides/${identifier}`);
        const data = res?.data !== undefined ? res.data : res;
        setGuide(data);
      } catch (err) {
        console.warn('Failed to load guide detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [guideId, slug]);

  const handleOpenVideo = () => {
    if (guide?.youtubeUrl) {
      Linking.openURL(guide.youtubeUrl).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title={guide?.title || 'গাইড বিবরণ'} />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !guide ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>গাইডটি পাওয়া যায়নি।</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
          {guide.coverImage ? (
            <Image source={{ uri: getImageUrl(guide.coverImage) }} style={styles.coverImg} resizeMode="cover" />
          ) : null}

          <View style={styles.contentBox}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Eye size={13} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{guide.viewsCount || 0} ভিউ</Text>
              </View>
              {guide.createdAt ? (
                <View style={styles.metaItem}>
                  <Calendar size={13} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {new Date(guide.createdAt).toLocaleDateString('bn-BD')}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{guide.title}</Text>

            {guide.youtubeUrl ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleOpenVideo}
                style={[styles.videoBtn, { backgroundColor: '#ef4444' }]}
              >
                <Play size={18} color="#ffffff" fill="#ffffff" />
                <Text style={styles.videoBtnText}>ইউটিউবে ভিডিও টিউটোরিয়াল দেখুন</Text>
                <ExternalLink size={14} color="#ffffff" />
              </TouchableOpacity>
            ) : null}

            {guide.description ? (
              <View style={[styles.descCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.descText, { color: colors.text }]}>
                  {guide.description.replace(/<[^>]*>?/gm, '')}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
  },
  scrollContent: {
    gap: 16,
  },
  coverImg: {
    width: '100%',
    height: 200,
  },
  contentBox: {
    padding: 16,
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 28,
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginVertical: 4,
  },
  videoBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  descCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  descText: {
    fontSize: 13.5,
    lineHeight: 22,
  },
});

