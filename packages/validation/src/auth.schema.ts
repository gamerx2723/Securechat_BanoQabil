import { z } from 'zod';

export const registerSchema = z.object({
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().optional(),
  deviceId: z.string().min(10),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB', 'DESKTOP']),
  deviceName: z.string().min(1).max(50),
  identityKeyPublic: z.string().min(10),
  signedPreKeyPublic: z.string().min(10),
  signedPreKeySignature: z.string().min(10),
  oneTimePreKeys: z.array(
    z.object({
      keyId: z.number().int().nonnegative(),
      publicKey: z.string().min(10),
    })
  ).min(5, 'Must provide at least 5 one-time prekeys'),
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
  deviceId: z.string().min(10),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB', 'DESKTOP']),
  deviceName: z.string().min(1).max(50),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
  deviceId: z.string().min(10),
});
