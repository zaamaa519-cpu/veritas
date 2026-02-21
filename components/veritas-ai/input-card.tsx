'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TipsWidget } from './tips-widget';
import { useEffect } from 'react';

const formSchema = z.object({
  article: z
    .string()
    .min(100, {
      message: 'Article must be at least 100 characters to ensure accuracy.',
    })
    .max(10000, {
      message: 'Article must not exceed 10,000 characters.',
    }),
});

type InputCardProps = {
  onAnalyze: (article: string) => void;
  isLoading: boolean;
  initialArticle?: string;
};

export function InputCard({ onAnalyze, isLoading, initialArticle }: InputCardProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      article: initialArticle || '',
    },
  });

  useEffect(() => {
    if (initialArticle) {
      form.setValue('article', initialArticle);
    }
  }, [initialArticle, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAnalyze(values.article);
  }

  return (
    <Card className={cn(
      "w-full border-border/50 shadow-2xl backdrop-blur-sm bg-card/95 transition-all duration-300 hover:shadow-3xl",
      isLoading && "animate-pulse"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              📝 News Analyzer
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Paste a news headline or article below to check for authenticity.
            </CardDescription>
          </div>
          <TipsWidget />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="article"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">News Headline or Article</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the news headline or article here..."
                      className="min-h-[200px] resize-y text-base"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="text-sm">
                    Minimum 100 characters for reliable analysis.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <Button
                type="submit"
                size="lg"
                className="shadow-[0_0_15px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)] hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze'
                )}
              </Button>
              {!isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => form.reset()}
                >
                  Clear
                </Button>
              )}
              {!isLoading && (
                <span className="text-sm text-muted-foreground">⏱️ ~2-3s</span>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
