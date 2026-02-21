'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Twitter, ExternalLink, TrendingUp, Users, MessageCircle, Heart, Repeat2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface TwitterAccount {
  username: string;
  name: string;
  verified_type: string;
  followers: number;
  tweet_text: string;
  tweet_url: string;
  engagement: {
    retweets: number;
    likes: number;
    replies: number;
  };
  created_at: string;
}

interface DetailedTwitterCardProps {
  totalTweets: number;
  verifiedCount: number;
  verifiedAccounts: TwitterAccount[];
  engagementTotal: {
    retweets: number;
    likes: number;
    replies: number;
  };
  avgEngagement: number;
  byVerificationType: {
    government: number;
    business: number;
    blue: number;
  };
  credibilityScore: number;
  index?: number;
}

export function DetailedTwitterCard({
  totalTweets,
  verifiedCount,
  verifiedAccounts,
  engagementTotal,
  avgEngagement,
  byVerificationType,
  credibilityScore,
  index = 0
}: DetailedTwitterCardProps) {
  const getVerificationIcon = (type: string) => {
    switch(type) {
      case 'government': return '🏛️';
      case 'business': return '🏢';
      default: return '✓';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Twitter className="w-6 h-6 text-blue-500" />
            Twitter/X Detailed Analysis
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Accordion type="single" collapsible defaultValue="summary">
            <AccordionItem value="summary" className="border-none">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                📊 Verification Breakdown
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{totalTweets}</p>
                      <p className="text-xs text-muted-foreground">Total Tweets</p>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{verifiedCount}</p>
                      <p className="text-xs text-muted-foreground">Verified</p>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{formatNumber(engagementTotal.retweets + engagementTotal.likes + engagementTotal.replies)}</p>
                      <p className="text-xs text-muted-foreground">Total Engagement</p>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round(credibilityScore * 100)}%</p>
                      <p className="text-xs text-muted-foreground">Credibility</p>
                    </div>
                  </div>

                  {/* Account Types */}
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Verified Account Types
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {byVerificationType.government > 0 && (
                        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30">
                          🏛️ Government: {byVerificationType.government}
                        </Badge>
                      )}
                      {byVerificationType.business > 0 && (
                        <Badge variant="outline" className="bg-green-500/10 border-green-500/30">
                          🏢 News Orgs: {byVerificationType.business}
                        </Badge>
                      )}
                      {byVerificationType.blue > 0 && (
                        <Badge variant="outline" className="bg-cyan-500/10 border-cyan-500/30">
                          ✓ Verified: {byVerificationType.blue}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Engagement Metrics
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Repeat2 className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-lg font-bold">{formatNumber(engagementTotal.retweets)}</p>
                          <p className="text-xs text-muted-foreground">Retweets</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-lg font-bold">{formatNumber(engagementTotal.likes)}</p>
                          <p className="text-xs text-muted-foreground">Likes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-lg font-bold">{formatNumber(engagementTotal.replies)}</p>
                          <p className="text-xs text-muted-foreground">Replies</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Average: {formatNumber(avgEngagement)} interactions per tweet
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accounts" className="border-none">
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                👥 Top Verified Accounts ({verifiedAccounts.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-4">
                  {verifiedAccounts.slice(0, 5).map((account, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getVerificationIcon(account.verified_type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">@{account.username}</p>
                            <Badge variant="outline" className="text-xs">
                              {formatNumber(account.followers)} followers
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {account.tweet_text}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Repeat2 className="w-3 h-3" />
                              {formatNumber(account.engagement.retweets)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {formatNumber(account.engagement.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {formatNumber(account.engagement.replies)}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(account.tweet_url, '_blank')}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Conclusion */}
          <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">🎯 Conclusion:</span> Multiple verified news organizations independently reported this story, indicating high likelihood of authenticity.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
