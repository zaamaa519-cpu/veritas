'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield } from 'lucide-react';

interface VerificationSummaryProps {
  trustedSources: number;
  factCheckers: number;
  twitterAccounts: number;
  credibleDomains: number;
  overallScore: number;
  index?: number;
}

export function VerificationSummaryCard({
  trustedSources,
  factCheckers,
  twitterAccounts,
  credibleDomains,
  overallScore,
  index = 0
}: VerificationSummaryProps) {
  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'STRONG', color: 'text-green-600 dark:text-green-400' };
    if (score >= 75) return { label: 'GOOD', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 60) return { label: 'MODERATE', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'WEAK', color: 'text-red-600 dark:text-red-400' };
  };

  const scoreInfo = getScoreLabel(overallScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-7 h-7 text-primary" />
            <h3 className="text-xl md:text-2xl font-bold">Verification Summary</h3>
          </div>

          {/* Verification Checklist */}
          <div className="space-y-3 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm md:text-base">
                Found in <span className="font-bold text-foreground">{trustedSources}</span> trusted news sources
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm md:text-base">
                Verified by <span className="font-bold text-foreground">{factCheckers}</span> fact-checking organizations
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm md:text-base">
                Mentioned by <span className="font-bold text-foreground">{twitterAccounts}</span> verified Twitter/X accounts
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm md:text-base">
                Published across <span className="font-bold text-foreground">{credibleDomains}</span> credible domains
              </span>
            </motion.div>
          </div>

          {/* Overall Verification Score */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="pt-4 border-t border-border/30"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Overall Verification:</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${scoreInfo.color} font-bold text-base px-3 py-1`}>
                  {scoreInfo.label}
                </Badge>
                <span className="text-lg font-bold">{overallScore}/100</span>
              </div>
            </div>
            
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="origin-left"
            >
              <Progress value={overallScore} className="h-3" />
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
