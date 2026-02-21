'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AccuracyDisplayProps {
  overallAccuracy: number;
  componentAccuracies?: {
    ai_model?: number;
    web_search?: number;
    source_verification?: number;
    twitter_verification?: number;
    fact_check?: number;
  };
  index?: number;
}

export function AccuracyDisplay({ 
  overallAccuracy, 
  componentAccuracies,
  index = 0 
}: AccuracyDisplayProps) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-600 dark:text-green-400';
    if (accuracy >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAccuracyLabel = (accuracy: number) => {
    if (accuracy >= 0.9) return 'Excellent';
    if (accuracy >= 0.8) return 'Very Good';
    if (accuracy >= 0.7) return 'Good';
    if (accuracy >= 0.6) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
        <CardContent className="p-6">
          {/* Overall Accuracy */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Target className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold">Analysis Accuracy</h3>
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
              className="relative inline-block"
            >
              <div className={`text-6xl font-bold ${getAccuracyColor(overallAccuracy)}`}>
                {Math.round(overallAccuracy * 100)}%
              </div>
              <Badge 
                variant="outline" 
                className="mt-2 text-sm"
              >
                {getAccuracyLabel(overallAccuracy)}
              </Badge>
            </motion.div>
          </div>

          {/* Component Accuracies */}
          {componentAccuracies && Object.keys(componentAccuracies).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-muted-foreground">Component Breakdown</h4>
              </div>
              
              {Object.entries(componentAccuracies).map(([key, value], i) => {
                if (value === undefined || value === null) return null;
                
                const label = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className={`font-semibold ${getAccuracyColor(value)}`}>
                        {Math.round(value * 100)}%
                      </span>
                    </div>
                    <Progress value={value * 100} className="h-2" />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Verification Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="mt-6 pt-4 border-t border-border/30 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Multi-source verification complete</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
