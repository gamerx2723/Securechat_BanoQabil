import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { AuthenticatedRequest, authMiddleware, requireRole } from '../auth/jwt.service.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(requireRole('ADMIN'));

adminRouter.get('/telemetry', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalDevices = await prisma.device.count({ where: { isRevoked: false } });
    const totalMessages = await prisma.message.count();
    const totalSecurityEvents = await prisma.securityEvent.count();

    const redEvents = await prisma.securityEvent.count({ where: { indicatorColor: 'RED' } });
    const orangeEvents = await prisma.securityEvent.count({ where: { indicatorColor: 'ORANGE' } });
    const greenEvents = await prisma.securityEvent.count({ where: { indicatorColor: 'GREEN' } });

    const threatCategories = await prisma.securityEvent.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    const recentAudit = await prisma.securityEvent.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        severity: true,
        riskScore: true,
        indicatorColor: true,
        confidence: true,
        source: true,
        createdAt: true,
      },
    });

    res.json({
      systemHealth: 'HEALTHY',
      uptimeSeconds: Math.round(process.uptime()),
      metrics: {
        totalUsers,
        totalDevices,
        totalMessages,
        totalSecurityEvents,
        redEvents,
        orangeEvents,
        greenEvents,
      },
      threatBreakdown: threatCategories.map(t => ({ category: t.type, count: t._count.id })),
      recentEvents: recentAudit,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin telemetry' });
  }
});
