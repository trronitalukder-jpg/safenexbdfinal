import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import {
  MessageSquare,
  ShieldCheck,
  Search,
  X,
  UserPlus,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';
import { getChatSocket } from '../../sockets/chatSocket';
import { getImageUrl } from '../../utils/imageUtils';

export const ConversationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Suggested Users
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const searchDebounce = useRef<any>(null);

  const fetchConversations = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res: any = await api.get('/chat/conversations');
      const list = Array.isArray(res) ? res : res?.data || res?.conversations || [];

      // Normalize items
      const normalized = list.map((item: any) => {
        const other =
          item.otherUser ||
          item.participants?.find((p: any) => p.userId !== user.id)?.user;
        const convId = item.conversationId || item.id;
        return {
          ...item,
          conversationId: convId,
          otherUser: other,
        };
      });

      // Deduplicate normalized conversations by conversationId
      const deduped: any[] = [];
      const seenIds = new Set<string>();
      for (const item of normalized) {
        const k = item.conversationId || item.otherUser?.id;
        if (k && !seenIds.has(k)) {
          seenIds.add(k);
          deduped.push(item);
        }
      }

      setConversations(deduped);
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    try {
      setLoadingSuggested(true);
      const res: any = await api.get('/users/search');
      const raw = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(raw) ? raw : raw?.users || [];
      const filtered = list.filter((u: any) => u.id !== user.id);

      const dedupedUsers: any[] = [];
      const seenUserIds = new Set<string>();
      for (const u of filtered) {
        if (u?.id && !seenUserIds.has(u.id)) {
          seenUserIds.add(u.id);
          dedupedUsers.push(u);
        }
      }
      setSuggestedUsers(dedupedUsers);
    } catch (err) {
      console.warn('Failed to load suggested users:', err);
    } finally {
      setLoadingSuggested(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchSuggestedUsers();

    if (user?.id) {
      const socket = getChatSocket(user.id);
      const handleRefresh = () => {
        fetchConversations();
      };

      socket.on('notification:message', handleRefresh);
      socket.on('message:receive', handleRefresh);
      socket.on('transaction:update', handleRefresh);

      return () => {
        socket.off('notification:message', handleRefresh);
        socket.off('message:receive', handleRefresh);
        socket.off('transaction:update', handleRefresh);
      };
    }
  }, [user]);

  // Live user search debounce
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res: any = await api.get(`/users/search?query=${encodeURIComponent(searchQuery.trim())}`);
        const raw = res?.data !== undefined ? res.data : res;
        const list = Array.isArray(raw) ? raw : raw?.users || [];
        setSearchResults(list.filter((u: any) => u.id !== user?.id));
      } catch (err) {
        console.warn('User search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchQuery, user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
    fetchSuggestedUsers();
  }, [user]);

  // Open or create chat directly with target user (Guaranteed 1:1)
  const startChatWithUser = async (targetUser: any) => {
    if (!targetUser?.id) return;

    // Check if conversation exists
    const existing = conversations.find(
      (c) =>
        c.otherUser?.id === targetUser.id ||
        (targetUser.uniqueUserId && c.otherUser?.uniqueUserId === targetUser.uniqueUserId)
    );

    if (existing && existing.conversationId) {
      setSearchQuery('');
      setSearchResults([]);
      navigation.navigate('ChatDetail', {
        conversationId: existing.conversationId,
        targetUserId: targetUser.id,
        partner: existing.otherUser || targetUser,
      });
      return;
    }

    try {
      const res: any = await api.post('/chat/conversations', {
        targetUserId: targetUser.id,
        recipientId: targetUser.id,
      });
      const data = res?.data !== undefined ? res.data : res;
      const conversationId = data?.id || data?.conversationId;

      setSearchQuery('');
      setSearchResults([]);
      navigation.navigate('ChatDetail', {
        conversationId,
        targetUserId: targetUser.id,
        partner: targetUser,
      });
    } catch (err: any) {
      console.warn('Cannot open chat:', err);
      // Still attempt navigation with targetUserId
      navigation.navigate('ChatDetail', {
        targetUserId: targetUser.id,
        partner: targetUser,
      });
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="লাইভ চ্যাট" />
        <View style={styles.centerBox}>
          <MessageSquare size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>চ্যাট দেখতে লগইন করুন</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            সেলার ও বায়ারদের সাথে নিরাপদ এসক্রো চ্যাট ও ডিল পরিচালনা করতে আপনার অ্যাকাউন্টে লগইন করুন।
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.loginBtnText}>লগইন করুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderConversationItem = ({ item }: { item: any }) => {
    const other = item.otherUser;
    const otherName = other?.firstName
      ? `${other.firstName} ${other.lastName || ''}`.trim()
      : other?.uniqueUserId || 'ব্যবহারকারী';
    const otherHandle = other?.uniqueUserId || 'User';
    const lastMsg = item.lastMessage?.content || 'কথোপকথন শুরু করতে ট্যাপ করুন';
    const hasActiveDeal = Boolean(item.activeTransaction || item.transactionId);
    const avatarUrl = other?.avatarUrl ? getImageUrl(other.avatarUrl) : null;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() =>
          navigation.navigate('ChatDetail', {
            conversationId: item.conversationId,
            targetUserId: other?.id,
            partner: other,
          })
        }
        style={[styles.chatItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {/* Avatar */}
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{otherName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.chatInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
              {otherName}
            </Text>
            {item.updatedAt && (
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {new Date(item.updatedAt).toLocaleTimeString('bn-BD', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>

          <View style={styles.subRow}>
            <Text style={[styles.handleText, { color: colors.textMuted }]}>@{otherHandle}</Text>
            {hasActiveDeal && (
              <View style={styles.dealBadge}>
                <ShieldCheck size={11} color="#10b981" />
                <Text style={styles.dealBadgeText}>ACTIVE DEAL</Text>
              </View>
            )}
          </View>

          <Text style={[styles.lastMsgText, { color: colors.textSecondary }]} numberOfLines={1}>
            {lastMsg}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="লাইভ চ্যাট ও ডিলস" />

      {/* User Search Input */}
      <View style={[styles.searchBarWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ইউজার খুঁজুন (নাম, @ইউজার আইডি, ফোন)..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Live Search Results Dropdown/Overlay */}
      {searchQuery.trim().length > 0 ? (
        <View style={styles.searchContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            অনুসন্ধানের ফলাফল ({searchResults.length})
          </Text>
          {searching ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : searchResults.length === 0 ? (
            <View style={styles.noUserFoundBox}>
              <Text style={[styles.noUserFoundText, { color: colors.textMuted }]}>
                "{searchQuery}" দিয়ে কোনো ইউজার পাওয়া যায়নি।
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(u, idx) => `${u.id}_${idx}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: u }) => {
                const uName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.uniqueUserId;
                const avatar = u.avatarUrl ? getImageUrl(u.avatarUrl) : null;

                return (
                  <TouchableOpacity
                    style={[styles.userSearchResultItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => startChatWithUser(u)}
                  >
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.searchAvatarImg} />
                    ) : (
                      <View style={[styles.searchAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.searchAvatarText}>{uName.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.searchUserName, { color: colors.text }]}>{uName}</Text>
                      <Text style={[styles.searchUserHandle, { color: colors.textMuted }]}>@{u.uniqueUserId}</Text>
                    </View>
                    <View style={[styles.startChatChip, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.startChatChipText, { color: colors.primary }]}>চ্যাট করুন</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.mainScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Suggested Users / Start New Chat Strip */}
          {suggestedUsers.length > 0 && (
            <View style={styles.suggestedSection}>
              <View style={styles.suggestedHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Users size={16} color={colors.primary} />
                  <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                    ইউজার তালিকা (নতুন চ্যাট শুরু করুন)
                  </Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedHorizontalScroll}
              >
                {suggestedUsers.slice(0, 15).map((u, idx) => {
                  const uName = u.firstName || u.uniqueUserId || 'User';
                  const avatar = u.avatarUrl ? getImageUrl(u.avatarUrl) : null;

                  return (
                    <TouchableOpacity
                      key={`${u.id}_${idx}`}
                      style={[styles.suggestedUserCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => startChatWithUser(u)}
                      activeOpacity={0.7}
                    >
                      {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.suggestedAvatarImg} />
                      ) : (
                        <View style={[styles.suggestedAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.suggestedAvatarText}>{uName.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={[styles.suggestedUserName, { color: colors.text }]} numberOfLines={1}>
                        {uName}
                      </Text>
                      <Text style={[styles.suggestedUserHandle, { color: colors.textMuted }]} numberOfLines={1}>
                        @{u.uniqueUserId}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Active Conversations Heading */}
          <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 16 }]}>
            কথোপকথনসমূহ ({conversations.length})
          </Text>

          {loading && !refreshing ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : conversations.length === 0 ? (
            <View style={[styles.emptyConvsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MessageSquare size={36} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 16 }]}>এখনো কোনো চ্যাট শুরু হয়নি</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                উপরে ইউজার সার্চ করুন অথবা ইউজার তালিকা থেকে যেকোনো ইউজারের সাথে ১-ট্যাপে চ্যাট শুরু করুন।
              </Text>
            </View>
          ) : (
            <View style={styles.conversationsList}>
              {conversations.map((c, idx) => (
                <View key={`${c.conversationId || 'conv'}_${idx}`}>
                  {renderConversationItem({ item: c })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  noUserFoundBox: {
    padding: 24,
    alignItems: 'center',
  },
  noUserFoundText: {
    fontSize: 13,
  },
  userSearchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  searchAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  searchAvatarText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  searchUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchUserHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  startChatChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startChatChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  suggestedSection: {
    marginTop: 4,
    marginBottom: 10,
  },
  suggestedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  suggestedHorizontalScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  suggestedUserCard: {
    width: 90,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  suggestedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  suggestedAvatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 6,
  },
  suggestedAvatarText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  suggestedUserName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  suggestedUserHandle: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  conversationsList: {
    gap: 10,
    marginTop: 4,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  chatInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  timeText: {
    fontSize: 11,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  handleText: {
    fontSize: 12,
  },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dealBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  lastMsgText: {
    fontSize: 13,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 250,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyConvsCard: {
    padding: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  loginBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
