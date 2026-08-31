import { z } from 'zod';

export const createConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']),
  title: z.string().max(100).optional(),
  participantUserIds: z.array(z.string()).min(1),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  recipientDeviceId: z.string().min(10),
  encryptedPayload: z.string().min(10),
  replyToMessageId: z.string().uuid().optional(),
  disappearsInSeconds: z.number().int().positive().optional(),
});

export const messageReactionSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(8),
});
