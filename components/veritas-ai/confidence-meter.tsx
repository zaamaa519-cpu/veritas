'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ClassifyFakeNewsOutput } from '@/lib/types';

type ConfidenceMeterProps = {
  value: number; // A value between 0 and 1
  classification: ClassifyFakeNewsOutput['classification'];
};

export function ConfidenceMeter({ value, classification }: ConfidenceMeterProps) {
  const percentage = Math.round(value * 100);

  const getProgressColor = () => {
    switch (classification) {
      case 'Fake':
        return 'bg-red-500';
      case 'Possibly Fake':
        return 'bg-yellow-400';
      case 'Real':
        return 'bg-green-400';
      default:
        return 'bg-primary';
    }
  };

  const getShadowColor = () => {
    switch (classification) {
      case 'Fake':
        return 'shadow-red-500/80';
      case 'Possibly Fake':
        return 'shadow-yellow-400/80';
      case 'Real':
        return 'shadow-green-400/80';
      default:
        return 'shadow-primary/50';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Progress
        value={percentage}
        className="h-3 w-full bg-muted/50"
        indicatorClassName={cn(
          getProgressColor(),
          getShadowColor(),
          'shadow-[0_0_10px,0_0_5px] transition-all duration-500'
        )}
      />
      <span className="text-lg font-bold text-foreground">{percentage}%</span>
    </div>
  );
}
