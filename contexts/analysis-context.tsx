'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { EnhancedAnalysisOutput } from '@/lib/types';

type AnalysisContextValue = {
  article: string;
  analysis: EnhancedAnalysisOutput | null;
  setAnalysis: (article: string, analysis: EnhancedAnalysisOutput | null) => void;
};

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [article, setArticle] = useState('');
  const [analysis, setAnalysisState] = useState<EnhancedAnalysisOutput | null>(null);

  const setAnalysis = useCallback((newArticle: string, newAnalysis: EnhancedAnalysisOutput | null) => {
    setArticle(newArticle);
    setAnalysisState(newAnalysis);
  }, []);

  return (
    <AnalysisContext.Provider value={{ article, analysis, setAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
}
