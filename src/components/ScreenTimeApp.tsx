import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TimerDisplay } from './TimerDisplay';
import { FloatingTimer } from './FloatingTimer';
import { PositionSelector } from './PositionSelector';
import { useScreenTimeTracker } from '@/hooks/useScreenTimeTracker';
import { Play, Square, RotateCcw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const ScreenTimeApp = () => {
  const { time, isActive, isPaused, startTimer, stopTimer, resetTimer } = useScreenTimeTracker();
  const [floatingPosition, setFloatingPosition] = useState<TimerPosition>('top-right');
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState(time);

  // Update current time for smooth display
  useEffect(() => {
    setCurrentTime(time);
  }, [time]);

  // Real-time update for active timer
  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused]);

  const handleStartStop = () => {
    if (isActive) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const formatTimeToday = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary rounded-full blur-xl" />
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-accent rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary-glow rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Screen Time
          </h1>
          <p className="text-muted-foreground">
            Track your daily mobile usage
          </p>
        </div>

        {/* Main Timer Display */}
        <Card className="p-8 mb-8 bg-card/80 backdrop-blur-sm border-border/50">
          <TimerDisplay 
            time={currentTime} 
            isActive={isActive && !isPaused}
            className="mb-6"
          />
          
          {/* Status indicator */}
          <div className="text-center mb-6">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              isActive 
                ? isPaused 
                  ? "bg-timer-paused/20 text-timer-paused" 
                  : "bg-timer-active/20 text-timer-active"
                : "bg-timer-stopped/20 text-timer-stopped"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                isActive 
                  ? isPaused 
                    ? "bg-timer-paused" 
                    : "bg-timer-active animate-pulse"
                  : "bg-timer-stopped"
              )} />
              {isActive 
                ? isPaused 
                  ? "Paused" 
                  : "Active"
                : "Stopped"
              }
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant={isActive ? "stop" : "timer"}
              size="hero"
              onClick={handleStartStop}
              className="min-w-[140px]"
            >
              {isActive ? (
                <>
                  <Square className="w-5 h-5" />
                  Stop Timer
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Timer
                </>
              )}
            </Button>
          </div>

          {/* Secondary actions */}
          <div className="flex gap-3 justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetTimer}
              disabled={isActive}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </Card>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-6 mb-6 bg-card/80 backdrop-blur-sm border-border/50">
            <PositionSelector
              currentPosition={floatingPosition}
              onPositionChange={setFloatingPosition}
            />
          </Card>
        )}

        {/* Today's Summary */}
        <Card className="p-6 bg-card/60 backdrop-blur-sm border-border/30">
          <h3 className="text-lg font-semibold mb-3 text-center">Today's Summary</h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatTimeToday(currentTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total screen time
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Timer */}
      {isActive && (
        <FloatingTimer
          time={currentTime}
          isActive={!isPaused}
          position={floatingPosition}
          onPositionChange={setFloatingPosition}
        />
      )}
    </div>
  );
};