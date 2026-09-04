package com.securechat.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "SecureChatMainActivity";
    private String cachedFcmToken = "";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Request POST_NOTIFICATIONS runtime permission on Android 13+ (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // 2. Read any previously cached token from SharedPreferences
        SharedPreferences prefs = getSharedPreferences("securechat_push_prefs", Context.MODE_PRIVATE);
        cachedFcmToken = prefs.getString("fcm_token", "");

        // 3. Fetch latest Firebase FCM Registration Token
        try {
            FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                        return;
                    }
                    cachedFcmToken = task.getResult();
                    Log.d(TAG, "Successfully fetched FCM Token: " + cachedFcmToken);
                    prefs.edit().putString("fcm_token", cachedFcmToken).apply();
                    injectFcmToken();
                });
        } catch (Exception e) {
            Log.e(TAG, "FirebaseMessaging initialization error:", e);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        injectFcmToken();
    }

    @Override
    public void onResume() {
        super.onResume();
        injectFcmToken();
    }

    private void injectFcmToken() {
        if (cachedFcmToken == null || cachedFcmToken.isEmpty() || getBridge() == null || getBridge().getWebView() == null) {
            return;
        }

        runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                webView.addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public String getFcmToken() {
                        return cachedFcmToken;
                    }
                }, "SecureChatNative");

                String script = "try { " +
                        "window.__SECURECHAT_FCM_TOKEN__ = '" + cachedFcmToken + "'; " +
                        "window.dispatchEvent(new CustomEvent('fcm_token_ready', { detail: '" + cachedFcmToken + "' })); " +
                        "console.log('[NativeBridge] FCM Token injected into WebView:', '" + cachedFcmToken.substring(0, Math.min(15, cachedFcmToken.length())) + "...'); " +
                        "} catch(e) { console.error('FCM Token injection error:', e); }";

                webView.evaluateJavascript(script, null);
            } catch (Exception e) {
                Log.e(TAG, "Error injecting FCM token into WebView:", e);
            }
        });
    }
}
