import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DoubleTapRippleIndicatorProps {
  side: 'left' | 'right' | null;
  seconds: number;
}

export const DoubleTapRippleIndicator: React.FC<DoubleTapRippleIndicatorProps> = ({
  side,
  seconds,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (side) {
      opacityAnim.setValue(0.9);
      scaleAnim.setValue(0.85);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 650,
          delay: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [side, seconds, opacityAnim, scaleAnim]);

  if (!side) return null;

  const isLeft = side === 'left';

  return (
    <View
      style={[
        styles.container,
        isLeft ? styles.leftContainer : styles.rightContainer,
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.curvedOverlay,
          isLeft ? styles.leftCurved : styles.rightCurved,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconRow}>
            {isLeft ? (
              <>
                <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                <Ionicons name="chevron-back" size={26} color="#FFFFFF" style={{ marginLeft: -14 }} />
                <Ionicons name="chevron-back" size={26} color="#FFFFFF" style={{ marginLeft: -14 }} />
              </>
            ) : (
              <>
                <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
                <Ionicons name="chevron-forward" size={26} color="#FFFFFF" style={{ marginLeft: -14 }} />
                <Ionicons name="chevron-forward" size={26} color="#FFFFFF" style={{ marginLeft: -14 }} />
              </>
            )}
          </View>
          <Text style={styles.secondsText}>
            {seconds} seconds
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '45%',
    zIndex: 15,
  },
  leftContainer: {
    left: 0,
  },
  rightContainer: {
    right: 0,
  },
  curvedOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftCurved: {
    borderTopRightRadius: 9999,
    borderBottomRightRadius: 9999,
  },
  rightCurved: {
    borderTopLeftRadius: 9999,
    borderBottomLeftRadius: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
