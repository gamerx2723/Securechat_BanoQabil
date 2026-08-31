# SECURECHAT — PROJECT MEMORY

Version: 3.6
Status: PHONE-ONLY AUTH, IMMUTABLE IDENTITY, ACID BLOCK/UNBLOCK WITH HISTORY PRESERVATION & EDITOR LOCKING ACTIVE
Last Updated: 2026-09-01
Authoritative State Record: YES

---

## 1. PROJECT IDENTITY

- **Name:** SecureChat
- **Type:** AI-Powered Zero-Trust Secure Messaging Platform & Cross-App Security Companion (SecureBridge)
- **Platforms:** Android (Native Kotlin / Jetpack Compose), Web / SuperAdmin Portal (React 18 + TypeScript + Vite + Custom Cyberpunk CSS System), API Server (Express + TypeScript + WebSocket Gateway), AI Microservice (Python FastAPI + Scikit-Learn).

---

## 2. CHECKPOINTS & CURRENT STATE

### 🚩 CHECKPOINT 1 (Updated: 2026-09-01)
- **Phone-Only Registration & Immutable Account Identity (`AuthModal.tsx`, `ProfileModal.tsx`, `auth.routes.ts`):**
  - Registration takes **ONLY** the user's **Phone Number** and **Password**.
  - All E2EE Signal prekeys, identity keys, device bindings, and preferences are automatically generated in a single atomic ACID transaction (`prisma.$transaction`).
  - **Permanent Immutability**: The registered phone number is locked as the primary cryptographic account anchor and cannot be modified at registration or later in profile settings (`PATCH /api/v1/auth/profile`).
- **Strict ACID Block / Unblock Engine with Intact Message History (`conversations.routes.ts`, `ChatArea.tsx`, `App.tsx`):**
  - Blocking a user preserves the entire chat and message history completely intact (no data deletion).
  - The conversation header and 3-dots dropdown menu dynamically toggle between **`Unblock User`** (`UserCheck` icon) and **`Block User`** (`UserX` icon).
  - Unblocking immediately restores full messaging capabilities.
- **Client & Editor Side Locked when Blocked (`ChatArea.tsx`, `MessageItem.tsx`, `messages.routes.ts`):**
  - When blocked, the composer input is disabled with a warning notice (`🚫 User is blocked. Message history is preserved, but sending, editing, and deleting are disabled`).
  - Message editing (pencil) and message deletion (trash) buttons are removed from the client editor on hover.
  - Server-side routes (`POST /messages`, `PATCH /messages/:id`, `DELETE /messages/:id`) enforce `403 Forbidden` checks with strict `prisma.$transaction` rollbacks.
- **Pre-Send Sender Credential & Personal Data (DLP) Interception (`DlpPreSendWarningModal.tsx` & `ChatArea.tsx`):**
  - Scans for Passwords, PINs, Passcodes, CNIC (Pakistani National ID), Bank Accounts / IBAN, Credit/Debit Cards, CVV, OTPs, and Cloud API Keys.
  - Real-time typing warning banner (`Data Loss Prevention Alert`).
  - Send button interception modal offering:
    1. `[ ✂️ Redact Secrets & Send Safely ]` (Auto-masks secrets with `[REDACTED]` before dispatch).
    2. `[ 🚫 Cancel & Edit Draft ]`.
    3. `[ ⚠️ Send Unmasked Anyway ]` (Explicit risk override).
- **Multi-Turn Psychological Grooming & Social Engineering Chain Engine (`ConversationContextEngine`):**
  - Identifies multi-turn staged attacks (Rapport Building -> Grooming Intimacy -> Social Isolation -> Problem/Bait -> Coercive Value/Access Demand).
  - Flags whole-conversation context as `PSYCHOLOGICAL_SCAM` (95% Risk / 🔴 RED), alerting the victim before they fall into the trap.
- **Asymmetric Operational Security (OpSec) Threat Warning Visibility:**
  - **For Sender (`isSelf === true`)**: Only alerted to their OWN sensitive data leaks (DLP secret exposure) to prevent self-harm. Senders are NOT given phishing/social engineering threat feedback or evasion clues.
  - **For Receiver (`isSelf === false`)**: Receives full prominent protection banners (`⚠️ PSYCHOLOGICAL SCAM DETECTED`, `⚠️ DECEPTIVE PHISHING LINK`), risk scores, and evidence inspection.
- **SuperAdmin Threat Moderation & Collaborative Learning Center (`AdminThreatReviewQueue.tsx` & `SecurityCenter.tsx`):**
  - Real-time review queue with crowd consensus metrics (`X users voted Threat`, `Y users voted Safe`).
  - One-click Admin approval (`TRAIN_MALICIOUS` / `TRAIN_BENIGN`) triggering live online incremental SGD training (`partial_fit`) and dynamic vector memory indexing.
- **12-Dimensional Deep Cognitive Intent Recognizer (`DeepCognitiveEngine.py`):**
  - Normalizes leetspeak (`p@ssw0rd` -> `password`), homoglyphs, and zero-width anti-analysis unicode characters.
  - Evaluates 12 psychological and action vectors (Credentials, Funds, Software Execution, Off-Platform Migration, Urgency, Authority Extortion, Penalty Framing, Greed Lure, Crisis Simulation, Verification Bypass, Evasion Obfuscation).
- **Clean Conversational Token Guard & ML Threshold Calibration:**
  - Resolved base prior intercept bias on 2-letter tokens (`hi`, `hey`, `ok`, `salam`) across `SocialEngineeringDetector` and `UrduScamDetector`. Greetings evaluate to **0% Risk (🟢 GREEN / SAFE)**.
- **AI Conversation Topic Explainer & Multi-Turn Security Modal (`ConversationTopicModal.tsx` & `context_engine.py`):**
  - Interactive **`[ ✨ AI Topic & Risk Summary ]`** icon button in the ChatArea header.
  - Generates identified topic title, subject category (`CYBER_THREAT`, `FINANCIAL_FRAUD`, `PRODUCTIVITY`, `SOCIAL`), composite risk score (0-100), key entities (shared links, requested amounts), turn-by-turn risk timeline, and guardian precautions.
- **Fully Interactive AI Copilot Chatbot (`CopilotDrawer.tsx` & `copilot.py`):**
  - Conversational question answering for active chats, phishing links, zero-day threat triangles, Urdu/Roman Urdu scams, DLP secrets, and Double Ratchet/X3DH cryptography.
- **Zero-Day Cognitive Intent & Invariant Reasoning (`ZeroDayCognitiveEngine` & `ZeroDayReasoner`):**
  - Behavioral logic defense for unlisted out-of-database threats.
- **Bilingual Urdu & Roman Urdu Threat Defense Engine (`UrduScamDetector`):**
  - Native Urdu Script & 500,000 Roman Urdu SGD Classifier (**100% Accuracy, 1.00 F1**).
- **549,355 Real Phishing URLs Dataset (`phishing_model.joblib`):**
  - High-capacity Random Forest + 14-Feature Lexical Union (**F1: 0.8842**).
- **549,355 Real Phishing URLs Dataset & 500,000 Roman Urdu Corpus:**
  - `apps/ai-service/data/phishing_site_urls.csv` (31.5 MB, 549k URLs): Real-world phishing kits, deceptive subdomains, hash tokens, brand impersonation paths.
  - `apps/ai-service/data/roman_urdu_500k_dataset.csv` (70.4 MB, 500k samples): Easypaisa, JazzCash, BISP, FIA, lottery scams.

- **Trained & Exported Production Models (`apps/ai-service/models_store/`):**
  - `phishing_model.joblib`: High-capacity Random Forest + 14-Feature Lexical & Structural Union + Char N-Grams trained on 100,000 real-world URLs (**F1: 0.8842**).
  - `roman_urdu_phishing_model.joblib`: High-throughput Word/Subword N-Gram Linear SGD Classifier on 500,000 rows (**100.00% Accuracy | 1.0000 F1**).
  - `social_engineering_model.joblib`: Multi-label classifier on 10,000 rich samples (**1.00 Precision, 1.00 Recall, 1.00 F1**).

- **Hybrid Threat Evaluation Pipeline (`apps/api/src/services/threat_evaluation.service.ts`):**
  - Fuses Python Zero-Trust AI Microservice ML intelligence with local deterministic security rule engine.
  - Detects deep path brand spoofing, hex session hash tokens, suspicious TLDs, dynamic DNS hosts, script execution paths (`.php`, `webscr`, `cgi-bin`), and numerical IP destinations.
  - Pre-send real-time warnings for both DLP secrets and Phishing URLs in `ChatArea.tsx` and high-visibility alert badges in `MessageItem.tsx`.

- **Git Version Control:**
  - Committed to repository (`commit: ecefd40`).
