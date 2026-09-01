import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';
import { z } from 'zod';

export const conversationsRouter = Router();

// Mandatory authentication middleware
conversationsRouter.use(authMiddleware);

const createConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']),
  title: z.string().optional(),
  participantUserIds: z.array(z.string()).min(1),
});

conversationsRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            sentAt: 'desc',
          },
          include: {
            securityEvents: {
              select: {
                riskScore: true,
                indicatorColor: true,
              },
            },
          },
        },
        aiContexts: {
          where: {
            userId,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Auto-mark incoming unread messages as DELIVERED and compute unread count per conversation
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversation: {
          members: {
            some: { userId },
          },
        },
        senderId: { not: userId },
        status: { in: ['SENT', 'DELIVERED'] },
      },
      select: {
        id: true,
        conversationId: true,
        status: true,
      },
    });

    // Mark SENT messages to DELIVERED
    const sentToDeliver = unreadMessages.filter((m: any) => m.status === 'SENT').map((m: any) => m.id);
    if (sentToDeliver.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: sentToDeliver } },
        data: { status: 'DELIVERED' },
      });
    }

    // Map unread counts per conversation
    const unreadMap = new Map<string, number>();
    for (const m of unreadMessages) {
      unreadMap.set(m.conversationId, (unreadMap.get(m.conversationId) || 0) + 1);
    }

    // Fetch contacts where either this user blocked the contact or contact blocked this user
    const blockedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { ownerUserId: userId, isBlocked: true },
          { contactUserId: userId, isBlocked: true },
        ],
      },
    });
    const blockedUserIds = new Set(
      blockedContacts.map((c: any) => (c.ownerUserId === userId ? c.contactUserId : c.ownerUserId))
    );

    const result = conversations.map((c: any) => {
      const selfMember = c.members.find((m: any) => m.userId === userId);
      const otherMember = c.members.find((m: any) => m.userId !== userId);
      const isBlocked = otherMember ? blockedUserIds.has(otherMember.userId) : false;
      const aiContext = c.aiContexts?.[0];

      return {
        id: c.id,
        type: c.type,
        title: c.title,
        avatarUrl: c.avatarUrl,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        unreadCount: unreadMap.get(c.id) || 0,
        isExcludedFromAi: c.isExcludedFromAi || selfMember?.isExcluded || false,
        isBlocked,
        lastMessage: c.messages[0] || null,
        securitySummary: aiContext ? {
          riskScore: aiContext.currentRiskScore,
          securityState: aiContext.currentSecurityState,
          summary: aiContext.summary,
        } : null,
        members: c.members.map((m: any) => ({
          userId: m.userId,
          role: m.role,
          username: m.user?.username || 'user',
          displayName: m.user?.displayName || m.user?.username || 'User',
          avatarUrl: m.user?.avatarUrl,
        })),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

conversationsRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = createConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { type, title, participantUserIds } = parseResult.data;
    const currentUserId = req.user!.userId;

    // Combine current user with requested participants
    const allUserIds = Array.from(new Set([currentUserId, ...participantUserIds]));

    // If Direct chat, check if an existing conversation between these 2 users already exists
    if (type === 'DIRECT' && allUserIds.length === 2) {
      const otherUserId = allUserIds.find(id => id !== currentUserId) || allUserIds[0];
      
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { members: { some: { userId: currentUserId } } },
            { members: { some: { userId: otherUserId } } },
          ],
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          },
        },
      });

      if (existing) {
        res.json(existing);
        return;
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        type,
        title: type === 'GROUP' ? title || 'New Secure Group' : undefined,
        members: {
          create: allUserIds.map(uid => ({
            userId: uid,
            role: uid === currentUserId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(conversation);
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create conversation' });
  }
});

conversationsRouter.patch('/:id/privacy', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { isExcludedFromAi } = req.body;
    const userId = req.user!.userId;

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
      data: {
        isExcluded: isExcludedFromAi,
      },
    });

    res.json({ message: 'Privacy mode updated for conversation', isExcludedFromAi });
  } catch {
    res.status(500).json({ error: 'Failed to update conversation privacy' });
  }
});

// Per-User Isolated Deletion: Deleting a conversation removes only the requesting user's view
conversationsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    // 1. Remove the calling user's membership
    await prisma.conversationMember.deleteMany({
      where: {
        conversationId: id,
        userId,
      },
    });

    // 2. Check if any participants remain
    const remainingMembers = await prisma.conversationMember.count({
      where: { conversationId: id },
    });

    // 3. Only if ALL participants have deleted the conversation, purge database records
    if (remainingMembers === 0) {
      await prisma.$transaction(async (tx: any) => {
        await tx.messageReaction.deleteMany({
          where: { message: { conversationId: id } },
        });
        await tx.securityEvent.deleteMany({
          where: { conversationId: id },
        });
        await tx.message.deleteMany({
          where: { conversationId: id },
        });
        await tx.conversation.deleteMany({
          where: { id },
        });
      });
    }

    res.json({ success: true, message: 'Conversation deleted from your account.' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ACID Block User (Keeps message history intact)
conversationsRouter.post('/:id/block', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const otherMember = conv.members.find((m: any) => m.userId !== userId);
    if (!otherMember) {
      res.status(400).json({ error: 'Cannot block in channel without participants' });
      return;
    }

    // ACID transaction: block contact, update member status, preserve all message history
    await prisma.$transaction(async (tx: any) => {
      await tx.contact.upsert({
        where: {
          ownerUserId_contactUserId: {
            ownerUserId: userId,
            contactUserId: otherMember.userId,
          },
        },
        create: {
          ownerUserId: userId,
          contactUserId: otherMember.userId,
          isBlocked: true,
          trustState: 'BLOCKED',
        },
        update: {
          isBlocked: true,
          trustState: 'BLOCKED',
        },
      });

      await tx.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: otherMember.userId,
          },
        },
        data: {
          isExcluded: true,
        },
      });
    });

    res.json({ success: true, isBlocked: true, message: 'User blocked. Message history preserved intact.' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// ACID Unblock User (Restores messaging while preserving history)
conversationsRouter.post('/:id/unblock', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.userId;

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!conv) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const otherMember = conv.members.find((m: any) => m.userId !== userId);
    if (!otherMember) {
      res.status(400).json({ error: 'Cannot unblock in channel without participants' });
      return;
    }

    // ACID transaction: unblock contact, restore status, preserve all message history
    await prisma.$transaction(async (tx: any) => {
      await tx.contact.upsert({
        where: {
          ownerUserId_contactUserId: {
            ownerUserId: userId,
            contactUserId: otherMember.userId,
          },
        },
        create: {
          ownerUserId: userId,
          contactUserId: otherMember.userId,
          isBlocked: false,
          trustState: 'VERIFIED',
        },
        update: {
          isBlocked: false,
          trustState: 'VERIFIED',
        },
      });

      await tx.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId: id,
            userId: otherMember.userId,
          },
        },
        data: {
          isExcluded: false,
        },
      });
    });

    res.json({ success: true, isBlocked: false, message: 'User unblocked. Messaging restored.' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});
