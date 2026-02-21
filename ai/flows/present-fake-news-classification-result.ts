'use server';
/**
 * @fileOverview This flow classifies a news article as real or fake and provides supporting evidence and explanations.
 *
 * - classifyFakeNews - A function that classifies news as real or fake.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { ClassifyFakeNewsInputSchema, ClassifyFakeNewsOutputSchema } from '@/lib/types';
import type { ClassifyFakeNewsInput, ClassifyFakeNewsOutput } from '@/lib/types';


export async function classifyFakeNews(input: ClassifyFakeNewsInput): Promise<ClassifyFakeNewsOutput> {
  return classifyFakeNewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyFakeNewsPrompt',
  input: {schema: ClassifyFakeNewsInputSchema},
  output: {schema: ClassifyFakeNewsOutputSchema},
  prompt: `You are a world-class fake news detection expert. Your task is to analyze the following news article with extreme scrutiny.

News Article:
"{{{article}}}"

Analyze the article based on the following criteria and provide a detailed assessment.

1.  **Source Analysis**: Does the text mention a source? Is the source reputable (e.g., Reuters, Associated Press, BBC)? Or does it rely on vague sources like "insiders say" or "sources claim"?
2.  **Linguistic & Sentiment Analysis**:
    *   **Sensationalism**: Does it use emotionally charged, extreme, or exaggerated language (e.g., 'shocking', 'explosive', 'miracle', 'devastating')?
    *   **Emotional Tone**: Is the sentiment overly negative or positive, aiming to provoke anger, fear, or excitement?
    *   **Vagueness**: Does it use vague phrases like 'some people say' or 'rumor has it'?
    *   **Conspiracy Language**: Are there keywords often associated with conspiracies (e.g., 'cover-up', 'deep state', 'hidden truth', 'mainstream media is lying')?
    *   **Formatting**: Is there excessive use of ALL CAPS or punctuation like '!!!' or '???' to create false urgency?
3.  **Factual Consistency**: Does the article present verifiable facts, specific dates, and direct quotes from named individuals or organizations? Or does it lack specific, checkable details?

Based on your comprehensive analysis, provide the following in a valid JSON format:

*   **classification**: Your final verdict - "Real", "Fake", or "Possibly Fake" if there are mixed signals.
*   **confidence**: Your confidence in this verdict, from 0.0 (not confident) to 1.0 (certain).
*   **explanation**: A concise, well-reasoned paragraph explaining your verdict, summarizing the most critical findings from your analysis.
*   **indicators**: A list of the most prominent indicators (e.g., "Use of sensationalist language", "Lack of verifiable sources", "Neutral tone and factual reporting", "Contains conspiracy keywords"). This list should contain between 2 and 5 indicators.

Be methodical and objective. Your goal is to provide a reliable and informative assessment.`,
});

const classifyFakeNewsFlow = ai.defineFlow(
  {
    name: 'classifyFakeNewsFlow',
    inputSchema: ClassifyFakeNewsInputSchema,
    outputSchema: ClassifyFakeNewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
