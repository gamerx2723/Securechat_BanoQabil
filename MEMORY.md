# SECURECHAT — PROJECT MEMORY

Version: 1.6
Status: CHECKPOINT 1 — SUPERADMIN MANAGEMENT PORTAL, ROLE-BASED VIEWPOINTS, DATABASE GOVERNANCE & REALTIME SYSTEM READY
Last Updated: 2026-08-31
Authoritative State Record: YES

---

## 1. PROJECT IDENTITY

- **Name:** SecureChat
- **Type:** AI-Powered Zero-Trust Secure Messaging Platform & Cross-App Security Companion (SecureBridge)
- **Platforms:** Android (Native Kotlin / Jetpack Compose), Web / SuperAdmin Portal (React 19 + TypeScript + Vite), API Server (Express + TypeScript + WebSocket Gateway), AI Microservice (Python FastAPI + Scikit-Learn).

---

## 2. CHECKPOINTS & CURRENT STATE

### 🚩 CHECKPOINT 1 (Updated: 2026-08-31)
- **SuperAdmin Role & Database Governance:**
  - **Master Admin Account:** Pre-seeded admin account (`username: 'admin'`, `role: 'ADMIN'`).
  - **Admin REST API (`apps/api/src/routes/admin.routes.ts`):**
    - `GET /api/v1/admin/users`: List all registered accounts with device keys, status, and message activity.
    - `POST /api/v1/admin/users`: Create and provision accounts directly with custom roles (`USER` or `ADMIN`).
    - `PATCH /api/v1/admin/users/:id/role`: Change user roles dynamically.
    - `PATCH /api/v1/admin/users/:id/status`: Suspend, ban, or activate user accounts and revoke sessions.
    - `DELETE /api/v1/admin/users/:id`: Permanently delete accounts and their cryptographic identity keys.
    - `GET /api/v1/admin/conversations`: View all active database channels and participant rosters.
    - `DELETE /api/v1/admin/conversations/:id`: Terminate and remove conversation channels.
    - `GET /api/v1/admin/telemetry`: Real-time system health, database counts, and threat classification logs.
  - **Frontend Admin Viewpoint (`apps/web/src/components/AdminConsole.tsx`):**
    - Distinct **Admin Portal** navigation tab with crown badge visible only to users with `role === 'ADMIN'`.
    - Interactive user CRUD table with instant role switching, account suspension, and creation modals.
    - Database channel monitor & live threat audit log feed.
  - **Common User Viewpoint:**
    - Standard end-to-end encrypted messaging, interactive Guardian AI panel, SecOps dashboard, and privacy controls without administrative database access.

- **Git Version Control:**
  - Initialized repository with initial and superadmin commits (`commit: 3d3082b`).
