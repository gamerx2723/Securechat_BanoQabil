import { z } from 'zod';

export const registerSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores only'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  displayName: z.string().min(1).max(50),
  deviceId: z.string().min(10),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB', 'DESKTOP']),
  deviceName: z.string().min(1).max(50),
  identityKeyPublic: z.string().min(20),
  signedPreKeyPublic: z.string().min(20),
  signedPreKeySignature: z.string().min(20),
  oneTimePreKeys: z.array(
    z.object({
      keyId: z.number().int().nonnegative(),
      publicKey: z.string().min(20),
    })
  ).min(5, 'Must provide at least 5 one-time prekeys'),
}).refine(data => data.phone || data.email, {
  message: 'Either email or phone number is required',
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
