import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { UserRole } from '@securechat/types';
import * as crypto from 'node:crypto';

export interface JwtPayload {
  userId: string;
  deviceId: string;
  role: UserRole;
  username: string;
}

export class JwtService {
  public static signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
  }

  public static signRefreshToken(payload: { userId: string; deviceId: string }): string {
    return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
  }

  public static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  }

  public static verifyRefreshToken(token: string): { userId: string; deviceId: string } {
    return jwt.verify(token, config.jwtRefreshSecret) as { userId: string; deviceId: string };
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = JwtService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired access token' });
  }
}

export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || (req.user.role !== role && req.user.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
}
