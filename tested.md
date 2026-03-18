# Proposal Generator Prompt Stress Test

Date: 2026-03-18

## Test Setup

- App tested locally through `POST /api/generate`
- Model used by the app: `llama-3.3-70b-versatile`
- Prompt under test: `lib/prompt.ts`
- Inputs used: the five cases supplied in the request

## Overall Verdict

The current prompt is usable, but it is not robust. It consistently returns a clean proposal structure and avoids placeholders, which is good. The failures are mostly in judgment quality rather than formatting.

Main weaknesses exposed by the tests:

- It defaults to generic stacks and generic deliverables when the brief is vague.
- It does not justify pricing even though the prompt explicitly asks for that.
- It does not push back when budget, deadline, and scope are in conflict.
- It tends to invent assumptions as if they were decided requirements.
- It can break its own "exactly this structure" instruction on more complex jobs.
- The prompt text has encoding artifacts, and they leak into output as garbled dash characters.

## Summary Table

| Test | Result | Key Output | Main Weakness |
| --- | --- | --- | --- |
| 1. Very Vague | Partial pass | 21 days, $8,000, WordPress-style site | Makes too many arbitrary assumptions |
| 2. E-commerce | Partial pass | 65 days, $35,000 | Generic feature set, no pricing rationale |
| 3. Detailed SaaS | Partial pass | 90 days, $135,000 | Better complexity handling, but architecture and assumptions are still fuzzy |
| 4. Messy Tutor App | Fail | 63 days, $63,000 | Ignores low-budget and ASAP tension, treats a marketplace as a normal app |
| 5. Landing Page + MVP | Partial pass | 28 days, $35,000 | Accepts the requested timeline too easily without discussing tradeoffs |

## Test 1 - Very Vague

**Input**

`I need a website for my business. It should look modern and professional. I also want customers to contact me easily.`

**Observed output**

- Scope included a homepage, about page, contact form, map integration, and a CMS.
- Timeline: 21 days.
- Price: $8,000.
- Stack: HTML/CSS/JS, WordPress-style CMS, MySQL, AWS.

**Assessment**

This is a partial pass. The prompt does fill in missing detail and returns a complete proposal without asking questions. That satisfies the basic requirement.

The problem is that it overcommits on invented details. It treats a CMS, map integration, and initial content creation as decided scope, even though none of that was provided. That means the proposal sounds confident but not well-grounded. For vague briefs, the prompt should label assumptions more clearly and keep the proposed scope narrower.

## Test 2 - Medium E-commerce

**Input**

`Looking for a developer to build an e-commerce website. It should have product listings, cart, checkout, and admin panel to manage products. Payment integration required. Prefer something scalable.`

**Observed output**

- Scope included product listings, cart, checkout, and admin.
- Optional enhancements were reviews and coupons.
- Timeline: 65 days.
- Price: $35,000.
- Stack: React, Express, MySQL, AWS.

**Assessment**

This is also a partial pass. The output is structurally clean and the core features are recognized correctly.

The weakness is that the proposal stays generic. It does not mention shipping rules, taxes, inventory, order status management, refunds, or payment reconciliation. Those are normal e-commerce concerns. The price is not obviously wrong, but the model still does not justify it, despite the prompt requiring justification. It also expands the timeline and pricing into three phases, which breaks the prompt's own "exactly this structure" instruction.

## Test 3 - Detailed SaaS

**Input**

`We want to build a SaaS platform where users can sign up, upload documents, and use AI to summarize them. There should be authentication, dashboard, file storage, and usage limits based on subscription. Admin panel required to manage users. Prefer React frontend and Python backend.`

**Observed output**

- Scope recognized authentication, uploads, summarization, subscriptions, and admin.
- Timeline: 90 days.
- Price: $135,000.
- Stack: React, Python, PostgreSQL plus MongoDB, AWS.

**Assessment**

This is the strongest result of the five. The prompt does respond to the higher-complexity input with a larger budget and longer timeline, which is the right direction.

The weak points are still important. The architecture recommendation is muddy: it suggests "Django or Flask" instead of making a clear choice, and it introduces both PostgreSQL and MongoDB without explaining why both are needed. The assumptions also shift responsibility outward in a vague way, such as saying the client will provide infrastructure and define subscription rules. That makes the proposal look less consultative than it should.

## Test 4 - Messy / Poorly Written

**Input**

`need app fast like uber but for tutors student login teacher login video call chat also payment maybe razorpay idk budget low but want good quality asap`

**Observed output**

- It cleaned the messy input into a readable proposal.
- Scope included student login, teacher login, video calls, chat, and payments.
- Timeline: 63 days.
- Price: $63,000.
- Stack: React Native, Node.js, MongoDB, AWS.

**Assessment**

This is a fail relative to the intent of the test. The prompt does clean the input, but it misses the real business signal: the client wants a marketplace-style app, wants it fast, wants high quality, and says the budget is low. Those constraints conflict.

A good proposal should push back here. It should say that a tutor marketplace with identity, chat, video, scheduling, payments, and admin is not a low-budget or rushed build, then offer an MVP cut such as account roles, booking, and payment first, with chat and video later. Instead, the current prompt normalizes the request into a standard proposal and loses the negotiation value.

## Test 5 - Real Freelance Scenario

**Input**

`We are a startup looking to build a landing page and MVP for our product. The landing page should include product info, signup form, and analytics. The MVP should allow users to create accounts, submit data, and view results on a dashboard. We need this within 4-6 weeks.`

**Observed output**

- Scope included landing page, signup form, accounts, data submission, dashboard, and analytics.
- Timeline: 28 days.
- Price: $35,000.
- Stack: React, Express, MongoDB, AWS.

**Assessment**

This is a partial pass. The output captures the split between landing page and MVP and lands within the stated 4 to 6 week window.

The issue is that it accepts the deadline too easily. For a startup MVP, "create accounts, submit data, and view results" can mean very different levels of complexity. The prompt should acknowledge that the 4 to 6 week target is only realistic if the MVP is tightly scoped and if design, product decisions, and feedback are quick. Right now it sounds more certain than it should.

## Cross-Test Findings

1. The structure is consistent, but the thinking is too template-driven.
2. The prompt is better at turning rough input into polished text than at making good consulting decisions.
3. It does not surface risks, exclusions, or tradeoffs, which is where high-value freelance proposals become persuasive.
4. It does not explicitly explain why the proposed timeline or pricing is appropriate.
5. It has a strong default-stack bias.
6. The encoding issue in the prompt should be fixed because it leaks into generated output.

## Recommended Prompt Fixes

1. Add a rule that vague inputs must keep assumptions minimal and clearly labeled.
2. Add a rule that conflicting constraints must be called out directly, especially around budget and speed.
3. Require one short pricing rationale and one short timeline rationale in every proposal.
4. Require a brief "Scope Boundaries" or "Out of Scope" note for complex builds.
5. Force a single clear recommended stack unless the client explicitly requests options.
6. Fix the mojibake characters in the prompt text so outputs stop showing garbled dash characters.

## Final Take

The prompt is good enough for quick draft generation, but not good enough yet for dependable client-facing proposals in messy or high-stakes freelance scenarios. Its biggest gap is not formatting. Its biggest gap is judgment.
