import { useState, useEffect, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

interface ScreenTimeState {
  accumulated: number; // seconds accumulated before current active session
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null; // ms timestamp when last resumed
}

const STORAGE_KEY = 'screen_time_data';
const NOTIFICATION_ID = 1;

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const useScreenTimeTracker = () => {
  const [state, setState] = useState<ScreenTimeState>({
    accumulated: 0,
    isActive: false,
    isPaused: false,
    startTime: null,
  });

  // Load saved data on mount (with migration from older shape)
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Request notification permissions and ensure Android notification channel
        await LocalNotifications.requestPermissions();

        try {
          // Create/update Android notification channel for ongoing timer
          await (LocalNotifications as any).createChannel?.({
            id: 'screen_time',
            name: 'Screen Time',
            description: 'Ongoing screen time tracking',
            importance: 4, // HIGH
            visibility: 1, // PUBLIC on lock screen
            lights: false,
            vibration: false,
          });
        } catch (e) {
          console.log('Channel create skipped (web/iOS):', e);
        }

        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const saved = JSON.parse(value);
          const next: ScreenTimeState = 'accumulated' in saved
            ? saved
            : {
                accumulated: saved.totalTime ?? 0,
                isActive: saved.isActive ?? false,
                isPaused: saved.isPaused ?? false,
                startTime: saved.startTime ?? null,
              };

          if (next.isActive && next.startTime && !next.isPaused) {
            // Add elapsed since last start to accumulated and reset startTime to now
            next.accumulated += Math.floor((Date.now() - next.startTime) / 1000);
            next.startTime = Date.now();
          }

          setState(next);
        }
      } catch (error) {
        console.error('Failed to load saved timer data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Persist state
  useEffect(() => {
    const saveState = async () => {
      try {
        await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(state) });
      } catch (error) {
        console.error('Failed to save timer data:', error);
      }
    };

    saveState();
  }, [state]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (appState: { isActive: boolean }) => {
      const now = Date.now();

      if (appState.isActive) {
        // App came to foreground: resume if timer was paused
        setState(prev => {
          if (prev.isActive && prev.isPaused) {
            return {
              ...prev,
              isPaused: false,
              startTime: now,
            };
          }
          return prev;
        });
      } else {
        // App went to background: pause if running and accumulate elapsed
        setState(prev => {
          if (prev.isActive && !prev.isPaused) {
            const elapsed = prev.startTime ? Math.floor((now - prev.startTime) / 1000) : 0;
            return {
              ...prev,
              accumulated: prev.accumulated + elapsed,
              isPaused: true,
              startTime: null,
            };
          }
          return prev;
        });
      }
    };

    let stateListenerCleanup: (() => void) | undefined;
    CapacitorApp.addListener('appStateChange', handleAppStateChange).then((listener) => {
      stateListenerCleanup = () => listener.remove();
    });

    // Web fallback
    const handleVisibilityChange = () => handleAppStateChange({ isActive: !document.hidden });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (stateListenerCleanup) stateListenerCleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isActive, state.isPaused]);

  const updateNotification = useCallback(async (time: number, isActive: boolean, isPaused: boolean) => {
    try {
      if (isActive && !isPaused) {
        await LocalNotifications.schedule({
          notifications: [{
            id: NOTIFICATION_ID,
            title: 'Screen Time Tracker',
            body: `Active: ${formatTime(time)}`,
            channelId: 'screen_time',
            ongoing: true,
            autoCancel: false,
            extra: { ongoing: true },
            schedule: undefined,
            sound: undefined,
            attachments: undefined,
            actionTypeId: undefined,
            group: undefined,
            groupSummary: false,
          }]
        });
      } else {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
      }
    } catch (error) {
      console.log('Notification error (normal in web):', error);
    }
  }, []);

  const startTimer = useCallback(async () => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: now,
    }));
  }, []);

  const stopTimer = useCallback(async () => {
    const now = Date.now();
    setState(prev => {
      let accumulated = prev.accumulated;
      if (prev.isActive && !prev.isPaused && prev.startTime) {
        accumulated += Math.floor((now - prev.startTime) / 1000);
      }
      return {
        accumulated,
        isActive: false,
        isPaused: false,
        startTime: null,
      };
    });
    await updateNotification(0, false, false);
  }, [updateNotification]);

  const resetTimer = useCallback(async () => {
    setState({ accumulated: 0, isActive: false, isPaused: false, startTime: null });
    await updateNotification(0, false, false);
    try {
      await Preferences.remove({ key: STORAGE_KEY });
    } catch (error) {
      console.error('Failed to clear saved timer data:', error);
    }
  }, [updateNotification]);

  const getTime = useCallback(() => {
    let total = state.accumulated;
    if (state.isActive && !state.isPaused && state.startTime) {
      total += Math.floor((Date.now() - state.startTime) / 1000);
    }
    return total;
  }, [state]);

  // Update notification when state changes
  useEffect(() => {
    const time = getTime();
    updateNotification(time, state.isActive, state.isPaused);
  }, [state.isActive, state.isPaused, state.accumulated, updateNotification, getTime]);

  // Periodically refresh ongoing notification (minutes precision)
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      const id = setInterval(() => {
        const time = getTime();
        updateNotification(time, true, false);
      }, 60000);
      return () => clearInterval(id);
    }
  }, [state.isActive, state.isPaused, getTime, updateNotification]);

  return {
    getTime,
    isActive: state.isActive,
    isPaused: state.isPaused,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
