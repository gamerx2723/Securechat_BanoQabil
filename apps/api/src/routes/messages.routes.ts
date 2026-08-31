import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { RiskEngine } from '@securechat/security';
import { sendMessageSchema, messageReactionSchema } from '@securechat/validation';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';
import { wsGateway } from '../websocket/ws_gateway.js';

export const messagesRouter = Router();

messagesRouter.use(authMiddleware);

messagesRouter.get('/:conversationId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = String(req.params.conversationId);
    const userId = req.user!.userId;

    // Check or auto-enroll membership if conversation exists
    let member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!member) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv) {
        member = await prisma.conversationMember.create({
          data: {
            conversationId,
            userId,
            role: 'MEMBER',
          },
        });
      } else {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
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
  } catch (error) {
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

    // Find or fallback to any device for this user
    let senderDevice = await prisma.device.findFirst({
      where: { deviceId: senderDeviceId, userId: senderId },
    });

    if (!senderDevice) {
      senderDevice = await prisma.device.findFirst({
        where: { userId: senderId },
      });
    }

    if (!senderDevice) {
      senderDevice = await prisma.device.create({
        data: {
          userId: senderId,
          deviceId: senderDeviceId || ('DEV_' + Math.random().toString(36).substring(2, 9)),
          deviceType: 'WEB',
          deviceName: 'Web Client Device',
          publicKey: 'PUBKEY_' + Math.random().toString(36).substring(2, 10),
        },
      });
    }

    // Ensure sender is a member of the conversation
    let member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!member) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv) {
        await prisma.conversationMember.create({
          data: {
            conversationId,
            userId: senderId,
            role: 'MEMBER',
          },
        });
      }
    }

    // Extract plaintext to perform Zero-Trust AI Security Analysis
    let plaintext = encryptedPayload;
    try {
      const parsed = JSON.parse(encryptedPayload);
      plaintext = parsed.plaintext || encryptedPayload;
    } catch {}

    const analysis = RiskEngine.evaluateMessage(plaintext);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        senderDeviceId: senderDevice.id,
        encryptedPayload,
        replyToMessageId,
        disappearsInSeconds,
        status: 'SENT',
        securityEvents: {
          create: {
            userId: senderId,
            conversationId,
            type: analysis.primaryThreat,
            severity: analysis.indicatorColor === 'RED' ? 'CRITICAL' : analysis.indicatorColor === 'ORANGE' ? 'MEDIUM' : 'LOW',
            riskScore: analysis.riskScore,
            indicatorColor: analysis.indicatorColor,
            confidence: analysis.confidence / 100,
            source: 'ZERO_TRUST_ANALYZER',
            explanation: analysis.explanation,
            recommendation: analysis.recommendation,
          },
        },
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

    // Update conversation timestamp & security state
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
