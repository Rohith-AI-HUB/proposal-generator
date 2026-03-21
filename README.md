# ProposaIQ

> Generate client-ready dev proposals in seconds.

---

## The Problem

Freelance developers lose deals not because of skill -- but because of how they present.

Writing a proposal takes 1-3 hours. Most are vague, mispriced, or never sent.
Clients read generic output and pass. The work goes to someone who looked more prepared.

This tool takes a raw client requirement and returns a structured, priced,
consultant-grade proposal -- ready to send without editing.

---

## Demo

![Proposal Generator Demo](./docs/demo.gif)

> Paste requirement -> Generate -> 10 structured sections appear -> Copy and send.

---

## Live

[proposal-generator-blond.vercel.app](https://proposal-generator-blond.vercel.app/)

---

## What it generates

| Section | What it does |
|---|---|
| Project Overview | Reframes the requirement around client outcome |
| Feasibility Note | Flags scope/budget conflicts with structured alternatives |
| Scope of Work | Phase 1 core + Phase 2 optional, with budget guidance |
| Deliverables | Exact outputs -- no vague line items |
| Timeline | Phased with buffers and dependency flags |
| Pricing Estimate | Range with module breakdown and rationale |
| Tech Stack | Justified against this project, not generic defaults |
| Scope Boundaries | What is not included |
| Risk Signals | 1-3 real risks, framed as awareness |
| Assumptions | Only what materially affects cost or timeline |
| Next Steps | Clear CTA with milestone delivery line |

---

## Stack

- Next.js 16 (App Router)
- TypeScript 5
- Tailwind CSS 3
- Groq API -- `llama-3.3-70b-versatile`

---

## Setup

```bash
git clone https://github.com/your-username/proposal-generator
cd proposal-generator
npm install
```

Create `.env.local`:

```
GROQ_API_KEY=gsk_...
```

Run:

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

Get your Groq key: [console.groq.com](https://console.groq.com)

---

## API

```
POST /api/generate
Body:    { requirement: string }
Returns: { proposal: Proposal, renderedText: string }
```

`proposal` is a typed object with all 11 sections.
`renderedText` is a plain-text version ready for clipboard copy.

---

## Project Structure

```
app/
  page.tsx                        <- Landing + tool (single page, client component)
  layout.tsx                      <- Root layout, font loading, theme anti-flash script
  globals.css                     <- Design tokens, base styles, component classes
  api/generate/route.ts           <- POST /api/generate

components/
  Logo.tsx
  ThemeToggle.tsx
  proposal/
    ProposalView.tsx              <- Section nav + all section renders + action bar
    OverviewSection.tsx
    FeasibilitySection.tsx
    ScopeSection.tsx
    DeliverablesSection.tsx
    TimelineSection.tsx
    PricingSection.tsx
    TechStackSection.tsx
    BoundariesSection.tsx
    RisksSection.tsx
    AssumptionsSection.tsx
    NextStepsSection.tsx
    shared.tsx                    <- SectionCard wrapper used by every section

lib/
  domain/proposal/
    schema.ts                     <- All Proposal types (single source of truth)
    constants.ts                  <- Model config, guardrails, error messages
    normalizer.ts                 <- Clamps and trims validated model output
    warnings.ts                   <- Client-side input quality signals (debounced)

  server/generation/
    index.ts                      <- generateProposal() orchestrator
    model.ts                      <- Groq SDK adapter
    prompt.ts                     <- System prompt + user message builder
    preprocessor.ts               <- Requirement signal extraction (budget, deadline, vagueness)
    validator.ts                  <- Structural + semantic validation of model output

  server/rendering/
    index.ts
    text.ts                       <- Plain-text renderer for clipboard export
```

---

## Roadmap

- [x] Core proposal generation
- [x] Feasibility spectrum (Green / Amber / Orange / Red)
- [x] Pricing with rationale and cost drivers
- [x] Risk signals and scope boundaries
- [x] Landing page
- [x] Input quality warnings (budget/deadline/vagueness detection)
- [ ] Auth (Clerk)
- [ ] 3 free proposals limit
- [ ] Stripe paywall ($9/month)
- [ ] PDF export
