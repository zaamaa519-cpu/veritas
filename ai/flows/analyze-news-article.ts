'use server';

/**
 * @fileOverview An AI agent to analyze news articles and determine the likelihood of it being fake news.
 *
 * - analyzeNewsArticle - A function that analyzes a news article and returns the likelihood of it being fake news.
 * - AnalyzeNewsArticleInput - The input type for the analyzeNewsArticle function.
 * - AnalyzeNewsArticleOutput - The return type for the analyzeNewsArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeNewsArticleInputSchema = z.object({
  article: z.string().describe('The news article or text snippet to analyze.'),
});
export type AnalyzeNewsArticleInput = z.infer<typeof AnalyzeNewsArticleInputSchema>;

const AnalyzeNewsArticleOutputSchema = z.object({
  isFake: z.boolean().describe('Whether the article is likely to be fake news.'),
  confidence: z.number().describe('The confidence level (0-1) of the AI in its assessment.'),
  explanation: z.string().describe('Explanation of why the AI thinks the article is fake or not.'),
});
export type AnalyzeNewsArticleOutput = z.infer<typeof AnalyzeNewsArticleOutputSchema>;

export async function analyzeNewsArticle(input: AnalyzeNewsArticleInput): Promise<AnalyzeNewsArticleOutput> {
  return analyzeNewsArticleFlow(input);
}

const analyzeNewsArticlePrompt = ai.definePrompt({
  name: 'analyzeNewsArticlePrompt',
  input: {schema: AnalyzeNewsArticleInputSchema},
  output: {schema: AnalyzeNewsArticleOutputSchema},
  prompt: `You are an expert in detecting fake news. Analyze the following news article and determine the likelihood of it being fake news.

Article: {{{article}}}

Consider various indicators such as the source's reputation, the presence of sensationalism, factual errors, and other red flags. Provide a confidence level (0-1) indicating the certainty of your assessment and an explanation of your reasoning.

Is Fake: {{isFake}}
Confidence: {{confidence}}
Explanation: {{explanation}}`,
});

const analyzeNewsArticleFlow = ai.defineFlow(
  {
    name: 'analyzeNewsArticleFlow',
    inputSchema: AnalyzeNewsArticleInputSchema,
    outputSchema: AnalyzeNewsArticleOutputSchema,
  },
  async input => {
    const {output} = await analyzeNewsArticlePrompt(input);
    return output!;
  }
);
