import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { HoldSide } from '../../types/video';

interface GestureOverlayProps {
  onSingleTap: () => void;
  onDoubleTapSeek: (side: 'left' | 'right') => void;
  onHoldStart: (side: HoldSide) => void;
  onHoldEnd: () => void;
  // Continuous Pinch-to-Zoom
  onPinchStart?: () => void;
  onPinchChange?: (scaleFactor: number) => void;
  onPinchEnd?: () => void;
  // Vertical Swiping (Left: Brightness, Right: Volume)
  onVerticalSwipeStart?: (side: 'left' | 'right') => void;
  onVerticalSwipeChange?: (side: 'left' | 'right', translationY: number) => void;
  onVerticalSwipeEnd?: (side: 'left' | 'right') => void;
  // Legacy / convenience
  onPinchSnap?: (mode: 'zoom' | 'fit') => void;
  children?: React.ReactNode;
}

export const GestureOverlay: React.FC<GestureOverlayProps> = ({
  onSingleTap,
  onDoubleTapSeek,
  onHoldStart,
  onHoldEnd,
  onPinchStart,
  onPinchChange,
  onPinchEnd,
  onVerticalSwipeStart,
  onVerticalSwipeChange,
  onVerticalSwipeEnd,
  onPinchSnap,
  children,
}) => {
  const [containerSize, setContainerSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  const panSide = useSharedValue<'left' | 'right'>('right');

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
  };

  const composedGesture = useMemo(() => {
    // 1. Single-Tap recognizer: Toggles UI overlay after ensuring no second tap is incoming
    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(250)
      .onEnd(() => {
        'worklet';
        runOnJS(onSingleTap)();
      });

    // 2. Double-Tap recognizer: Screen zone partitioning (Left 40% vs Right 40% vs Center 20%)
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd((e) => {
        'worklet';
        const x = e.x;
        const width = containerSize.width;
        const leftBoundary = width * 0.4;
        const rightBoundary = width * 0.6;

        if (x <= leftBoundary) {
          // Left Zone: Rewind
          runOnJS(onDoubleTapSeek)('left');
        } else if (x >= rightBoundary) {
          // Right Zone: Fast-forward
          runOnJS(onDoubleTapSeek)('right');
        } else {
          // Center Zone: Regular toggle
          runOnJS(onSingleTap)();
        }
      });

    // 3. Long-Press recognizer: holding the left or right 40% fast-forwards
    const longPress = Gesture.LongPress()
      .minDuration(250)
      .onStart((e) => {
        'worklet';
        const width = containerSize.width;
        if (e.x <= width * 0.4) {
          runOnJS(onHoldStart)('left');
        } else if (e.x >= width * 0.6) {
          runOnJS(onHoldStart)('right');
        }
      })
      .onFinalize((_e, success) => {
        'worklet';
        if (success) {
          runOnJS(onHoldEnd)();
        }
      });

    // 4. Continuous Pinch-to-Zoom recognizer (2-finger)
    const pinch = Gesture.Pinch()
      .onStart(() => {
        'worklet';
        if (onPinchStart) {
          runOnJS(onPinchStart)();
        }
      })
      .onUpdate((e) => {
        'worklet';
        if (onPinchChange) {
          runOnJS(onPinchChange)(e.scale);
        }
      })
      .onEnd((e) => {
        'worklet';
        if (onPinchEnd) {
          runOnJS(onPinchEnd)();
        }
        if (onPinchSnap) {
          if (e.scale > 1.15) {
            runOnJS(onPinchSnap)('zoom');
          } else if (e.scale < 0.88) {
            runOnJS(onPinchSnap)('fit');
          }
        }
      });

    // 5. Vertical Pan recognizer: Left 50% = Brightness, Right 50% = Volume
    const verticalPan = Gesture.Pan()
      .minDistance(10)
      .maxPointers(1)
      .activeOffsetY([-12, 12])
      .failOffsetX([-25, 25])
      .onStart((e) => {
        'worklet';
        panSide.value = e.x < containerSize.width * 0.5 ? 'left' : 'right';
        if (onVerticalSwipeStart) {
          runOnJS(onVerticalSwipeStart)(panSide.value);
        }
      })
      .onUpdate((e) => {
        'worklet';
        if (onVerticalSwipeChange) {
          runOnJS(onVerticalSwipeChange)(panSide.value, e.translationY);
        }
      })
      .onFinalize(() => {
        'worklet';
        if (onVerticalSwipeEnd) {
          runOnJS(onVerticalSwipeEnd)(panSide.value);
        }
      });

    // Priority hierarchy:
    // DoubleTap has priority over SingleTap (Exclusive)
    const tapGestures = Gesture.Exclusive(doubleTap, singleTap);
    // LongPress races with tap gestures (holding for 250ms starts hold before tap fires)
    const touchGestures = Gesture.Race(longPress, tapGestures);
    // Pan and Pinch can execute simultaneously with touch gestures (Gesture Handler cancels taps once Pan/Pinch passes threshold)
    return Gesture.Simultaneous(pinch, verticalPan, touchGestures);
  }, [
    containerSize.width,
    onSingleTap,
    onDoubleTapSeek,
    onHoldStart,
    onHoldEnd,
    onPinchStart,
    onPinchChange,
    onPinchEnd,
    onPinchSnap,
    onVerticalSwipeStart,
    onVerticalSwipeChange,
    onVerticalSwipeEnd,
  ]);

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container} onLayout={onLayout} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});
