import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { sendMessageSchema, messageReactionSchema } from '@securechat/validation';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';
import { wsGateway } from '../websocket/ws_gateway.js';

export const messagesRouter = Router();

messagesRouter.use(authMiddleware);

messagesRouter.get('/:conversationId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = String(req.params.conversationId);
    const userId = req.user!.userId;

    // Verify membership
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!member) {
      res.status(403).json({ error: 'Not a member of this conversation' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
        reactions: true,
        readReceipts: true,
        securityEvents: {
          select: {
            id: true,
            type: true,
            severity: true,
            riskScore: true,
            indicatorColor: true,
            confidence: true,
            explanation: true,
            recommendation: true,
          },
        },
      },
      orderBy: { sentAt: 'asc' },
      take: 100,
    });

    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

messagesRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = sendMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { conversationId, recipientDeviceId, encryptedPayload, replyToMessageId, disappearsInSeconds } = parseResult.data;
    const senderId = req.user!.userId;
    const senderDeviceId = req.user!.deviceId;

    const senderDevice = await prisma.device.findFirst({
      where: { deviceId: senderDeviceId, userId: senderId },
    });

    if (!senderDevice) {
      res.status(404).json({ error: 'Sender device not found' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderDeviceId: senderDevice.id,
        encryptedPayload,
        replyToMessageId,
        disappearsInSeconds,
        status: 'SENT',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reactions: true,
        attachments: true,
        readReceipts: true,
        securityEvents: true,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast via WebSocket
    wsGateway.broadcastMessage(conversationId, message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

messagesRouter.post('/reaction', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = messageReactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed' });
      return;
    }

    const { messageId, emoji } = parseResult.data;
    const userId = req.user!.userId;

    const reaction = await prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
      update: {},
      create: { messageId, userId, emoji },
    });

    res.json(reaction);
  } catch {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});
