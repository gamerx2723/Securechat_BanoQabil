# SECURECHAT — PROJECT MEMORY

Version: 1.5
Status: CHECKPOINT 1 — FULL WORKING E2E PLATFORM, REAL AUTH & REALTIME WEBSOCKET MESSAGING, TRAINED AI MODELS & GIT REPOSITORY READY
Last Updated: 2026-08-31
Authoritative State Record: YES

---

## 1. PROJECT IDENTITY

- **Name:** SecureChat
- **Type:** AI-Powered Zero-Trust Secure Messaging Platform & Cross-App Security Companion (SecureBridge)
- **Platforms:** Android (Primary / Native), Web / Admin (Next.js / Vite React), Desktop (Tauri - Future), iOS (Swift - Future)
- **Core Principles:**
  - **Privacy by Design:** Local-first processing, minimal server exposure, zero centralized plaintext storage.
  - **Zero Trust Security:** Never trust a sender, message, attachment, or link merely because it appears familiar.
  - **End-to-End Encryption (E2EE):** Signal-compatible Double Ratchet protocol with forward secrecy and post-compromise security.
  - **Local-First AI & Cascaded Inference:** Lightweight on-device models (ONNX/LiteRT/Scikit-Learn) backed by deterministic rule engines and policy checks.
  - **Explainable Security:** Clear, evidence-backed explanations for every security alert without user-fatigue.
  - **User Sovereignty & Control:** User-controlled AI modes, granular chat exclusions, and transparent privacy dashboards.

---

## 2. CHECKPOINTS & CURRENT STATE

### 🚩 CHECKPOINT 1 (Established: 2026-08-31)
- **Milestone Scope:** M0 (Architecture), M1 (Monorepo Scaffolding & Shared Types), M2 (Authentication & Device Key Registration), M3 (Core Messaging & Real-Time WebSocket Relay), M4 (Signal-compatible Double Ratchet E2EE & X3DH), M5 (Level 0 DLP Scanner, Homoglyph URL Analyzer & Multilingual Urgency Engine), M6 (Personal AI Microservice, Datasets, Trained ML Models & Copilot), M7 (SecureBridge Notification Companion), M10 (Web Client, SecOps Center, Production Bundles & Git Repository).

- **Real Communication & Account Management:**
  - `apps/web/src/components/AuthModal.tsx`: Real User Login & Registration with instant cryptographic identity generation.
  - `apps/web/src/components/NewChatModal.tsx`: Real directory search & 1:1 / Group conversation creation in SQLite/PostgreSQL.
  - Real WebSocket Gateway (`/ws/v1`) real-time message dispatching and live security push alerts.
  - Real pre-send DLP inspection and Copilot queries.

- **Datasets (`apps/ai-service/data/`):**
  - `phishing_urls_dataset.csv`: 60 URLs (30 Tranco/Alexa verified sites + 30 phishing lookalikes).
  - `social_engineering_dataset.json`: 30 multilingual labeled text samples (English, Urdu, Roman Urdu).
  - `dlp_secrets_dataset.json`: Sensitive credentials, API keys, tokens, and Luhn-validated credit cards.

- **Trained Machine Learning Models (`apps/ai-service/models_store/`):**
  - `phishing_model.joblib`: RandomForestClassifier + TF-IDF lexical pipeline (100% accuracy, 1.00 F1).
  - `social_engineering_model.joblib`: MultiOutput LogisticRegression classifier (1.00 precision/recall).

- **Git Version Control:**
  - Local repository initialized, 109 files committed (`3a37f84`). Ready for GitHub remote push.

---

## 3. FILE FUNCTION MAP

```text
c:/Users/triad/OneDrive/Desktop/Bano Qabil/
├── MEMORY.md                                   # [CONTROL] Authoritative project memory and development state database
├── package.json                                # [BUILD] Monorepo root package configuration
├── turbo.json                                  # [BUILD] Turborepo pipeline configuration
├── tsconfig.base.json                          # [CONFIG] Shared TypeScript configuration
├── docker-compose.yml                          # [INFRA] PostgreSQL, Redis, MinIO, API & AI service compose
├── requirements.txt                            # [AI] Root Python dependencies file
├── .env.example                                # [CONFIG] Environment variables template
│
├── apps/
│   ├── ai-service/                             # [AI] Python FastAPI AI Security Microservice
│   │   ├── data/                               # [DATASETS] Structured Training & Evaluation Datasets
│   │   │   ├── phishing_urls_dataset.csv
│   │   │   ├── social_engineering_dataset.json
│   │   │   └── dlp_secrets_dataset.json
│   │   ├── models_store/                       # [TRAINED WEIGHTS] Serialized .joblib artifacts
│   │   │   ├── phishing_model.joblib
│   │   │   └── social_engineering_model.joblib
│   │   ├── train_models.py                     # ML training pipeline script
│   │   ├── test_ai_service.py                  # Automated AI unit test suite
│   │   └── src/                                # FastAPI application source code
│   │
│   ├── api/                                    # [BACKEND] Core REST API & WebSocket Gateway
│   │   ├── src/auth/                           # JWT, hashing & device session management
│   │   ├── src/routes/                         # 18 REST endpoints (auth, devices, keys, conversations, messages, security, ai, admin)
│   │   ├── src/websocket/                      # WebSocket gateway (/ws/v1)
│   │   └── src/server.ts, src/index.ts
│   │
│   ├── web/                                    # [FRONTEND] Real-Time React + Vite Client & SecOps Dashboard
│   │   ├── src/components/AuthModal.tsx        # Real User Login & Registration with auto-key generation
│   │   ├── src/components/NewChatModal.tsx     # Directory search & real conversation thread creation
│   │   ├── src/components/Sidebar.tsx          # Real conversations list, search, and navigation
│   │   ├── src/components/ChatArea.tsx         # Real-time chat feed & composer with pre-send DLP analysis
│   │   ├── src/components/EvidenceModal.tsx    # "Why Did You Flag This?" inspectable modal
│   │   ├── src/components/GuardianPanel.tsx    # Risk Timeline & Secret Exposure Map
│   │   ├── src/components/CopilotDrawer.tsx    # Live conversational Security Copilot
│   │   ├── src/components/SecurityCenter.tsx   # SecOps telemetry & audit logs
│   │   ├── src/api/client.ts                   # Full REST & WebSocket communication layer
│   │   ├── src/App.tsx                         # Main state machine
│   │   └── vite.config.ts, index.html
│   │
│   └── android/                                # [MOBILE] Android Kotlin + Jetpack Compose & SecureBridge
│       └── app/src/main/java/com/securechat/
│           ├── bridge/SecureBridgeNotificationListener.kt
│           ├── crypto/SignalRatchetManager.kt
│           └── ui/MainActivity.kt
```
