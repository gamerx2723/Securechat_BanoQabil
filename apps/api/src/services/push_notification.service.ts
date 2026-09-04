import { prisma } from '@securechat/database';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  isThreat?: boolean;
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
   */
  public static async sendPushToToken(fcmToken: string, payload: PushPayload): Promise<boolean> {
    const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;

    if (!fcmServerKey) {
      // Diagnostic log when Firebase server key has not yet been placed in environment
      console.debug(
        `[PushService] FCM_SERVER_KEY not configured. Push skipped for token ${fcmToken.slice(0, 10)}... (Add FCM_SERVER_KEY or google-services.json to activate background delivery)`
      );
      return false;
    }

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
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
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

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`FCM push delivery returned status ${response.status}:`, errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending FCM push request:', error);
      return false;
    }
  }
}
