import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  WatchHistoryEntry,
  getWatchHistoryList,
  clearWatchHistory,
  removeWatchHistoryItem,
} from '../utils/watchHistory';
import { VideoAsset } from '../types/video';
import { COLORS, SPACING } from '../constants/theme';
import { formatDuration, formatRelativeTime } from '../utils/formatters';

interface WatchHistoryListViewProps {
  onSelectVideo: (asset: VideoAsset) => void;
}

export const WatchHistoryListView: React.FC<WatchHistoryListViewProps> = ({ onSelectVideo }) => {
  const [historyList, setHistoryList] = useState<WatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadHistory = useCallback(async () => {
    try {
      const items = await getWatchHistoryList();
      setHistoryList(items);
    } catch (err) {
      console.warn('Failed to load watch history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory();
  }, [loadHistory]);

  const handleClearAll = () => {
    if (historyList.length === 0) return;
    Alert.alert(
      'Clear Watch History',
      'Are you sure you want to clear your entire playback history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearWatchHistory();
            setHistoryList([]);
          },
        },
      ]
    );
  };

  const handleRemoveSingle = (item: WatchHistoryEntry) => {
    Alert.alert(
      'Remove from History',
      `Remove "${item.filename || 'this video'}" from your watch history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeWatchHistoryItem(item.videoId);
            setHistoryList((prev) => prev.filter((h) => h.videoId !== item.videoId));
          },
        },
      ]
    );
  };

  const handleResume = (item: WatchHistoryEntry) => {
    const asset: VideoAsset = {
      id: item.videoId,
      uri: item.uri || '',
      filename: item.filename || 'Untitled Video',
      duration: item.duration || 0,
      albumTitle: item.albumTitle || 'Watch History',
      watchProgressPercent: item.percent || 0,
    };
    onSelectVideo(asset);
  };

  const renderItem = ({ item }: { item: WatchHistoryEntry }) => {
    const isFinished = item.percent >= 95;
    const hasProgress = item.position > 0 && !isFinished;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleResume(item)}
        activeOpacity={0.7}
      >
        {/* Left Thumbnail or Placeholder */}
        <View style={styles.thumbnailContainer}>
          {item.uri ? (
            <Image source={{ uri: item.uri }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Ionicons name="film-outline" size={26} color={COLORS.textSecondary} />
            </View>
          )}

          {/* Duration Badge */}
          {item.duration > 0 && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
            </View>
          )}

          {/* Watched Progress Bar */}
          {item.duration > 0 && (
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${isFinished ? 100 : item.percent}%` },
                  isFinished && { backgroundColor: COLORS.success },
                ]}
              />
            </View>
          )}
        </View>

        {/* Center Video Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.filename} numberOfLines={2}>
            {item.filename || 'Video'}
          </Text>

          <View style={styles.metaRow}>
            {item.albumTitle ? (
              <View style={styles.tag}>
                <Ionicons name="folder-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.tagText} numberOfLines={1}>
                  {item.albumTitle}
                </Text>
              </View>
            ) : null}

            {item.updatedAt ? (
              <Text style={styles.timeAgoText}>{formatRelativeTime(item.updatedAt)}</Text>
            ) : null}
          </View>

          {/* Progress Summary Text */}
          <View style={styles.statusRow}>
            {isFinished ? (
              <View style={styles.finishedBadge}>
                <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                <Text style={styles.finishedText}>Watched</Text>
              </View>
            ) : hasProgress ? (
              <Text style={styles.progressText}>
                Resume at {formatDuration(item.position)} ({item.percent}%)
              </Text>
            ) : (
              <Text style={styles.progressText}>Watched {item.percent}%</Text>
            )}
          </View>
        </View>

        {/* Right Action: Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveSingle(item)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.6}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* History Header Action Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Ionicons name="time" size={18} color={COLORS.primary} />
          <Text style={styles.headerTitle}>
            Recently Played ({historyList.length})
          </Text>
        </View>

        {historyList.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-bin-outline" size={14} color={COLORS.error} />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* History Items FlatList */}
      <FlatList
        data={historyList}
        keyExtractor={(item) => item.videoId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="time-outline" size={42} color={COLORS.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Watch History</Text>
              <Text style={styles.emptySubtitle}>
                Videos you play will appear here so you can easily resume watching right where you left off.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  clearAllText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    alignItems: 'center',
    gap: 12,
  },
  thumbnailContainer: {
    width: 105,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#161822',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  filename: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tagText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  timeAgoText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    color: COLORS.accentYellow,
    fontSize: 11,
    fontWeight: '600',
  },
  finishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finishedText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.xl,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
