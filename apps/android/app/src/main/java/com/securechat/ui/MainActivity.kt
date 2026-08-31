package com.securechat.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SecureChatTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF080C14)
                ) {
                    SecureChatMainScreen()
                }
            }
        }
    }
}

@Composable
fun SecureChatTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF10B981),
            secondary = Color(0xFF0284C7),
            background = Color(0xFF080C14),
            surface = Color(0xFF0F172A),
        ),
        content = content
    )
}

@Composable
fun SecureChatMainScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "🛡️ SecureChat",
            fontSize = 28.sp,
            color = Color(0xFF10B981)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Zero-Trust AI Secure Messaging & SecureBridge",
            fontSize = 14.sp,
            color = Color(0xFF94A3B8)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Double Ratchet E2EE: ACTIVE",
                    color = Color(0xFF10B981),
                    fontSize = 14.sp
                )
                Text(
                    text = "SecureBridge WhatsApp Companion: ACTIVE",
                    color = Color(0xFF38BDF8),
                    fontSize = 14.sp
                )
                Text(
                    text = "Local Level 0/1 AI Protection: ACTIVE",
                    color = Color(0xFFF8FAFC),
                    fontSize = 14.sp
                )
            }
        }
    }
}
