# ProposaIQ

> Generate trust-first proposal drafts with cited facts and explicit assumptions.

---

## The Problem

Freelance developers lose deals not because of skill -- but because of how they present.

Writing a proposal takes 1-3 hours. Most are vague, mispriced, or never sent.
Clients read generic output and pass. The work goes to someone who looked more prepared.

This tool takes a raw client requirement and returns a structured proposal draft
that separates verified facts from estimates, calls out assumptions, and asks
follow-up questions when the input is too vague to trust.

---

## Demo

![Proposal Generator Demo](./docs/demo.gif)

> Paste requirement -> answer missing questions -> review a grounded draft.

---

## Live

[proposal-generator-blond.vercel.app](https://proposal-generator-blond.vercel.app/)

---

## What it generates

| Section | What it does |
|---|---|
| Project Overview | Reframes the requirement around client outcome |
| Trust Summary | Shows overall confidence and whether the draft should be reviewed before sending |
| Feasibility Note | Flags scope/budget conflicts with structured alternatives |
| Scope of Work | Phase 1 core + Phase 2 optional, with minimal speculation |
| Deliverables | Exact outputs instead of vague filler |
| Timeline Estimate | Phased estimate with dependencies and explicit uncertainty |
| Pricing Estimate | Freelancer estimate based on the chosen day rate |
| Verified Facts | Source-backed claims that affect feasibility or client costs |
| Uncertainty | Unsupported claims and open questions that still need review |
| Client Costs | Vendor or platform costs with source metadata when available |
| Assumptions | Explicit assumptions when confidence is not high |
| Sources | The URLs actually used by the draft |

---

## Stack

- Next.js 16 (App Router)
- TypeScript 5
- Tailwind CSS 3
- Groq API -- `llama-3.3-70b-versatile`
- Groq web research -- `groq/compound-mini`

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
Body:    {
           requirement: string,
           clientType?: "domestic" | "international",
           dayRate?: number,
           clarificationAnswers?: Record<string, string>
         }
Returns:
  | { status: "needs_clarification", summary: string, questions: ClarificationQuestion[] }
  | { status: "ready", proposal: Proposal, renderedText: string }
```

`proposal` includes confidence, evidence, unsupported claims, and sources.
`renderedText` is a plain-text draft for clipboard export.

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
    signals.ts                    <- Shared requirement analysis for warnings and gating

  server/generation/
    index.ts                      <- Clarification gate + research + generation orchestrator
    clarification.ts              <- Missing-info gate and follow-up question logic
    model.ts                      <- Groq SDK adapter
    prompt.ts                     <- System prompt + user message builder
    research.ts                   <- Source-backed vendor and platform fact retrieval
    trust.ts                      <- Trust scoring, evidence shaping, unsupported-claim handling
    preprocessor.ts               <- Requirement signal extraction adapter
    validator.ts                  <- Structural + semantic validation of model output

  server/rendering/
    index.ts
    text.ts                       <- Plain-text renderer for clipboard export

tests/
  clarification.test.ts           <- Clarification-gate coverage
  generation-flow.test.ts         <- Trust-first generation flow coverage
  trust-validation.test.ts        <- Evidence and confidence rules

fixtures/
  trust-evals.json                <- 25+ trust evaluation briefs

scripts/
  evaluate-trust.ts               <- Batch evaluation harness for trust metrics
```

---

## Roadmap

- [x] Core proposal generation
- [x] Clarification gate for vague briefs
- [x] Web-researched evidence and source-backed client costs
- [x] Confidence scoring and unsupported-claim surfacing
- [x] Trust-first UI with facts, assumptions, and sources
- [x] Fixture-based trust evaluation harness
- [ ] Better source coverage scoring
- [ ] Real-world benchmark set review and tuning
- [ ] Export formats after trust metrics are stable
