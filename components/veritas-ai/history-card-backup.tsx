'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { formatDistanceToNow } from 'date-fns';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { PredictionHistoryItem } from '@/lib/python-api';

const badgeVariants = cva('text-sm font-bold', {
  variants: {
    classification: {
      HIGHLY_CREDIBLE: 'border-green-400/50 bg-green-500/80 text-white',
      CREDIBLE: 'border-teal-400/50 bg-teal-500/80 text-white',
      CAUTION_ADVISED: 'border-yellow-400/50 bg-yellow-500/80 text-black',
      QUESTIONABLE: 'border-orange-500/50 bg-orange-500/80 text-white',
      UNRELIABLE: 'border-red-500/50 bg-destructive/80 text-destructive-foreground',
    },
  },
  defaultVariants: {
    classification: 'CAUTION_ADVISED',
  },
});

type HistoryCardProps = {
  items: PredictionHistoryItem[];
};

function mapVerdictToClassification(prediction: string, confidence: number) {
  const p = prediction.toUpperCase();
  if (p === 'FAKE') {
    if (confidence >= 0.8) return 'UNRELIABLE';
    return 'QUESTIONABLE';
  }
  if (p === 'REAL') {
    if (confidence >= 0.8) return 'HIGHLY_CREDIBLE';
    return 'CREDIBLE';
  }
  return 'CAUTION_ADVISED';
}

export function HistoryCard({ items }: HistoryCardProps) {
  if (!items.length) {
    return (
      <Card className="w-full border-border/50 glow-shadow-sm">
        <CardHeader>
          <CardTitle>No History Yet</CardTitle>
          <CardDescription>
            Start analyzing headlines on the Analyze page and your recent checks will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/50 glow-shadow-sm">
      <CardHeader>
        <CardTitle>Your Recent Analyses</CardTitle>
        <CardDescription>
          These are the most recent predictions made by the Veritas AI detector.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item) => {
            const classification = mapVerdictToClassification(
              item.prediction,
              item.confidence,
            );
            
            // Fix timestamp parsing - handle both ISO strings and timestamps
            let timestamp: Date | null = null;
            if (item.timestamp) {
              try {
                const raw = item.timestamp as unknown;
                if (typeof raw === 'object' && raw !== null && raw instanceof Date) {
                  timestamp = raw;
                } else {
                  const parsed = new Date(raw as any);
                  if (!isNaN(parsed.getTime())) timestamp = parsed;
                }
              } catch (e) {
                console.error('Error parsing timestamp:', e);
              }
            }

            return (
              <AccordionItem key={item.id} value={`item-${item.id}`}>
                <AccordionTrigger>
                  <div className="flex justify-between items-center w-full pr-4 gap-3">
                    <p className="truncate text-sm font-medium max-w-xs sm:max-w-md">
                      {item.headline}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={cn(badgeVariants({ classification }))}>
                        {classification.replace(/_/g, ' ')}
                      </Badge>
                      {timestamp && (
                        <span className="hidden md:inline-block text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(timestamp, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <span className="font-semibold">Verdict:</span>{' '}
                      {item.prediction} ({(item.confidence * 100).toFixed(1)}% confident)
                    </p>
                    <p>
                      <span className="font-semibold">Method:</span> {item.method}
                    </p>
                    {typeof item.credibility_score === 'number' && (
                      <p>
                        <span className="font-semibold">Credibility score:</span>{' '}
                        {(item.credibility_score * 100).toFixed(0)}%
                      </p>
                    )}
                    {timestamp && (
                      <p className="text-xs mt-2">
                        <span className="font-semibold">Analyzed:</span>{' '}
                        {timestamp.toLocaleString()}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

