import { useState, useEffect, useCallback, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

interface ScreenTimeState {
  totalTime: number;
  isActive: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number;
}

const STORAGE_KEY = 'screen_time_data';

export const useScreenTimeTracker = () => {
  const [state, setState] = useState<ScreenTimeState>({
    totalTime: 0,
    isActive: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveTime = useRef<number>(Date.now());

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const savedState = JSON.parse(value);
          setState(savedState);
          
          // If timer was active when app closed, calculate elapsed time
          if (savedState.isActive && savedState.startTime) {
            const elapsedSinceStart = Math.floor((Date.now() - savedState.startTime) / 1000);
            setState(prev => ({
              ...prev,
              totalTime: savedState.totalTime + elapsedSinceStart - savedState.pausedTime,
              startTime: Date.now(), // Reset start time to now
              pausedTime: 0,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load saved timer data:', error);
      }
    };

    loadSavedData();
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    const saveState = async () => {
      try {
        await Preferences.set({
          key: STORAGE_KEY,
          value: JSON.stringify(state),
        });
      } catch (error) {
        console.error('Failed to save timer data:', error);
      }
    };

    if (state.startTime !== null) {
      saveState();
    }
  }, [state]);

  // Handle app state changes (background/foreground/screen lock)
  useEffect(() => {
    const handleAppStateChange = (appState: { isActive: boolean }) => {
      const now = Date.now();
      
      if (appState.isActive) {
        // App became active - resume timer if it was running
        if (state.isActive && state.isPaused) {
          setState(prev => ({
            ...prev,
            isPaused: false,
            pausedTime: prev.pausedTime + Math.floor((now - lastActiveTime.current) / 1000),
          }));
        }
        lastActiveTime.current = now;
      } else {
        // App became inactive - pause timer if running
        if (state.isActive && !state.isPaused) {
          setState(prev => ({
            ...prev,
            isPaused: true,
          }));
        }
        lastActiveTime.current = now;
      }
    };

    // Listen for app state changes
    let stateListenerCleanup: (() => void) | undefined;
    
    CapacitorApp.addListener('appStateChange', handleAppStateChange).then((listener) => {
      stateListenerCleanup = () => listener.remove();
    });

    // Handle visibility change for web
    const handleVisibilityChange = () => {
      handleAppStateChange({ isActive: !document.hidden });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (stateListenerCleanup) {
        stateListenerCleanup();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isActive, state.isPaused]);

  // Timer interval
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          if (prev.startTime) {
            const elapsedTotal = Math.floor((Date.now() - prev.startTime) / 1000);
            return {
              ...prev,
              totalTime: prev.totalTime + 1,
            };
          }
          return prev;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.isPaused]);

  const startTimer = useCallback(() => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: now,
      pausedTime: 0,
    }));
  }, []);

  const stopTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
    }));
  }, []);

  const resetTimer = useCallback(async () => {
    setState({
      totalTime: 0,
      isActive: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
    });
    
    try {
      await Preferences.remove({ key: STORAGE_KEY });
    } catch (error) {
      console.error('Failed to clear saved timer data:', error);
    }
  }, []);

  const getCurrentTime = useCallback(() => {
    if (state.isActive && state.startTime && !state.isPaused) {
      const elapsedSinceStart = Math.floor((Date.now() - state.startTime) / 1000);
      return state.totalTime + elapsedSinceStart - state.pausedTime;
    }
    return state.totalTime;
  }, [state]);

  return {
    time: getCurrentTime(),
    isActive: state.isActive,
    isPaused: state.isPaused,
    startTimer,
    stopTimer,
    resetTimer,
  };
};