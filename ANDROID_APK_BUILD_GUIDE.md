# 📱 SecureChat Zero-Trust Android APK Build Guide (Offline-First Architecture)

This guide explains how the **SecureChat Zero-Trust E2EE Messenger** is packaged as a standalone Android `.apk` application with **100% Offline-First Resilience**, local message caching, and on-device AI heuristic engines.

---

## 🚀 How Offline Resilience & Local Storage Works

The Android APK is built to open and function smoothly **even without an active internet connection / in Airplane Mode**:

1. **Local Asset & UI Component Bundling**:
   - All React UI components, CSS styles, Lucide icons, fonts, and assets are bundled directly inside the APK package (`android/app/src/main/assets/public/`).
   - The app does not load from an external web server; it boots locally from internal APK storage in **0 milliseconds**.

2. **Persistent Message & Conversation History**:
   - Every conversation and message thread is cached locally in device storage (`localStorage`).
   - When the APK opens without internet, previous messages, contacts, avatars, and timestamps load instantly from cache.
   - An amber **Offline Mode** indicator badge appears at the top of the viewport.

3. **On-Device Zero-Trust AI Security Models**:
   - The client-side threat detection engine (`clientSideEvaluate`) runs **100% offline** on the device.
   - It performs real-time regex/entropy/linguistic scanning for **Phishing**, **Social Engineering**, **Coercive Sextortion**, **Urgency Pressure**, and **PII/Credential Leaks** without sending data over the network.

---

## 🛠️ Step-by-Step APK Build Instructions

The Android native project is built and maintained directly inside:
📁 **`C:\Users\triad\OneDrive\Desktop\Bano Qabil\apps\android`**

### Option 1: Build via Android Studio (Recommended GUI)

1. Open **Android Studio**.
2. Select **Open Project** and navigate to:
   📁 `c:\Users\triad\OneDrive\Desktop\Bano Qabil\apps\android`
3. Wait for Gradle sync to complete.
4. To build the installable `.apk`:
   - Click menu **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
   - Android Studio will generate the APK at:
     📁 **`apps/android/app/build/outputs/apk/debug/app-debug.apk`**
5. Connect your Android phone with a USB cable (with USB Debugging enabled) and click **Run (▶️)** to install directly.

---

### Option 2: 1-Click Command-Line Build (Gradle CLI)

If you have Java JDK (17+) configured in your environment:

```powershell
# From the apps/android directory:
cd "apps/android"
.\gradlew.bat assembleDebug
```

The output APK will be saved at:
📁 **`apps/android/app/build/outputs/apk/debug/app-debug.apk`**

---

### Option 3: Refreshing Web Assets after Making Changes

Whenever you modify any frontend code and want to sync it into the Android build:

```powershell
# From the project root:
npm run sync:android

# Or from apps/web:
cd "apps/web"
npm run sync:android
```

---

## 🛡️ Android Permissions Configured

In `apps/android/app/src/main/AndroidManifest.xml`:
- `android.permission.INTERNET`: For end-to-end encrypted message sync and WebSockets.
- `android.permission.ACCESS_NETWORK_STATE`: For detecting online/offline network transitions.
- `android.permission.POST_NOTIFICATIONS`: For background alerts and security alarms.
- `android.permission.VIBRATE`: For tactile haptic chime notifications.
