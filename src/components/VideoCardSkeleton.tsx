import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

interface VideoCardSkeletonProps {
  layout?: 'grid' | 'list';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - SPACING.md * 3) / 2;

export const VideoCardSkeleton: React.FC<VideoCardSkeletonProps> = ({ layout = 'grid' }) => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (layout === 'list') {
    return (
      <View style={styles.listContainer}>
        <Animated.View style={[styles.listThumbnail, { opacity: pulseAnim }]} />
        <View style={styles.listInfoContainer}>
          <Animated.View style={[styles.titlePlaceholder, { width: '85%', opacity: pulseAnim }]} />
          <Animated.View style={[styles.titlePlaceholder, { width: '50%', marginTop: 6, opacity: pulseAnim }]} />
          <View style={styles.tagRow}>
            <Animated.View style={[styles.badgePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.badgePlaceholder, { width: 38, opacity: pulseAnim }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      <Animated.View style={[styles.gridThumbnail, { opacity: pulseAnim }]} />
      <View style={styles.gridInfoContainer}>
        <Animated.View style={[styles.titlePlaceholder, { width: '90%', opacity: pulseAnim }]} />
        <Animated.View style={[styles.titlePlaceholder, { width: '60%', marginTop: 6, opacity: pulseAnim }]} />
        <View style={styles.tagRow}>
          <Animated.View style={[styles.badgePlaceholder, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.badgePlaceholder, { width: 38, opacity: pulseAnim }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Grid layout
  gridContainer: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridThumbnail: {
    width: '100%',
    height: GRID_ITEM_WIDTH * 0.65,
    backgroundColor: COLORS.surfaceElevated,
  },
  gridInfoContainer: {
    padding: SPACING.sm,
  },
  // List layout
  listContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  listThumbnail: {
    width: 120,
    height: 75,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
  },
  listInfoContainer: {
    flex: 1,
    paddingLeft: SPACING.sm,
    justifyContent: 'center',
  },
  // Shared placeholders
  titlePlaceholder: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  badgePlaceholder: {
    width: 32,
    height: 16,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceElevated,
  },
});
