# ProposaIQ

> Upwork reply sprint for solo React and Next.js freelancers.

ProposaIQ is not a generic proposal generator. It takes an Upwork job post plus a lightweight proof pack and returns:

- `3` ranked opening hooks
- `1` matched proof point
- `1` quick reply or `1` fuller proposal built from the same argument

The product is deliberately narrow:

- ICP: solo React / Next.js freelancers on Upwork
- Problem: generic first lines get skipped in the proposal preview
- Outcome: tighter opener plus job-specific reply draft in under `30` seconds

## Live

[proposal-generator-blond.vercel.app](https://proposal-generator-blond.vercel.app/)

## Core Flow

1. Paste the full Upwork job post.
2. Add one proof point.
3. Optionally add specialty context and a portfolio URL.
4. Generate a quick reply or a full proposal.
5. Copy the final proposal into Upwork and send.

## API

```json
POST /api/generate
{
  "jobPost": "string",
  "mode": "quick_reply" | "full_proposal",
  "proofPack": {
    "specialty": "string (optional)",
    "proofPoints": ["string"],
    "portfolioUrl": "string (optional)"
  }
}
```

Rules:

- `proofPoints` must contain at least `1` non-empty item and at most `3`
- `specialty` is optional
- `portfolioUrl` is optional

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

## Analytics

The app logs a minimal funnel through `POST /api/track` using a browser visitor id plus a session id. Current events:

- `page_view`
- `return_visit`
- `builder_started`
- `generate_success`
- `expand_to_full`
- `copy_proposal`
- `copy_hook`
- `purchase_click`

The route logs JSON to stdout so you can inspect sessions without adding a third-party analytics SDK.

## Setup

```bash
git clone https://github.com/your-username/proposal-generator
cd proposal-generator
npm install
```

Create `.env.local`:

```bash
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_REPLY_SPRINT_CHECKOUT_URL=https://your-checkout-link.example
```

Run locally:

```bash
npm run dev
```

If `NEXT_PUBLIC_REPLY_SPRINT_CHECKOUT_URL` is missing, the paid CTA stays disabled. That is intentional. Do not ship paid traffic to a mailto link and pretend it is checkout.

## Stack

- Next.js 16
- TypeScript 5
- Tailwind CSS 3
- Groq API with `llama-3.3-70b-versatile`

## Validation

- `npm run test:reply`
- `npm run build`
- `npm run lint`

## Kill Criteria

Do not keep adding features blindly. Stop expanding if a `14`-day direct outreach sprint fails to produce at least:

- `10` repeat users
- `3` people willing to pay

If that signal does not show up, the product is not proving enough value yet.
