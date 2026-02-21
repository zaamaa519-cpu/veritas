'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

const tips = [
  {
    title: 'Why Sentiment Matters',
    content:
      'Fake news often uses emotionally charged language to provoke a reaction. Our AI looks for extreme sentiment as a potential red flag.',
  },
  {
    title: 'The Importance of Sources',
    content:
      'Reputable sources have a history of journalistic integrity. We check if the source is known for accuracy and accountability.',
  },
  {
    title: 'Look for Factual Claims',
    content:
      'Genuine news articles are built on verifiable facts. A lack of specific, checkable data can be an indicator of a fabricated story.',
  },
];

export function TipsWidget() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <Lightbulb className="h-5 w-5" />
            <span className="sr-only">Analysis Tips</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="max-w-xs p-4 bg-card/90 backdrop-blur-sm border-primary/20 glow-shadow-sm"
        >
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Analysis Tips</h4>
            <ul className="space-y-3">
              {tips.map((tip) => (
                <li key={tip.title} className="text-sm">
                  <p className="font-semibold text-primary">{tip.title}</p>
                  <p className="text-muted-foreground">{tip.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
