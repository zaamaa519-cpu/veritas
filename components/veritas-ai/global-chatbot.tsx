'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatedCharacter } from '@/components/veritas-ai/animated-character';
import { ReasoningChatbot } from '@/components/veritas-ai/reasoning-chatbot';
import { useAnalysis } from '@/contexts/analysis-context';

export function GlobalChatbot() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { article, analysis: initialAnalysis } = useAnalysis();

  return (
    <Dialog open={isChatbotOpen} onOpenChange={setIsChatbotOpen}>
      <DialogTrigger asChild>
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsChatbotOpen(true)}
            className="rounded-full h-16 w-16 shadow-lg glow-shadow-sm hover:glow-shadow transition-all group"
            aria-label="Open Chatbot"
          >
            <AnimatedCharacter className="w-12 h-12 transition-transform group-hover:scale-110" />
            <span className="sr-only">Open Analysis Chatbot</span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-2xl bg-card/80 backdrop-blur-xl border-primary/20 glow-shadow-sm p-0">
         <DialogTitle className="sr-only">Vera Chatbot</DialogTitle>
         <DialogDescription className="sr-only">
           A chatbot named Vera that can analyze articles, answer questions, and guide you through the features of Veritas AI.
         </DialogDescription>
        <ReasoningChatbot
          article={article}
          initialAnalysis={initialAnalysis}
          setIsChatbotOpen={setIsChatbotOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
