import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, Platform, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeNavigationBar } from './src/utils/safeNavigationBar';
import { MediaLibraryProvider } from './src/context/MediaLibraryContext';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import { VideoAsset } from './src/types/video';
import { COLORS } from './src/constants/theme';

export default function App() {
  const [selectedVideo, setSelectedVideo] = useState<VideoAsset | null>(null);

  // Configure Android System Navigation Bar to match dark theme (prevent white navigation bar)
  useEffect(() => {
    if (Platform.OS === 'android') {
      SafeNavigationBar.setBackgroundColorAsync('#0B0C10');
      SafeNavigationBar.setBorderColorAsync('#0B0C10');
      SafeNavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  // Handle external video launch intent (e.g. "Open With" from Files / Gallery / WhatsApp)
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      try {
        const decoded = decodeURIComponent(url);
        let filename = 'External Video';
        const parts = decoded.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length > 0) {
          filename = lastPart.split('?')[0];
        }

        const externalAsset: VideoAsset = {
          id: `ext_${Date.now()}`,
          uri: url,
          filename: filename || 'Video',
          duration: 0,
        };
        setSelectedVideo(externalAsset);
      } catch (err) {
        console.warn('[INTENT] Failed to open external video URL:', err);
      }
    };

    // Cold start (app opened by tapping a video file while closed)
    Linking.getInitialURL().then(handleUrl).catch(() => {});

    // Warm start (app opened by tapping a video file while already running in background)
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  // Handle hardware back button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (selectedVideo) {
        setSelectedVideo(null);
        return true; // handled
      }
      return false; // let system exit app
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [selectedVideo]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <MediaLibraryProvider>
          <View style={styles.container}>
            {/* LibraryScreen remains mounted permanently in background to preserve scroll and state */}
            <LibraryScreen onSelectVideo={(asset) => setSelectedVideo(asset)} />

            {/* PlayerScreen mounts as an absolute overlay when a video is selected */}
            {selectedVideo && (
              <View style={StyleSheet.absoluteFill}>
                <PlayerScreen asset={selectedVideo} onClose={() => setSelectedVideo(null)} />
              </View>
            )}
          </View>
        </MediaLibraryProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
