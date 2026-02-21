'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface SummaryFooterProps {
  prediction: string;
  confidence: number;
  components: Array<{ name: string; weight: number }>;
}

export function SummaryFooter({ prediction, confidence, components }: SummaryFooterProps) {
  const componentBreakdown = components
    .sort((a, b) => b.weight - a.weight)
    .map(c => `${c.name} (${c.weight}%)`)
    .join(' + ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5 }}
    >
      <Card className="p-8 bg-gradient-to-br from-muted/50 to-muted/30 border-border/50 backdrop-blur-sm">
        <div className="text-center space-y-2">
          <p className="text-sm md:text-base leading-relaxed">
            <span className="font-semibold text-foreground">Summary:</span> This content is classified as{' '}
            <span className="font-bold text-primary text-lg">{prediction}</span> with{' '}
            <span className="font-bold text-lg">{Math.round(confidence * 100)}% confidence</span>.
            {componentBreakdown && (
              <>
                <br />
                <span className="text-muted-foreground">Analysis breakdown: {componentBreakdown}</span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground pt-4 border-t border-border/30 mt-4">
            © 2025 Veritas AI. All rights reserved.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
