'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, CornerDownLeft, Sparkles } from 'lucide-react';
import { askAboutAnalysis } from '@/app/actions';
import type { ClassifyFakeNewsOutput, EnhancedAnalysisOutput } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AnimatedCharacter } from './animated-character';
import { useRouter } from 'next/navigation';

type Message = {
  role: 'user' | 'bot';
  content: string;
};

type ReasoningChatbotProps = {
  article: string;
  initialAnalysis: ClassifyFakeNewsOutput | EnhancedAnalysisOutput | null;
  setIsChatbotOpen: (isOpen: boolean) => void;
};

export function ReasoningChatbot({
  article,
  initialAnalysis,
  setIsChatbotOpen,
}: ReasoningChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSuggestionClick = (suggestion: string, route?: string) => {
    if (route) {
        setIsChatbotOpen(false); // Close dialog before navigating
        router.push(route);
        return;
    }
    setInputValue(suggestion);
    // You could also auto-submit here if desired
    // handleSubmit(new Event('submit') as any, suggestion);
  };
  
  // Set initial message based on whether an analysis has been performed
  useEffect(() => {
    if (initialAnalysis) {
      setMessages([
        {
          role: 'bot',
          content: "I have completed my analysis on the article provided. Would you like to explore how I reached this verdict, or dig into specific claims? Here are a few things you can ask:",
        },
      ]);
    } else {
      setMessages([
        {
          role: 'bot',
          content: "Hello, truth-seeker. I’m Vera, your guardian of clarity. What shall we unravel today? I can analyze an article for you or challenge your instincts with a quiz.",
        },
      ]);
    }
  }, [initialAnalysis]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent, value?: string) => {
    e.preventDefault();
    const currentInput = value || inputValue;
    if (!currentInput.trim() || isLoading || !initialAnalysis) return;

    const userMessage: Message = { role: 'user', content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const res = await askAboutAnalysis({
      article,
      analysis: initialAnalysis,
      question: currentInput,
    });

    const botMessage: Message = {
      role: 'bot',
      content: res.error || res.answer || 'I am unable to process that query at this time.',
    };
    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  const initialSuggestions = [
    { text: 'Analyze an Article', action: () => handleSuggestionClick('', '/analysis') },
    { text: 'Start a Quiz Challenge', action: () => handleSuggestionClick('', '/quiz') }
  ];

  const analysisSuggestions = [
    { text: 'Explain the source analysis.', action: () => handleSuggestionClick('Explain the source analysis.') },
    { text: 'Why was the language a red flag?', action: () => handleSuggestionClick('Why was the language a red flag?') },
    { text: 'Tell me more about the indicators.', action: () => handleSuggestionClick('Tell me more about the indicators.') }
  ];

  const suggestions = initialAnalysis ? analysisSuggestions : initialSuggestions;

  return (
    <div className="relative flex flex-col h-[70vh] rounded-lg bg-background/30 p-4 space-y-4 border-primary/20 transition-all duration-300">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-background"></div>

        <div className="relative flex items-center gap-3 border-b border-primary/20 pb-3">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                <AnimatedCharacter className="w-12 h-12" />
            </div>
            <div>
                <h4 className="font-bold text-lg text-foreground tracking-wider">Vera</h4>
                <p className="text-xs text-primary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online & Ready</p>
            </div>
        </div>

      <ScrollArea className="flex-grow h-full pr-4" ref={scrollAreaRef}>
        <div className="space-y-6 relative">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn('flex items-start gap-3 text-sm', 
                message.role === 'bot' ? 'justify-start' : 'justify-end'
              )}
            >
              {message.role === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/50 p-1">
                  <AnimatedCharacter className="w-6 h-6" />
                </div>
              )}
              <div
                className={cn('max-w-[85%] rounded-lg p-3 leading-relaxed transition-all duration-300',
                  message.role === 'bot'
                    ? 'bg-muted/50 text-muted-foreground border border-border/20'
                    : 'bg-primary/90 text-primary-foreground glow-shadow-sm'
                )}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 border border-accent/50">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}
           {messages.length > 0 && messages[messages.length - 1].role === 'bot' && !isLoading && (
            <div className="flex flex-wrap gap-2 pt-2">
                {suggestions.map((suggestion, i) => (
                    <Button key={i} size="sm" variant="outline" className="bg-background/50 hover:bg-muted/80" onClick={suggestion.action}>
                        <Sparkles className="mr-2 h-3 w-3 text-primary" />
                        {suggestion.text}
                    </Button>
                ))}
            </div>
           )}
          {isLoading && (
             <div className="flex items-start gap-3 justify-start text-sm">
               <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/50 p-1">
                  <AnimatedCharacter className="w-6 h-6 animate-spin-slow" />
                </div>
               <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 flex items-center border border-border/20">
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...
               </div>
             </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 pt-4 border-t border-primary/20">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={!initialAnalysis ? "Analyze an article or start a quiz!" : "Ask about the analysis..."}
          className="flex-grow bg-background/70 focus-visible:ring-primary"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim() || !initialAnalysis} className="glow-shadow-sm">
          <CornerDownLeft className="w-4 h-4" />
          <span className="sr-only">Submit</span>
        </Button>
      </form>
      <style jsx>{`
        .bg-grid-pattern {
            background-image: linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 5s linear infinite;
        }
      `}</style>
    </div>
  );
}
