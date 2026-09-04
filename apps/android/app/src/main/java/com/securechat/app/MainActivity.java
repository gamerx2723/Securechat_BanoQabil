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
    private boolean isInterfaceAttached = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
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
            FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    try {
                        if (!task.isSuccessful()) {
                            Log.w(TAG, "Fetching FCM registration token failed", task.getException());
                            return;
                        }
                        cachedFcmToken = task.getResult();
                        Log.d(TAG, "Successfully fetched FCM Token: " + cachedFcmToken);
                        prefs.edit().putString("fcm_token", cachedFcmToken).apply();
                        injectFcmToken();
                    } catch (Throwable e) {
                        Log.e(TAG, "Error in getToken onCompleteListener", e);
                    }
                });
        } catch (Throwable t) {
            Log.e(TAG, "MainActivity onCreate error:", t);
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
        try {
            if (cachedFcmToken == null || cachedFcmToken.isEmpty()) return;
            if (getBridge() == null || getBridge().getWebView() == null) return;

            runOnUiThread(() -> {
                try {
                    if (getBridge() == null) return;
                    WebView webView = getBridge().getWebView();
                    if (webView == null) return;

                    if (!isInterfaceAttached) {
                        webView.addJavascriptInterface(new Object() {
                            @JavascriptInterface
                            public String getFcmToken() {
                                return cachedFcmToken;
                            }
                        }, "SecureChatNative");
                        isInterfaceAttached = true;
                    }

                    String script = "try { " +
                            "window.__SECURECHAT_FCM_TOKEN__ = '" + cachedFcmToken + "'; " +
                            "window.dispatchEvent(new CustomEvent('fcm_token_ready', { detail: '" + cachedFcmToken + "' })); " +
                            "console.log('[NativeBridge] FCM Token ready:', '" + cachedFcmToken.substring(0, Math.min(15, cachedFcmToken.length())) + "...'); " +
                            "} catch(e) { console.error('FCM Token injection error:', e); }";

                    webView.evaluateJavascript(script, null);
                } catch (Throwable e) {
                    Log.e(TAG, "Error evaluating FCM token script in WebView:", e);
                }
            });
        } catch (Throwable t) {
            Log.e(TAG, "Error in injectFcmToken:", t);
        }
    }
}
