import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface TransparencySelectorProps {
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  className?: string;
}

export const TransparencySelector = ({ opacity, onOpacityChange, className }: TransparencySelectorProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Timer Transparency</h3>
          <span className="text-xs text-muted-foreground">{opacity}%</span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={(value) => onOpacityChange(value[0])}
          max={100}
          min={20}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>More transparent</span>
          <span>Less transparent</span>
        </div>
      </div>
      
      {/* Preview */}
      <div className="flex justify-center">
        <div 
          className="bg-card backdrop-blur-md rounded-lg border border-border/30 p-2 text-xs text-center min-w-[80px]"
          style={{ opacity: opacity / 100 }}
        >
          <div className="font-mono font-medium">01:23:45</div>
          <div className="text-[10px] text-muted-foreground/80 mt-0.5">Preview</div>
        </div>
      </div>
    </div>
  );
};