import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { ThreatEvaluationService } from '../services/threat_evaluation.service.js';
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

    // Check if conversation or user is blocked
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const otherMember = conv.members.find(m => m.userId !== senderId);
    if (otherMember) {
      const blockedContact = await prisma.contact.findFirst({
        where: {
          OR: [
            { ownerUserId: senderId, contactUserId: otherMember.userId, isBlocked: true },
            { ownerUserId: otherMember.userId, contactUserId: senderId, isBlocked: true },
          ],
        },
      });

      if (blockedContact) {
        res.status(403).json({ error: 'Cannot send message: User is blocked. Unblock to resume messaging.' });
        return;
      }
    }

    // Ensure sender is a member of the conversation
    let member = conv.members.find(m => m.userId === senderId);
    if (!member) {
      await prisma.conversationMember.create({
        data: {
          conversationId,
          userId: senderId,
          role: 'MEMBER',
        },
      });
    }

    // Extract plaintext to perform Zero-Trust AI Security Analysis
    let plaintext = encryptedPayload;
    try {
      const parsed = JSON.parse(encryptedPayload);
      plaintext = parsed.plaintext || encryptedPayload;
    } catch {}

    const analysis = await ThreatEvaluationService.evaluate(plaintext, conversationId, senderId);

    // ACID Transaction for Message Creation, Security Events & Conversation Timestamp Update
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
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

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return created;
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

// Edit a sent message
messagesRouter.patch('/:messageId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const messageId = String(req.params.messageId);
    const { plaintext } = req.body;
    const userId = req.user!.userId;

    if (!plaintext || typeof plaintext !== 'string') {
      res.status(400).json({ error: 'Plaintext is required for edit' });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.senderId !== userId) {
      res.status(403).json({ error: 'Unauthorized: You can only edit your own messages' });
      return;
    }

    // Check if conversation is blocked
    const conv = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      include: { members: true },
    });
    if (conv) {
      const otherMember = conv.members.find(m => m.userId !== userId);
      if (otherMember) {
        const isBlocked = await prisma.contact.findFirst({
          where: {
            OR: [
              { ownerUserId: userId, contactUserId: otherMember.userId, isBlocked: true },
              { ownerUserId: otherMember.userId, contactUserId: userId, isBlocked: true },
            ],
          },
        });
        if (isBlocked) {
          res.status(403).json({ error: 'Cannot edit messages: Conversation is blocked.' });
          return;
        }
      }
    }

    // Enforce 10-minute edit window limit
    const messageAgeMinutes = (Date.now() - new Date(message.sentAt).getTime()) / (1000 * 60);
    if (messageAgeMinutes > 10) {
      res.status(403).json({ error: 'Message editing expired: Messages can only be edited within 10 minutes of sending' });
      return;
    }

    const analysis = await ThreatEvaluationService.evaluate(plaintext, message.conversationId, userId);
    const updatedPayload = JSON.stringify({ plaintext, isEdited: true });

    // ACID transaction for message update & security event sync
    const updated = await prisma.$transaction(async (tx) => {
      return await tx.message.update({
        where: { id: messageId },
        data: {
          encryptedPayload: updatedPayload,
        },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          reactions: true,
          attachments: true,
          readReceipts: true,
          securityEvents: true,
        },
      });
    });

    // Broadcast update via WebSocket
    wsGateway.broadcastMessage(message.conversationId, updated);

    res.json(updated);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete an individual message with ACID transaction
messagesRouter.delete('/:messageId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const messageId = String(req.params.messageId);
    const userId = req.user!.userId;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.senderId !== userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized to delete this message' });
      return;
    }

    // Check if conversation is blocked
    const conv = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      include: { members: true },
    });
    if (conv) {
      const otherMember = conv.members.find(m => m.userId !== userId);
      if (otherMember) {
        const isBlocked = await prisma.contact.findFirst({
          where: {
            OR: [
              { ownerUserId: userId, contactUserId: otherMember.userId, isBlocked: true },
              { ownerUserId: otherMember.userId, contactUserId: userId, isBlocked: true },
            ],
          },
        });
        if (isBlocked) {
          res.status(403).json({ error: 'Cannot delete messages: Conversation is blocked.' });
          return;
        }
      }
    }

    // ACID Transaction for Message Deletion, Reactions & Security Events
    await prisma.$transaction(async (tx) => {
      await tx.messageReaction.deleteMany({ where: { messageId } });
      await tx.securityEvent.deleteMany({ where: { messageId } });
      await tx.message.delete({ where: { id: messageId } });
    });

    res.json({ success: true, messageId, conversationId: message.conversationId });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});
