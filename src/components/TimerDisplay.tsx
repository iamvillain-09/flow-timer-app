import { memo } from 'react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  time: number;
  isActive: boolean;
  className?: string;
  size?: 'small' | 'large';
}

export const TimerDisplay = memo<TimerDisplayProps>(({ time, isActive, className, size = 'large' }) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const HH = hours.toString().padStart(2, '0');
    const MM = minutes.toString().padStart(2, '0');

    if (size === 'small') {
      return `${HH}:${MM}`;
    }

    return { hours: HH, minutes: MM };
  };

  const timeValue = formatTime(time);

  if (size === 'small') {
    return (
      <div className={cn(
        "font-mono font-bold",
        isActive ? "text-timer-active" : "text-timer-stopped",
        className
      )}>
        {timeValue as string}
      </div>
    );
  }

  const timeObj = timeValue as { hours: string; minutes: string };

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 font-mono",
      className
    )}>
      <div className="text-center">
        <div className={cn(
          "text-6xl font-bold tabular-nums",
          isActive ? "text-timer-active" : "text-timer-stopped"
        )}>
          {timeObj.hours}
        </div>
        <div className="text-sm text-muted-foreground uppercase tracking-wider">hours</div>
      </div>
      <div className="text-4xl text-muted-foreground">:</div>
      <div className="text-center">
        <div className={cn(
          "text-6xl font-bold tabular-nums",
          isActive ? "text-timer-active" : "text-timer-stopped"
        )}>
          {timeObj.minutes}
        </div>
        <div className="text-sm text-muted-foreground uppercase tracking-wider">minutes</div>
      </div>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';