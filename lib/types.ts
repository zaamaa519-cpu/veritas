import { z } from 'zod';

export const ClassifyFakeNewsInputSchema = z.object({
  article: z.string().describe('The news article or text snippet to analyze.'),
});
export type ClassifyFakeNewsInput = z.infer<typeof ClassifyFakeNewsInputSchema>;

export const ClassifyFakeNewsOutputSchema = z.object({
  classification: z.enum(['Real', 'Fake', 'Possibly Fake']).describe('The classification result: Real, Fake, or Possibly Fake.'),
  confidence: z.number().min(0).max(1).describe('The confidence level of the classification (0 to 1).'),
  explanation: z.string().describe('A detailed explanation supporting the classification, summarizing the key findings.'),
  indicators: z
    .array(
      z.string().describe('A list of specific red flags or positive indicators found in the text.')
    )
    .optional()
    .describe('List of indicators (e.g., "Sensationalist Language", "Lack of Named Sources") that support the classification.'),
});
export type ClassifyFakeNewsOutput = z.infer<typeof ClassifyFakeNewsOutputSchema>;


// New types for the Enhanced News Analyzer
export const EnhancedAnalysisInputSchema = z.object({
  text: z.string().describe('The content of the article to be analyzed.'),
});
export type EnhancedAnalysisInput = z.infer<typeof EnhancedAnalysisInputSchema>;

export const EnhancedAnalysisOutputSchema = z.object({
  final_score: z.number().min(0).max(1),
  confidence_level: z.enum(['very_high', 'high', 'medium', 'low']),
  primary_verdict: z.enum([
    'HIGHLY_CREDIBLE',
    'CREDIBLE',
    'CAUTION_ADVISED',
    'QUESTIONABLE',
    'UNRELIABLE',
  ]),
  component_scores: z.object({
    model_analysis: z.number().min(0).max(1),
    web_search: z.number().min(0).max(1),
    source_verification: z.number().min(0).max(1),
    fact_check: z.number().min(0).max(1),
  }),
  key_findings: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  // New fields for enhanced verification
  verification_details: z.object({
    twitter_verification: z.object({
      checked: z.boolean(),
      verified_mentions: z.number(),
      verified_accounts: z.array(z.string()).optional(),
    }).optional(),
    trusted_sources: z.array(z.object({
      name: z.string(),
      url: z.string(),
      verified: z.boolean(),
      credibility: z.enum(['high', 'medium', 'low']),
    })).optional(),
    fact_check_results: z.object({
      found: z.boolean(),
      sources: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
  accuracy_metrics: z.object({
    overall_accuracy: z.number().min(0).max(1),
    component_accuracies: z.object({
      ai_model: z.number().min(0).max(1).optional(),
      web_search: z.number().min(0).max(1).optional(),
      source_verification: z.number().min(0).max(1).optional(),
      twitter_verification: z.number().min(0).max(1).optional(),
      fact_check: z.number().min(0).max(1).optional(),
    }).optional(),
  }).optional(),
});
export type EnhancedAnalysisOutput = z.infer<typeof EnhancedAnalysisOutputSchema>;

/** Maps EnhancedAnalysisOutput to quiz/chatbot-compatible format */
export function enhancedToLegacyFormat(enhanced: EnhancedAnalysisOutput): ClassifyFakeNewsOutput {
  const verdictToClassification: Record<string, 'Real' | 'Fake' | 'Possibly Fake'> = {
    HIGHLY_CREDIBLE: 'Real',
    CREDIBLE: 'Real',
    CAUTION_ADVISED: 'Possibly Fake',
    QUESTIONABLE: 'Fake',
    UNRELIABLE: 'Fake',
  };
  return {
    classification: verdictToClassification[enhanced.primary_verdict] ?? 'Possibly Fake',
    confidence: enhanced.final_score,
    explanation: enhanced.key_findings.join('. '),
    indicators: enhanced.recommended_actions,
  };
}
