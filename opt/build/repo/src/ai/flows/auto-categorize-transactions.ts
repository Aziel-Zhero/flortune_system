// src/ai/flows/auto-categorize-transactions.ts
'use server';
/**
 * @fileOverview A transaction auto-categorization AI agent.
 *
 * - autoCategorizeTransaction - A function that handles the transaction categorization process.
 * - AutoCategorizeTransactionInput - The input type for the autoCategorizeTransaction function.
 * - AutoCategorizeTransactionOutput - The return type for the autoCategorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCategorizeTransactionInputSchema = z.object({
  transactionDescription: z
    .string()
    .describe('The description of the transaction to categorize.'),
});
export type AutoCategorizeTransactionInput = z.infer<
  typeof AutoCategorizeTransactionInputSchema
>;

const AutoCategorizeTransactionOutputSchema = z.object({
  category: z.string().describe('The predicted category for the transaction.'),
  confidence: z
    .number()
    .describe(
      'A number between 0 and 1 indicating the confidence in the category prediction.'
    ),
});
export type AutoCategorizeTransactionOutput = z.infer<
  typeof AutoCategorizeTransactionOutputSchema
>;

export async function autoCategorizeTransaction(
  input: AutoCategorizeTransactionInput
): Promise<AutoCategorizeTransactionOutput> {
  return autoCategorizeTransactionFlow(input);
}

const autoCategorizeTransactionPrompt = ai.definePrompt({
  name: 'autoCategorizeTransactionPrompt',
  input: {schema: AutoCategorizeTransactionInputSchema},
  output: {schema: AutoCategorizeTransactionOutputSchema},
  prompt: `You are a personal finance expert. Given a transaction description, you will predict the most likely category for the transaction.

Transaction Description: {{{transactionDescription}}}

Consider these categories:
- Groceries
- Restaurants
- Entertainment
- Utilities
- Rent
- Salary
- Transportation
- Shopping
- Travel
- Other

Respond with the category and a confidence score between 0 and 1. The confidence score should reflect how certain you are of your prediction. Return a valid JSON object.`,
});

const autoCategorizeTransactionFlow = ai.defineFlow(
  {
    name: 'autoCategorizeTransactionFlow',
    inputSchema: AutoCategorizeTransactionInputSchema,
    outputSchema: AutoCategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await autoCategorizeTransactionPrompt(input);
    return output!;
  }
);
