import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';

export const devicesRouter = Router();

devicesRouter.use(authMiddleware);

devicesRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.user!.userId },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        deviceType: true,
        publicKey: true,
        isRevoked: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    res.json(devices);
  } catch {
    res.status(500).json({ error: 'Failed to list devices' });
  }
});

devicesRouter.post('/:deviceId/revoke', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const deviceId = String(req.params.deviceId);
    const device = await prisma.device.findFirst({
      where: {
        deviceId,
        userId: req.user!.userId,
      },
    });

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    await prisma.device.update({
      where: { id: device.id },
      data: { isRevoked: true },
    });

    // Revoke all active sessions for this device
    await prisma.session.updateMany({
      where: { deviceId: device.id },
      data: { revokedAt: new Date() },
    });

    res.json({ message: 'Device revoked successfully', deviceId });
  } catch {
    res.status(500).json({ error: 'Failed to revoke device' });
  }
});
