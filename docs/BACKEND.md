# Made in Heaven — Backend Architecture & API Reference

Made in Heaven is an event and wedding planning web application designed for Indian families, driven by **Maya** (an empathetic AI celebration manager).

---

## 1. Architecture Overview

```
Browser Client (React / Next.js)
  │
  ├─ Cookie: mih_session (HMAC signed session cookie, 7 days)
  └─ Firebase Auth (Client-side Google popup/redirect for identity)
         │
         ▼
Next.js App Router (Server-Side Route Handlers)
  │
  ├── checkOrigin(request) ─> [CSRF protection on all POST, PATCH, DELETE]
  ├── getSession(request) ──> [Session Validation & Caller Context]
  ├── Rate Limiter ─────────> [In-memory sliding window for Guest & Home creation]
  ├── Zod Schemas ──────────> [Request validation & size limits]
  ├── Tally Engine ─────────> [src/lib/decisions/tally.ts (Pure deterministic code)]
  │
  ▼
Storage Layer (IWeddingStorage interface)
  ├── 'local': LocalWeddingStorage (Disk state with in-memory fallback for read-only Vercel)
  └── 'firestore': FirestoreWeddingStorage (Server-only driver via firebase-admin)
```

### Important Runtime Notes
- **Authentication**: Users authenticate either via **Google Sign-In** (Firebase Client Auth) or **Continue as Guest**. Google users exchange their Firebase ID token via `POST /api/auth/session` (verified using `firebase-admin`). Guest users are assigned a secure random UUID via `POST /api/auth/guest`. Both receive a 7-day signed `httpOnly`, `sameSite=lax`, `secure` session cookie (`mih_session`).
- **CSRF & Origin Check**: Every mutating API route (`POST`, `PATCH`, `DELETE`) enforces origin validation checking that the incoming `Origin` (or `Referer`) matches `localhost`, `127.0.0.1`, or `https://made-in-heaven-uorx.vercel.app` (and Vercel preview environments).
- **In-Memory Rate Limiting**: The rate limiter (`src/lib/security/rateLimit.ts`) operates per server instance on serverless platforms like Vercel. Each cold start or independent serverless instance maintains its own in-memory sliding window (e.g. 5 guest sessions per 10 minutes per IP; 5 homes per hour per IP).
- **Budget Data Redaction**: Members without `canSeeBudget: true` (e.g. Advisors, Viewers) never receive budget figures. Budget data is stripped server-side across all endpoints and omitted from prompt context before any AI operations.
- **Vote Tallying Principle**: Maya (the LLM) **never** counts votes or alters permissions. All tallying is performed deterministically by `src/lib/decisions/tally.ts`.

---

## 2. API Route Reference

All routes return consistent JSON envelopes:
- Success: `{ success: true, ...data }`
- Error: `{ success: false, error: string }`

### Authentication & Session

| Endpoint | Method | Caller | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/session` | `POST` | Google signed-in client | Verifies Firebase ID token with `firebase-admin`, creates/updates user doc, sets `mih_session` cookie | `{ idToken: string }` | `{ success: true, user }` |
| `/api/auth/guest` | `POST` | Anyone | Rate-limited guest user creation with random UID and custom display name, sets `mih_session` cookie | `{ displayName?: string }` | `{ success: true, user }` |
| `/api/auth/logout` | `POST` | Any active user | Clears `mih_session` cookie | None | `{ success: true }` |
| `/api/me` | `GET` | Authenticated member | Returns current member profile, home details, and user celebrations | None | `{ success: true, member, homeId, homes, canSeeBudget, permission }` |

### Homes & Invites

| Endpoint | Method | Caller | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/homes` | `POST` | Authenticated user | Creates a new Home. Creator becomes `couple` / host. Appends to user's `homeIds` | `{ coupleNames, date?, city?, eventType?, eventSubtype? }` | `{ success: true, home, member }` |
| `/api/homes/[homeId]` | `GET` | Member of Home | Retrieves Home details | None | `{ success: true, home }` |
| `/api/homes/[homeId]/invites` | `POST` | Couple only | Generates a 7-day secure invite token with role configuration | `{ allowedRole?: string }` | `{ success: true, token, expiresAt, inviteUrl }` |
| `/api/invites/[token]/accept` | `POST` | Authenticated user | Accepts an invite token and joins Home as specified role; associates home with user | `{ name?, relationship?, preferredLanguage? }` | `{ success: true, home, member }` |

### Settings & Celebrations

| Endpoint | Method | Caller | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/settings` | `PATCH` | Authenticated member | Updates home profile, or performs `action: 'switch_home'` to switch active celebration | `{ action: 'switch_home', homeId: string }` or home update fields | `{ success: true, home }` |
| `/api/homes/[homeId]/members/[uid]` | `PATCH` | Couple (or self for language) | Couple updates `permission`, `canVote` (toggles voter/advisor), or `canSeeBudget`. Member updates `preferredLanguage` | `{ permission?, canVote?, canSeeBudget?, preferredLanguage? }` | `{ success: true, member }` |

### Rooms, Messages & Ideas

| Endpoint | Method | Caller | Description | Request Body / Query | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/homes/[homeId]/rooms` | `GET` | Member of Home | Lists all discussion rooms | None | `{ success: true, rooms }` |
| `/api/homes/[homeId]/rooms/[roomId]/messages` | `GET` | Member of Home | Poll messages (supports `?since=<ms>&limit=<n>`) | Query: `?since=<ms>` | `{ success: true, messages }` |
| `/api/homes/[homeId]/rooms/[roomId]/messages` | `POST` | Member of Home | Post message (max 2,000 chars) | `{ text: string, lang?: string }` | `{ success: true, message }` |
| `/api/homes/[homeId]/rooms/[roomId]/ideas` | `GET` | Member of Home | Poll ideas (supports `?since=<ms>`) | Query: `?since=<ms>` | `{ success: true, ideas }` |
| `/api/homes/[homeId]/rooms/[roomId]/ideas` | `POST` | Member of Home | Post idea (max 2,000 chars) | `{ text: string }` | `{ success: true, idea }` |

### Decisions & Majority Tally

| Endpoint | Method | Caller | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/decisions` | `POST` | Couple only | Creates decision from synthesized options | `{ roomId, topic, options: [...] }` | `{ success: true, decision }` |
| `/api/decisions` | `GET` | Member of Home | Lists decisions for the Home | None | `{ success: true, decisions }` |
| `/api/decisions/[id]` | `GET` | Member of Home | Get decision with live vote counts | None | `{ success: true, decision, tally }` |
| `/api/decisions/vote` | `POST` | Eligible voters only (`couple` or `voter`) | Casts or replaces vote | `{ decisionId, optionId }` | `{ success: true, decision }` |
| `/api/decisions/close` | `POST` | Couple only | Executes tally: `winner`, `runoff`, or `couple_decides` | `{ decisionId }` | `{ success: true, outcome, ... }` |
| `/api/decisions/couple-choice` | `POST` | Couple only | Breaks tie during `awaiting_couple` status | `{ decisionId, optionId }` | `{ success: true, winner, decision }` |

### Maya AI Endpoints

| Endpoint | Method | Caller | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/maya` | `GET` | Member of Home | Get chat history, profile, and onboarding status | None | `{ success: true, messages, profile, budget, ... }` |
| `/api/maya` | `POST` | Member of Home | Executes a chat turn (rate-limited, mock-safe) | `{ message: string, roomId?: string, mode?: 'text' \| 'voice' }` | `{ success: true, message, envelope, ... }` |
| `/api/maya/synthesize` | `POST` | Member of Home | Synthesizes room ideas into a structured decision brief | `{ roomId: string }` | `{ success: true, envelope, brief }` |
| `/api/maya/plan` | `GET` / `POST` | Member of Home | Plan inspection, vendor toggle, or part generation | `{ part?, toggleVendor?, booked?, action? }` | `{ success: true, plan }` |
| `/api/maya/replan` | `POST` | Member (Couple for budget/locked) | Applies change, regenerates affected plan parts | `{ change: { path, value } }` | `{ success: true, plan, changes: [...] }` |
| `/api/maya/confirm` | `POST` | Member of Home | Confirms pending updates | `{ confirmationId, confirmed }` | `{ success: true, action, ... }` |
| `/api/maya/reject` | `POST` | Member of Home | Dismisses pending update | `{ confirmationId }` | `{ success: true }` |
| `/api/maya/reset` | `POST` | Couple only | Resets onboarding state | None | `{ success: true }` |

---

## 3. Setting Up Free Firebase (Spark Plan)

You can run Made in Heaven on the **100% free Firebase Spark plan** with zero cost, no credit card, and no GCP billing:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, enter a name (e.g. `made-in-heaven-prod`), and continue.
3. Disable Google Analytics (optional) and click **Create project**.

### Step 2: Enable Cloud Firestore
1. In the left sidebar, click **Build > Firestore Database**.
2. Click **Create database**.
3. Choose your database location (e.g. `asia-south1` for Mumbai or closest region).
4. Select **Start in production mode** and click **Create**.
5. Deploy `firestore.rules` and `firestore.indexes.json` using Firebase CLI (`firebase deploy --only firestore:rules,firestore:indexes`).

### Step 3: Enable Firebase Authentication
1. In the left sidebar, click **Build > Authentication**.
2. Click **Get Started**.
3. Enable **Google** sign-in provider in the Sign-in method tab.
4. Add authorized domains (e.g. `localhost`, `made-in-heaven-uorx.vercel.app`).

### Step 4: Generate a Service Account (Firebase Admin)
1. In the Firebase console, click the gear icon **⚙ > Project settings**.
2. Select the **Service accounts** tab.
3. Click **Generate new private key** and download the JSON file.
4. Open the downloaded JSON file and extract the values into your `.env.local`:
   ```bash
   FIREBASE_PROJECT_ID="your_project_id"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```
5. In the **General** tab of Project settings, copy your client configuration:
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
   ```

### Step 5: Switch Storage Driver to Firestore
Set in your `.env.local`:
```bash
STORAGE_DRIVER=firestore
```
