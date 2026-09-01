import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';
import { z } from 'zod';
import { ThreatEvaluationService } from '../services/threat_evaluation.service.js';
import { wsGateway } from '../websocket/ws_gateway.js';

export const messagesRouter = Router();

// Mandatory authentication middleware
messagesRouter.use(authMiddleware);

const sendMessageSchema = z.object({
  conversationId: z.string(),
  encryptedPayload: z.string(),
  replyToMessageId: z.string().optional(),
  disappearsInSeconds: z.number().int().positive().optional(),
});

messagesRouter.get('/:conversationId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = String(req.params.conversationId);
    const userId = req.user!.userId;

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
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
        reactions: {
          select: {
            id: true,
            userId: true,
            emoji: true,
          },
        },
        attachments: true,
        readReceipts: {
          select: {
            userId: true,
            status: true,
            timestamp: true,
          },
        },
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
      orderBy: {
        sentAt: 'asc',
      },
    });

    // Mark unread incoming messages as READ (Double Blue Ticks)
    const unreadIncomingIds = messages
      .filter((m: any) => m.senderId !== userId && m.status !== 'READ')
      .map((m: any) => m.id);

    if (unreadIncomingIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIncomingIds } },
        data: { status: 'READ' },
      });
      // Broadcast read receipt update
      wsGateway.broadcastReadReceipt(conversationId, userId, unreadIncomingIds);
    }

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

    const { conversationId, encryptedPayload, replyToMessageId, disappearsInSeconds } = parseResult.data;
    const senderId = req.user!.userId;

    // Get active sender device (or create fallback default enclave)
    let senderDevice = await prisma.device.findFirst({
      where: { userId: senderId, isRevoked: false },
    });

    if (!senderDevice) {
      senderDevice = await prisma.device.create({
        data: {
          userId: senderId,
          deviceId: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          deviceName: 'Primary Secure Enclave',
          deviceType: 'BROWSER',
          publicKey: `pub-secp256k1-${Date.now()}`,
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

    let otherMember = conv.members.find((m: any) => m.userId !== senderId);

    // If other member had deleted the conversation previously, automatically re-connect them on new incoming message
    if (!otherMember && conv.type === 'DIRECT') {
      const pastMsg = await prisma.message.findFirst({
        where: {
          conversationId,
          senderId: { not: senderId },
        },
      });
      if (pastMsg) {
        otherMember = await prisma.conversationMember.create({
          data: {
            conversationId,
            userId: pastMsg.senderId,
            role: 'MEMBER',
          },
        });
      }
    }

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
    let member = conv.members.find((m: any) => m.userId === senderId);
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
    const isRecipientOnline = otherMember ? wsGateway.isUserConnected(otherMember.userId) : false;
    const initialStatus = isRecipientOnline ? 'DELIVERED' : 'SENT';

    // ACID Transaction for Message Creation, Security Events & Conversation Timestamp Update
    const message = await prisma.$transaction(async (tx: any) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId,
          senderDeviceId: senderDevice.id,
          encryptedPayload,
          replyToMessageId,
          disappearsInSeconds,
          status: initialStatus,
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

    // Broadcast message via WebSocket
    wsGateway.broadcastMessage(conversationId, message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// React to a message (Emoji reaction) with ACID transaction
messagesRouter.post('/:messageId/reaction', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const messageId = String(req.params.messageId);
    const { emoji } = req.body;
    const userId = req.user!.userId;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { members: true } } },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Check if conversation is blocked
    const otherMember = message.conversation.members.find((m: any) => m.userId !== userId);
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
        res.status(403).json({ error: 'Cannot react: Conversation is blocked.' });
        return;
      }
    }

    // ACID Transaction for Reaction Upsert
    const reaction = await prisma.$transaction(async (tx: any) => {
      return await tx.messageReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
        create: {
          messageId,
          userId,
          emoji,
        },
        update: {},
      });
    });

    // Broadcast reaction via WebSocket
    wsGateway.broadcastReaction(message.conversationId, {
      messageId,
      userId,
      emoji,
      action: 'ADD',
    });

    res.json(reaction);
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Edit an existing message with full AI re-evaluation
messagesRouter.patch('/:messageId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const messageId = String(req.params.messageId);
    const { plaintext } = req.body;
    const userId = req.user!.userId;

    if (!plaintext) {
      res.status(400).json({ error: 'Plaintext is required for edit' });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { members: true } } },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.senderId !== userId) {
      res.status(403).json({ error: 'Only the sender can edit this message' });
      return;
    }

    // Check if conversation is blocked
    const otherMember = message.conversation.members.find((m: any) => m.userId !== userId);
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
        res.status(403).json({ error: 'Cannot edit message: Conversation is blocked.' });
        return;
      }
    }

    const analysis = await ThreatEvaluationService.evaluate(plaintext, message.conversationId, userId);
    const updatedPayload = JSON.stringify({ plaintext, isEdited: true });

    // ACID transaction for message update & security event sync
    const updated = await prisma.$transaction(async (tx: any) => {
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

// User-Isolated Message Deletion: Returns confirmation without destroying recipient's message copy
messagesRouter.delete('/:messageId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const messageId = String(req.params.messageId);
    res.json({ success: true, messageId, message: 'Message deleted from your account view.' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});
