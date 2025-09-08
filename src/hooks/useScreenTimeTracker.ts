import { useState, useEffect, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

interface ScreenTimeState {
  accumulated: number; // seconds accumulated before current active session
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null; // ms timestamp when last resumed
}

const STORAGE_KEY = 'screen_time_data';

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

  const startTimer = useCallback(() => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: now,
    }));
  }, []);

  const stopTimer = useCallback(() => {
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
  }, []);

  const resetTimer = useCallback(async () => {
    setState({ accumulated: 0, isActive: false, isPaused: false, startTime: null });
    try {
      await Preferences.remove({ key: STORAGE_KEY });
    } catch (error) {
      console.error('Failed to clear saved timer data:', error);
    }
  }, []);

  const getTime = useCallback(() => {
    let total = state.accumulated;
    if (state.isActive && !state.isPaused && state.startTime) {
      total += Math.floor((Date.now() - state.startTime) / 1000);
    }
    return total;
  }, [state]);

  return {
    getTime,
    isActive: state.isActive,
    isPaused: state.isPaused,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
