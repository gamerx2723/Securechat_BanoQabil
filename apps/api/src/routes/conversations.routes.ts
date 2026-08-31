import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { createConversationSchema } from '@securechat/validation';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';

export const conversationsRouter = Router();

conversationsRouter.use(authMiddleware);

conversationsRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId },
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
                status: true,
              },
            },
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
        },
        aiContexts: {
          where: { userId },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = conversations.map(c => {
      const selfMember = c.members.find(m => m.userId === userId);
      const aiContext = c.aiContexts[0];

      return {
        id: c.id,
        type: c.type,
        title: c.title,
        avatarUrl: c.avatarUrl,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        isExcludedFromAi: c.isExcludedFromAi || selfMember?.isExcluded || false,
        lastMessage: c.messages[0] || null,
        securitySummary: aiContext ? {
          riskScore: aiContext.currentRiskScore,
          securityState: aiContext.currentSecurityState,
          summary: aiContext.summary,
        } : null,
        members: c.members.map(m => ({
          userId: m.userId,
          role: m.role,
          username: m.user.username,
          displayName: m.user.displayName,
          avatarUrl: m.user.avatarUrl,
        })),
      };
    });

    res.json(result);
  } catch (error) {
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

    // If Direct chat, check if conversation between these 2 users already exists
    if (type === 'DIRECT' && allUserIds.length === 2) {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { members: { some: { userId: allUserIds[0] } } },
            { members: { some: { userId: allUserIds[1] } } },
          ],
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
        aiContexts: {
          create: allUserIds.map(uid => ({
            userId: uid,
            summary: 'Initial secure conversation channel created.',
            currentRiskScore: 0,
            currentSecurityState: 'GREEN',
            observations: JSON.stringify(['Channel initialized with zero trust baseline']),
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
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
