'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface Claim {
  text: string;
  id: number;
}

export function ClaimsExtractor({ claims }: { claims: Claim[] }) {
  const handleFindEvidence = (claim: string) => {
    const searchQuery = encodeURIComponent(claim);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  if (!claims || claims.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            🔎 Key Claims Extracted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {claims.map((claim, i) => (
            <motion.div 
              key={claim.id} 
              className="flex flex-col sm:flex-row items-start gap-3 p-5 rounded-lg bg-muted/50 border border-border/30 hover:bg-muted/70 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.3 }}
              whileHover={{ x: 5 }}
            >
              <div className="flex-1">
                <p className="text-sm md:text-base italic text-muted-foreground leading-relaxed">
                  "{claim.text}"
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFindEvidence(claim.text)}
                  className="flex-shrink-0"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Evidence
                </Button>
              </motion.div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
