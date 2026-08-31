import { Router, Response } from 'express';
import { prisma } from '@securechat/database';
import { registerSchema, loginSchema, refreshSchema } from '@securechat/validation';
import { JwtService, AuthenticatedRequest, authMiddleware } from '../auth/jwt.service.js';
import * as crypto from 'node:crypto';

export const authRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'securechat_salt_2026').digest('hex');
}

authRouter.post('/register', async (req, res): Promise<void> => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const {
      username,
      email,
      phone,
      password,
      displayName,
      deviceId,
      deviceType,
      deviceName,
      identityKeyPublic,
      signedPreKeyPublic,
      signedPreKeySignature,
      oneTimePreKeys,
    } = parseResult.data;

    const cleanDigits = (phone || '').replace(/[^0-9]/g, '');
    const finalUsername = (username || `user_${cleanDigits || Math.random().toString(36).substring(2, 8)}`).trim().toLowerCase();
    const finalDisplayName = (displayName || `User +${cleanDigits.slice(-4) || 'Member'}`).trim();

    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: finalUsername },
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      res.status(409).json({ error: 'Username, email, or phone number already in use' });
      return;
    }

    // ACID Transaction for User, Devices, Cryptographic Keys, Preferences & Session
    const { user, createdDevice, accessToken, refreshToken } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: finalUsername,
          email,
          phone,
          passwordHash: hashPassword(password),
          displayName: finalDisplayName,
          avatarUrl: (parseResult.data as any).avatarUrl || req.body.avatarUrl || null,
          role: 'USER',
          status: 'ACTIVE',
          userPreference: {
            create: {
              aiMode: 'BALANCED',
              enableDlp: true,
              enablePhishing: true,
              enableSocialEng: true,
            },
          },
          devices: {
            create: {
              deviceId,
              deviceType,
              deviceName,
              publicKey: identityKeyPublic,
              identityKeys: {
                create: {
                  publicKey: identityKeyPublic,
                  signedPreKey: signedPreKeyPublic,
                  signedPreKeyId: 1,
                  signedPreKeySignature,
                },
              },
              preKeys: {
                create: oneTimePreKeys.map(k => ({
                  keyId: k.keyId,
                  publicKey: k.publicKey,
                })),
              },
            },
          },
        },
        include: {
          devices: true,
        },
      });

      const firstDevice = newUser.devices[0];
      const accToken = JwtService.signAccessToken({
        userId: newUser.id,
        deviceId: firstDevice.deviceId,
        role: newUser.role as any,
        username: newUser.username,
      });
      const refToken = JwtService.signRefreshToken({
        userId: newUser.id,
        deviceId: firstDevice.deviceId,
      });

      await tx.session.create({
        data: {
          userId: newUser.id,
          deviceId: firstDevice.id,
          refreshTokenHash: JwtService.hashToken(refToken),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { user: newUser, createdDevice: firstDevice, accessToken: accToken, refreshToken: refToken };
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
      device: {
        id: createdDevice.id,
        deviceId: createdDevice.deviceId,
        deviceName: createdDevice.deviceName,
        deviceType: createdDevice.deviceType,
        publicKey: createdDevice.publicKey,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

authRouter.post('/login', async (req, res): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const { identifier, password, deviceId, deviceType, deviceName } = parseResult.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }, { phone: identifier }],
      },
      include: {
        devices: true,
      },
    });

    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: 'Invalid identifier or password' });
      return;
    }

    // Find or register device
    let device = user.devices.find(d => d.deviceId === deviceId);
    if (!device) {
      const existingDevice = await prisma.device.findUnique({ where: { deviceId } });
      if (existingDevice) {
        if (existingDevice.userId === user.id) {
          device = existingDevice;
          await prisma.device.update({
            where: { id: device.id },
            data: { lastSeenAt: new Date() },
          });
        } else {
          const userDeviceId = `${deviceId}_${user.id.substring(0, 6)}`;
          device = await prisma.device.upsert({
            where: { deviceId: userDeviceId },
            update: { lastSeenAt: new Date() },
            create: {
              userId: user.id,
              deviceId: userDeviceId,
              deviceType,
              deviceName,
              publicKey: 'DEFAULT_PUBKEY_' + userDeviceId,
            },
          });
        }
      } else {
        device = await prisma.device.create({
          data: {
            userId: user.id,
            deviceId,
            deviceType,
            deviceName,
            publicKey: 'DEFAULT_PUBKEY_' + deviceId,
          },
        });
      }
    } else {
      await prisma.device.update({
        where: { id: device.id },
        data: { lastSeenAt: new Date() },
      });
    }

    const accessToken = JwtService.signAccessToken({
      userId: user.id,
      deviceId: device.deviceId,
      role: user.role as any,
      username: user.username,
    });
    const refreshToken = JwtService.signRefreshToken({
      userId: user.id,
      deviceId: device.deviceId,
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        refreshTokenHash: JwtService.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
      },
      device: {
        id: device.id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        publicKey: device.publicKey,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

authRouter.post('/refresh', async (req, res): Promise<void> => {
  try {
    const parseResult = refreshSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid refresh request' });
      return;
    }

    const { refreshToken, deviceId } = parseResult.data;
    const decoded = JwtService.verifyRefreshToken(refreshToken);

    const tokenHash = JwtService.hashToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
        device: true,
      },
    });

    if (!session) {
      res.status(401).json({ error: 'Session expired or invalidated' });
      return;
    }

    // Revoke old session and rotate
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = JwtService.signAccessToken({
      userId: session.user.id,
      deviceId,
      role: session.user.role as any,
      username: session.user.username,
    });
    const newRefreshToken = JwtService.signRefreshToken({
      userId: session.user.id,
      deviceId,
    });

    await prisma.session.create({
      data: {
        userId: session.user.id,
        deviceId: session.device.id,
        refreshTokenHash: JwtService.hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.get('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.userId;
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
      },
      take: 50,
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch directory users' });
  }
});

authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        devices: true,
        userPreference: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      devices: user.devices,
      preferences: user.userPreference,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

authRouter.patch('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { displayName, avatarUrl, status } = req.body;

    // Strict Security Rule: Phone number is a permanent cryptographic account anchor and cannot be modified
    const updated = await prisma.$transaction(async (tx) => {
      return await tx.user.update({
        where: { id: userId },
        data: {
          ...(displayName ? { displayName: displayName.trim() } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() } : {}),
          ...(status ? { status } : {}),
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          phone: true,
          email: true,
          avatarUrl: true,
          role: true,
          status: true,
        },
      });
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});
