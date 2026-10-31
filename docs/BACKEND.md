# Made in Heaven — Backend Architecture & API Reference

Made in Heaven is a wedding planning web application designed for Indian families, driven by **Maya** (an empathetic AI wedding manager).

---

## 1. Architecture Overview

```
Browser Client (React / Next.js)
  │
  ├─ Cookie: mih_session (Demo Mode / HMAC signed)
  └─ Header: Authorization: Bearer <Firebase_ID_Token> (Production Mode)
         │
         ▼
Next.js App Router (Server-Side Route Handlers)
  │
  ├── getSession(request) ──> [Session Validation & Caller Context]
  ├── Rate Limiter ─────────> [In-memory sliding window]
  ├── Zod Schemas ──────────> [Request validation & 2,000 char limits]
  ├── Tally Engine ─────────> [src/lib/decisions/tally.ts (Pure deterministic code)]
  │
  ▼
Storage Layer (IWeddingStorage interface)
  ├── 'local': LocalWeddingStorage (Disk state with in-memory fallback for read-only Vercel)
  └── 'firestore': FirestoreWeddingStorage (Server-only driver via firebase-admin)
```

### Important Runtime Notes
- **Deployed Demo Mode vs Production**: The deployed demo operates with `NEXT_PUBLIC_DEMO_MODE=true` using signed `httpOnly` session cookies (`mih_session`). This allows judges and evaluators to seamlessly switch between Aarav, Diya, Meenakshi, Kabir, and Rhea without requiring individual phone logins. Standard production mode uses Firebase Auth ID tokens (`Bearer <token>`).
- **In-Memory Rate Limiting**: The rate limiter (`src/lib/security/rateLimit.ts`) operates per server instance on serverless platforms like Vercel. Each cold start or independent serverless instance maintains its own in-memory sliding window.
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
| `/api/auth/demo` | `POST` | Anyone (Demo mode only) | Sets signed `httpOnly` cookie for selected demo member (`demo-aarav-1`, `demo-diya-1`, `demo-mother-1`, `demo-brother-1`, `demo-friend-1`) | `{ uid: string, homeId?: string }` | `{ success: true, member, homeId }` |
| `/api/auth/logout` | `POST` | Any active user | Clears `mih_session` cookie | None | `{ success: true }` |
| `/api/me` | `GET` | Authenticated member | Returns current member profile and home details | None | `{ success: true, member, homeId, canSeeBudget, permission }` |
| `/api/demo/reset` | `POST` | Couple (Demo mode only) | Restores canonical demo home state ("Aarav and Diya", 5 members, default rooms, sample ideas) | None | `{ success: true, message }` |

### Homes & Invites

| Endpoint | Method | Caller | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/homes` | `POST` | Authenticated user | Creates a new Home. Creator becomes `couple` | `{ coupleNames, date?, city?, eventType?, eventSubtype? }` | `{ success: true, home, member }` |
| `/api/homes/[homeId]` | `GET` | Member of Home | Retrieves Home details | None | `{ success: true, home }` |
| `/api/homes/[homeId]/invites` | `POST` | Couple only | Generates a 7-day secure invite token | None | `{ success: true, token, expiresAt, inviteUrl }` |
| `/api/invites/[token]/accept` | `POST` | Authenticated user | Accepts an invite token and joins Home as viewer | `{ name?, relationship?, preferredLanguage? }` | `{ success: true, home, member }` |

### Members & Permissions

| Endpoint | Method | Caller | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
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
3. Enable **Email/Password** or **Anonymous** sign-in provider as desired.

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
Run `npm run seed` to initialize your Firestore database.

