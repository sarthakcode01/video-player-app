import React, { useState, useMemo, useRef } from 'react';
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
  children,
}) => {
  const [containerSize, setContainerSize] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });

  const panSide = useSharedValue<'left' | 'right'>('right');

  // Keep latest callback references in ref to prevent gestures from re-instantiating on state changes
  const callbacksRef = useRef({
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
  });
  callbacksRef.current = {
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
  };

  const callSingleTap = () => callbacksRef.current.onSingleTap?.();
  const callDoubleTapSeek = (side: 'left' | 'right') => callbacksRef.current.onDoubleTapSeek?.(side);
  const callHoldStart = (side: HoldSide) => callbacksRef.current.onHoldStart?.(side);
  const callHoldEnd = () => callbacksRef.current.onHoldEnd?.();
  const callPinchStart = () => callbacksRef.current.onPinchStart?.();
  const callPinchChange = (scale: number) => callbacksRef.current.onPinchChange?.(scale);
  const callPinchEnd = () => callbacksRef.current.onPinchEnd?.();
  const callVerticalSwipeStart = (side: 'left' | 'right') => callbacksRef.current.onVerticalSwipeStart?.(side);
  const callVerticalSwipeChange = (side: 'left' | 'right', translationY: number) =>
    callbacksRef.current.onVerticalSwipeChange?.(side, translationY);
  const callVerticalSwipeEnd = (side: 'left' | 'right') => callbacksRef.current.onVerticalSwipeEnd?.(side);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
  };

  const composedGesture = useMemo(() => {
    // 1. Single-Tap recognizer: Toggles UI overlay (single finger only)
    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDuration(250)
      .onEnd(() => {
        'worklet';
        runOnJS(callSingleTap)();
      });

    // 2. Double-Tap recognizer: Screen zone partitioning (Left 40% vs Right 40% vs Center 20%)
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd((e: any) => {
        'worklet';
        const x = e.x;
        const width = containerSize.width;
        const leftBoundary = width * 0.4;
        const rightBoundary = width * 0.6;

        if (x <= leftBoundary) {
          runOnJS(callDoubleTapSeek)('left');
        } else if (x >= rightBoundary) {
          runOnJS(callDoubleTapSeek)('right');
        } else {
          runOnJS(callSingleTap)();
        }
      });

    // 3. Long-Press recognizer: holding the left or right 40% fast-forwards (single finger only)
    const longPress = Gesture.LongPress()
      .minDuration(250)
      .onStart((e: any) => {
        'worklet';
        const width = containerSize.width;
        if (e.x <= width * 0.4) {
          runOnJS(callHoldStart)('left');
        } else if (e.x >= width * 0.6) {
          runOnJS(callHoldStart)('right');
        }
      })
      .onFinalize((_e: any, success: boolean) => {
        'worklet';
        if (success) {
          runOnJS(callHoldEnd)();
        }
      });

    // 4. Continuous Pinch-to-Zoom recognizer (2-finger)
    const pinch = Gesture.Pinch()
      .onStart(() => {
        'worklet';
        runOnJS(callPinchStart)();
      })
      .onUpdate((e: any) => {
        'worklet';
        runOnJS(callPinchChange)(e.scale);
      })
      .onFinalize(() => {
        'worklet';
        runOnJS(callPinchEnd)();
      });

    // 5. Vertical Pan recognizer: Left 50% = Brightness, Right 50% = Volume (strictly 1 finger)
    const verticalPan = Gesture.Pan()
      .minDistance(15)
      .minPointers(1)
      .maxPointers(1)
      .activeOffsetY([-20, 20])
      .failOffsetX([-25, 25])
      .onStart((e: any) => {
        'worklet';
        panSide.value = e.x < containerSize.width * 0.5 ? 'left' : 'right';
        runOnJS(callVerticalSwipeStart)(panSide.value);
      })
      .onUpdate((e: any) => {
        'worklet';
        runOnJS(callVerticalSwipeChange)(panSide.value, e.translationY);
      })
      .onFinalize(() => {
        'worklet';
        runOnJS(callVerticalSwipeEnd)(panSide.value);
      });

    // Priority hierarchy:
    // DoubleTap has priority over SingleTap (Exclusive)
    const tapGestures = Gesture.Exclusive(doubleTap, singleTap);
    // LongPress races with tap gestures (holding for 250ms starts hold before tap fires)
    const touchGestures = Gesture.Race(longPress, tapGestures);
    // Pan and Pinch can execute simultaneously with touch gestures
    return Gesture.Simultaneous(pinch, verticalPan, touchGestures);
  }, [containerSize.width]);

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
