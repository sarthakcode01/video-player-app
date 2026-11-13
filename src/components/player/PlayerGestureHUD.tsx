import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export type GestureHUDType = 'volume' | 'brightness' | 'zoom' | null;

interface PlayerGestureHUDProps {
  type: GestureHUDType;
  value: number; // 0 to 1 for volume & brightness; 0.5 to 3.0 for zoom
  visible: boolean;
}

export const PlayerGestureHUD: React.FC<PlayerGestureHUDProps> = ({
  type,
  value,
  visible,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacityAnim]);

  if (!type) return null;

  // 1. Zoom HUD pill (horizontal top-center)
  if (type === 'zoom') {
    const percent = Math.round(value * 100);
    const isOriginal = percent === 100;

    return (
      <Animated.View
        style={[
          styles.zoomContainer,
          { opacity: opacityAnim },
        ]}
        pointerEvents="none"
      >
        <Ionicons
          name="scan-outline"
          size={16}
          color={isOriginal ? COLORS.primary : COLORS.accentYellow}
        />
        <Text style={styles.zoomText}>
          {percent}%{isOriginal ? ' (Original)' : ''}
        </Text>
      </Animated.View>
    );
  }

  // 2. Brightness HUD (Left side vertical pill)
  if (type === 'brightness') {
    const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
    const iconName = percent === 0 ? 'moon-outline' : percent > 60 ? 'sunny' : 'sunny-outline';

    return (
      <Animated.View
        style={[
          styles.verticalPill,
          styles.leftPosition,
          { opacity: opacityAnim },
        ]}
        pointerEvents="none"
      >
        <Ionicons name={iconName} size={22} color={COLORS.accentYellow} />
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { height: `${percent}%`, backgroundColor: COLORS.accentYellow }]} />
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </Animated.View>
    );
  }

  // 3. Volume HUD (Right side vertical pill)
  if (type === 'volume') {
    const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
    const iconName =
      percent === 0
        ? 'volume-mute'
        : percent < 35
        ? 'volume-low'
        : percent < 75
        ? 'volume-medium'
        : 'volume-high';

    return (
      <Animated.View
        style={[
          styles.verticalPill,
          styles.rightPosition,
          { opacity: opacityAnim },
        ]}
        pointerEvents="none"
      >
        <Ionicons name={iconName} size={22} color={COLORS.primary} />
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { height: `${percent}%`, backgroundColor: COLORS.primary }]} />
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </Animated.View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  zoomContainer: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 16, 22, 0.90)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  zoomText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verticalPill: {
    position: 'absolute',
    top: '32%',
    width: 52,
    height: 190,
    backgroundColor: 'rgba(15, 16, 22, 0.88)',
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  leftPosition: {
    left: 24,
  },
  rightPosition: {
    right: 24,
  },
  meterTrack: {
    width: 6,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  meterFill: {
    width: '100%',
    borderRadius: 3,
  },
  percentText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
