# Made in Heaven: Antigravity build brief

Put this file and `maya_prompts_v4.md` in the project folder before you start. Every agent reads both.

## 1. What we are building

**Made in Heaven** is a wedding planning web app for Indian families. Its manager, **Maya** (powered by Gemini), asks about the couple's taste, then builds a budget, timeline, vendor checklist, palette, decor, and attire plan in INR. Families join a shared **Home**, discuss in rooms, vote by majority, and Maya turns their ideas into a decision. Maya understands Indian languages and can listen and speak.

### MVP (must work in the demo)

1. Onboarding chat with Maya that fills the event profile.
2. A full plan: budget by function, timeline, vendor checklist, palette, decor, attire.
3. Re-plan: change the budget or guest count and the plan updates with an explanation.
4. One Home with three members, rooms, and a Maya decision brief ending in a majority vote.
5. Maya replying in Hindi or Gujarati to a member who writes in it.
6. Voice: speak to Maya and hear her reply.

### Not in scope

Real bookings, real vendor listings, payments, and any invented vendor names or prices.

## 2. Stack (assumptions, change if you prefer)

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript + Tailwind | One codebase for UI and API routes |
| Data and login | Firebase Auth + Firestore | Realtime updates for Home rooms |
| AI | Gemini API via the official Google GenAI SDK, called **server-side only** | Keeps the API key private |
| Voice (MVP) | Browser Web Speech API (speech recognition and speech synthesis) | No extra services; works best in Chrome, so test each language |
| Voice (later) | Google Cloud speech-to-text and text-to-speech | Better regional language coverage |
| Validation | Zod | Checks Gemini's JSON before the app uses it |

**Environment variables:** `GEMINI_API_KEY`, `GEMINI_MODEL` (read the model name from here, never hardcode it; check Google AI Studio for the current model name), and the Firebase keys. Never expose the Gemini key to the browser.

## 3. Architecture

```
Browser (chat, plan views, Home, mic and speaker)
   |
Next.js API routes
   |-- /api/maya              chat turn (loads profile, speaker, recent messages)
   |-- /api/maya/replan       apply a change and regenerate affected plan parts
   |-- /api/maya/synthesize   build a decision brief for a room
   |-- /api/decisions/vote    record a vote
   |-- /api/decisions/close   count votes (majority logic in code)
   |
Gemini (system prompt from maya_prompts_v4.md + context)   Firestore
```

**One rule:** Maya never counts votes or changes permissions. Code does.

## 4. Data model (Firestore)

```
homes/{homeId}
  name, ownerUid, createdAt
  profile            event profile JSON (no budget fields)
homes/{homeId}/private/budget      budget object; readable by couple + members with canSeeBudget
homes/{homeId}/members/{uid}       name, relationship, permission (couple|voter|advisor|viewer),
                                   preferredLanguage, interests[], canSeeBudget
homes/{homeId}/rooms/{roomId}      name (Venue, Food, Outfits, Decor, Budget, General)
homes/{homeId}/rooms/{roomId}/messages/{id}   authorType (member|maya), authorUid, text, lang,
                                              structured?, createdAt
homes/{homeId}/rooms/{roomId}/ideas/{id}      authorUid, text, createdAt
homes/{homeId}/plan                budget, timeline, checklist, palette, decor, attire, version
homes/{homeId}/decisions/{id}      roomId, topic, options[], votes{uid: optionId},
                                   status (open|runoff|closed), result, decidedBy, closedAt
```

**Security rules:** members can read only their own Home; only the couple writes `profile` locked fields, permissions, and budget; votes are accepted only from eligible voters.

## 5. How a Maya chat turn works

1. The client sends the message, `roomId`, and `mode` (text or voice).
2. The server loads the profile, the speaker's member record, and the last 20 messages.
3. If the speaker cannot see the budget, the server **removes budget data from the context** (do not rely on the prompt alone).
4. The server calls Gemini with the Part A system prompt, the context, and JSON output mode using the envelope in Part C.
5. The server validates the JSON with Zod; on failure it retries once, then shows a friendly fallback message.
6. The server applies allowed `profile_updates`, saves the messages, and returns the envelope.
7. The client shows `reply` and `quick_replies` as tappable chips, and speaks `spoken_reply` in voice mode.

## 6. Screens

1. **Landing and login**
2. **Create Home:** couple's names, date, city
3. **Chat with Maya:** message list, quick-reply chips, mic button, speaker toggle, language selector
4. **Plan:** tabs for Budget, Timeline, Checklist, Palette (color swatches), Decor, Attire
5. **Home:** member list with roles and a "can vote" toggle (couple only), invite link, room list
6. **Room:** discussion thread, "Add my idea" box, "Ask Maya to summarize" button
7. **Decision:** options from the brief, vote buttons for eligible voters, live tally, result

## 7. Workstreams: prompts to give each Antigravity agent

Start with **Step 0** alone. Then run **1 and 4** in parallel, then the rest. Review each agent's plan before you approve it.

### Step 0: Scaffold

> Create a Next.js (App Router) + TypeScript + Tailwind project named made-in-heaven. Add Firebase Auth and Firestore setup using environment variables, the Firestore data model from section 4 of antigravity_build_brief.md as TypeScript types, a Zod schema for the Maya response envelope in maya_prompts_v4.md (Part C), and a server-only helper `callMaya()` that calls Gemini with the system prompt from Part A, using GEMINI_API_KEY and GEMINI_MODEL from the environment. Load the system prompt text from a file, not inline. Add a .env.example. Never expose the API key to the client.

### Workstream 1: Maya chat core

> Build the Maya chat screen and the /api/maya route following section 5. Show quick_replies as tappable chips. Apply profile_updates only for allowed paths. Validate the envelope with Zod and retry once on invalid JSON. Add an onboarding flow where Maya collects date, city, guest count, budget, culture, and vibe one question at a time. Acceptance: a new user can complete onboarding and see their saved event profile.

### Workstream 2: Plan views

> Build the Plan screen with tabs for Budget, Timeline, Checklist, Palette, Decor, and Attire. Render each from the structured data formats in maya_prompts_v4.md. Format all money in INR with Indian grouping (₹8,00,000). Show palette colors as swatches with hex codes. Add a "Generate plan" button that calls /api/maya for each part. Label every price as an estimate. Acceptance: all six tabs render from sample JSON and from live Gemini output.

### Workstream 3: Re-plan

> Build /api/maya/replan. The user changes one thing (budget, guest count, date, a locked constraint). Send the current plan plus the change to Maya, regenerate every affected plan part, and show a "What changed and why" summary above the updated plan. Acceptance: changing the budget from 8 to 10 lakh updates budget, decor, and attire tabs with an explanation.

### Workstream 4: Home

> Build Home: create a Home, invite members by link, set each member's relationship, language, and permission (voter, advisor, viewer), and let only the couple toggle "can vote" and "can see budget". Create default rooms (Venue, Food, Outfits, Decor, Budget, General) with realtime messages. Write Firestore security rules per section 4. Acceptance: three members in one Home see the same rooms in realtime, and an advisor cannot vote.

### Workstream 5: Synthesis and voting

> Build /api/maya/synthesize using Part B of maya_prompts_v4.md. Members add ideas to a room; "Ask Maya to summarize" returns a decision_brief with common ground, conflicts, and 2 to 3 combined options. Build the Decision screen and voting. Implement the voting rule from maya_prompts_v4.md in plain code, not in the model: majority of votes cast, runoff between the top two, couple decides on a tie. After a decision closes, save it to the decisions log and call Maya to update the plan. Write unit tests for the vote counting. Acceptance: three voters, three options, correct winner, runoff, and tie cases all pass.

### Workstream 6: Languages

> Add a language selector per member (English, Hindi, Gujarati, Punjabi, Marathi) stored as preferredLanguage. Pass the speaker's language to Maya. Show Maya's replies in the language the member writes in. Keep ritual words and JSON keys unchanged. Render Indian-language text with a font that supports Devanagari, Gujarati, and Gurmukhi. For decision briefs, generate each reader's version in their language while keeping option ids identical. Acceptance: a Gujarati message gets a Gujarati reply with ₹ amounts and words like mehendi unchanged.

### Workstream 7: Voice

> Add a mic button using the browser SpeechRecognition API and speak replies with speechSynthesis, using language codes en-IN, hi-IN, gu-IN, pa-IN, and mr-IN. Send mode "voice" to /api/maya and speak only spoken_reply. For items in needs_confirmation, show a yes/no prompt and read the question aloud; save only after a yes. Feature-detect support and fall back to text with a clear message. Acceptance: speaking "budget eight lakh, 300 guests" results in Maya repeating it back and saving it after confirmation.

## 8. Demo seed data

Ask an agent to write a seed script that creates:

- **Home:** "Aarav and Diya", Pune, 300 guests, four functions, fusion style, budget ₹8 lakh, locked: 300 guests and luxury garden venue.
- **Members:** Aarav and Diya (couple), Diya's mother (voter, Gujarati), Aarav's brother (advisor, Hindi), Diya's friend (viewer, English).
- **Sample ideas** in the Decor and Venue rooms so the synthesis demo works instantly.

## 9. Rules for every agent

- Never put the Gemini key in client code or commit `.env`.
- Never invent vendors or exact prices; estimates only, always labeled.
- Maya's replies must follow the JSON envelope; validate everything.
- Keep the system prompt in a file so we can edit it without code changes.
- Write short tests for vote counting, money formatting, and permission checks.
- After each task, produce a walkthrough with screenshots so we can verify it.

## 10. Definition of done (demo checklist)

- [ ] Onboarding in under a minute, profile saved
- [ ] Full plan generated, all six tabs
- [ ] Impossible wishlist: Maya stays kind, honest, and states the realistic budget
- [ ] Re-plan after a budget change, with "what changed and why"
- [ ] Gujarati or Hindi reply for a family member
- [ ] Voice question answered aloud, numbers confirmed before saving
- [ ] Three members, three ideas, decision brief, majority vote, plan updated
- [ ] Advisor cannot vote; member without budget access sees only cost tiers
