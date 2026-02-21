'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle, AlertCircle, Globe, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SourceSite {
  name: string;
  url: string;
  verified: boolean;
  credibility: 'high' | 'medium' | 'low';
}

interface SourceVerificationCardProps {
  sources: SourceSite[];
  twitterVerified?: {
    checked: boolean;
    verified_mentions: number;
    verified_accounts?: string[];
  };
  accuracy?: number;
  index?: number;
}

export function SourceVerificationCard({ 
  sources, 
  twitterVerified, 
  accuracy,
  index = 0 
}: SourceVerificationCardProps) {
  const getCredibilityColor = (credibility: string) => {
    switch(credibility) {
      case 'high': return 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/50';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/50';
      case 'low': return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/50';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Globe className="w-6 h-6 text-primary" />
            Source Verification
          </CardTitle>
          {accuracy !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Accuracy:</span>
              <Badge variant="outline" className="text-base font-bold">
                {Math.round(accuracy * 100)}%
              </Badge>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Twitter/X Verification */}
          {twitterVerified?.checked && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20"
            >
              <div className="flex items-start gap-3">
                <Twitter className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    Twitter/X Verification
                    {twitterVerified.verified_mentions > 0 && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </h4>
                  
                  {twitterVerified.verified_mentions > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Mentioned by <span className="font-bold text-foreground">{twitterVerified.verified_mentions}</span> verified Twitter/X account{twitterVerified.verified_mentions > 1 ? 's' : ''}
                      </p>
                      
                      {twitterVerified.verified_accounts && twitterVerified.verified_accounts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {twitterVerified.verified_accounts.map((account, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="text-xs bg-blue-500/10 border-blue-500/30"
                            >
                              @{account}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No mentions found from verified accounts
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Source Sites */}
          {sources && sources.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <Globe className="w-4 h-4" />
                News Sources ({sources.length})
              </h4>
              
              <div className="space-y-3">
                {sources.map((source, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {source.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">{source.name}</span>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCredibilityColor(source.credibility)}`}
                      >
                        {source.credibility.toUpperCase()} Credibility
                      </Badge>
                    </div>
                    
                    {source.url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(source.url, '_blank')}
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No sources found */}
          {(!sources || sources.length === 0) && !twitterVerified?.checked && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No external sources found for verification</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
