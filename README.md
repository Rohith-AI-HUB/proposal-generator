# Proposal Generator

> Generate client-ready dev proposals in seconds.

---

## The Problem

Freelance developers lose deals not because of skill — but because of how they present.

Writing a proposal takes 1–3 hours. Most are vague, mispriced, or never sent.
Clients read generic output and pass. The work goes to someone who looked more prepared.

This tool takes a raw client requirement and returns a structured, priced,
consultant-grade proposal — ready to send without editing.

---

## Demo

https://github.com/user-attachments/assets/demo.mp4

> Paste requirement → Generate → 10 structured sections appear → Copy and send.


---

## Live

🔗 **[proposal-generator-blond.vercel.app](https://proposal-generator-blond.vercel.app/)**

---

## What it generates

| Section | What it does |
|---|---|
| Project Overview | Reframes the requirement around client outcome |
| Feasibility Note | Flags scope/budget conflicts with structured alternatives |
| Scope of Work | Phase 1 core + Phase 2 optional, with budget guidance |
| Deliverables | Exact outputs — no vague line items |
| Timeline | Phased with buffers and dependency flags |
| Pricing Estimate | Range with module breakdown and rationale |
| Tech Stack | Justified against this project, not generic defaults |
| Scope Boundaries | What is not included |
| Risk Signals | 1–3 real risks, framed as awareness |
| Assumptions | Only what materially affects cost or timeline |
| Next Steps | Clear CTA with milestone delivery line |

---

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Groq API — `llama-3.3-70b-versatile`

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
Returns: { proposal: string }
```

---

## Project Structure

```
app/
  page.tsx                 ← Landing + tool (single page)
  layout.tsx               ← Root layout
  globals.css              ← Glass variables, base styles
  api/generate/route.ts    ← POST /api/generate
components/
  VersionBadge.tsx         ← Floating glass version pill
lib/
  prompt.ts                ← System prompt (the core intelligence)
```

---

## Roadmap

- [x] Core proposal generation
- [x] Feasibility spectrum (Green / Amber / Orange / Red)
- [x] Pricing with rationale and cost drivers
- [x] Risk signals and scope boundaries
- [x] Landing page
- [ ] Auth (Clerk)
- [ ] 3 free proposals limit
- [ ] Stripe paywall ($9/month)
- [ ] PDF export
