'use client';

import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function FeedbackButtons() {
  const { toast } = useToast();

  const handleFeedback = () => {
    toast({
      title: 'Feedback Submitted',
      description: 'Thank you for helping us improve Veritas AI.',
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={handleFeedback} aria-label="Good result">
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleFeedback} aria-label="Bad result">
        <ThumbsDown className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={handleFeedback} aria-label="Report result">
        <Flag className="h-4 w-4" />
      </Button>
    </div>
  );
}
