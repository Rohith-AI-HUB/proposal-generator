# ProposaIQ

> Upwork reply sprint for React and Next.js freelancers.

ProposaIQ no longer generates long proposal reports. It takes an Upwork job post plus a saved proof pack and returns:

- `3` ranked opening hooks
- `1` matched proof point
- `1` quick reply or `1` fuller Upwork proposal built from the same core argument

The product is deliberately narrow:

- ICP: solo React / Next.js freelancers on Upwork
- Problem: generic first lines get skipped in the proposal preview
- Outcome: tighter opener plus job-specific reply draft in under `30` seconds

## Live

[proposal-generator-blond.vercel.app](https://proposal-generator-blond.vercel.app/)

## Core Flow

1. Paste the full Upwork job post.
2. Reuse a saved proof pack:
   - specialty
   - three proof bullets
   - one portfolio link
3. Generate a quick reply or a full proposal.
4. Optionally expand a quick reply into a fuller proposal.
5. Copy the final proposal into Upwork and send.

## API

```json
POST /api/generate
{
  "jobPost": "string",
  "mode": "quick_reply" | "full_proposal",
  "proofPack": {
    "specialty": "string",
    "proofPoints": ["string", "string", "string"],
    "portfolioUrl": "string"
  }
}
```

Response:

```json
{
  "status": "ready",
  "draft": {
    "mode": "quick_reply" | "full_proposal",
    "finalProposal": "string",
    "matchedProof": "string",
    "hookOptions": [
      { "rank": 1, "hook": "string", "rationale": "string" },
      { "rank": 2, "hook": "string", "rationale": "string" },
      { "rank": 3, "hook": "string", "rationale": "string" }
    ]
  },
  "renderedText": "string"
}
```

`renderedText` is the same paste-ready proposal text used by the copy action.

## Setup

```bash
git clone https://github.com/your-username/proposal-generator
cd proposal-generator
npm install
```

Create `.env.local`:

```bash
GROQ_API_KEY=gsk_...
```

Run locally:

```bash
npm run dev
```

Optional purchase CTA override:

```bash
NEXT_PUBLIC_REPLY_SPRINT_URL=https://your-payment-link.example
```

Without that env var, the buy button falls back to a `mailto:` link.

## Stack

- Next.js 16
- TypeScript 5
- Tailwind CSS 3
- Groq API with `llama-3.3-70b-versatile`

## Verification

- `npm run test:trust`
- `npm run build`
- `npm run lint`
