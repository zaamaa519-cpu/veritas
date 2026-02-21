'use client';

import { EnhancedQuizCard } from '@/components/veritas-ai/enhanced-quiz-card';

export default function QuizPage() {
  return (
    <section className="w-full py-12 md:py-20 lg:py-28 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-4xl items-start gap-10">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              <span className="animated-gradient-text bg-gradient-primary-accent bg-clip-text text-transparent">
                Fake News Challenge
              </span>
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              Test your ability to spot misinformation with questions based on current news. 
              Earn points, level up, and become a truth-seeking expert!
            </p>
          </div>
          <EnhancedQuizCard />
        </div>
      </div>
    </section>
  );
}
