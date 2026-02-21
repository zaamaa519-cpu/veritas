'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export function FeedbackBar() {
  const [feedback, setFeedback] = useState<'real' | 'fake' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    toast({
      title: 'Thank you!',
      description: 'Your feedback helps improve our analysis.',
    });
    setSubmitted(true);
    setTimeout(() => {
      setFeedback(null);
      setComment('');
      setSubmitted(false);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      <Card className="p-8 border-border/50 backdrop-blur-sm bg-card/95 shadow-lg">
        <div className="space-y-6">
          <p className="font-semibold text-center text-xl">Was this analysis helpful?</p>
          
          <div className="flex justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={feedback === 'real' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setFeedback('real')}
                className="flex items-center gap-2 px-6"
                disabled={submitted}
              >
                <ThumbsUp className="w-5 h-5" />
                Accurate
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={feedback === 'fake' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setFeedback('fake')}
                className="flex items-center gap-2 px-6"
                disabled={submitted}
              >
                <ThumbsDown className="w-5 h-5" />
                Inaccurate
              </Button>
            </motion.div>
          </div>
          
          {feedback && !submitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <Textarea
                placeholder="Additional comments (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
              
              <Button onClick={handleSubmit} className="w-full mt-3">
                Submit Feedback
              </Button>
            </motion.div>
          )}
          
          {submitted && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-green-600"
            >
              ✓ Feedback submitted successfully!
            </motion.p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
