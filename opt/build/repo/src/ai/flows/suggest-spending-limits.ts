'use server';

/**
 * @fileOverview AI agent that analyzes spending patterns and suggests spending limits.
 *
 * - suggestSpendingLimits - A function that analyzes spending and suggests limits.
 * - SuggestSpendingLimitsInput - The input type for the suggestSpendingLimits function.
 * - SuggestSpendingLimitsOutput - The return type for the suggestSpendingLimits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSpendingLimitsInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'Spending data as a JSON string, including categories and amounts spent.'
    ),
});
export type SuggestSpendingLimitsInput = z.infer<
  typeof SuggestSpendingLimitsInputSchema
>;

const SuggestSpendingLimitsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions for spending limits in different categories.'),
});
export type SuggestSpendingLimitsOutput = z.infer<
  typeof SuggestSpendingLimitsOutputSchema
>;

export async function suggestSpendingLimits(
  input: SuggestSpendingLimitsInput
): Promise<SuggestSpendingLimitsOutput> {
  return suggestSpendingLimitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSpendingLimitsPrompt',
  input: {schema: SuggestSpendingLimitsInputSchema},
  output: {schema: SuggestSpendingLimitsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following spending data and suggest spending limits for each category. Be brief and actionable.

Spending Data: {{{spendingData}}}`,
});

const suggestSpendingLimitsFlow = ai.defineFlow(
  {
    name: 'suggestSpendingLimitsFlow',
    inputSchema: SuggestSpendingLimitsInputSchema,
    outputSchema: SuggestSpendingLimitsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
