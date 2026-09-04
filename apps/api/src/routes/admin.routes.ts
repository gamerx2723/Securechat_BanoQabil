import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../auth/jwt.service.js';
import * as crypto from 'node:crypto';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(requireRole('ADMIN'));

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'securechat_salt_2026').digest('hex');
}

/**
 * 1. Admin System Telemetry & Metrics
 */
adminRouter.get('/telemetry', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalDevices = await prisma.device.count({ where: { isRevoked: false } });
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.message.count();
    const totalSecurityEvents = await prisma.securityEvent.count();

    const redEvents = await prisma.securityEvent.count({ where: { indicatorColor: 'RED' } });
    const orangeEvents = await prisma.securityEvent.count({ where: { indicatorColor: 'ORANGE' } });
    const greenEvents = await prisma.securityEvent.count({ where: { indicatorColor: 'GREEN' } });

    const threatCategories = await prisma.securityEvent.groupBy({
      by: ['type'],
      _count: { id: true },
    });

    const recentAudit = await prisma.securityEvent.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        severity: true,
        riskScore: true,
        indicatorColor: true,
        confidence: true,
        explanation: true,
        recommendation: true,
        source: true,
        createdAt: true,
      },
    });

    res.json({
      systemHealth: 'HEALTHY',
      uptimeSeconds: Math.round(process.uptime()),
      database: 'Supabase PostgreSQL (Zero-Trust Active)',
      metrics: {
        totalUsers,
        totalDevices,
        totalConversations,
        totalMessages,
        totalSecurityEvents,
        redEvents,
        orangeEvents,
        greenEvents,
      },
      threatBreakdown: threatCategories.map((t) => ({ category: t.type, count: t._count.id })),
      recentEvents: recentAudit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin telemetry' });
  }
});

/**
 * 2. Get All Users (with device count and message stats)
 */
adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        devices: {
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
            deviceType: true,
            isRevoked: true,
            lastSeenAt: true,
          },
        },
        _count: {
          select: {
            sentMessages: true,
            conversationMembers: true,
          },
        },
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

/**
 * 3. Create Account directly by Admin
 */
adminRouter.post('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username, displayName, email, phone, password, role } = req.body;

    if (!username || !password || !displayName) {
      res.status(400).json({ error: 'Username, password, and displayName are required' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
    });

    if (existing) {
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }

    const deviceId = 'DEV_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const identityKeyPublic = 'IK_' + Math.random().toString(36).substring(2, 15);
    const signedPreKeyPublic = 'SPK_' + Math.random().toString(36).substring(2, 15);

    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        email: email || undefined,
        phone: phone || undefined,
        passwordHash: hashPassword(password),
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        status: 'ACTIVE',
        devices: {
          create: {
            deviceId,
            deviceType: 'WEB',
            deviceName: 'Admin Provisioned Device',
            publicKey: identityKeyPublic,
            identityKeys: {
              create: {
                publicKey: identityKeyPublic,
                signedPreKey: signedPreKeyPublic,
                signedPreKeyId: 1,
                signedPreKeySignature: 'SIG_ADMIN_INIT',
              },
            },
          },
        },
        userPreference: {
          create: {
            aiMode: 'BALANCED',
            enableDlp: true,
            enablePhishing: true,
            enableSocialEng: true,
          },
        },
      },
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * 4. Update User Role (USER <-> ADMIN)
 */
adminRouter.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { role } = req.body;

    if (!['USER', 'SECURITY_USER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json({ message: 'User role updated', user: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * 5. Update User Status (ACTIVE, SUSPENDED, BANNED)
 */
adminRouter.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
    });

    // If suspended or banned, revoke active sessions
    if (status !== 'ACTIVE') {
      await prisma.session.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() },
      });
    }

    res.json({ message: 'User status updated', user: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * 6. Delete Account
 */
adminRouter.delete('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    if (id === req.user!.userId) {
      res.status(400).json({ error: 'Admin cannot delete their own active account' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully', id });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * 7. List All Conversations in Database (Metadata only)
 */
adminRouter.get('/conversations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, role: true },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json(conversations);
  } catch {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * 8. Delete Conversation Channel
 */
adminRouter.delete('/conversations/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    await prisma.conversation.delete({
      where: { id },
    });

    res.json({ message: 'Conversation deleted successfully', id });
  } catch {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});
