'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, CheckCircle, ShieldAlert, AlertTriangle, Cpu, Globe, Scale, BookCheck } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedAnalysisOutput } from '@/lib/types';

type ResultCardProps = {
  result: EnhancedAnalysisOutput | null;
  isLoading: boolean;
};

const AnimatedGauge = ({ value, label }: { value: number; label: string }) => {
  const percentage = Math.round(value * 100);
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getStrokeColor = () => {
    if (percentage >= 90) return 'stroke-green-400';
    if (percentage >= 70) return 'stroke-teal-400';
    if (percentage >= 50) return 'stroke-yellow-400';
    if (percentage >= 30) return 'stroke-orange-500';
    return 'stroke-red-500';
  };

  return (
    <div className="relative flex flex-col items-center justify-center gap-2">
      <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="10"
          className="stroke-muted/30"
          fill="transparent"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="10"
          className={cn('transition-colors duration-500', getStrokeColor())}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset, transition: { duration: 1.5, ease: 'easeOut' } }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-bold text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.5, duration: 1 } }}
        >
          {percentage}
          <span className="text-xl">%</span>
        </motion.span>
      </div>
      <p className="font-semibold text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

const ComponentScoreBar = ({
  icon,
  label,
  score,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
  delay: number;
}) => {
  const percentage = Math.round(score * 100);
  const getProgressColor = () => {
    if (percentage >= 75) return 'bg-green-400';
    if (percentage >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  };
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.5, delay } }}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-bold text-foreground">{percentage}%</span>
      </div>
      <div className="w-full bg-muted/30 rounded-full h-2.5">
        <motion.div
          className={cn('h-2.5 rounded-full', getProgressColor())}
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%`, transition: { duration: 1.5, ease: 'easeOut', delay } }}
        />
      </div>
    </motion.div>
  );
};


function LoadingSkeleton() {
  return (
    <div className="space-y-8 p-2">
      <div className="flex justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3 mx-auto rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
      <Separator />
      <div className="space-y-4">
         <Skeleton className="h-6 w-1/4 rounded-md" />
         <Skeleton className="h-10 w-full rounded-md" />
         <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

const verdictConfig = {
  CAUTION_ADVISED: {
    text: 'Caution Advised',
    icon: <AlertTriangle className="w-6 h-6" />,
    badge: 'border-yellow-400/50 bg-yellow-500/80 text-black shadow-yellow-400/30 hover:bg-yellow-500/90',
  },
  HIGHLY_CREDIBLE: {
    text: 'Highly Credible',
    icon: <CheckCircle className="w-6 h-6" />,
    badge: 'border-green-400/50 bg-green-500/80 text-white shadow-green-500/30 hover:bg-green-500/90',
  },
  CREDIBLE: {
    text: 'Credible',
    icon: <CheckCircle className="w-6 h-6" />,
    badge: 'border-teal-400/50 bg-teal-500/80 text-white shadow-teal-500/30 hover:bg-teal-500/90',
  },
  QUESTIONABLE: {
    text: 'Questionable',
    icon: <ShieldAlert className="w-6 h-6" />,
    badge: 'border-orange-500/50 bg-orange-500/80 text-white shadow-orange-500/30 hover:bg-orange-500/90',
  },
  UNRELIABLE: {
    text: 'Unreliable',
    icon: <ShieldAlert className="w-6 h-6" />,
    badge: 'border-red-500/50 bg-destructive/80 text-destructive-foreground shadow-red-500/30 hover:bg-destructive/90',
  },
};


export function ResultCard({ result, isLoading }: ResultCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full border-border/30 bg-card/50 glow-shadow-sm animate-pulse">
        <CardHeader>
          <CardTitle className="text-2xl">Analysis in Progress</CardTitle>
          <CardDescription>
            Our AI is running a multi-factor credibility assessment...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    // This part can be enhanced with an empty state component if needed
    return null;
  }

  const verdict = result.primary_verdict?.replace(/\s+/g, '_').toUpperCase() as keyof typeof verdictConfig;
  const config = verdictConfig[verdict] ?? verdictConfig.CAUTION_ADVISED;
  const { component_scores, key_findings, recommended_actions, final_score } = result;

  return (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <Card className="w-full border-primary/20 bg-card/80 backdrop-blur-xl glow-shadow overflow-hidden">
                <CardHeader className="bg-background/30 p-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <motion.div initial={{opacity:0, scale:0.5}} animate={{opacity:1, scale:1, transition:{delay: 0.2, type: 'spring'}}}>
                            <Badge className={cn('text-lg font-bold shadow-lg py-2 px-6 tracking-wider border-2 flex items-center gap-2', config.badge)}>
                                {config.icon}
                                <span>{config.text}</span>
                            </Badge>
                        </motion.div>
                        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-primary-accent bg-clip-text text-transparent">
                            Credibility Report
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="space-y-8 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="flex justify-center">
                            <AnimatedGauge value={final_score} label="Final Score" />
                        </div>
                        <div className="space-y-4">
                            <ComponentScoreBar icon={<Cpu size={18} />} label="AI Model Analysis" score={component_scores.model_analysis} delay={0.3} />
                            <ComponentScoreBar icon={<Globe size={18} />} label="Web Corroboration" score={component_scores.web_search} delay={0.5} />
                            <ComponentScoreBar icon={<Scale size={18} />} label="Source Authority" score={component_scores.source_verification} delay={0.7} />
                            <ComponentScoreBar icon={<BookCheck size={18} />} label="Fact-Check Databases" score={component_scores.fact_check} delay={0.9} />
                        </div>
                    </div>
                    
                    <Separator className="bg-border/20" />
                    
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.0 } }} className="space-y-4">
                        <h3 className="font-semibold text-lg text-foreground flex items-center gap-2"><Lightbulb /> Key Findings</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm pl-2">
                           {key_findings.map((finding, i) => <li key={i}>{finding}</li>)}
                        </ul>
                    </motion.div>

                    <Separator className="bg-border/20" />

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 1.2 } }} className="space-y-4">
                        <h3 className="font-semibold text-lg text-foreground">Recommended Actions</h3>
                        <div className="flex flex-wrap gap-2">
                             {recommended_actions.map((action, i) => <Badge key={i} variant="secondary">{action.replace(/_/g, ' ')}</Badge>)}
                        </div>
                    </motion.div>
                </CardContent>
            </Card>
        </motion.div>
    </AnimatePresence>
  );
}
