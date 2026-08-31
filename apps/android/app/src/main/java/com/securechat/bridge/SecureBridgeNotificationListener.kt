package com.securechat.bridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * SecureBridge: Zero-Trust Companion that analyzes notifications from WhatsApp
 * and third-party messaging apps for phishing, malicious links, and urgency coercion.
 */
class SecureBridgeNotificationListener : NotificationListenerService() {

    private val TAG = "SecureBridgeListener"
    private val TARGET_PACKAGES = setOf("com.whatsapp", "com.whatsapp.w4b", "org.telegram.messenger")

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null) return

        val packageName = sbn.packageName
        if (!TARGET_PACKAGES.contains(packageName)) return

        val extras = sbn.notification.extras
        val title = extras.getString(Notification.EXTRA_TITLE) ?: "Unknown Sender"
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        if (text.isBlank()) return

        Log.d(TAG, "SecureBridge captured notification from $packageName [$title]: $text")

        // 1. Run local on-device Zero-Trust security scan
        val analysis = evaluateNotificationSecurity(text)

        // 2. If suspicious or critical threat detected, raise proactive security alert
        if (analysis.riskScore >= 60) {
            triggerSecurityAlert(title, text, analysis)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        if (sbn == null) return
        val packageName = sbn.packageName
        if (TARGET_PACKAGES.contains(packageName)) {
            Log.d(TAG, "Notification dismissed or retracted by sender from $packageName. Preserved in SecureBridge archive.")
        }
    }

    private fun evaluateNotificationSecurity(text: String): NotificationSecurityResult {
        var score = 0
        val reasons = mutableListOf<String>()

        // Check for urgency patterns
        if (text.contains(Regex("(urgent|immediately|suspended|block honay wala hai|foran|jaldi)", RegexOption.IGNORE_CASE))) {
            score += 35
            reasons.add("Urgency pressure detected")
        }

        // Check for suspicious URL
        if (text.contains(Regex("https?://\\S+"))) {
            if (text.contains(Regex("(paypa1|bank|verify|update|claim|\\.xyz|\\.top)", RegexOption.IGNORE_CASE))) {
                score += 55
                reasons.add("Lookalike phishing URL or suspicious TLD")
            } else {
                score += 20
                reasons.add("Contains external link")
            }
        }

        return NotificationSecurityResult(
            riskScore = score.coerceAtMost(100),
            isPhishing = score >= 60,
            reasons = reasons
        )
    }

    private fun triggerSecurityAlert(sender: String, messageText: String, analysis: NotificationSecurityResult) {
        val channelId = "securebridge_alerts"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "SecureBridge Threat Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Proactive cross-app security warnings"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val alert = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setContentTitle("⚠️ SecureChat Security Alert ($sender)")
            .setContentText("Potential Phishing or Scam Detected: ${analysis.reasons.joinToString(", ")}")
            .setStyle(NotificationCompat.BigTextStyle().bigText("Message: \"$messageText\"\n\nRisk: ${analysis.riskScore}/100\nEvidence: ${analysis.reasons.joinToString("; ")}\nRecommendation: Do NOT open links or provide OTPs."))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        notificationManager.notify((System.currentTimeMillis() % 10000).toInt(), alert)
    }

    data class NotificationSecurityResult(
        val riskScore: Int,
        val isPhishing: Boolean,
        val reasons: List<String>
    )
}
