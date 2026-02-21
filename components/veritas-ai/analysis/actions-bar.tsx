'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionsBarProps {
  analysisId?: string;
  onCopy?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function ActionsBar({ analysisId, onCopy, onDownload, onShare }: ActionsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 backdrop-blur-sm bg-card/95 shadow-sm">
        <CardContent className="p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Hash className="w-4 h-4" />
            <span className="font-medium">Analysis ID:</span>
            <span className="font-mono text-foreground text-[11px] md:text-xs">
              {analysisId || 'pending-run'}
            </span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={onCopy} className="text-xs md:text-sm">
              <Copy className="w-3 h-3 mr-1" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={onDownload} className="text-xs md:text-sm">
              <Download className="w-3 h-3 mr-1" /> Download
            </Button>
            <Button size="sm" variant="outline" onClick={onShare} className="text-xs md:text-sm">
              <Share2 className="w-3 h-3 mr-1" /> Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
