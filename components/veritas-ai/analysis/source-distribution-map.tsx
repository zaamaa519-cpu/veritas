'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, CheckCircle, Clock, Award } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface NewsOutlet {
  name: string;
  url: string;
  published_at: string;
  title: string;
  trust_score: number;
  tier: number;
}

interface FactChecker {
  name: string;
  rating: boolean;
  url?: string;
  date?: string;
  explanation?: string;
}

interface Domain {
  domain: string;
  tier: number;
  trust_score: number;
}

interface SourceDistributionMapProps {
  newsOutlets: NewsOutlet[];
  factCheckers: FactChecker[];
  domains: Domain[];
  verificationScore: number;
  totalSources: number;
  index?: number;
}

export function SourceDistributionMap({
  newsOutlets,
  factCheckers,
  domains,
  verificationScore,
  totalSources,
  index = 0
}: SourceDistributionMapProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getTierColor = (tier: number) => {
    switch(tier) {
      case 1: return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      case 2: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <MapPin className="w-6 h-6 text-primary" />
            Source Distribution Map
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            This story has been verified across multiple independent sources
          </p>
        </CardHeader>

        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
              <p className="text-3xl font-bold text-foreground">{totalSources}</p>
              <p className="text-sm text-muted-foreground">Total Sources</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{verificationScore}/100</p>
              <p className="text-sm text-muted-foreground">Verification Score</p>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["news", "fact", "domains"]} className="space-y-2">
            {/* News Outlets */}
            {newsOutlets && newsOutlets.length > 0 && (
              <AccordionItem value="news" className="border border-border/30 rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📰</span>
                    <span className="font-semibold">News Outlets ({newsOutlets.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {newsOutlets.map((outlet, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        className="border-l-4 border-green-500 pl-4 py-3 bg-muted/20 rounded-r-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <p className="font-semibold text-base">{outlet.name}</p>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {outlet.title}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Clock className="w-3 h-3" />
                              <span>Published: {formatDate(outlet.published_at)}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30">
                                Trust: {outlet.trust_score}/100
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${getTierColor(outlet.tier)}`}>
                                Tier {outlet.tier}
                              </Badge>
                            </div>
                          </div>
                          
                          {outlet.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(outlet.url, '_blank')}
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Fact-Checkers */}
            {factCheckers && factCheckers.length > 0 && (
              <AccordionItem value="fact" className="border border-border/30 rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    <span className="font-semibold">Fact-Checkers ({factCheckers.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {factCheckers.map((fc, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        className="border-l-4 border-blue-500 pl-4 py-3 bg-muted/20 rounded-r-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-4 h-4 text-blue-500" />
                              <p className="font-semibold text-base">{fc.name}</p>
                            </div>
                            
                            {fc.explanation && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {fc.explanation}
                              </p>
                            )}
                            
                            {fc.date && (
                              <p className="text-xs text-muted-foreground mb-2">
                                Verified: {formatDate(fc.date)}
                              </p>
                            )}
                            
                            <Badge 
                              variant="outline"
                              className={fc.rating 
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' 
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                              }
                            >
                              {fc.rating ? '✅ VERIFIED' : '❌ FALSE'}
                            </Badge>
                          </div>
                          
                          {fc.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(fc.url, '_blank')}
                              className="flex-shrink-0"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Domain Reputation */}
            {domains && domains.length > 0 && (
              <AccordionItem value="domains" className="border border-border/30 rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <span className="font-semibold">Domain Reputation ({domains.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {domains.map((domain, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        className="p-3 bg-muted/30 rounded-lg border border-border/30"
                      >
                        <p className="font-medium text-sm truncate mb-2">{domain.domain}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getTierColor(domain.tier)}`}>
                            Tier {domain.tier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Trust: {domain.trust_score}/100
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* Cross-Verification Score */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  Cross-Verification Score: {verificationScore}/100
                </p>
                <p className="text-sm text-muted-foreground">
                  All sources independently confirm this story
                </p>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
