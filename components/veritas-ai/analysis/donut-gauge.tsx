'use client';

import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface DonutGaugeProps {
  label: string;
  value: number; // 0-1
  verdict: string;
}

export function DonutGauge({ label, value, verdict }: DonutGaugeProps) {
  const percentage = Math.round(value * 100);
  const radius = 54;
  const stroke = 10;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColorClass = () => {
    if (value >= 0.75) return 'text-green-500 stroke-green-500';
    if (value >= 0.5) return 'text-yellow-500 stroke-yellow-500';
    return 'text-red-500 stroke-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-card/95 shadow-lg">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
              <circle
                stroke="hsl(var(--muted-foreground) / 0.15)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <motion.circle
                strokeWidth={stroke}
                strokeLinecap="round"
                className={getColorClass()}
                fill="transparent"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{percentage}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">
                {label}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Model Verdict
            </p>
            <p className="text-lg font-bold leading-tight">{verdict}</p>
            <p className="text-xs text-muted-foreground max-w-xs">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
