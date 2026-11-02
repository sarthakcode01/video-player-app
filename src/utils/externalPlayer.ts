import { Linking, Platform, Alert } from 'react-native';

/**
 * Hands the video file over to an external media player (VLC, MX Player, etc.)
 * via Android Intent.ACTION_VIEW with the standardized MediaStore Content URI.
 */
export const openInExternalPlayer = async (uri: string, mediaId?: string): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const targetUri =
      mediaId && /^\d+$/.test(mediaId)
        ? `content://media/external/video/media/${mediaId}`
        : uri;

    try {
      // Send standard Android ACTION_VIEW intent for video mime type
      if ('sendIntent' in Linking && typeof (Linking as any).sendIntent === 'function') {
        await (Linking as any).sendIntent('android.intent.action.VIEW', [
          { key: 'data', value: targetUri },
          { key: 'type', value: 'video/*' },
        ]);
        return true;
      }

      await Linking.openURL(targetUri);
      return true;
    } catch (err) {
      console.warn('[EXTERNAL_PLAYER] Failed to open external player intent:', err);
      Alert.alert(
        'External Player',
        'Could not find a supported video player. Please install VLC or MX Player from Google Play Store.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } else {
    try {
      const canOpen = await Linking.canOpenURL(uri);
      if (canOpen) {
        await Linking.openURL(uri);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[EXTERNAL_PLAYER] iOS openURL failed:', err);
      return false;
    }
  }
};
