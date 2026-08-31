# SECURECHAT — PROJECT MEMORY

Version: 1.4
Status: CHECKPOINT 1 — FULL WORKING PLATFORM, DATASETS, TRAINED ML MODELS & VERIFICATION COMPLETE
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
- **Milestone Scope:** M0 (Architecture), M1 (Monorepo Scaffolding & Shared Types), M2 (Authentication & Device Key Registration), M3 (Core Messaging & WebSocket Relay), M4 (Signal-compatible Double Ratchet E2EE & X3DH), M5 (Level 0 DLP Scanner, Homoglyph URL Analyzer & Multilingual Urgency Engine), M6 (Personal AI Microservice, Datasets, Trained ML Models & Copilot), M7 (SecureBridge Notification Companion), M10 (Web Client, SecOps Center & Production Bundles).

- **Structured Dataset Files Location (`apps/ai-service/data/`):**
  1. [`phishing_urls_dataset.csv`](file:///c:/Users/triad/OneDrive/Desktop/Bano%20Qabil/apps/ai-service/data/phishing_urls_dataset.csv): 40 structured URL samples (20 legitimate Tranco/Alexa verified sites + 20 phishing lookalikes/crypto drainers).
  2. [`social_engineering_dataset.json`](file:///c:/Users/triad/OneDrive/Desktop/Bano%20Qabil/apps/ai-service/data/social_engineering_dataset.json): 24 multi-label text samples in English, Urdu script, and Roman Urdu.
  3. [`dlp_secrets_dataset.json`](file:///c:/Users/triad/OneDrive/Desktop/Bano%20Qabil/apps/ai-service/data/dlp_secrets_dataset.json): Sensitive credential and token test vectors (AWS keys, GitHub tokens, JWTs, OTPs, credit cards).

- **Trained Machine Learning Models (`apps/ai-service/models_store/`):**
  - `phishing_model.joblib`: RandomForestClassifier with TF-IDF char n-grams + lexical feature union.
  - `social_engineering_model.joblib`: MultiOutput LogisticRegression classifier for Urgency, Fear, Authority, Secrecy, and Credential Solicitation.

- **Verification Status:** 100% Passed (13/13 tests across Python AI, Cryptographic Ratchet, Deterministic Security, and Vite web build).
- **Environment Status:** All dependencies installed via npm (`241 audited packages`) and pip (`requirements.txt`).
- **Database Status:** SQLite database `dev.db` pushed, Prisma client v6.19.3 generated, and baseline seed data loaded.

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
├── .env                                        # [ENV] Development environment variables
│
├── apps/
│   ├── ai-service/                             # [AI] Python FastAPI AI Security Microservice
│   │   ├── data/                               # [DATASETS] Structured Training and Evaluation Datasets
│   │   │   ├── phishing_urls_dataset.csv       # (40 URLs: PhishTank, URLhaus, Tranco)
│   │   │   ├── social_engineering_dataset.json # (24 Multilingual samples: EN, UR, Roman UR)
│   │   │   └── dlp_secrets_dataset.json        # (Secret patterns, tokens, and test vectors)
│   │   ├── models_store/                       # [TRAINED WEIGHTS] Serialized .joblib model artifacts
│   │   │   ├── phishing_model.joblib           # (RandomForest + TF-IDF Lexical Pipeline)
│   │   │   └── social_engineering_model.joblib # (Multi-label TF-IDF Logistic Regression)
│   │   ├── train_models.py                     # Training script loading datasets & generating models
│   │   ├── test_ai_service.py                  # Automated AI unit & integration test suite
│   │   └── src/                                # FastAPI application source code
```
