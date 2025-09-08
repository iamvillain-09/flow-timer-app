import { memo } from 'react';
import { TimerDisplay } from './TimerDisplay';
import { cn } from '@/lib/utils';

interface FloatingTimerProps {
  time: number;
  isActive: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onPositionChange: (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
  opacity: number;
}

export const FloatingTimer = memo<FloatingTimerProps>(({ 
  time, 
  isActive, 
  position, 
  onPositionChange,
  opacity 
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const handlePositionCycle = () => {
    const positions: Array<typeof position> = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
    const currentIndex = positions.indexOf(position);
    const nextIndex = (currentIndex + 1) % positions.length;
    onPositionChange(positions[nextIndex]);
  };

  return (
    <div 
      className={cn(
        "fixed z-50 select-none cursor-pointer",
        "bg-card backdrop-blur-md rounded-lg",
        "border border-border/30",
        "p-2 min-w-[100px]",
        "transition-all duration-200",
        "hover:scale-105 active:scale-95",
        positionClasses[position]
      )}
      onClick={handlePositionCycle}
      style={{ 
        opacity: opacity / 100,
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <div className="text-center">
        <TimerDisplay 
          time={time} 
          isActive={isActive} 
          size="small" 
          className="text-xs font-medium"
        />
        <div className="text-[10px] text-muted-foreground/80 mt-0.5">
          Screen Time
        </div>
      </div>
      
      {/* Position indicator */}
      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
    </div>
  );
});

FloatingTimer.displayName = 'FloatingTimer';