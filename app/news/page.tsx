'use client';

import { NewsList } from '@/components/veritas-ai/news-list';

export default function NewsPage() {
  return (
    <section className="w-full py-12 md:py-20 lg:py-28">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-6xl items-start gap-10">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              <span className="animated-gradient-text bg-gradient-primary-accent bg-clip-text text-transparent">
                Today's Headlines
              </span>
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Catch up on the latest news from around the world.
            </p>
          </div>
          <NewsList />
        </div>
      </div>
    </section>
  );
}
