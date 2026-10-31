# Made in Heaven: Indian Celebration & Event Planner

> **Live Deployment:** [https://made-in-heaven-uorx.vercel.app](https://made-in-heaven-uorx.vercel.app)  
> **Repository:** [https://github.com/dpanchal1295/made-in-heaven](https://github.com/dpanchal1295/made-in-heaven)  
> **Challenge Track:** Challenge 5 — Celebration & Event Planner

Made in Heaven is a collaborative event management platform built for modern Indian families. It brings together family members and organisers across three celebration archetypes: **Weddings**, **Milestone Birthdays**, and **Community Festivals**.

At the core of the platform is **Maya**, an AI celebration manager powered by Google Gemini, paired with an editorial design system, native multilingual speech synthesis, strict server-side budget privacy, and deterministic multi-tenant consensus voting.

---

## 1. What Made in Heaven Does

Modern Indian celebrations involve dozens of stakeholders, complex cultural rituals, high emotional stakes, and substantial multi-vendor budgets. Made in Heaven bridges individual taste with family consensus:

1. **Celebration-Wide Onboarding (`/start`)**:
   - Distinct setup journeys for **Weddings**, **Milestone Birthdays**, and **Community Festivals** (e.g. Navratri, Diwali Mela, Society Ganesh Utsav).
   - Generates an isolated multi-tenant **Home** with dedicated family collaboration rooms and distinct visual accent tokens (`#A8603E` terracotta for weddings, `#9B4A6A` plum for birthdays, `#A35700` saffron for community festivals).

2. **Maya: Conversational Event Manager (`/chat`)**:
   - Instant opening chat with contextual first messages synthesized dynamically from saved celebration details (zero cold-start delay).
   - Low-latency chat turns powered by `gemini-3.5-flash-lite` (`thinkingBudget: 0`) with quick-reply suggestions.
   - Script detection and Web Speech API audio playback using region-matched female voices (`en-IN`, `hi-IN`, `gu-IN`, `mr-IN`, `pa-IN`) with graceful text fallbacks when voices are unavailable on client operating systems.

3. **6-Part Adaptive Plan (`/plan`)**:
   - Concurrent tab generation across 6 core pillars: **Budget Breakdown**, **Timeline Countdown**, **Vendor Checklist**, **Color Palette**, **Decor Concepts**, and **Attire & Styling**.
   - Structured JSON schemas with regional Indian cost anchoring (e.g. Pune/Mumbai plate tiers, stage decor fabric specs, mandap/pandal requirements).
   - Interactive re-planning panel that scales budgets and guest counts proportionally while documenting "What Changed and Why".

4. **Family Collaboration & Democratic Voting (`/family`)**:
   - Dedicated discussion rooms (e.g. Venue, Decor, Food & Catering, Music & Entertainment, Clothes & Styling, Rituals & Puja).
   - Role-based collaboration with fine-grained privileges: **Hosts / Couple** (decision owners), **Voters** (eligible to cast ballots), and **Advisors** (can suggest ideas and join discussions, but cannot vote).
   - Deterministic multi-round vote tallying engine (`src/lib/decisions/tally.ts`): enforces strict majorities, triggers automated top-two runoffs, and falls back to host tiebreak authority. **Maya never counts votes or alters permissions.**

5. **Strict Budget Privacy & Multi-Tenant Isolation**:
   - Server-side redaction ensures that only the hosts/couple can see itemized rupee figures. Non-budget viewers never receive financial payloads, and budget data is scrubbed from AI context before any prompt execution.

---

## 2. Architecture & Tech Stack

```
                     ┌───────────────────────────────────┐
                     │   Next.js 16 App Router (React)   │
                     │  Editorial Cormorant + Inter UI   │
                     └─────────────────┬─────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│ Client Authentication │                             │  Fast Speech & Audio  │
│  • Google Sign-In     │                             │  • Web Speech API     │
│  • Guest Session UUID │                             │  • Regional female    │
│  • Signed JWT Cookie  │                             │    voice selection    │
└───────────┬───────────┘                             └───────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API Security Layer                              │
│  • checkOrigin(): Strict CSRF validation (localhost & vercel subdomains)    │
│  • getSession(): Cryptographic HMAC signature verification                 │
│  • rateLimit(): Sliding-window memory rate limiting per serverless pod      │
│  • Zod Validation: Strict payload schemas & 2000 char message caps         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│       AI Intelligence         │             │      Data Persistence         │
│  • Chat: gemini-3.5-flash-lite│             │  • Storage: IWeddingStorage   │
│  • Plans: gemini-3.8-flash    │             │  • Driver: Cloud Firestore    │
│  • Fallback: Exponential      │             │    (Production)               │
│    jittered retry on 503/500  │             │  • Local: wedding_state.json  │
│  • tally.ts: Pure code voting │             │    (Local Dev Fallback)       │
└───────────────────────────────┘             └───────────────────────────────┘
```

- **Framework**: Next.js 16.4 (App Router, Server Actions, Route Handlers)
- **Styling**: Tailwind CSS, Cormorant Garamond (editorial serif), Inter (clean sans)
- **AI Models**: Google Gemini 3.5 Flash Lite (chat) & Gemini 3.8 Flash (plans & briefs) via `@google/genai`
- **Database**: Google Cloud Firestore (`firebase-admin` server SDK)
- **Testing**: Node.js Native Test Runner (`node:test`) + `tsx`

---

## 3. Gemini Models & Error Handling

To satisfy fast interactive responses while supporting deep structured event plans, Made in Heaven implements a two-model strategy:

1. **Conversational Turns (`GEMINI_CHAT_MODEL = gemini-3.5-flash-lite`)**:
   - Operates with `thinkingBudget: 0` for sub-second text turnarounds.
   - Outputs natural replies along with 3 contextual quick-reply chips.
   - Enforces a 25-second client-side timeout with friendly "Try again" resend mechanics.

2. **Structured Planning & Re-planning (`GEMINI_MODEL = gemini-3.8-flash`)**:
   - Generates strictly-typed JSON schemas for itemized budgets, milestone timelines, vendor lead times, and decor specs.
   - Powered by a concurrent client-side worker pool (3 parallel streams) completing all 6 plan tabs in ~15 seconds on live Vercel deployments.

3. **Resilience & Fallback Architecture**:
   - Automatically traps transient HTTP 503 (Model Overloaded) and 500 errors.
   - Retries up to 2 times with exponential backoff (`0.8s`, `1.6s` + random jitter).
   - If `GEMINI_CHAT_MODEL` encounters persistent errors, it gracefully falls back to `GEMINI_MODEL` (and vice-versa).
   - If all live AI calls fail, the server returns realistic cached regional mock fixtures so the user journey is never blocked.

---

## 4. Voting Logic & Consensus Rules (`src/lib/decisions/tally.ts`)

Made in Heaven strictly separates AI synthesis from democratic consensus. Maya synthesizes family discussions into clear proposal options (`/api/maya/synthesize`), but **all vote counting is 100% deterministic TypeScript**:

- **Strict Majority**: An option wins if its votes exceed 50% of valid votes cast. (e.g. 3 out of 3, or 2 out of 3).
- **No Majority Split**:
  - If two options tie for the top vote count (e.g. 2-2 out of 4), the decision is referred directly to the **Couple / Host** to make the final choice.
  - If three or more options tie (e.g. 1-1-1), the Couple / Host selects among all tied options.
  - If there is a clear top two without a majority (e.g. Option A: 2 votes, Option B: 2 votes, Option C: 1 vote), an automated **Runoff** round is initiated restricted to the top two candidates.
- **Role Enforcement**:
  - **Couple / Host**: Always eligible to vote and possesses exclusive tiebreak authority.
  - **Voters**: Eligible family members whose votes count toward the round tally.
  - **Advisors**: Permitted to submit thoughts and vote in the UI for engagement, but the server-side tally engine completely discounts advisor votes.

---

## 5. Security & Privacy

1. **Origin Verification (`src/lib/security/originCheck.ts`)**:
   - Every state-modifying route (`POST`, `PATCH`, `DELETE`) enforces origin validation.
   - Whitelist restricted to `http://localhost:3000`, `http://127.0.0.1:3000`, production `https://made-in-heaven-uorx.vercel.app`, and project-specific preview patterns (`^https:\/\/made-in-heaven-uorx-[a-z0-9]+-dpanchal1295s-projects\.vercel\.app$`). All external or unknown Vercel domains are rejected with `403 Forbidden`.

2. **Authentication & Session Tokens**:
   - Dual authentication: Google Firebase Auth (popup flow with redirect fallback) or instant Guest access.
   - Session tokens are signed using HMAC-SHA256 (`SESSION_SECRET`) and issued in `httpOnly`, `sameSite=lax`, `secure` cookies with 7-day expiration.

3. **Server-Side Budget Redaction**:
   - Budget records are stored in a restricted `private/budget` subcollection.
   - Any API request made by a member without `canSeeBudget: true` redacts total budgets, category numbers, and catering ranges before serialization.

4. **Multi-Tenant Isolation**:
   - Every database document is partitioned under `/homes/{homeId}`.
   - Session tokens bind the caller to a single `homeId`. Cross-home resource requests return `403 Forbidden`.

---

## 6. Accessibility & Editorial Design System

- **WCAG AA Compliance**: All text tokens tested and verified for contrast. Dark accent tokens (`#94512F` wedding, `#863A57` birthday, `#8E4A00` community) exceed 4.5:1 on cream (`#FCFBF8`) and beige (`#F5EFEB`) backgrounds.
- **Typography**: Editorial hierarchy pairing **Cormorant Garamond** (warm serif headings) with **Inter** (accessible body text) and monospace font styling for financial figures and dates.
- **Keyboard & Screen Reader Support**: Full focus trapping on modals, accessible `aria-live` status regions for typing indicators, and keyboard navigation across all tabs.

---

## 7. Running Locally

### Prerequisites
- Node.js 20+ (Node 24 recommended)
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))
- (Optional) Firebase project credentials for Firestore persistence

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dpanchal1295/made-in-heaven.git
   cd made-in-heaven
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Provide your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_CHAT_MODEL=gemini-3.5-flash-lite
   GEMINI_MODEL=gemini-3.8-flash
   STORAGE_DRIVER=local
   SESSION_SECRET=a_random_32_character_secret_key
   ```
   *(When `STORAGE_DRIVER=local`, the application stores state in a local JSON file without needing Firebase).*

4. **Run the test suite**:
   ```bash
   npm test
   ```

5. **Run the linter**:
   ```bash
   npm run lint
   ```

6. **Build for production**:
   ```bash
   npm run build
   ```

7. **Start the local server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Assumptions & Design Decisions

- **Guest Plans & Device Persistence**: Guest users can experience the entire platform without signing in. Guest plans are saved on the active browser session. Users are gently informed to sign in with Google to sync plans across multiple devices.
- **Regional Rate Estimates**: All vendor and catering pricing generated by Maya is anchored to realistic Pune/Mumbai tier rates in Indian Rupees (INR) and formatted with Lakh notation. Users are clearly advised that figures are budgetary estimates subject to formal vendor quotes.
- **Deterministic Consensus**: In multi-generational celebrations, family members often feel disenfranchised by opaque algorithms. By making Maya a neutral advisor and executing vote counts deterministically in code, the decision process remains fair, transparent, and respectful of elder and host authority.

---

## 9. Asset & Photography Credits

All photography used in Made in Heaven is curated from royalty-free Unsplash collections celebrating Indian culture, ceremonies, and decor:

- **Hero & Architecture**: Rajasthani balcony and palaces ([Unsplash](https://unsplash.com/))
- **Decor & Ambiance**: Festive marigold garlands, brass diyas, and lantern lighting
- **Attire & Styling**: Traditional silk sarees, gold temple jewelry, and embroidered kurtas
- **Ceremonial Traditions**: Haldi turmeric ceremonies, mehendi artistry, and wedding rituals

*(A full dynamic mapping of images is maintained in `src/config/images.ts` and generated via `scripts/generate-available-images.cjs`).*
