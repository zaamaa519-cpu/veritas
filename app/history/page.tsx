'use client';

import { useEffect, useState } from 'react';
import { AnimatedCharacter } from '@/components/veritas-ai/animated-character';
import { HistoryCard } from '@/components/veritas-ai/history-card';
import { fetchPredictionHistory } from '@/app/actions';
import { useUser } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import type { PredictionHistoryItem } from '@/lib/python-api';

export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (isUserLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      const { result, error } = await fetchPredictionHistory(1, 20, user?.id);
      
      if (error) {
        setError(error);
      } else if (result) {
        setHistory(result.items);
      }
      
      setIsLoading(false);
    }

    loadHistory();
  }, [user, isUserLoading]);

  return (
    <section className="w-full py-12 md:py-20 lg:py-28">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-4xl items-start gap-10">
          <div className="relative flex flex-col items-center text-center">
            <AnimatedCharacter className="absolute -top-1/3 -left-1/3 w-1/2 h-auto opacity-10" />
            <AnimatedCharacter className="absolute -bottom-1/3 -right-1/3 w-1/2 h-auto opacity-10" animationDirection="reverse" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
              <span className="animated-gradient-text bg-gradient-primary-accent bg-clip-text text-transparent">
                Your Analysis History
              </span>
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl max-w-xl">
              {user 
                ? 'Review your recent analyses from the Analyze page.' 
                : 'Sign in to view your personal analysis history.'}
            </p>
            {error && (
              <p className="mt-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <HistoryCard items={history} />
          )}
        </div>
      </div>
    </section>
  );
}
