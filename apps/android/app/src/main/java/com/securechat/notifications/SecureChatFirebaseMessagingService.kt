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

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "New FCM Registration Token: $token")
        
        // Store in SharedPreferences for seamless token retrieval
        val prefs = getSharedPreferences("securechat_push_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("fcm_token", token).apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "FCM Message received from: ${remoteMessage.from}")

        val data = remoteMessage.data
        val notification = remoteMessage.notification

        val title = notification?.title ?: data["title"] ?: "🔒 SecureChat Message"
        val body = notification?.body ?: data["body"] ?: "New encrypted zero-trust message received."
        val conversationId = data["conversationId"] ?: ""
        val isThreat = data["isThreat"] == "true" || title.contains("THREAT", ignoreCase = true)

        displayNotification(title, body, conversationId, isThreat)
    }

    private fun displayNotification(title: String, body: String, conversationId: String, isThreat: Boolean) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = if (isThreat) CHANNEL_ID_THREATS else CHANNEL_ID_MESSAGES

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = if (isThreat) "Zero-Trust Threat Alerts" else "Encrypted Messages"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(channelId, name, importance).apply {
                description = if (isThreat) "High-priority security warnings" else "Incoming chat messages"
                enableVibration(true)
                if (isThreat) {
                    vibrationPattern = longArrayOf(0, 200, 100, 200, 100, 300)
                }
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Open MainActivity when notification is tapped
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("conversationId", conversationId)
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val pendingIntent = PendingIntent.getActivity(this, (System.currentTimeMillis() % 10000).toInt(), intent, pendingIntentFlags)
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(if (isThreat) android.R.drawable.stat_sys_warning else R.mipmap.ic_launcher)
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

        notificationManager.notify((System.currentTimeMillis() % 100000).toInt(), notificationBuilder.build())
    }
}
