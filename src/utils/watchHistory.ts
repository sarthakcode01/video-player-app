import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PREFIX = '@video_player_history_';

export interface WatchHistoryEntry {
  videoId: string;
  position: number; // in seconds
  duration: number; // in seconds
  percent: number; // 0 to 100
  updatedAt: number; // epoch timestamp
  filename?: string;
  uri?: string;
  albumTitle?: string;
}

// In-memory fallback and fast cache for instant lookups
const memoryHistoryCache: Record<string, WatchHistoryEntry> = {};

/**
 * Preloads all watch history entries into memory in a single multiGet query.
 * Drastically accelerates initial media library indexing.
 */
export async function preloadWatchHistory(): Promise<Record<string, WatchHistoryEntry>> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
    if (historyKeys.length > 0) {
      const pairs = await AsyncStorage.multiGet(historyKeys);
      pairs.forEach(([key, val]) => {
        if (val) {
          try {
            const entry: WatchHistoryEntry = JSON.parse(val);
            const videoId = key.substring(STORAGE_KEY_PREFIX.length);
            memoryHistoryCache[videoId] = entry;
          } catch {}
        }
      });
    }
  } catch (error) {
    console.warn('Failed to batch preload watch history:', error);
  }
  return memoryHistoryCache;
}

/**
 * Instant synchronous lookup from memory cache.
 */
export function getCachedPlaybackPosition(videoId: string): WatchHistoryEntry | null {
  return memoryHistoryCache[videoId] || null;
}

/**
 * Saves video playback timestamp with metadata
 */
export async function savePlaybackPosition(
  videoId: string,
  positionSeconds: number,
  durationSeconds: number,
  metadata?: { filename?: string; uri?: string; albumTitle?: string }
): Promise<void> {
  if (!videoId || durationSeconds <= 0) return;

  const percent = Math.min(100, Math.max(0, Math.round((positionSeconds / durationSeconds) * 100)));

  // If video is finished (>95% watched), reset position to start
  const positionToSave = percent >= 95 ? 0 : Math.floor(positionSeconds);

  // Preserve existing metadata if not passed
  const existing = memoryHistoryCache[videoId];

  const entry: WatchHistoryEntry = {
    videoId,
    position: positionToSave,
    duration: Math.floor(durationSeconds),
    percent: percent >= 95 ? 0 : percent,
    updatedAt: Date.now(),
    filename: metadata?.filename || existing?.filename || '',
    uri: metadata?.uri || existing?.uri || '',
    albumTitle: metadata?.albumTitle || existing?.albumTitle || '',
  };

  memoryHistoryCache[videoId] = entry;

  try {
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${videoId}`, JSON.stringify(entry));
  } catch (error) {
    // Silently fall back to in-memory cache
  }
}

/**
 * Retrieves saved playback timestamp for a video
 */
export async function getPlaybackPosition(videoId: string): Promise<WatchHistoryEntry | null> {
  if (!videoId) return null;

  if (memoryHistoryCache[videoId]) {
    return memoryHistoryCache[videoId];
  }

  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${videoId}`);
    if (raw) {
      const parsed: WatchHistoryEntry = JSON.parse(raw);
      memoryHistoryCache[videoId] = parsed;
      return parsed;
    }
  } catch (error) {
    // Fall back to memory
  }

  return null;
}

/**
 * Returns all watch history entries sorted by most recently watched.
 */
export async function getWatchHistoryList(): Promise<WatchHistoryEntry[]> {
  try {
    await preloadWatchHistory();
    const entries = Object.values(memoryHistoryCache);
    return entries
      .filter((e) => e && e.videoId)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (error) {
    console.warn('Failed to retrieve watch history list:', error);
    return [];
  }
}

/**
 * Removes a single history item.
 */
export async function removeWatchHistoryItem(videoId: string): Promise<void> {
  if (!videoId) return;
  delete memoryHistoryCache[videoId];
  try {
    await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${videoId}`);
  } catch (error) {
    console.warn('Failed to remove watch history item:', error);
  }
}

/**
 * Clears all watch history.
 */
export async function clearWatchHistory(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const historyKeys = allKeys.filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
    if (historyKeys.length > 0) {
      await AsyncStorage.multiRemove(historyKeys);
    }
    Object.keys(memoryHistoryCache).forEach((k) => delete memoryHistoryCache[k]);
  } catch (error) {
    console.warn('Failed to clear watch history:', error);
  }
}
