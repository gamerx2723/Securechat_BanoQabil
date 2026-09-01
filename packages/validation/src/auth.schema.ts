import { z } from 'zod';
import {
  normalizePhoneNumber,
  normalizeUsername,
  normalizeEmail,
  normalizeDisplayName,
  sanitizeText,
} from './sanitizer.js';

export const registerSchema = z.object({
  phone: z
    .string()
    .min(7, 'Valid phone number is required')
    .transform((val) => normalizePhoneNumber(val))
    .refine((val) => val.length >= 8 && val.startsWith('+'), {
      message: 'Invalid phone number format. Must contain valid country code or standard domestic number (e.g. 03001234567 or +923001234567)',
    }),
  email: z
    .string()
    .email('Please provide a valid email address')
    .transform((val) => normalizeEmail(val))
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .transform((val) => normalizeUsername(val))
    .optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  displayName: z
    .string()
    .min(1)
    .max(50)
    .transform((val) => normalizeDisplayName(val))
    .optional(),
  avatarUrl: z.string().optional(),
  deviceId: z.string().min(6).transform((val) => sanitizeText(val)),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB', 'DESKTOP']),
  deviceName: z.string().min(1).max(50).transform((val) => sanitizeText(val)),
  identityKeyPublic: z.string().min(10),
  signedPreKeyPublic: z.string().min(10),
  signedPreKeySignature: z.string().min(10),
  oneTimePreKeys: z
    .array(
      z.object({
        keyId: z.number().int().nonnegative(),
        publicKey: z.string().min(10),
      })
    )
    .min(1, 'Must provide at least 1 one-time prekey'),
});

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(2, 'Username or phone number required')
    .transform((val) => sanitizeText(val).trim()),
  password: z.string().min(1, 'Password required'),
  deviceId: z.string().min(6).transform((val) => sanitizeText(val)),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB', 'DESKTOP']),
  deviceName: z.string().min(1).max(50).transform((val) => sanitizeText(val)),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
  deviceId: z.string().min(6).transform((val) => sanitizeText(val)),
});
