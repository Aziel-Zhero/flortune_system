import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-spending-limits.ts';
import '@/ai/flows/auto-categorize-transactions.ts';