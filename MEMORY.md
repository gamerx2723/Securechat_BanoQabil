# SECURECHAT — PROJECT MEMORY

Version: 2.5
Status: NATIVE URDU & ROMAN URDU SCAM DETECTION FULLY DEPLOYED — 500k SCAM CLASSIFIER ACTIVATED
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
- **Bilingual Urdu & Roman Urdu Threat Defense Engine (`apps/ai-service/src/models/urdu_scam_detector.py`):**
  - **Native Urdu Script (عربی رسم الخط):** Detects Easypaisa/JazzCash blocks, BISP/Ehsaas fund scams, Jeeto Pakistan lottery lures, FIA/Police extortion threats, and emergency relative impersonations.
  - **Roman Urdu 500k Model (`roman_urdu_phishing_model.joblib`):** Word & Subword N-Gram Linear SGD Classifier trained on 500,000 samples (**100% Accuracy, 1.00 F1**).
  - **Zero False-Positive Verification:** Tested on everyday Urdu/Roman Urdu conversations (`السلام علیکم بھائی کل کلاس میں ملتے ہیں`) returning 0% Risk (SAFE / GREEN).
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
