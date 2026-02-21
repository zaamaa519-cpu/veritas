'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export function LearnMoreModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg">Learn How It Works</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card/90 backdrop-blur-sm border-primary/20 glow-shadow-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary-accent bg-clip-text text-transparent">
            How Veritas AI Works
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            Our AI uses a multi-faceted approach to analyze news content and detect potential misinformation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Source Analysis</h3>
              <p className="text-sm text-muted-foreground">
                We evaluate the reputation and history of the news source, cross-referencing against databases of known biased or unreliable publishers.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Content & Sentiment Analysis</h3>
              <p className="text-sm text-muted-foreground">
                The AI scrutinizes the article for sensationalist language, emotional manipulation, and factual inconsistencies. It identifies patterns commonly found in fake news.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Cross-Verification</h3>
              <p className="text-sm text-muted-foreground">
                Key claims and facts within the article are checked against a wide array of trusted, independent news sources to verify their accuracy.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
