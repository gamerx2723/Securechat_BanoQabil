import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';

export const keysRouter = Router();

keysRouter.use(authMiddleware);

/**
 * Fetches pre-key bundle for a target user or device to initiate an E2EE Double Ratchet conversation via X3DH.
 */
keysRouter.get('/bundle/:targetUserId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = String(req.params.targetUserId);

    const device = await prisma.device.findFirst({
      where: {
        userId: targetUserId,
        isRevoked: false,
      },
      include: {
        identityKeys: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        preKeys: {
          where: { isConsumed: false },
          take: 1,
        },
      },
    });

    if (!device || device.identityKeys.length === 0) {
      res.status(404).json({ error: 'No active cryptographic identity found for target user' });
      return;
    }

    const ik = device.identityKeys[0];
    const opk = device.preKeys[0];

    // If one-time prekey was claimed, mark it consumed
    if (opk) {
      await prisma.preKey.update({
        where: { id: opk.id },
        data: { isConsumed: true },
      });
    }

    res.json({
      userId: targetUserId,
      deviceId: device.deviceId,
      identityKey: ik.publicKey,
      signedPreKey: ik.signedPreKey,
      signedPreKeyId: ik.signedPreKeyId,
      signedPreKeySignature: ik.signedPreKeySignature,
      oneTimePreKey: opk ? opk.publicKey : undefined,
      oneTimePreKeyId: opk ? opk.keyId : undefined,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pre-key bundle' });
  }
});

/**
 * Uploads a replenishment batch of One-Time PreKeys.
 */
keysRouter.post('/prekeys', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { deviceId, preKeys } = req.body;

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

    await prisma.preKey.createMany({
      data: preKeys.map((k: { keyId: number; publicKey: string }) => ({
        deviceId: device.id,
        keyId: k.keyId,
        publicKey: k.publicKey,
        isConsumed: false,
      })),
    });

    res.json({ message: 'Prekeys uploaded successfully', count: preKeys.length });
  } catch {
    res.status(500).json({ error: 'Failed to upload prekeys' });
  }
});
