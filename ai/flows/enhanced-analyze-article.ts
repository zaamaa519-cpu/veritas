'use server';
/**
 * @fileOverview This flow provides a comprehensive, multi-faceted analysis of a news article
 * simulating a weighted scoring system across different analytical components.
 *
 * - enhancedAnalyzeArticle - A function that performs the enhanced analysis.
 */

import { ai } from '@/ai/genkit';
import {
  EnhancedAnalysisInputSchema,
  EnhancedAnalysisOutputSchema,
} from '@/lib/types';
import type {
  EnhancedAnalysisInput,
  EnhancedAnalysisOutput,
} from '@/lib/types';

export async function enhancedAnalyzeArticle(
  input: EnhancedAnalysisInput
): Promise<EnhancedAnalysisOutput> {
  return enhancedAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancedAnalysisPrompt',
  input: { schema: EnhancedAnalysisInputSchema },
  output: { schema: EnhancedAnalysisOutputSchema },
  prompt: `
    **VERITAS AI ULTIMATE ANALYSIS PROTOCOL**

    You are an expert fact-checking AI system. Your task is to perform a multi-dimensional analysis of the provided text and synthesize the findings into a final, weighted score and verdict.

    **ARTICLE FOR ANALYSIS:**
    """
    {{{text}}}
    """

    **STEP 1: SIMULATE FOUR INDEPENDENT ANALYSIS COMPONENTS**

    **COMPONENT A: Model Analysis (Weight: 50%)**
    Perform a deep linguistic and claims analysis.
    - **Analysis Dimensions**: Claim verifiability, rhetorical techniques, bias, emotional manipulation, source attribution quality, logical consistency.
    - **Scoring**: Assign a 'model_score' from 0.0 (highly unreliable) to 1.0 (highly reliable).

    **COMPONENT B: Source Verification (Weight: 15%)**
    Simulate a check on the article's source. If a source is mentioned (e.g., "Reuters," "a blog called 'TruthSeeker'"), evaluate its general reputation based on journalistic standards. If no source is mentioned, assign a low score.
    - **Credibility Tiers (Simulated)**:
      - Tier 1 (e.g., Reuters, AP): ~0.95
      - Tier 2 (e.g., BBC, NYT): ~0.8
      - Tier 3 (e.g., CNN, Fox): ~0.6
      - Tier 4 (e.g., Local News): ~0.4
      - Tier 5 (e.g., Blogs, unknown): ~0.15
    - **Scoring**: Assign a 'source_verification_score' from 0.0 to 1.0.

    **COMPONENT C: Web Search Simulation (Weight: 20%)**
    Simulate a web search to find corroborating or conflicting reports from other reputable sources.
    - **Search Strategy**: Imagine searching for key claims on AP, Reuters, and other major news outlets.
    - **Consensus Analysis**: Determine if there is strong consensus, conflicting reports, or no coverage. Strong consensus from reputable sources yields a high score. No coverage or conflicting reports yield a low score.
    - **Scoring**: Assign a 'web_search_score' from 0.0 to 1.0.

    **COMPONENT D: Fact-Check Database Simulation (Weight: 15%)**
    Simulate a lookup in major fact-checking databases (Snopes, PolitiFact, FactCheck.org).
    - **Verification**: Imagine checking if the main claims have been previously debunked or verified by these organizations.
    - **Scoring**: If you simulate finding a "False" rating, assign a very low 'fact_check_score'. If "True," a high score. If unproven or not found, assign a medium-to-low score.
    - **Scoring**: Assign a 'fact_check_score' from 0.0 to 1.0.

    **STEP 2: CALCULATE FINAL WEIGHTED SCORE**

    Combine the scores from Step 1 using the specified weights:
    Final Score = (model_score * 0.50) + (source_verification_score * 0.15) + (web_search_score * 0.20) + (fact_check_score * 0.15)

    **STEP 3: DETERMINE FINAL VERDICT AND CONFIDENCE**

    Based on the Final Score, determine the 'primary_verdict' and 'risk_level'.
    - **Verdict Thresholds**:
      - 90-100%: HIGHLY_CREDIBLE (low risk)
      - 70-89%: CREDIBLE (low risk)
      - 50-69%: CAUTION_ADVISED (medium risk)
      - 30-49%: QUESTIONABLE (high risk)
      - 0-29%: UNRELIABLE (critical risk)
    - **Confidence Level**: Assess the agreement between your simulated components. If all components point to the same conclusion, 'confidence_level' is 'very_high'. If there are mixed signals (e.g., good source but debunked claims), set to 'medium' or 'low'.

    **STEP 4: GENERATE KEY FINDINGS AND RECOMMENDATIONS**

    - **Key Findings**: Summarize the most critical insights from all components into 2-4 bullet points.
    - **Recommended Actions**: Provide 2-3 actionable recommendations for the user (e.g., "verify_with_experts", "check_primary_sources", "be_wary_of_emotional_language").

    **STEP 5: COMPILE THE FINAL JSON OUTPUT**

    Provide the complete, final analysis in the specified JSON format. Ensure all fields are populated correctly.
    `,
});

const enhancedAnalysisFlow = ai.defineFlow(
  {
    name: 'enhancedAnalysisFlow',
    inputSchema: EnhancedAnalysisInputSchema,
    outputSchema: EnhancedAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI failed to produce an analysis.');
    }
    // Simple validation to ensure the final score is somewhat plausible,
    // sometimes the model miscalculates. We can correct it here if needed.
    const calculatedScore = (output.component_scores.model_analysis * 0.5) +
                            (output.component_scores.source_verification * 0.15) +
                            (output.component_scores.web_search * 0.20) +
                            (output.component_scores.fact_check * 0.15);
    
    // If the model's final_score is wildly different from our calculation, use our calculation.
    // This adds a layer of robustness.
    if (Math.abs(output.final_score - calculatedScore) > 0.1) {
        output.final_score = calculatedScore;
    }

    return output;
  }
);
