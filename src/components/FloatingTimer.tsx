import { memo } from 'react';
import { TimerDisplay } from './TimerDisplay';
import { cn } from '@/lib/utils';

interface FloatingTimerProps {
  time: number;
  isActive: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onPositionChange: (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
}

export const FloatingTimer = memo<FloatingTimerProps>(({ 
  time, 
  isActive, 
  position, 
  onPositionChange 
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
        "bg-card/80 backdrop-blur-md rounded-2xl",
        "border border-border/50 shadow-floating",
        "p-3 min-w-[120px]",
        "transition-all duration-300 ease-smooth",
        "hover:scale-105 active:scale-95",
        isActive && "timer-float",
        positionClasses[position]
      )}
      onClick={handlePositionCycle}
      style={{ 
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
          className="text-sm"
        />
        <div className="text-xs text-muted-foreground mt-1">
          Screen Time
        </div>
      </div>
      
      {/* Position indicator */}
      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary opacity-50" />
    </div>
  );
});

FloatingTimer.displayName = 'FloatingTimer';