'use server';

/**
 * @fileOverview An AI agent to generate a quiz question about current affairs.
 *
 * - generateQuizQuestion - A function that generates a single quiz question.
 * - GenerateQuizQuestionInput - The input type for the generateQuizQuestion function.
 * - GenerateQuizQuestionOutput - The return type for the generateQuizQuestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuizQuestionInputSchema = z.object({
  topic: z.string().describe('The topic for the quiz question (e.g., Technology, Politics, Sports).'),
});
export type GenerateQuizQuestionInput = z.infer<typeof GenerateQuizQuestionInputSchema>;

const GenerateQuizQuestionOutputSchema = z.object({
  text: z.string().describe('A short, realistic news headline or snippet.'),
  isReal: z.boolean().describe('A flag indicating if the news snippet is based on a real event or is fabricated.'),
});
export type GenerateQuizQuestionOutput = z.infer<typeof GenerateQuizQuestionOutputSchema>;

export async function generateQuizQuestion(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  return generateQuizQuestionFlow(input);
}

const generateQuizQuestionPrompt = ai.definePrompt({
  name: 'generateQuizQuestionPrompt',
  input: { schema: GenerateQuizQuestionInputSchema },
  output: { schema: GenerateQuizQuestionOutputSchema },
  prompt: `You are a quiz master creating questions for a fake news detection game. Your task is to generate a single news snippet based on the given topic.

You must randomly decide whether to create a REAL news snippet (based on a verifiable, recent event) or a FAKE one (plausible but entirely fictional).

The snippet should be a single, concise paragraph.

Topic: {{{topic}}}
`,
});

const generateQuizQuestionFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionFlow',
    inputSchema: GenerateQuizQuestionInputSchema,
    outputSchema: GenerateQuizQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuizQuestionPrompt(input);
    return output!;
  }
);
