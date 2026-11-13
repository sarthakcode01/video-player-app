/**
 * Formats seconds into HH:MM:SS or MM:SS
 * @param totalSeconds Number of seconds
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats byte size into human readable string (KB, MB, GB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: 'English',
  eng: 'English',
  hi: 'Hindi',
  hin: 'Hindi',
  es: 'Spanish',
  spa: 'Spanish',
  fr: 'French',
  fra: 'French',
  fre: 'French',
  de: 'German',
  deu: 'German',
  ger: 'German',
  ja: 'Japanese',
  jpn: 'Japanese',
  ko: 'Korean',
  kor: 'Korean',
  zh: 'Chinese',
  zho: 'Chinese',
  chi: 'Chinese',
  ta: 'Tamil',
  tam: 'Tamil',
  te: 'Telugu',
  tel: 'Telugu',
  ml: 'Malayalam',
  mal: 'Malayalam',
  mr: 'Marathi',
  mar: 'Marathi',
  bn: 'Bengali',
  ben: 'Bengali',
  pa: 'Punjabi',
  pan: 'Punjabi',
  ru: 'Russian',
  rus: 'Russian',
  pt: 'Portuguese',
  por: 'Portuguese',
  it: 'Italian',
  ita: 'Italian',
  ar: 'Arabic',
  ara: 'Arabic',
  und: 'Undetermined',
};

/**
 * Step 5.2 — Formats track stream metadata into human-readable track titles
 */
export function formatTrackLabel(
  track: { index: number; title?: string; language?: string },
  fallbackType: 'Audio' | 'Subtitle' = 'Audio'
): string {
  const langKey = track.language ? track.language.toLowerCase().trim() : '';
  const readableLanguage = langKey && LANGUAGE_CODE_MAP[langKey] ? LANGUAGE_CODE_MAP[langKey] : null;

  if (track.title && readableLanguage) {
    // If title doesn't already contain the language name, join them
    if (track.title.toLowerCase().includes(readableLanguage.toLowerCase())) {
      return track.title;
    }
    return `${readableLanguage} (${track.title})`;
  }

  if (track.title) {
    return track.title;
  }

  if (readableLanguage) {
    return readableLanguage;
  }

  if (track.language && track.language !== 'und') {
    return track.language.toUpperCase();
  }

  return `${fallbackType} Track ${track.index + 1}`;
}

/**
 * Formats an epoch timestamp into a friendly relative time (e.g. 'Just now', '15m ago', 'Yesterday')
 */
export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
