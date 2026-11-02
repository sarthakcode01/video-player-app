import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

const { Orientation, OrientationLock } = ScreenOrientation;

function isLandscapeOrientation(o: ScreenOrientation.Orientation): boolean {
  return o === Orientation.LANDSCAPE_LEFT || o === Orientation.LANDSCAPE_RIGHT;
}

/**
 * Helper to unlock orientation to follow the physical device sensor.
 * On Android, OrientationLock.ALL sets ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR,
 * which allows the screen to rotate freely between portrait and landscape based on the accelerometer.
 * (unlockAsync() sets SCREEN_ORIENTATION_UNSPECIFIED, which fails to re-enable sensor rotation on Android
 * once the activity was previously locked to PORTRAIT_UP).
 * On iOS, unlockAsync() enables all supported orientations without throwing on notched devices.
 */
async function unlockToSensor(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await ScreenOrientation.lockAsync(OrientationLock.ALL);
    } else {
      await ScreenOrientation.unlockAsync();
    }
  } catch (error) {
    console.warn('Failed to unlock orientation to sensor:', error);
  }
}

/**
 * Player orientation control.
 * - Auto (default): screen follows the phone's physical sensor until explicitly locked.
 * - Locked: orientation is frozen to the current angle until the user unlocks.
 * isFullscreen reports whether the player is currently in landscape.
 */
export function useOrientation(initialFullscreen = false) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(initialFullscreen);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Start in auto-rotate and track orientation changes
  useEffect(() => {
    let mounted = true;

    // Immediately enable sensor auto-rotation upon entering player
    unlockToSensor();

    ScreenOrientation.getOrientationAsync()
      .then((o) => {
        if (mounted) setIsFullscreen(isLandscapeOrientation(o));
      })
      .catch(() => {});

    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      if (mounted) {
        setIsFullscreen(isLandscapeOrientation(event.orientationInfo.orientation));
      }
    });

    return () => {
      mounted = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
      // Always restore upright portrait when leaving the player back to library
      ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  // Explicitly freeze the current orientation, or return to auto-rotate
  const toggleLock = useCallback(async () => {
    try {
      if (isLocked) {
        await unlockToSensor();
        setIsLocked(false);
        return;
      }
      const current = await ScreenOrientation.getOrientationAsync();
      const lock =
        current === Orientation.LANDSCAPE_LEFT
          ? OrientationLock.LANDSCAPE_LEFT
          : current === Orientation.LANDSCAPE_RIGHT
          ? OrientationLock.LANDSCAPE_RIGHT
          : current === Orientation.PORTRAIT_DOWN
          ? OrientationLock.PORTRAIT_DOWN
          : OrientationLock.PORTRAIT_UP;
      await ScreenOrientation.lockAsync(lock);
      setIsLocked(true);
    } catch (error) {
      console.warn('Failed to toggle orientation lock:', error);
    }
  }, [isLocked]);

  // Force landscape
  const enterFullscreen = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(OrientationLock.LANDSCAPE);
      setIsFullscreen(true);
      // If user hadn't locked, keep isLocked false so toggleLock can lock/unlock smoothly
    } catch (error) {
      console.warn('Failed to set orientation to landscape:', error);
    }
  }, []);

  // Force portrait
  const exitFullscreen = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
    } catch (error) {
      console.warn('Failed to restore orientation to portrait:', error);
    }
  }, []);

  // Fullscreen button: toggle between landscape and portrait
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isLocked,
    toggleLock,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    unlockToSensor,
  };
}
