import { z } from 'zod';

export const analyzeMessageSchema = z.object({
  conversationId: z.string().optional(),
  senderId: z.string().optional(),
  text: z.string().min(1),
  language: z.enum(['en', 'ur', 'roman_ur', 'auto']).default('auto'),
  conversationHistory: z.array(z.string()).optional(),
});

export const securityFeedbackSchema = z.object({
  messageId: z.string(),
  isFalsePositive: z.boolean(),
  userComment: z.string().max(500).optional(),
});

export const copilotQuerySchema = z.object({
  conversationId: z.string().optional(),
  query: z.string().min(2).max(1000),
  currentContext: z.string().optional(),
});
