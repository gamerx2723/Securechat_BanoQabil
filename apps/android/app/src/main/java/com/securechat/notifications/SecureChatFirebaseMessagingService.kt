package com.securechat.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.securechat.app.MainActivity
import com.securechat.app.R

/**
 * SecureChat Native Firebase Cloud Messaging Service.
 * Wakes up the device and displays system push notifications when the app is in background or closed.
 */
class SecureChatFirebaseMessagingService : FirebaseMessagingService() {

    private val TAG = "SecureChatFCM"
    private val CHANNEL_ID_MESSAGES = "securechat_messages"
    private val CHANNEL_ID_THREATS = "securechat_threat_alerts"

    override fun onCreate() {
        super.onCreate()
        try {
            createNotificationChannels()
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing notification channels in onCreate", e)
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Registration Token: $token")
        try {
            val prefs = getSharedPreferences("securechat_push_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("fcm_token", token).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Error saving new token to SharedPreferences", e)
        }
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        try {
            Log.d(TAG, "FCM Message received from: ${remoteMessage.from}")

            val data = remoteMessage.data
            val notification = remoteMessage.notification

            val title = notification?.title ?: data["title"] ?: "🔒 SecureChat Message"
            val body = notification?.body ?: data["body"] ?: "New encrypted zero-trust message received."
            val conversationId = data["conversationId"] ?: ""
            val isThreat = data["isThreat"] == "true" || title.contains("THREAT", ignoreCase = true)

            displayNotification(title, body, conversationId, isThreat)
        } catch (e: Throwable) {
            Log.e(TAG, "Unhandled exception in onMessageReceived", e)
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            // 1. Normal Messages Channel
            val msgChannel = NotificationChannel(
                CHANNEL_ID_MESSAGES,
                "Encrypted Messages",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Incoming chat messages"
                enableVibration(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(msgChannel)

            // 2. High-Priority Threat Alerts Channel
            val threatChannel = NotificationChannel(
                CHANNEL_ID_THREATS,
                "Zero-Trust Threat Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority security warnings & threat detection alerts"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 200, 100, 200, 100, 300)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(threatChannel)
        }
    }

    private fun displayNotification(title: String, body: String, conversationId: String, isThreat: Boolean) {
        try {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
            createNotificationChannels()

            val channelId = if (isThreat) CHANNEL_ID_THREATS else CHANNEL_ID_MESSAGES

            // Open MainActivity when notification is tapped
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                if (conversationId.isNotEmpty()) {
                    putExtra("conversationId", conversationId)
                }
            }

            val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val requestCode = (System.currentTimeMillis() % 10000).toInt()
            val pendingIntent = PendingIntent.getActivity(this, requestCode, intent, pendingIntentFlags)
            val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

            // Use valid vector drawables ic_threat_alert or ic_notification (prevents BadNotificationException)
            val iconRes = if (isThreat) R.drawable.ic_threat_alert else R.drawable.ic_notification

            val notificationBuilder = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(iconRes)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)

            if (isThreat) {
                notificationBuilder.setCategory(NotificationCompat.CATEGORY_ALARM)
                notificationBuilder.setVibrate(longArrayOf(0, 250, 150, 250, 150, 350))
            }

            val notificationId = (System.currentTimeMillis() % 100000).toInt()
            notificationManager.notify(notificationId, notificationBuilder.build())
            Log.d(TAG, "Successfully dispatched notification #$notificationId: $title")
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to build or notify system push notification", e)
        }
    }
}
