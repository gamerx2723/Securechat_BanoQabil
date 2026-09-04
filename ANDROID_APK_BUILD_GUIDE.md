# 📱 SecureChat Zero-Trust Android APK Build Guide

This guide explains how to bundle and build the **SecureChat Zero-Trust E2EE Messenger** as a native Android `.apk` application using **Capacitor** and **Android Studio / Gradle**.

---

## 🚀 Prerequisites

1. **Node.js & npm** (v18+)
2. **Android Studio** (Koala, Hedgehog or newer) with:
   - Android SDK (API 34 or 35)
   - Android SDK Command-line Tools
   - Android SDK Build-Tools
3. **Java JDK 17 or 21** installed and configured on your `PATH` / `JAVA_HOME`.

---

## 🛠️ Step-by-Step APK Generation Commands

### 1. Build the Production Web App Assets
From the project root:
```bash
cd "apps/web"
npm run build
```
This produces the optimized production bundle inside `apps/web/dist/`.

---

### 2. Install Capacitor Dependencies (One-Time Setup)
```bash
cd "apps/web"
npm install --save @capacitor/core
npm install --save-dev @capacitor/cli @capacitor/android
```

---

### 3. Initialize & Add the Android Native Platform
```bash
npx cap init "SecureChat Zero-Trust" "com.securechat.app" --web-dir dist
npx cap add android
```
This generates the `android/` native project folder with `MainActivity.java`, `AndroidManifest.xml`, and Gradle build wrappers.

---

### 4. Sync Web Build into Android Assets
Whenever you make frontend changes:
```bash
npm run build
npx cap sync android
```

---

### 5. Build the `.apk` File

#### Option A: 1-Click Command-Line Build (No GUI Required)
```bash
cd android
./gradlew assembleDebug
```
*(On Windows PowerShell: `.\gradlew.bat assembleDebug`)*

Your generated APK will be located at:
📁 **`apps/web/android/app/build/outputs/apk/debug/app-debug.apk`**

You can immediately copy this `.apk` to any Android phone via USB or WhatsApp and install it!

---

#### Option B: Build via Android Studio (GUI / Emulator / USB Debugging)
```bash
npx cap open android
```
- Android Studio will launch the project.
- Click **Run (▶️)** to test on an Android Virtual Device (AVD) or physical device connected via USB.
- To generate a signed release APK for Play Store or distribution:
  - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.

---

## 🛡️ Android Security & Permissions Manifest

Capacitor automatically configures the following secure zero-trust Android permissions in `android/app/src/main/AndroidManifest.xml`:
- `android.permission.INTERNET` (For encrypted WebSocket and API sync)
- `android.permission.ACCESS_NETWORK_STATE`
- `android.permission.POST_NOTIFICATIONS` (For real-time security alerts & background chimes)
- `android.permission.READ_EXTERNAL_STORAGE` / `android.permission.READ_MEDIA_IMAGES` (For encrypted media attachments with forensic watermarking)

---

## ⚡ Production Release Checklist
- Configure your Production API URL in `.env`: `VITE_API_URL=https://your-api.onrender.com/api/v1` and `VITE_WS_URL=wss://your-api.onrender.com`
- Set `android:usesCleartextTraffic="false"` in `AndroidManifest.xml` for production strict TLS enforcement.
