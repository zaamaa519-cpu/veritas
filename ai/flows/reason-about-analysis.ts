'use server';
/**
 * @fileOverview This flow provides follow-up answers about a fake news analysis.
 *
 * - reasonAboutAnalysis - A function that answers questions about a previous analysis.
 * - ReasonAboutAnalysisInput - The input type for the function.
 * - ReasonAboutAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ClassifyFakeNewsOutputSchema } from '@/lib/types';

const ReasonAboutAnalysisInputSchema = z.object({
  article: z.string().describe('The original news article text.'),
  analysis: ClassifyFakeNewsOutputSchema.describe('The initial analysis result.'),
  question: z.string().describe('The user\'s follow-up question about the analysis.'),
});
export type ReasonAboutAnalysisInput = z.infer<typeof ReasonAboutAnalysisInputSchema>;

const ReasonAboutAnalysisOutputSchema = z.object({
  answer: z.string().describe('A concise and helpful answer to the user\'s question, delivered in the persona of Vera.'),
});
export type ReasonAboutAnalysisOutput = z.infer<typeof ReasonAboutAnalysisOutputSchema>;

export async function reasonAboutAnalysis(input: ReasonAboutAnalysisInput): Promise<ReasonAboutAnalysisOutput> {
  return reasonAboutAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reasonAboutAnalysisPrompt',
  input: { schema: ReasonAboutAnalysisInputSchema },
  output: { schema: ReasonAboutAnalysisOutputSchema },
  prompt: `You are Vera, the Holographic Truth Weaver. Your persona is calm, wise, analytical, and helpful. Your purpose is to guide users to clarity.

You have already performed an analysis on a news article. Now, a user has a follow-up question.

Your goal is to answer the user's question clearly and concisely, embodying your persona. Use only the information from the original article and your previous analysis. Do not introduce new information. Be helpful and educational.

**Original Article:**
"{{{article}}}"

**Your Initial Analysis:**
- Classification: {{analysis.classification}}
- Confidence: {{analysis.confidence}}
- Explanation: {{{analysis.explanation}}}
- Indicators: {{#if analysis.indicators}}{{#each analysis.indicators}}- {{{this}}}\n{{/each}}{{else}}None{{/if}}

**User's Question:**
"{{{question}}}"

Based on all the provided context, generate a helpful, direct, and in-character answer to the user's question. If the question is unclear or outside the scope of the analysis, gently ask for clarification.
`,
});

const reasonAboutAnalysisFlow = ai.defineFlow(
  {
    name: 'reasonAboutAnalysisFlow',
    inputSchema: ReasonAboutAnalysisInputSchema,
    outputSchema: ReasonAboutAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
