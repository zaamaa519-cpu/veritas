'use server';
/**
 * @fileOverview An AI agent that provides a confidence level for fake news detection.
 *
 * - provideFakeNewsConfidenceLevel - A function that handles the fake news confidence level process.
 * - ProvideFakeNewsConfidenceLevelInput - The input type for the provideFakeNewsConfidenceLevel function.
 * - ProvideFakeNewsConfidenceLevelOutput - The return type for the provideFakeNewsConfidenceLevel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideFakeNewsConfidenceLevelInputSchema = z.object({
  newsArticle: z.string().describe('The news article or text snippet to analyze.'),
});
export type ProvideFakeNewsConfidenceLevelInput = z.infer<typeof ProvideFakeNewsConfidenceLevelInputSchema>;

const ProvideFakeNewsConfidenceLevelOutputSchema = z.object({
  confidenceLevel: z.number().describe('The confidence level (as a percentage) of the AI\'s assessment.'),
  isFakeNews: z.boolean().describe('Whether the article is classified as fake news.'),
  reasoning: z.string().describe('The reasoning behind the AI\'s assessment.'),
});
export type ProvideFakeNewsConfidenceLevelOutput = z.infer<typeof ProvideFakeNewsConfidenceLevelOutputSchema>;

export async function provideFakeNewsConfidenceLevel(input: ProvideFakeNewsConfidenceLevelInput): Promise<ProvideFakeNewsConfidenceLevelOutput> {
  return provideFakeNewsConfidenceLevelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideFakeNewsConfidenceLevelPrompt',
  input: {schema: ProvideFakeNewsConfidenceLevelInputSchema},
  output: {schema: ProvideFakeNewsConfidenceLevelOutputSchema},
  prompt: `You are an AI-powered fake news detection tool. Analyze the following news article and determine the likelihood of it being fake news. Provide a confidence level (as a percentage) indicating the certainty of your assessment. Also, provide the reasoning behind your assessment.

News Article: {{{newsArticle}}}

Output should be in JSON format:
{
  "confidenceLevel": number, // Confidence level as a percentage (e.g., 95 for 95%)
  "isFakeNews": boolean, // true if the article is classified as fake news, false otherwise
  "reasoning": string // The reasoning behind the assessment
}
`,
});

const provideFakeNewsConfidenceLevelFlow = ai.defineFlow(
  {
    name: 'provideFakeNewsConfidenceLevelFlow',
    inputSchema: ProvideFakeNewsConfidenceLevelInputSchema,
    outputSchema: ProvideFakeNewsConfidenceLevelOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
