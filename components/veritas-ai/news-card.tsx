'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

type Article = {
  headline: string;
  summary: string;
  source: string;
  category: string;
  url?: string;
};

type NewsCardProps = {
  article: Article;
};

export function NewsCard({ article }: NewsCardProps) {
  const router = useRouter();

  const handleAnalyze = () => {
    // Pass the article text to the analysis page via local storage.
    // This is a simple way to pass data between client-side pages.
    localStorage.setItem('veritas-ai-analyze-text', article.summary);
    router.push('/analysis');
  };

  const handleReadMore = () => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };


  return (
    <Card className="flex flex-col h-full border-border/50 glow-shadow-sm hover:border-primary transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg leading-tight">{article.headline}</CardTitle>
        <CardDescription className="text-xs pt-1">{article.source}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {article.summary}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 pt-4">
        <div className="flex justify-between items-center w-full">
          <Badge variant="secondary">{article.category}</Badge>
        </div>
        <div className="flex gap-2 w-full">
          {article.url && (
            <Button size="sm" variant="outline" onClick={handleReadMore} className="flex-1">
              Read More
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleAnalyze} className="flex-1">
            Analyze
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
