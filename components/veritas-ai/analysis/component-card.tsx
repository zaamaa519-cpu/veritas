'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface ComponentCardProps {
  title: string;
  icon: React.ReactNode;
  verdict: string;
  confidence: number;
  weight: number;
  details: string[];
  concerns?: string[];
  index: number;
  detailedStats?: {
    accuracy?: number;
    totalPredictions?: number;
    methodology?: string;
    sources?: Array<{ name: string; url?: string }>;
    lastUpdated?: string;
  };
}

export function ComponentCard({
  title,
  icon,
  verdict,
  confidence,
  weight,
  details,
  concerns,
  index,
  detailedStats
}: ComponentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFake = verdict.toLowerCase().includes('fake') || verdict.toLowerCase().includes('unreliable');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="h-full hover:shadow-2xl transition-all duration-300 border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                {icon}
              </motion.div>
              <span className="text-base">{title}</span>
            </CardTitle>
            <Badge variant="outline" className="text-xs font-semibold">
              {weight > 0 ? `+${weight}%` : `${weight}%`}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Verdict with animated badge */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
            >
              <Badge 
                variant={isFake ? 'destructive' : 'default'} 
                className="font-semibold text-sm px-3 py-1"
              >
                {verdict}
              </Badge>
            </motion.div>
            <span className="text-base font-bold text-foreground">{confidence}%</span>
          </div>
          
          {/* Accuracy Display */}
          {detailedStats?.accuracy && (
            <div className="text-xs text-muted-foreground">
              Accuracy: <span className="font-semibold text-foreground">{detailedStats.accuracy}%</span>
            </div>
          )}
          
          {/* Animated Progress Bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
            className="origin-left"
          >
            <Progress value={confidence} className="h-2.5" />
          </motion.div>
          
          {/* Details */}
          <div className="space-y-2">
            {details.map((detail, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {detail}
              </p>
            ))}
          </div>
          
          {/* Concerns */}
          {concerns && concerns.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground">Key Indicators:</p>
              <ul className="space-y-1">
                {concerns.map((concern, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Expand Button */}
          {detailedStats && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full text-xs mt-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  View Detailed Stats
                </>
              )}
            </Button>
          )}
          
          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && detailedStats && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 pt-3 border-t border-border/50"
              >
                {/* Methodology */}
                {detailedStats.methodology && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Methodology:</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {detailedStats.methodology}
                    </p>
                  </div>
                )}
                
                {/* Total Predictions */}
                {detailedStats.totalPredictions && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Performance:</p>
                    <p className="text-xs text-muted-foreground">
                      Based on {detailedStats.totalPredictions.toLocaleString()} verified predictions
                    </p>
                  </div>
                )}
                
                {/* Sources */}
                {detailedStats.sources && detailedStats.sources.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Sources:</p>
                    <div className="space-y-1">
                      {detailedStats.sources.map((source, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{source.name}</span>
                          {source.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(source.url, '_blank')}
                              className="h-6 px-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Last Updated */}
                {detailedStats.lastUpdated && (
                  <p className="text-xs text-muted-foreground italic">
                    Last updated: {detailedStats.lastUpdated}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
