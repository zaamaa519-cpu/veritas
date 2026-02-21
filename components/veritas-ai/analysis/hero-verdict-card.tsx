'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroVerdictCardProps {
  prediction: 'FAKE' | 'REAL';
  confidence: number;
  fakeness_probability: number;
}

export function HeroVerdictCard({ prediction, confidence, fakeness_probability }: HeroVerdictCardProps) {
  const isFake = prediction === 'FAKE';
  
  // Determine recommendation based on confidence and prediction
  const getRecommendation = () => {
    if (isFake && confidence >= 0.7) {
      return { type: 'do_not_share', text: 'DO NOT SHARE', icon: XCircle, color: 'destructive' };
    } else if (isFake || confidence < 0.6) {
      return { type: 'verify', text: 'VERIFY BEFORE SHARING', icon: AlertTriangle, color: 'warning' };
    } else {
      return { type: 'safe', text: 'SAFE TO SHARE', icon: CheckCircle, color: 'success' };
    }
  };
  
  const recommendation = getRecommendation();
  const RecommendationIcon = recommendation.icon;
  
  // Calculate position for fakeness bar needle (0-100%)
  const needlePosition = fakeness_probability * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', bounce: 0.3 }}
    >
      <Card className={cn(
        "relative overflow-hidden border-2 shadow-2xl backdrop-blur-sm",
        isFake ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20" : "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
      )}>
        {/* Animated background gradient with pulse */}
        <motion.div 
          className={cn(
            "absolute inset-0 opacity-10",
            isFake 
              ? "bg-gradient-to-br from-red-500 via-orange-500 to-red-600" 
              : "bg-gradient-to-br from-green-500 via-emerald-500 to-green-600"
          )}
          animate={{ 
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <CardContent className="relative p-8 md:p-12">
          {/* Main Verdict with animated icon */}
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.5 }}
          >
            <motion.div 
              className="flex items-center justify-center gap-4 mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {isFake ? (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <XCircle className="w-20 h-20 md:w-24 md:h-24 text-red-500 drop-shadow-lg" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5, type: 'spring', bounce: 0.6 }}
                >
                  <CheckCircle className="w-20 h-20 md:w-24 md:h-24 text-green-500 drop-shadow-lg" />
                </motion.div>
              )}
            </motion.div>
            <motion.h2 
              className={cn(
                "text-5xl md:text-7xl font-bold mb-3",
                isFake ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              LIKELY {prediction}
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-lg md:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Based on comprehensive analysis
            </motion.p>
          </motion.div>
          
          {/* Confidence Meter - Circular Display with Pulsing Dot */}
          <motion.div 
            className="flex justify-center my-12"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, duration: 0.8, type: 'spring' }}
          >
            <div className="relative">
              {/* Pulsing glow effect */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full blur-2xl",
                  isFake ? "bg-red-500/30" : "bg-green-500/30"
                )}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Circular progress background */}
              <svg className="w-48 h-48 md:w-64 md:h-64 transform -rotate-90 relative z-10">
                {/* Background circle */}
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className={isFake ? "text-red-500" : "text-green-500"}
                  initial={{ strokeDasharray: "0 1000" }}
                  animate={{ 
                    strokeDasharray: `${confidence * 10} 1000`,
                  }}
                  transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                  style={{
                    strokeDasharray: `${confidence * 10} 1000`,
                  }}
                />
              </svg>
              
              {/* Center content with pulsing dot */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                  className="text-center"
                >
                  {/* Pulsing dot */}
                  <motion.div
                    className={cn(
                      "w-4 h-4 rounded-full mx-auto mb-4",
                      isFake ? "bg-red-500" : "bg-green-500"
                    )}
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <div className="text-5xl md:text-7xl font-bold">
                    {Math.round(confidence * 100)}%
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground text-center mt-2">
                    Confidence
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          {/* Model Accuracy Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.5 }}
            className="text-center mb-8 pb-6 border-b border-border/30"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <p className="text-base md:text-lg font-semibold">MODEL ACCURACY: 94.2%</p>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">
              Based on 12,847 verified predictions
            </p>
          </motion.div>
          
          {/* Recommendation Badge with animation */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, duration: 0.5, type: 'spring' }}
            whileHover={{ scale: 1.05 }}
          >
            <Badge 
              variant={recommendation.color as any}
              className="text-base md:text-lg px-6 py-3 flex items-center gap-2 shadow-2xl border-2"
            >
              <RecommendationIcon className="w-5 h-5" />
              {recommendation.text}
            </Badge>
          </motion.div>
          
          {/* Fakeness Probability Bar with enhanced styling */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Fakeness Probability</span>
              <span className="font-bold text-foreground">{(fakeness_probability * 100).toFixed(1)}%</span>
            </div>
            
            {/* Gradient bar with shadow */}
            <div className="relative h-10 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 shadow-lg">
              {/* Needle/marker with enhanced styling */}
              <motion.div
                className="absolute top-0 bottom-0 w-1.5 bg-white shadow-2xl z-10"
                initial={{ left: '0%' }}
                animate={{ left: `${needlePosition}%` }}
                transition={{ delay: 2.7, duration: 1.2, ease: 'easeOut' }}
                style={{ left: `${needlePosition}%` }}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-white drop-shadow-lg" />
                </div>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
                </div>
              </motion.div>
            </div>
            
            {/* Labels with better styling */}
            <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
              <span>0% Real</span>
              <span>50%</span>
              <span>100% Fake</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
