'use client';

import { useState, useEffect } from 'react';
import { fetchNews } from '@/app/actions';
import { NewsCard } from './news-card';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

type Article = {
  headline: string;
  summary: string;
  source: string;
  category: string;
  url?: string;
};

const topics = [
  'World',
  'Technology',
  'Business',
  'Science',
  'Health',
  'Entertainment',
];

export function NewsList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('World');
  const { toast } = useToast();

  useEffect(() => {
    handleFetchNews(selectedTopic);
  }, [selectedTopic]);

  const handleFetchNews = async (topic: string) => {
    setIsLoading(true);
    setArticles([]);
    const response = await fetchNews(topic);
    if (response.error || !response.result) {
      toast({
        title: 'Failed to fetch news',
        description: response.error || 'An unknown error occurred.',
        variant: 'destructive',
      });
      setArticles([]);
    } else {
      setArticles(response.result.articles);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {topics.map((topic) => (
          <Button
            key={topic}
            variant={selectedTopic === topic ? 'default' : 'outline'}
            onClick={() => setSelectedTopic(topic)}
            className="rounded-full"
          >
            {topic}
          </Button>
        ))}
      </div>
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse bg-card/50">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-muted rounded w-full"></div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && (
         <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
          {articles.map((article, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
            >
                <NewsCard article={article} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
