import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PositionSelectorProps {
  currentPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onPositionChange: (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
  className?: string;
}

export const PositionSelector = ({ currentPosition, onPositionChange, className }: PositionSelectorProps) => {
  const positions = [
    { id: 'top-left' as const, label: 'Top Left', icon: '↖' },
    { id: 'top-right' as const, label: 'Top Right', icon: '↗' },
    { id: 'bottom-left' as const, label: 'Bottom Left', icon: '↙' },
    { id: 'bottom-right' as const, label: 'Bottom Right', icon: '↘' },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold text-center">Timer Position</h3>
      <div className="grid grid-cols-2 gap-3">
        {positions.map((position) => (
          <Button
            key={position.id}
            variant={currentPosition === position.id ? "timer" : "secondary"}
            size="lg"
            onClick={() => onPositionChange(position.id)}
            className="h-16 flex-col gap-1"
          >
            <span className="text-2xl">{position.icon}</span>
            <span className="text-xs">{position.label}</span>
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        Tap the floating timer to change position while running
      </p>
    </div>
  );
};