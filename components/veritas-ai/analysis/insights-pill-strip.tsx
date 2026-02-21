'use client';

import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface Insight {
  text: string;
  severity: 'red' | 'yellow' | 'green';
}

export function InsightsPillStrip({ insights }: { insights: Insight[] }) {
  const getIcon = (severity: string) => {
    switch(severity) {
      case 'red': return <AlertCircle className="w-4 h-4" />;
      case 'yellow': return <AlertTriangle className="w-4 h-4" />;
      case 'green': return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getColorClass = (severity: string) => {
    switch(severity) {
      case 'red': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/50 hover:bg-red-500/20';
      case 'yellow': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20';
      case 'green': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50 hover:bg-green-500/20';
      default: return '';
    }
  };

  if (!insights || insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="w-full"
    >
      <div className="flex flex-wrap gap-3 justify-center">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4, type: 'spring' }}
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Badge 
              variant="outline"
              className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${getColorClass(insight.severity)}`}
            >
              {getIcon(insight.severity)}
              {insight.text}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
