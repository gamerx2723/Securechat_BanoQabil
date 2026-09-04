import { prisma } from '@securechat/database';
import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  isThreat?: boolean;
}

let firebaseApp: App | null = null;

function initFirebaseAdmin(): boolean {
  if (firebaseApp) return true;
  if (getApps().length > 0) {
    firebaseApp = getApps()[0] as App;
    return true;
  }

  try {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountEnv) {
      const parsed = typeof serviceAccountEnv === 'string' ? JSON.parse(serviceAccountEnv) : serviceAccountEnv;
      firebaseApp = initializeApp({
        credential: cert(parsed),
      });
      console.log('[PushService] Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT JSON.');
      return true;
    } else if (serviceAccountBase64) {
      const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      firebaseApp = initializeApp({
        credential: cert(parsed),
      });
      console.log('[PushService] Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_BASE64.');
      return true;
    } else if (serviceAccountPath) {
      firebaseApp = initializeApp({
        credential: applicationDefault(),
      });
      console.log('[PushService] Firebase Admin SDK initialized from GOOGLE_APPLICATION_CREDENTIALS.');
      return true;
    }
  } catch (error) {
    console.warn('[PushService] Firebase Admin initialization error:', error);
  }

  return false;
}

export class PushNotificationService {
  /**
   * Dispatches push notifications to all active mobile devices registered for a user.
   * Wakes up the device even if the app is killed, swiped away, or in the background.
   */
  public static async sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
    try {
      // Find all non-revoked devices with an active FCM token
      const devices = await prisma.device.findMany({
        where: {
          userId,
          isRevoked: false,
          fcmToken: { not: null },
        },
        select: {
          id: true,
          fcmToken: true,
          deviceName: true,
          deviceType: true,
        },
      });

      if (!devices || devices.length === 0) {
        return;
      }

      for (const device of devices) {
        if (device.fcmToken) {
          await this.sendPushToToken(device.fcmToken, payload);
        }
      }
    } catch (error) {
      console.error(`Failed to send push notification to user ${userId}:`, error);
    }
  }

  /**
   * Sends high-priority push notification payload to a specific FCM token.
   * Supports both modern Firebase Admin SDK (HTTP v1) and legacy server key.
   */
  public static async sendPushToToken(fcmToken: string, payload: PushPayload): Promise<boolean> {
    // 1. Try modern Firebase Admin SDK (HTTP v1) first
    if (initFirebaseAdmin()) {
      try {
        await getMessaging().send({
          token: fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            ...(payload.data || {}),
            title: payload.title,
            body: payload.body,
            isThreat: payload.isThreat ? 'true' : 'false',
            timestamp: Date.now().toString(),
          },
          android: {
            priority: 'high',
            notification: {
              sound: payload.isThreat ? 'threat_warning.wav' : 'default',
              channelId: payload.isThreat ? 'securechat_threat_alerts' : 'securechat_messages',
              priority: 'max',
              visibility: 'public',
            },
          },
        });
        console.log(`[PushService] Push delivered via Firebase Admin SDK to ${fcmToken.slice(0, 10)}...`);
        return true;
      } catch (adminError) {
        console.error('[PushService] Firebase Admin send error:', adminError);
      }
    }

    // 2. Fallback to FCM Legacy Server Key if configured
    const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
    if (fcmServerKey) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            to: fcmToken,
            priority: 'high',
            content_available: true,
            notification: {
              title: payload.title,
              body: payload.body,
              sound: payload.isThreat ? 'threat_warning.wav' : 'default',
              badge: 1,
            },
            data: {
              ...payload.data,
              title: payload.title,
              body: payload.body,
              isThreat: payload.isThreat ? 'true' : 'false',
              timestamp: Date.now().toString(),
            },
          }),
        });

        return response.ok;
      } catch (legacyError) {
        console.error('[PushService] Legacy FCM send error:', legacyError);
      }
    }

    console.debug(
      `[PushService] Push skipped: Add FIREBASE_SERVICE_ACCOUNT JSON to environment variables to enable background push delivery.`
    );
    return false;
  }
}
