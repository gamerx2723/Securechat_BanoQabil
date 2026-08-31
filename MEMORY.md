# SECURECHAT — PROJECT MEMORY

Version: 2.2
Status: CHECKPOINT 1 — REAL-WORLD INTERNET DATASETS DOWNLOADED, RETRAINED ML MODELS (1,530 SAMPLES + OPENPHISH), PERSISTENT THREAT AI & LIVE CHAT SYNC
Last Updated: 2026-08-31
Authoritative State Record: YES

---

## 1. PROJECT IDENTITY

- **Name:** SecureChat
- **Type:** AI-Powered Zero-Trust Secure Messaging Platform & Cross-App Security Companion (SecureBridge)
- **Platforms:** Android (Native Kotlin / Jetpack Compose), Web / SuperAdmin Portal (React 18 + TypeScript + Vite + Custom Cyberpunk CSS System), API Server (Express + TypeScript + WebSocket Gateway), AI Microservice (Python FastAPI + Scikit-Learn).

---

## 2. CHECKPOINTS & CURRENT STATE

### 🚩 CHECKPOINT 1 (Updated: 2026-08-31)
- **Real-World Internet Datasets (`apps/ai-service/data/`):**
  - `sms_spam_raw.csv`: UCI Machine Learning SMS Scam & Spam dataset (5,574 raw messages).
  - `social_engineering_dataset.json`: 1,530 indexed multilingual scam/phishing/benign messages (English, Urdu, Roman Urdu).
  - `phishing_urls_dataset.csv`: 357 real URLs (OpenPhish live verified feeds + Tranco legitimate baseline).
  - `dlp_secrets_dataset.json`: GitLeaks and TruffleHog secret signatures (AWS keys, GitHub tokens, passwords, OTPs).

- **Retrained & Serialized Production Models (`apps/ai-service/models_store/`):**
  - `phishing_model.joblib`: RandomForestClassifier + TF-IDF char n-grams + Lexical features (**100% Accuracy, 1.00 F1**).
  - `social_engineering_model.joblib`: MultiOutput LogisticRegression classifier (**1.00 Precision, 0.88 weighted F1** across Urgency, Fear, Authority, Secrecy, and Credential Solicitation).

- **Live Chat Sync & Threat Persistence:**
  - Real-time continuous background sync in `apps/web/src/App.tsx` (messages update instantly without manual browser refresh).
  - Messages and their AI security threat events (RED/ORANGE/GREEN with risk scores) are permanently stored in SQLite and retrieved seamlessly on every session login.

- **Git Version Control:**
  - Committed to repository (`commit: 580084c`).
