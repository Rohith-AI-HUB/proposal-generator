# Proposal Generator — Phase 1 (Refactored)

AI-powered proposal generator for freelance developers. Single page, no routing, no complexity.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + CSS Variables (glassmorphism)
- Anthropic Claude API

## Setup

```bash
cd proposal-generator
npm install
```

Add your Anthropic API key to `.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
```

Run:
```bash
npm run dev
```

Open: http://localhost:3000

## Structure

```
app/
  page.tsx              ← Single page: Input + Output + Actions
  layout.tsx            ← Root layout + global CSS
  globals.css           ← Glass variables, base styles
  api/generate/route.ts ← POST /api/generate
components/
  VersionBadge.tsx      ← Floating glass version pill
lib/
  prompt.ts             ← Claude system prompt
```

## API

```
POST /api/generate
Body: { requirement: string }
Returns: { proposal: string }
```

## Phase 1 — Done
- [x] Input textarea
- [x] AI proposal generation
- [x] 8-section structured output (plain text)
- [x] Loading state + spinner
- [x] Error handling
- [x] Copy to clipboard
- [x] Regenerate button
- [x] Floating glass version badge

## Phase 2 — Next
- [ ] Auth (Clerk or Supabase)
- [ ] 3 free proposals limit
- [ ] Stripe paywall ($9/month)
- [ ] Landing page
