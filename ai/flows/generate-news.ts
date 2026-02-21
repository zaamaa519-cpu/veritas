'use server';

/**
 * @fileOverview An AI agent to generate news articles based on a topic.
 *
 * - generateNews - A function that generates news articles.
 * - GenerateNewsInput - The input type for the generateNews function.
 * - GenerateNewsOutput - The return type for the generateNews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const NewsArticleSchema = z.object({
  headline: z.string().describe('A compelling, realistic news headline.'),
  summary: z.string().describe('A one to two paragraph summary of the news article.'),
  source: z.string().describe('A plausible news source (e.g., Reuters, Associated Press, etc.).'),
  category: z.string().describe('A category for the news article (e.g., Technology, Politics, Sports).'),
});

const GenerateNewsInputSchema = z.object({
  topic: z.string().describe('The topic or country for which to generate news articles.'),
});
export type GenerateNewsInput = z.infer<typeof GenerateNewsInputSchema>;

const GenerateNewsOutputSchema = z.object({
  articles: z.array(NewsArticleSchema).describe('A list of generated news articles.'),
});
export type GenerateNewsOutput = z.infer<typeof GenerateNewsOutputSchema>;

export async function generateNews(input: GenerateNewsInput): Promise<GenerateNewsOutput> {
  return generateNewsFlow(input);
}

const generateNewsPrompt = ai.definePrompt({
  name: 'generateNewsPrompt',
  input: { schema: GenerateNewsInputSchema },
  output: { schema: GenerateNewsOutputSchema },
  prompt: `You are a news summarizer AI. Generate 8 recent, realistic news articles based on the following topic. The articles should cover a range of categories like technology, world news, business, and culture. Ensure the headlines are compelling and the summaries are concise.

Topic: {{{topic}}}
`,
});

const generateNewsFlow = ai.defineFlow(
  {
    name: 'generateNewsFlow',
    inputSchema: GenerateNewsInputSchema,
    outputSchema: GenerateNewsOutputSchema,
  },
  async (input) => {
    const { output } = await generateNewsPrompt(input);
    return output!;
  }
);
